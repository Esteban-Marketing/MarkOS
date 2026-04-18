'use strict';

// Phase 202 Plan 04 D-03 + D-16: Approval-token lifecycle for mutating tool calls.
// Redis-backed one-time token with 5-minute TTL. GETDEL semantics defeat replay (Pitfall 3).
// Token payload is bound to session.id + tool_name — stolen tokens from other sessions fail.

const { randomBytes, createHash } = require('node:crypto');

const APPROVAL_TTL_SECONDS = 300; // D-03: 5-min preview→commit window

function digestArgs(args) {
  return createHash('sha256').update(JSON.stringify(args || {})).digest('hex');
}

function key(session_id, token) {
  return `approval:${session_id}:${token}`;
}

async function issueApprovalToken(redis, session, tool_name, args) {
  if (!session || !session.id) throw new Error('issueApprovalToken: session.id required');
  if (!tool_name) throw new Error('issueApprovalToken: tool_name required');

  const token = randomBytes(16).toString('hex'); // 32-char hex
  const payload = JSON.stringify({
    session_id: session.id,
    tool_name,
    args_digest: digestArgs(args),
    issued_at: new Date().toISOString(),
  });

  const result = await redis.set(key(session.id, token), payload, { ex: APPROVAL_TTL_SECONDS, nx: true });
  // Upstash returns 'OK' on success, null on NX collision. Accept true/OK for flexibility.
  if (result !== 'OK' && result !== true) {
    throw new Error('issueApprovalToken: set failed (NX collision or backend error)');
  }
  return token;
}

async function checkApprovalToken(redis, token, session, tool_name) {
  if (!token || !session || !session.id || !tool_name) return false;

  const k = key(session.id, token);
  // Prefer GETDEL (Upstash native) — single-round-trip atomic consume (Pitfall 3 one-time).
  const raw = await (typeof redis.getdel === 'function'
    ? redis.getdel(k)
    : (async () => { const v = await redis.get(k); if (v) await redis.del(k); return v; })());
  if (!raw) return false;

  let payload;
  try { payload = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return false; }
  if (!payload || typeof payload !== 'object') return false;

  // Bind: session.id + tool_name must match the stored envelope (defeats token lift cross-session).
  return payload.session_id === session.id && payload.tool_name === tool_name;
}

module.exports = { APPROVAL_TTL_SECONDS, issueApprovalToken, checkApprovalToken };
