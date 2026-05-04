'use strict';

const { randomUUID } = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const { signPayload, signPayloadDualSign, SIGNATURE_HEADER, TIMESTAMP_HEADER } = require('./signing.cjs');
const { readSecret } = require('./secret-vault.cjs');
const { assertUrlIsPublic } = require('./ssrf-guard.cjs');
const {
  validateWebhookUrl,
  resolvePinnedAgent,
  resolvePinnedHttpAgent,
  DEFAULT_MAX_REDIRECTS,
} = require('./url-validator.cjs');
const { runDispatchGates, handleGateBlock } = require('./dispatch-gates.cjs');
// Phase 203 Plan 10 Task 1 — observability wrapper primitives.
// log-drain.cjs + sentry.cjs: emitLogLine in finally / captureToolError in catch.
// breaker.cjs: recordOutcome + classifyOutcome invoked post-fetch inside the finally block
// (Plan 203-10 owns this consumer side; Plan 203-08 ships the exports only, never edits
// delivery.cjs — T-203-10-07 single-owner-per-wave invariant).
const { emitLogLine } = require('./log-drain.cjs');
const { captureToolError } = require('./sentry.cjs');
const { recordOutcome, classifyOutcome } = require('./breaker.cjs');

const MAX_ATTEMPTS = 24;
const BASE_DELAY_SECONDS = 5;
const MAX_DELAY_SECONDS = 24 * 60 * 60;

const STATUS = {
  PENDING: 'pending',
  RETRYING: 'retrying',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

function computeBackoffSeconds(attempt) {
  if (attempt <= 0) return BASE_DELAY_SECONDS;
  const delay = BASE_DELAY_SECONDS * Math.pow(2, Math.min(attempt, 15));
  return Math.min(delay, MAX_DELAY_SECONDS);
}

function createInMemoryQueue() {
  const queue = [];
  return {
    async push(delivery_id) {
      queue.push(delivery_id);
    },
    drain() {
      const ids = [...queue];
      queue.length = 0;
      return ids;
    },
    size() {
      return queue.length;
    },
  };
}

function createInMemoryDeliveryStore() {
  const rows = new Map();
  return {
    async insert(row) {
      rows.set(row.id, row);
      return row;
    },
    async findById(id) {
      return rows.get(id) || null;
    },
    async update(id, patch) {
      const row = rows.get(id);
      if (!row) return null;
      const next = { ...row, ...patch, updated_at: new Date().toISOString() };
      rows.set(id, next);
      return next;
    },
    async listByTenant(tenant_id) {
      return [...rows.values()].filter((r) => r.tenant_id === tenant_id);
    },
  };
}

async function enqueueDelivery(deliveries, queue, input) {
  if (!input || !input.subscription) throw new Error('subscription is required');
  if (!input.event) throw new Error('event is required');
  const now = new Date().toISOString();
  const row = {
    id: `whdel_${randomUUID()}`,
    subscription_id: input.subscription.id,
    tenant_id: input.subscription.tenant_id,
    event: input.event,
    payload: input.payload ?? {},
    attempt: 0,
    status: STATUS.PENDING,
    response_code: null,
    last_error: null,
    next_retry_at: null,
    created_at: now,
    updated_at: now,
  };
  await deliveries.insert(row);
  await queue.push(row.id);
  return row;
}

// Phase 203 Plan 10 Task 1 — observability finally-block helpers. Extracted so processDelivery
// stays under S3776 cognitive-complexity 15 (Plan 203-07 precedent: extract on add).

// Safe breaker recording — swallows both sync throws and async rejections so the dispatch
// finally block never corrupts on Redis/Upstash issues (RESEARCH §Pitfall 2 resilience).
function recordBreakerOutcomeSafe(redis, sub_id, outcomeInput) {
  if (!outcomeInput) return;
  try {
    const classified = classifyOutcome(outcomeInput);
    const maybePromise = recordOutcome(redis, sub_id, classified);
    if (maybePromise?.catch) {
      maybePromise.catch(() => {});
    }
  } catch {
    // Breaker must never corrupt dispatch observability — swallow sync throws too.
  }
}

// Single-line status derivation for the post-fetch log emission. Empty observabilityResult
// (shouldn't happen post-fetch but keeps the finally safe on unexpected throw) → 'unknown'.
function deriveLogStatus(observabilityResult) {
  if (observabilityResult?.delivered) return 'delivered';
  return observabilityResult?.status || 'unknown';
}

// Dispatch-time URL validation: url-validator.cjs (D-201, Phase 200.1) runs FIRST
// with the full deny-list (IPv4 + IPv6 + denied protocols + redirect cap). The
// older ssrf-guard.cjs path remains as belt-and-braces for the IPv4 subset Phase
// 203 already shipped. The two MUST stay consistent: url-validator is the strict
// superset. SNI is pinned twice for HTTPS requests — resolvePinnedAgent sets
// `servername` on the Agent and request options set `servername` explicitly so
// TLS cert validation uses the original hostname rather than the resolved IP.

// Emits the pre-fetch observability log line for gate-blocked deliveries (breaker_open,
// rate_limited) + short-circuits via handleGateBlock. Extracted so the gate branch does not
// inflate processDelivery's cognitive complexity.
async function observeAndHandleGateBlock({ gate, delivery, delivery_id, subscription, deliveries, started, now }) {
  emitLogLine({
    domain: 'webhook',
    req_id: delivery_id,
    tenant_id: subscription.tenant_id,
    sub_id: subscription.id,
    delivery_id,
    event_type: delivery.event,
    delivery_attempt: delivery.attempt || 0,
    duration_ms: now() - started,
    status: gate.status || gate.reason || 'gate_blocked',
    error_code: null,
  });
  return await handleGateBlock({ gate, deliveryId: delivery_id, deliveries, now: now() });
}

// Dispatch-time SSRF re-check helper. Returns null to continue, or a short-circuit result.
async function checkSsrfReject(deliveries, delivery_id, subscription, lookup) {
  try {
    await assertUrlIsPublic(subscription.url, lookup ? { lookup } : undefined);
    return null;
  } catch (ssrfErr) {
    const msg = String(ssrfErr?.message || '');
    const isSsrfReject =
      msg === 'private_ip' ||
      msg.startsWith('private_ip:') ||
      msg === 'https_required' ||
      msg === 'invalid_scheme';
    if (!isSsrfReject) return null; // DNS ENOTFOUND etc — fall through to fetch for transient retry.
    const reason = `ssrf_blocked:${msg}`;
    await deliveries.update(delivery_id, {
      status: STATUS.FAILED,
      last_error: reason,
      dlq_reason: reason,
      dlq_at: new Date().toISOString(),
      next_retry_at: null,
    });
    return { delivered: false, status: STATUS.FAILED, reason: 'ssrf_blocked' };
  }
}

function buildFetchRequestAdapter(fetchImpl) {
  return async function requestWithFetch(currentUrl, requestOptions, body) {
    const response = await fetchImpl(currentUrl, {
      method: requestOptions.method,
      headers: requestOptions.headers,
      body,
      redirect: 'manual',
    });
    const headers = {};
    if (response?.headers?.entries) {
      for (const [key, value] of response.headers.entries()) {
        headers[key.toLowerCase()] = value;
      }
    }
    const responseBody = typeof response.text === 'function' ? await response.text() : '';
    return {
      statusCode: response.status,
      headers,
      body: responseBody,
    };
  };
}

function buildNodeRequestAdapter() {
  return function requestWithNode(_currentUrl, requestOptions, body) {
    return new Promise((resolve, reject) => {
      const transport = requestOptions.protocol === 'http:' ? http : https;
      const req = transport.request(requestOptions, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers || {},
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

function getRequestAdapter(fetchImpl, requestImpl) {
  if (typeof requestImpl === 'function') return requestImpl;
  if (typeof fetchImpl === 'function') return buildFetchRequestAdapter(fetchImpl);
  return buildNodeRequestAdapter();
}

async function resolvePrimarySecret(subscriptions, subscription) {
  if (typeof subscription.secret_vault_ref === 'string' && subscription.secret_vault_ref) {
    const vaultClient = subscriptions?.client;
    if (!vaultClient) throw new Error('vault_unavailable:missing_client');
    return readSecret(vaultClient, subscription.secret_vault_ref);
  }

  // Legacy compatibility for pre-70.2 rows and tests that still seed a raw
  // subscription object. Persisted rows should use secret_vault_ref.
  const legacySecret = subscription['secret'];
  if (typeof legacySecret === 'string' && legacySecret.length > 0) {
    return legacySecret;
  }

  throw new Error(`vault_secret_not_found:${subscription.id}`);
}

async function dispatchWithValidation(currentUrl, redirectsRemaining, body, headers, opts = {}) {
  const allowLocalhostHttp = process.env.MARKOS_WEBHOOK_ALLOW_LOCALHOST_HTTP === '1';
  const validation = await validateWebhookUrl(currentUrl, {
    allowLocalhostHttp,
    lookup: opts.lookup,
  });
  if (!validation.ok) {
    return {
      ok: false,
      retryable: false,
      error: 'url_validation_failed',
      reason: validation.reason,
      detail: validation.detail,
    };
  }

  const parsed = new URL(currentUrl);
  const hostname = validation.hostname || parsed.hostname;
  const finalHeaders = {
    ...headers,
    Host: parsed.host,
  };
  const requestOptions = {
    protocol: parsed.protocol,
    method: 'POST',
    headers: finalHeaders,
    host: validation.resolvedIp,
    port: parsed.port ? Number(parsed.port) : (parsed.protocol === 'http:' ? 80 : 443),
    path: `${parsed.pathname}${parsed.search}`,
    originalUrl: currentUrl,
  };
  if (parsed.protocol === 'https:') {
    requestOptions.agent = resolvePinnedAgent(validation.resolvedIp, validation.resolvedFamily, hostname);
    requestOptions.servername = hostname;
  } else {
    requestOptions.agent = resolvePinnedHttpAgent(validation.resolvedIp, validation.resolvedFamily);
  }

  const requestAdapter = getRequestAdapter(opts.fetch, opts.request);
  const response = await requestAdapter(currentUrl, requestOptions, body);
  const location = response.headers?.location || response.headers?.Location;
  if (response.statusCode >= 300 && response.statusCode < 400 && location) {
    if (redirectsRemaining <= 0) {
      return { ok: false, retryable: false, error: 'redirect_cap_exceeded' };
    }
    const nextUrl = new URL(location, currentUrl).toString();
    return dispatchWithValidation(nextUrl, redirectsRemaining - 1, body, headers, opts);
  }
  return {
    ok: response.statusCode >= 200 && response.statusCode < 300,
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body,
  };
}

async function processDelivery(
  deliveries,
  subscriptions,
  delivery_id,
  {
    fetch: fetchImpl = globalThis.fetch,
    request: requestImpl,
    now = () => Date.now(),
    lookup,
    // Phase 203-07 Task 2: dispatch-gates dependencies. `redis` is the Upstash handle (or a
    // pre-built limiter for tests); `planTier` resolves the D-13 ceiling when the subscription
    // row doesn't carry it inline yet. Both are optional — defaults fall through to 'free'
    // (fail-closed to lowest cap) and Upstash `Redis.fromEnv()`.
    redis,
    planTier,
  } = {},
) {
  // Phase 203 Plan 10 Task 1 — observability wrapper timer. Used by the finally-block
  // emitLogLine below; captures wall-clock from entry to outcome so subscriber RTT is
  // measured uniformly across delivered / retrying / breaker-blocked / rate-limited paths.
  const observabilityStarted = now();

  const delivery = await deliveries.findById(delivery_id);
  if (!delivery) return { delivered: false, reason: 'not_found' };

  const subscription = await subscriptions.findById(delivery.tenant_id, delivery.subscription_id);
  if (!subscription) {
    await deliveries.update(delivery_id, { status: STATUS.FAILED, last_error: 'subscription_missing' });
    return { delivered: false, reason: 'subscription_missing' };
  }

  // Phase 203-07 Task 2: dispatch-gates indirection (T-203-07-06 mitigation).
  // SINGLE pre-fetch indirection point — Plan 203-08 will extend dispatch-gates.cjs to add a
  // breaker gate; delivery.cjs MUST NOT grow additional pre-fetch branches.
  const resolvedPlanTier = planTier || subscription.plan_tier || 'free';
  const gate = await runDispatchGates({
    subId: subscription.id,
    tenantId: subscription.tenant_id,
    eventId: delivery.event,
    planTier: resolvedPlanTier,
    subscription,
    redis,
  });
  if (gate.status !== 'allowed') {
    // Phase 203 Plan 10 Task 1 — gate-blocked deliveries (breaker_open / rate_limited) get
    // a single log emission at this site (no post-fetch finally block runs for this path).
    return await observeAndHandleGateBlock({
      gate, delivery, delivery_id, subscription, deliveries, started: observabilityStarted, now,
    });
  }

  // Phase 203-02 Task 1: dispatch-time SSRF re-check (DNS-rebinding defense).
  // checkSsrfReject returns null to continue, or a short-circuit result on known SSRF codes.
  const ssrfShortCircuit = await checkSsrfReject(deliveries, delivery_id, subscription, lookup);
  if (ssrfShortCircuit) return ssrfShortCircuit;

  const attempt = delivery.attempt + 1;
  let primarySecret;
  try {
    primarySecret = await resolvePrimarySecret(subscriptions, subscription);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith('vault_unavailable:')) {
      return scheduleRetry(deliveries, delivery_id, attempt, null, message, now);
    }
    await deliveries.update(delivery_id, {
      attempt,
      status: STATUS.FAILED,
      response_code: null,
      last_error: message,
      next_retry_at: null,
      dlq_reason: message,
      dlq_at: new Date().toISOString(),
    });
    return { delivered: false, attempt, status: STATUS.FAILED, last_error: message };
  }

  const body = JSON.stringify({ id: delivery.id, event: delivery.event, payload: delivery.payload });

  // Phase 203-05 Task 1: outbound dual-sign (D-10). When subscription.secret_v2 is present the
  // dispatch carries BOTH X-Markos-Signature-V1 (current secret) and X-Markos-Signature-V2
  // (new secret) headers with a SHARED X-Markos-Timestamp. Subscribers verify either during
  // the 30-day grace window. Backwards-compatible X-Markos-Signature header is preserved so
  // pre-203 subscribers keep working (byte-for-byte identical to prior signPayload output).
  const { signature, timestamp } = signPayload(primarySecret, body, now);
  const { headers: dualHeaders } = signPayloadDualSign(
    primarySecret,
    subscription.secret_v2 || null,
    body,
    now,
  );

  const outboundHeaders = {
    'content-type': 'application/json',
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp,
    ...dualHeaders,
    'x-markos-event': String(delivery.event || ''),
    'x-markos-attempt': String(attempt),
  };
  // Phase 203-05 Task 1 — D-06: replay deliveries carry x-markos-replayed-from so subscribers
  // can diff the replay against their own logs. Header intentionally lower-case (HTTP/2 norm).
  if (delivery.replayed_from) {
    outboundHeaders['x-markos-replayed-from'] = String(delivery.replayed_from);
  }

  // Phase 203 Plan 10 Task 1 — observability wrapper around the fetch() round-trip.
  // SINGLE post-fetch insertion point (T-203-10-07). Combines:
  //   (a) breaker recordOutcome (imported from Plan 203-08's breaker.cjs) via classifyOutcome
  //   (b) Sentry captureToolError on uncaught exceptions
  //   (c) log-drain emitLogLine on every outcome (delivered / retrying / error)
  // Plan 203-08 does NOT edit delivery.cjs; Plan 203-10 owns this consumer side.
  let observabilityResult;
  let observabilityOutcomeInput = null; // { http } | { timeout: true } | { network_error: true }
  let observabilityErrorCode = null;
  try {
    const response = await dispatchWithValidation(
      subscription.url,
      DEFAULT_MAX_REDIRECTS,
      body,
      outboundHeaders,
      {
        fetch: fetchImpl,
        request: requestImpl,
        lookup,
      },
    );

    if (response.retryable === false) {
      await deliveries.update(delivery_id, {
        attempt,
        status: STATUS.FAILED,
        response_code: null,
        last_error: `${response.error}:${response.reason || response.detail || ''}`.replace(/:$/, ''),
        next_retry_at: null,
      });
      observabilityErrorCode = response.error;
      observabilityResult = {
        delivered: false,
        status: STATUS.FAILED,
        last_error: response.error,
      };
      return observabilityResult;
    }

    observabilityOutcomeInput = { http: response.statusCode };

    if (response.ok) {
      await deliveries.update(delivery_id, {
        attempt,
        status: STATUS.DELIVERED,
        response_code: response.statusCode,
        last_error: null,
        next_retry_at: null,
      });
      observabilityResult = { delivered: true, status: response.statusCode, attempt };
      return observabilityResult;
    }

    observabilityErrorCode = `http_${response.statusCode}`;
    observabilityResult = await scheduleRetry(
      deliveries,
      delivery_id,
      attempt,
      response.statusCode,
      `http_${response.statusCode}`,
      now,
    );
    return observabilityResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Classify AbortError / timeout vs generic network error so recordOutcome gets the right signal.
    const isTimeout = /abort|timeout/i.test(message) || error?.name === 'AbortError';
    observabilityOutcomeInput = isTimeout ? { timeout: true } : { network_error: true };
    observabilityErrorCode = error?.code || (isTimeout ? 'timeout' : 'network_error');
    // Triple-safety: captureToolError NEVER re-throws (env gate + lazy import + try/catch).
    captureToolError(error, {
      req_id: delivery_id,
      delivery_id,
      sub_id: subscription.id,
      tenant_id: subscription.tenant_id,
      event_type: delivery.event,
      attempt,
    });
    observabilityResult = await scheduleRetry(deliveries, delivery_id, attempt, null, message, now);
    return observabilityResult;
  } finally {
    recordBreakerOutcomeSafe(redis, subscription.id, observabilityOutcomeInput);
    const logStatus = deriveLogStatus(observabilityResult);
    emitLogLine({
      domain: 'webhook',
      req_id: delivery_id,
      tenant_id: subscription.tenant_id,
      sub_id: subscription.id,
      delivery_id,
      event_type: delivery.event,
      delivery_attempt: attempt,
      duration_ms: now() - observabilityStarted,
      status: logStatus,
      error_code: observabilityErrorCode,
    });
  }
}

async function scheduleRetry(deliveries, delivery_id, attempt, response_code, last_error, now) {
  if (attempt >= MAX_ATTEMPTS) {
    await deliveries.update(delivery_id, {
      attempt,
      status: STATUS.FAILED,
      response_code,
      last_error,
      next_retry_at: null,
    });
    return { delivered: false, attempt, status: STATUS.FAILED, last_error };
  }

  const next_retry_at = new Date(now() + computeBackoffSeconds(attempt) * 1000).toISOString();
  await deliveries.update(delivery_id, {
    attempt,
    status: STATUS.RETRYING,
    response_code,
    last_error,
    next_retry_at,
  });
  return { delivered: false, attempt, status: STATUS.RETRYING, next_retry_at, last_error };
}

module.exports = {
  MAX_ATTEMPTS,
  BASE_DELAY_SECONDS,
  MAX_DELAY_SECONDS,
  STATUS,
  computeBackoffSeconds,
  createInMemoryQueue,
  createInMemoryDeliveryStore,
  enqueueDelivery,
  processDelivery,
  dispatchWithValidation,
};
