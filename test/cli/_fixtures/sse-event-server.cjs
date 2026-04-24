'use strict';

// Phase 204 Plan 01 Task 3: stub SSE event server.
//
// Used by Plan 204-06 `markos run --watch` tests. Emits scriptable events
// with 50ms interval, double-newline frame termination, and 15s heartbeat.
//
// Usage:
//   const { port, url, close } = await startStubSseServer({
//     events: [
//       { event: 'run.step.started',  data: { run_id: 'run_abc', step: 'draft' }, id: '1' },
//       { event: 'run.completed',     data: { run_id: 'run_abc', status: 'success' }, id: '2' },
//     ],
//   });

const http = require('node:http');

function startStubSseServer(opts = {}) {
  const events = Array.isArray(opts.events) ? opts.events : [];
  const intervalMs = Number.isFinite(opts.intervalMs) ? opts.intervalMs : 50;
  const heartbeatMs = Number.isFinite(opts.heartbeatMs) ? opts.heartbeatMs : 15_000;

  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    let idx = 0;
    const sendNext = () => {
      if (idx >= events.length) return;
      const evt = events[idx++];
      const lines = [];
      if (evt.event) lines.push(`event: ${evt.event}`);
      if (evt.id != null) lines.push(`id: ${evt.id}`);
      if (evt.data !== undefined) {
        const payload = typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data);
        for (const l of payload.split('\n')) lines.push(`data: ${l}`);
      }
      res.write(lines.join('\n') + '\n\n');
      if (idx < events.length) setTimeout(sendNext, intervalMs);
    };

    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: {"ts":${Date.now()}}\n\n`);
    }, heartbeatMs);

    req.on('close', () => clearInterval(heartbeat));

    // Kick off first event on next tick so the client has time to subscribe.
    setImmediate(sendNext);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        port: addr.port,
        url: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

module.exports = { startStubSseServer };
