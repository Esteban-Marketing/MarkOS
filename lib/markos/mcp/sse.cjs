'use strict';

// Phase 202 Plan 08 — Server-Sent Events framing helper for MCP streaming (D-26).
//
// Usage:
//   openSseStream(res)              — set headers + flush
//   writeSseFrame(res, obj)         — emit `data: <json>\n\n` framing
//   sendProgressNotification(res, { progressToken, progress, total?, message? })
//                                    — writes a JSON-RPC notifications/progress envelope
//   sendResourceUpdated(res, uri)   — writes a notifications/resources/updated envelope
//   closeSseStream(res)             — writes `data: [DONE]\n\n` + ends the response
//
// T-202-08-07 mitigation: writeSseFrame serializes the data object via JSON.stringify —
// newlines in messages auto-escape; no raw string concatenation into the SSE payload.

function openSseStream(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    try { res.flushHeaders(); } catch { /* some response mocks don't support flush */ }
  }
  res._sseOpen = true;
}

function writeSseFrame(res, data) {
  if (!res || !res._sseOpen) throw new Error('writeSseFrame: stream not open');
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function closeSseStream(res) {
  if (!res || !res._sseOpen) return;
  try { res.write('data: [DONE]\n\n'); } catch { /* broken pipe is survivable at close-time */ }
  try { res.end(); } catch { /* same */ }
  res._sseOpen = false;
}

function sendProgressNotification(res, { progressToken, progress, total, message }) {
  const params = { progressToken, progress };
  if (total !== undefined) params.total = total;
  if (message !== undefined) params.message = message;
  writeSseFrame(res, {
    jsonrpc: '2.0',
    method: 'notifications/progress',
    params,
  });
}

function sendResourceUpdated(res, uri) {
  writeSseFrame(res, {
    jsonrpc: '2.0',
    method: 'notifications/resources/updated',
    params: { uri },
  });
}

module.exports = {
  openSseStream,
  writeSseFrame,
  closeSseStream,
  sendProgressNotification,
  sendResourceUpdated,
};
