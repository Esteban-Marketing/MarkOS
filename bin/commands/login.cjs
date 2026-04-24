'use strict';

// Phase 204 Plan 02 Task 3 — `markos login` command.
//
// Two modes:
//
//   1. Device flow (default, RFC 8628):
//      - POST ${BASE_URL}/api/cli/oauth/device/start with JSON {client_id, scope}
//      - Open browser to verification_uri_complete (unless --no-browser or !TTY)
//      - Poll /token every `interval` seconds honoring slow_down + expired_token + access_denied
//      - On success: write access_token to OS keychain (or XDG fallback) + exit 0
//
//   2. Token paste (--token=<mks_ak_...>) non-interactive CI fallback:
//      - Validate token format
//      - Write straight to keychain + exit 0
//
// Exit codes (D-10):
//   0 success | 1 user_error (invalid token format) | 2 transient (network)
//   3 auth_failure (expired, denied, SIGINT)

const { setToken } = require('../lib/cli/keychain.cjs');
const { resolveProfile } = require('../lib/cli/config.cjs');
const { openBrowser } = require('../lib/cli/open-browser.cjs');
const { BASE_URL } = require('../lib/cli/http.cjs');
const { EXIT_CODES, shouldUseJson } = require('../lib/cli/output.cjs');
const { formatError } = require('../lib/cli/errors.cjs');

const TOKEN_REGEX = /^mks_ak_[a-f0-9]{32,}$/;
const DEFAULT_TIMEOUT_SEC = 900;

// Exposed for tests — allows swapping fetch with a harness stub.
function getFetch() {
  return globalThis.fetch;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitSuccess(opts, profile, mode, keyFingerprint) {
  if (shouldUseJson(opts)) {
    process.stdout.write(JSON.stringify({
      success: true,
      profile,
      mode,
      key_fingerprint: keyFingerprint || null,
    }) + '\n');
  } else {
    process.stdout.write(`\n  ✓ Logged in (profile: ${profile}, mode: ${mode})\n`);
    if (keyFingerprint) process.stdout.write(`  fingerprint: ${keyFingerprint}\n\n`);
  }
}

async function tokenPasteMode(cli, profile) {
  const token = cli.token;
  if (!TOKEN_REGEX.test(token)) {
    formatError({
      error: 'invalid_token',
      message: 'Token does not match expected format.',
      hint: 'Expected mks_ak_<32+ hex chars>.',
    });
    process.exit(EXIT_CODES.USER_ERROR);
  }
  await setToken(profile, token);
  emitSuccess(cli, profile, 'token-paste', null);
  process.exit(EXIT_CODES.SUCCESS);
}

function printVerification(opts, envelope) {
  if (shouldUseJson(opts)) {
    process.stdout.write(JSON.stringify({
      verification_uri: envelope.verification_uri,
      verification_uri_complete: envelope.verification_uri_complete,
      user_code: envelope.user_code,
      expires_in: envelope.expires_in,
    }) + '\n');
  } else {
    process.stdout.write('\n');
    process.stdout.write(`  Go to: ${envelope.verification_uri}\n`);
    process.stdout.write(`  Code:  ${envelope.user_code}\n\n`);
  }
}

async function deviceFlowMode(cli, profile) {
  const fetchFn = getFetch();
  if (typeof fetchFn !== 'function') {
    formatError({ error: 'INTERNAL', message: 'fetch is not available (Node 22+ required).' });
    process.exit(EXIT_CODES.INTERNAL_BUG);
  }

  // Step 1: /start
  let startRes;
  try {
    startRes = await fetchFn(`${BASE_URL}/api/cli/oauth/device/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: 'markos-cli', scope: 'cli' }),
    });
  } catch (err) {
    formatError({ error: 'NETWORK_ERROR', message: `Failed to reach ${BASE_URL}: ${err.message}` });
    process.exit(EXIT_CODES.TRANSIENT);
  }
  if (!startRes.ok) {
    const body = await startRes.text().catch(() => '');
    formatError({ error: 'SERVER_ERROR', message: `Device-code request failed (${startRes.status}): ${body}` });
    process.exit(EXIT_CODES.TRANSIENT);
  }
  const envelope = await startRes.json();

  printVerification(cli, envelope);

  // Step 2: open browser unless suppressed.
  const noBrowser = Boolean(cli.noBrowser) || process.env.MARKOS_NO_BROWSER === '1';
  if (!noBrowser) {
    openBrowser(envelope.verification_uri_complete);
  }

  // Step 3: poll /token at `interval` seconds until approval or deadline.
  const timeoutSec = Number.isFinite(Number(cli.timeout)) ? Number(cli.timeout) : DEFAULT_TIMEOUT_SEC;
  const deadline = Date.now() + Math.min(timeoutSec, envelope.expires_in || DEFAULT_TIMEOUT_SEC) * 1000;
  let intervalMs = Math.max(1, (envelope.interval || 5)) * 1000;

  // SIGINT handling — clean exit 3.
  const sigintHandler = () => {
    process.stdout.write('\n  Login aborted.\n');
    process.exit(EXIT_CODES.AUTH_FAILURE);
  };
  process.on('SIGINT', sigintHandler);

  try {
    while (Date.now() < deadline) {
      await sleep(intervalMs);
      // Preemptive expiry check — prevents race documented in Pitfall 2.
      if (Date.now() >= deadline) break;

      const params = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: envelope.device_code,
        client_id: 'markos-cli',
      });

      let pollRes;
      try {
        pollRes = await fetchFn(`${BASE_URL}/api/cli/oauth/device/token`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
      } catch (err) {
        // Transient network hiccup — retry on next interval.
        continue;
      }

      const bodyText = await pollRes.text();
      let body;
      try { body = JSON.parse(bodyText); } catch { body = { error: 'invalid_response' }; }

      if (pollRes.ok) {
        // Success — write to keychain + exit clean.
        await setToken(profile, body.access_token);
        emitSuccess(cli, profile, 'device-flow', body.key_fingerprint);
        return process.exit(EXIT_CODES.SUCCESS);
      }

      // Typed polling errors per RFC 8628 §3.5.
      const code = body && body.error;
      if (code === 'authorization_pending') continue;
      if (code === 'slow_down') {
        intervalMs += 5000;
        continue;
      }
      if (code === 'expired_token') {
        formatError({
          error: 'TOKEN_EXPIRED',
          message: 'Login expired before approval.',
          hint: 'Run `markos login` again.',
        });
        return process.exit(EXIT_CODES.AUTH_FAILURE);
      }
      if (code === 'access_denied') {
        formatError({
          error: 'UNAUTHORIZED',
          message: 'Login denied.',
        });
        return process.exit(EXIT_CODES.AUTH_FAILURE);
      }
      // Unknown error — surface verbatim.
      formatError({ error: 'SERVER_ERROR', message: `Unexpected token response: ${code || bodyText.slice(0, 200)}` });
      return process.exit(EXIT_CODES.TRANSIENT);
    }

    // Fell out of the loop — we ran past the deadline.
    formatError({
      error: 'TOKEN_EXPIRED',
      message: 'Login expired before approval.',
      hint: 'Run `markos login` again.',
    });
    process.exit(EXIT_CODES.AUTH_FAILURE);
  } finally {
    process.removeListener('SIGINT', sigintHandler);
  }
}

async function main(ctx = {}) {
  const cli = (ctx && ctx.cli) || ctx || {};
  const profile = resolveProfile(cli);

  if (cli.token) {
    return tokenPasteMode(cli, profile);
  }
  return deviceFlowMode(cli, profile);
}

module.exports = { main };
// Exposed for tests.
module.exports._TOKEN_REGEX = TOKEN_REGEX;
