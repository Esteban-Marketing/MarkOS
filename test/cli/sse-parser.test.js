'use strict';

// Phase 204 Plan 06 Task 2 — SSE parser (client-side) + reconnect tests.
//
// Covers bin/lib/cli/sse.cjs::streamSSE end-to-end against a local stub
// http server fixture. Supplements Plan 204-01 which shipped the streamSSE
// primitive; here we validate the contract with realistic frame shapes.
//
// Cases:
//   sse-01: single-line data frame parses to { event, data, payload, id }
//   sse-02: multi-line data frames concatenate with \n between lines
//   sse-03: Last-Event-ID is sent on reconnect (server asserts)
//   sse-04: AbortController.signal.abort() stops the stream cleanly
//
// Tests use the Plan 01 stub fixture at test/cli/_fixtures/sse-event-server.cjs.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const { streamSSE } = require(path.resolve(REPO_ROOT, 'bin', 'lib', 'cli', 'sse.cjs'));
const { startStubSseServer } = require(path.resolve(__dirname, '_fixtures', 'sse-event-server.cjs'));

// ─── sse-01 ────────────────────────────────────────────────────────────────

test('sse-01: single-line data parses event + payload + id', async () => {
  const { url, close } = await startStubSseServer({
    events: [
      { event: 'run.snapshot', data: { run_id: 'run_x', status: 'running' }, id: '1' },
      { event: 'run.completed', data: { run_id: 'run_x', status: 'success' }, id: '2' },
    ],
    intervalMs: 10,
    heartbeatMs: 60_000,
  });

  const received = [];
  const controller = new AbortController();

  try {
    const done = streamSSE(url, {
      signal: controller.signal,
      heartbeatMs: 5_000,
      maxRetries: 0,
      onEvent: (evt) => {
        received.push(evt);
        if (evt.event === 'run.completed') controller.abort();
      },
    });
    // Safety net timeout.
    await Promise.race([done, new Promise((r) => setTimeout(r, 2000))]);

    assert.ok(received.length >= 2, `received ${received.length} events`);
    const first = received[0];
    assert.equal(first.event, 'run.snapshot');
    assert.ok(first.payload);
    assert.equal(first.payload.run_id, 'run_x');
    assert.equal(first.id, '1');

    const completed = received.find((e) => e.event === 'run.completed');
    assert.ok(completed);
    assert.equal(completed.payload.status, 'success');
  } finally {
    controller.abort();
    await close();
  }
});

// ─── sse-02 ────────────────────────────────────────────────────────────────

test('sse-02: multi-line data frames concatenate with \\n', async () => {
  // The fixture stub splits string data on \n into multiple `data:` lines,
  // which is exactly the MDN SSE spec shape. We supply a multi-line string.
  const { url, close } = await startStubSseServer({
    events: [
      { event: 'note', data: 'line1\nline2\nline3', id: '1' },
    ],
    intervalMs: 5,
    heartbeatMs: 60_000,
  });

  const received = [];
  const controller = new AbortController();

  try {
    const done = streamSSE(url, {
      signal: controller.signal,
      heartbeatMs: 5_000,
      maxRetries: 0,
      onEvent: (evt) => {
        received.push(evt);
        controller.abort();
      },
    });
    await Promise.race([done, new Promise((r) => setTimeout(r, 1500))]);

    assert.ok(received.length >= 1);
    const first = received[0];
    assert.equal(first.event, 'note');
    assert.equal(first.data, 'line1\nline2\nline3', `multi-line data joined: ${JSON.stringify(first.data)}`);
  } finally {
    controller.abort();
    await close();
  }
});

// ─── sse-03 ────────────────────────────────────────────────────────────────

test('sse-03: Last-Event-ID sent on reconnect', async () => {
  // Custom server: on connection 1 send id=5 then close; on connection 2
  // capture Last-Event-ID header and echo it back as a "resume" event.
  let connection = 0;
  let resumeIdSeen = null;

  const server = http.createServer((req, res) => {
    connection += 1;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    if (connection === 1) {
      res.write(`event: snapshot\ndata: ${JSON.stringify({ n: 1 })}\nid: 5\n\n`);
      setTimeout(() => { try { res.end(); } catch {} }, 50);
      return;
    }
    // Second connection: echo the Last-Event-ID and then send a resume event.
    resumeIdSeen = req.headers['last-event-id'] || null;
    res.write(`event: resume\ndata: ${JSON.stringify({ last: resumeIdSeen })}\nid: 6\n\n`);
    setTimeout(() => { try { res.end(); } catch {} }, 50);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const url = `http://127.0.0.1:${addr.port}`;

  const received = [];
  const controller = new AbortController();
  try {
    const done = streamSSE(url, {
      signal: controller.signal,
      heartbeatMs: 5_000,
      maxRetries: 2,
      onEvent: (evt) => {
        received.push(evt);
        if (evt.event === 'resume') {
          // Got the resume confirmation — abort.
          setTimeout(() => controller.abort(), 20);
        }
      },
    });
    await Promise.race([done, new Promise((r) => setTimeout(r, 4000))]);

    assert.ok(received.some((e) => e.event === 'snapshot'), 'first connection delivered snapshot');
    const resume = received.find((e) => e.event === 'resume');
    assert.ok(resume, 'reconnected + received resume frame');
    assert.equal(resumeIdSeen, '5', `Last-Event-ID on reconnect was ${resumeIdSeen}`);
  } finally {
    controller.abort();
    server.close();
  }
});

// ─── sse-04 ────────────────────────────────────────────────────────────────

test('sse-04: AbortController.signal.abort stops stream cleanly', async () => {
  const { url, close } = await startStubSseServer({
    events: [
      { event: 'a', data: { n: 1 }, id: '1' },
      { event: 'b', data: { n: 2 }, id: '2' },
      { event: 'c', data: { n: 3 }, id: '3' },
    ],
    intervalMs: 100,
    heartbeatMs: 60_000,
  });

  const received = [];
  const controller = new AbortController();

  try {
    const done = streamSSE(url, {
      signal: controller.signal,
      heartbeatMs: 5_000,
      maxRetries: 0,
      onEvent: (evt) => {
        received.push(evt);
        if (received.length === 1) controller.abort();
      },
    });

    await Promise.race([done, new Promise((r) => setTimeout(r, 1500))]);
    // Should have received exactly ~1 event before abort fired.
    assert.ok(received.length <= 2,
      `received ${received.length} events after abort (expected ≤2 due to inflight)`);
    assert.ok(controller.signal.aborted);
  } finally {
    controller.abort();
    await close();
  }
});
