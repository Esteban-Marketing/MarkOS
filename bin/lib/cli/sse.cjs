'use strict';

// Phase 204 Plan 01 Task 2: SSE streaming primitive.
//
// Hand-rolled on top of Node 22 built-in fetch (undici). No EventSource
// polyfill. Features:
//   - Parses event: / data: / id: lines, double-newline frame boundary.
//   - Tracks Last-Event-ID; sends it on reconnect per MDN SSE spec.
//   - Exponential backoff reconnect, capped at 30s.
//   - Heartbeat timeout: if no event received within heartbeatMs (default
//     22_500 = 1.5x server 15s heartbeat), treats as disconnect and reconnects.
//   - Aborts when signal.abort() is called.

const { CLIENT_VERSION } = require('./http.cjs');

async function streamSSE(url, opts) {
  const {
    token,
    onEvent,
    signal,
    heartbeatMs = 22_500,
    maxRetries = Infinity,
  } = opts || {};

  let lastEventId = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    if (signal && signal.aborted) return;

    // Per-connection abort controller; chained to caller's signal if any.
    const connController = new AbortController();
    const onOuterAbort = () => connController.abort();
    if (signal) signal.addEventListener('abort', onOuterAbort);

    // Heartbeat watchdog resets on each event received.
    let heartbeatTimer = null;
    const resetHeartbeat = () => {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        connController.abort();
      }, heartbeatMs);
    };

    try {
      const headers = {
        'Accept': 'text/event-stream',
        'x-markos-client': `markos-cli/${CLIENT_VERSION}`,
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (lastEventId != null) headers['Last-Event-ID'] = String(lastEventId);

      const res = await fetch(url, { headers, signal: connController.signal });
      if (!res.ok || !res.body) {
        throw new Error(`sse: HTTP ${res.status}`);
      }

      resetHeartbeat();
      retryCount = 0;

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        if (signal && signal.aborted) {
          connController.abort();
          break;
        }
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const evt = {};
          for (const line of raw.split('\n')) {
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) continue;
            const key = line.slice(0, colonIdx).trim();
            const val = line.slice(colonIdx + 1).replace(/^\s/, '');
            if (key === 'id') {
              evt.id = val;
              lastEventId = val;
            } else if (key === 'event') {
              evt.event = val;
            } else if (key === 'data') {
              evt.data = (evt.data ? evt.data + '\n' : '') + val;
            }
          }
          if (evt.data !== undefined || evt.event !== undefined) {
            try { evt.payload = evt.data ? JSON.parse(evt.data) : undefined; } catch { /* keep raw */ }
            resetHeartbeat();
            try { onEvent && onEvent(evt); } catch { /* isolate consumer errors */ }
          }
        }
      }
    } catch (err) {
      if (signal && signal.aborted) return;
      // Reconnect with exponential backoff.
      const delay = Math.min(30_000, 1000 * Math.pow(2, retryCount));
      retryCount += 1;
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      if (signal) signal.removeEventListener('abort', onOuterAbort);
    }
  }
}

module.exports = { streamSSE };
