'use strict';

// Phase 204 Plan 06 Task 2:
// GET /api/tenant/runs/{run_id}/events
//
// Server-Sent Events (SSE) stream of run progress. Clients (markos CLI `run
// --watch`, future web UI) subscribe to this endpoint and receive events as
// the run advances through pending→running→success/failed/cancelled.
//
// Wire format (MDN SSE):
//   event: run.snapshot
//   data: {"run_id":"run_...","status":"running",...}
//   id: 1
//   <blank>
//
// Heartbeat: `event: heartbeat\ndata: {"ts":...}` every 15s.
// Terminal close: `event: run.completed\ndata: {...,"status":"success"}` + end.
//
// Auth: Bearer (mks_ak_<64 hex>) OR legacy x-markos-user-id+tenant-id headers.
// Cross-tenant guard: the handler SELECTs the run row and compares its
// tenant_id against the resolved caller before streaming anything.
//
// Reconnection: clients send `Last-Event-ID` header; streamRunEvents resumes
// the event-id counter from (N+1).
//
// Responses:
//   200 text/event-stream + stream body
//   401 { error: 'unauthorized'|'invalid_token'|'revoked_token' }
//   403 { error: 'cross_tenant_forbidden' }
//   404 { error: 'run_not_found' }
//   405 { error: 'method_not_allowed' }

const { writeJson } = require('../../../../lib/markos/crm/api.cjs');
const { resolveWhoami, resolveSessionWhoami } = require('../../../../lib/markos/cli/whoami.cjs');
const { streamRunEvents, getRun } = require('../../../../lib/markos/cli/runs.cjs');
const { hashToken } = require('../../../../lib/markos/cli/plan.cjs');

// ─── Auth helpers ──────────────────────────────────────────────────────────

function extractBearer(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || typeof auth !== 'string') return null;
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

function getSupabase(deps) {
  if (deps && deps.supabase) return deps.supabase;
  const { getSupabase: real } = require('../../../../lib/markos/auth/session.ts');
  return real();
}

async function resolveCaller(req, res, supabase) {
  const bearer = extractBearer(req);
  if (bearer) {
    const key_hash = hashToken(bearer);
    try {
      const envelope = await resolveWhoami({ client: supabase, key_hash });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'cli' };
    } catch (err) {
      const msg = err?.message || 'invalid_token';
      if (msg === 'revoked_token') {
        writeJson(res, 401, { error: 'revoked_token', hint: 'Run `markos login` again.' });
        return null;
      }
      if (msg === 'invalid_token') {
        writeJson(res, 401, { error: 'invalid_token' });
        return null;
      }
      writeJson(res, 500, { error: 'server_error', error_description: msg });
      return null;
    }
  }
  const user_id = req.headers['x-markos-user-id'];
  const tenant_id = req.headers['x-markos-tenant-id'];
  if (user_id && tenant_id) {
    try {
      const envelope = await resolveSessionWhoami({ client: supabase, user_id, tenant_id });
      return { tenant_id: envelope.tenant_id, user_id: envelope.user_id, scope: 'session' };
    } catch {
      writeJson(res, 401, { error: 'invalid_token' });
      return null;
    }
  }
  writeJson(res, 401, { error: 'unauthorized' });
  return null;
}

function extractRunId(req) {
  // Next.js-style: req.query.run_id.
  if (req.query && req.query.run_id) return String(req.query.run_id);
  // Fallback: parse the URL path.
  if (req.url && typeof req.url === 'string') {
    const m = req.url.match(/\/api\/tenant\/runs\/([^/?#]+)\/events/);
    if (m) return m[1];
  }
  return null;
}

// ─── Handler ───────────────────────────────────────────────────────────────

async function handler(req, res, deps = {}) {
  if (req.method !== 'GET') {
    return writeJson(res, 405, { error: 'method_not_allowed' });
  }

  const supabase = getSupabase(deps);

  const caller = await resolveCaller(req, res, supabase);
  if (!caller) return;

  const run_id = extractRunId(req);
  if (!run_id) {
    return writeJson(res, 400, { error: 'invalid_request', errors: ['run_id required'] });
  }

  // Fetch + tenant guard.
  let row;
  try {
    row = await getRun({ client: supabase, tenant_id: caller.tenant_id, run_id });
  } catch (err) {
    return writeJson(res, 500, { error: 'server_error', error_description: err?.message || String(err) });
  }
  if (!row) {
    // Might be cross-tenant OR missing — distinguishable only by a raw fetch
    // bypassing tenant_id. To avoid leaking existence we treat both as 404.
    return writeJson(res, 404, { error: 'run_not_found' });
  }
  if (row.tenant_id !== caller.tenant_id) {
    return writeJson(res, 403, { error: 'cross_tenant_forbidden' });
  }

  // Upgrade response to SSE.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Writer abstraction the lib expects.
  const writer = {
    write(chunk) { try { res.write(chunk); } catch { /* closed */ } },
    end()        { try { res.end();       } catch { /* closed */ } },
  };

  // Request-close → abort the stream + free the poll loop.
  const controller = new AbortController();
  const onClose = () => controller.abort();
  if (req.on) req.on('close', onClose);

  // Resume from Last-Event-ID if provided.
  const lastEventId = req.headers['last-event-id'] || req.headers['Last-Event-ID'] || null;

  try {
    await streamRunEvents({
      client: supabase,
      run_id,
      tenant_id: caller.tenant_id,
      writer,
      signal: controller.signal,
      lastEventId,
    });
  } catch (err) {
    // Best-effort error frame.
    try {
      res.write(`event: run.error\ndata: ${JSON.stringify({ error: err?.message || 'stream_error' })}\n\n`);
    } catch { /* noop */ }
    try { res.end(); } catch { /* noop */ }
  } finally {
    if (req.off) req.off('close', onClose);
  }
}

module.exports = handler;
module.exports.handler = handler;
module.exports._extractBearer = extractBearer;
module.exports._extractRunId = extractRunId;
module.exports._resolveCaller = resolveCaller;
