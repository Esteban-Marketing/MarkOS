'use strict';

// Phase 202 Plan 08 — Upstash-backed subscribe registry for MCP resource updates (D-27).
// Key shape: subs:mcp:<uri> (Redis SET). Per-key EXPIRE = 24h matches session TTL (Plan 202-01).
//
// broadcastResourceUpdated walks subscribers against the provided in-memory SSE channel map
// (held by the Vercel Function instance); disconnected channels are reaped.

const SUBSCRIPTION_TTL_SECONDS = 24 * 60 * 60;

function key(uri) {
  return `subs:mcp:${uri}`;
}

async function addSubscription(redis, session_id, uri, ttl_seconds = SUBSCRIPTION_TTL_SECONDS) {
  if (!session_id || !uri) throw new Error('addSubscription: session_id + uri required');
  if (redis && typeof redis.sadd === 'function') {
    await redis.sadd(key(uri), session_id);
    if (typeof redis.expire === 'function') {
      try { await redis.expire(key(uri), ttl_seconds); } catch { /* best-effort */ }
    }
    return;
  }
  // Fallback for primitive mocks that lack SET semantics — store as keyed boolean with TTL.
  if (redis && typeof redis.set === 'function') {
    await redis.set(`${key(uri)}:${session_id}`, '1', { ex: ttl_seconds });
    return;
  }
}

async function removeSubscription(redis, session_id, uri) {
  if (!session_id || !uri) return;
  if (redis && typeof redis.srem === 'function') {
    await redis.srem(key(uri), session_id);
    return;
  }
  if (redis && typeof redis.del === 'function') {
    await redis.del(`${key(uri)}:${session_id}`);
  }
}

async function listSubscribers(redis, uri) {
  if (redis && typeof redis.smembers === 'function') {
    const members = await redis.smembers(key(uri));
    return Array.isArray(members) ? members : [];
  }
  return [];
}

async function broadcastResourceUpdated(redis, uri, sseChannels) {
  const subscribers = await listSubscribers(redis, uri);
  let notified = 0;
  let removed = 0;
  const frame = {
    jsonrpc: '2.0',
    method: 'notifications/resources/updated',
    params: { uri },
  };
  const payload = `data: ${JSON.stringify(frame)}\n\n`;
  for (const session_id of subscribers) {
    const channel = sseChannels && typeof sseChannels.get === 'function' ? sseChannels.get(session_id) : null;
    if (!channel || typeof channel.write !== 'function') {
      await removeSubscription(redis, session_id, uri);
      removed++;
      continue;
    }
    try {
      channel.write(payload);
      notified++;
    } catch {
      await removeSubscription(redis, session_id, uri);
      removed++;
    }
  }
  return { notified, removed };
}

module.exports = {
  SUBSCRIPTION_TTL_SECONDS,
  addSubscription,
  removeSubscription,
  listSubscribers,
  broadcastResourceUpdated,
};
