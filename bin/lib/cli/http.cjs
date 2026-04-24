'use strict';

// Phase 204 Plan 01 Task 2: HTTP client primitive.
//
// A9 locked: Wave 1 uses raw Node 22 built-in fetch (undici). SDK migration
// deferred to 204.1 gap-closure if 200-01.1 ships.
//
// Features:
//   - Bearer auth via { token }
//   - x-markos-trace-id + x-markos-client headers per request
//   - Retries 5xx/429/network with exponential backoff 1s -> 2s -> 4s -> 8s,
//     capped at 30s; 4 retries default.
//   - Throws AuthError on 401/403; TransientError on persistent 5xx.

const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const BASE_URL = process.env.MARKOS_API_BASE_URL || 'https://app.markos.com';

// Read our own package.json once for the client header.
let CLIENT_VERSION = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'package.json'), 'utf8'));
  CLIENT_VERSION = pkg.version || 'unknown';
} catch {
  // fall through.
}

class AuthError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = 'UNAUTHORIZED';
    this.status = status;
    this.body = body;
  }
}

class TransientError extends Error {
  constructor(message, { status, attempts } = {}) {
    super(message);
    this.name = 'TransientError';
    this.code = 'SERVER_ERROR';
    this.status = status;
    this.attempts = attempts;
  }
}

function generateTraceId() {
  return 'tr_' + crypto.randomBytes(8).toString('hex');
}

function resolveUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = BASE_URL.replace(/\/+$/, '');
  const suffix = pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl;
  return base + suffix;
}

function backoffDelayMs(attempt) {
  // attempt is 0-indexed; 1s, 2s, 4s, 8s, ... capped at 30s.
  return Math.min(30_000, 1000 * Math.pow(2, attempt));
}

function shouldRetryStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function authedFetch(pathOrUrl, opts = {}, ctx = {}) {
  const url = resolveUrl(pathOrUrl);
  const token = ctx.token;
  const traceId = ctx.trace_id || generateTraceId();
  const retries = Number.isFinite(ctx.retries) ? ctx.retries : 4;

  const headers = Object.assign({}, opts.headers || {}, {
    'x-markos-trace-id': traceId,
    'x-markos-client': `markos-cli/${CLIENT_VERSION}`,
  });
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, Object.assign({}, opts, { headers }));

      if (res.status === 401 || res.status === 403) {
        let body = null;
        try { body = await res.clone().text(); } catch {}
        throw new AuthError(`Authentication failed: ${res.status} ${res.statusText}`, { status: res.status, body });
      }

      if (shouldRetryStatus(res.status) && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffDelayMs(attempt)));
        continue;
      }

      if (res.status >= 500) {
        let body = null;
        try { body = await res.clone().text(); } catch {}
        throw new TransientError(`Server error after ${attempt + 1} attempts: ${res.status}`, { status: res.status, attempts: attempt + 1 });
      }

      return res;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      if (err instanceof TransientError && attempt >= retries) throw err;
      lastErr = err;
      // Network error (fetch rejection) — retry with backoff.
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffDelayMs(attempt)));
        continue;
      }
      throw new TransientError(`Network error after ${attempt + 1} attempts: ${err.message}`, { attempts: attempt + 1 });
    }
  }

  throw lastErr || new TransientError('authedFetch exhausted retries');
}

module.exports = {
  BASE_URL,
  CLIENT_VERSION,
  authedFetch,
  generateTraceId,
  AuthError,
  TransientError,
};
