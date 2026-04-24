'use strict';

// Phase 204 Plan 02 Task 2:
// POST /api/cli/oauth/device/start — RFC 8628 §3.1 Device Authorization Request
//
// Public endpoint (no Bearer / no session headers). Rate-limited per source IP
// to defeat brute-force (T-204-02-02). Delegates to device-flow library.
//
// Contract: F-101. Success body is the standard RFC 8628 §3.2 envelope.

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { createDeviceSession } = require('../../../../lib/markos/cli/device-flow.cjs');

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  return new Promise((resolve) => {
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

// Public endpoint has no tenant_id to scope by — key on source IP instead.
// Tests inject `deps.limiter` to avoid Upstash during unit runs.
function getLimiter(deps) {
  if (deps && deps.limiter) return deps.limiter;
  const { Redis } = require('@upstash/redis');
  const { Ratelimit } = require('@upstash/ratelimit');
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:cli:oauth:start',
  });
}

function sourceIp(req) {
  // x-forwarded-for may be a comma-list — first value is the originating client.
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  const realIp = req.headers['x-real-ip'];
  if (realIp) return String(realIp);
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return 'unknown';
}

async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return writeJson(res, 405, { error: 'method_not_allowed' });

  const body = await readJson(req);
  const client_id = body.client_id;
  const scope = body.scope || 'cli';

  if (client_id !== 'markos-cli') {
    return writeJson(res, 400, { error: 'invalid_client', error_description: 'client_id must be "markos-cli"' });
  }
  if (scope !== 'cli') {
    return writeJson(res, 400, { error: 'invalid_scope', error_description: 'only the "cli" scope is supported' });
  }

  // Rate-limit per source IP: 10 / minute (T-204-02-02).
  const limiter = getLimiter(deps);
  const ip = sourceIp(req);
  const rl = await limiter.limit(ip);
  if (!rl.success) {
    const retry_after = Math.max(1, Math.ceil(((rl.reset || (Date.now() + 60_000)) - Date.now()) / 1000));
    if (res.setHeader) res.setHeader('Retry-After', String(retry_after));
    return writeJson(res, 429, { error: 'rate_limited', retry_after });
  }

  const supabase = getSupabase(deps);

  try {
    const envelope = await createDeviceSession({ client: supabase, client_id, scope });
    return writeJson(res, 200, envelope);
  } catch (err) {
    const msg = err && err.message ? err.message : 'start_failed';
    if (msg === 'invalid_client') return writeJson(res, 400, { error: 'invalid_client' });
    if (msg === 'invalid_scope')  return writeJson(res, 400, { error: 'invalid_scope' });
    return writeJson(res, 500, { error: 'start_failed' });
  }
}

module.exports = handler;
module.exports.handler = handler;
