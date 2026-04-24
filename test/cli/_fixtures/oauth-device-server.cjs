'use strict';

// Phase 204 Plan 01 Task 3: stub OAuth 2.0 device-authorization server.
//
// Used by Plan 204-02 login tests. Implements RFC 8628 §3.5 wire protocol
// with scriptable scenarios:
//   'happy'     - returns authorization_pending 3 times then success (default)
//   'pending'   - returns authorization_pending indefinitely
//   'expired'   - returns expired_token on first poll
//   'denied'    - returns access_denied on first poll
//   'slow-down' - returns slow_down on first poll then success

const http = require('node:http');
const crypto = require('node:crypto');

function startStubOAuthServer(opts = {}) {
  const scenario = opts.scenario || 'happy';
  const pendingThreshold = Number.isFinite(opts.pendingThreshold) ? opts.pendingThreshold : 3;

  const state = {
    pollCount: 0,
    slowDownSent: false,
    deviceCode: 'dev_' + crypto.randomBytes(16).toString('hex'),
    userCode: 'WDJB-MJHT',
  };

  function readBody(req) {
    return new Promise((resolve) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/cli/oauth/device/start') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        device_code: state.deviceCode,
        user_code: state.userCode,
        verification_uri: 'http://localhost/cli/authorize',
        verification_uri_complete: `http://localhost/cli/authorize?user_code=${state.userCode}`,
        expires_in: 900,
        interval: 1,
      }));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/cli/oauth/device/token') {
      await readBody(req);
      state.pollCount += 1;

      if (scenario === 'expired') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'expired_token' }));
        return;
      }
      if (scenario === 'denied') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'access_denied' }));
        return;
      }
      if (scenario === 'pending') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'authorization_pending' }));
        return;
      }
      if (scenario === 'slow-down' && !state.slowDownSent) {
        state.slowDownSent = true;
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'slow_down' }));
        return;
      }

      // 'happy' (default): authorization_pending until threshold, then success.
      if (state.pollCount <= pendingThreshold && scenario === 'happy') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'authorization_pending' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: 'mks_ak_' + crypto.randomBytes(16).toString('hex'),
        token_type: 'bearer',
        expires_in: null,
        tenant_id: 'ten_stub',
        key_fingerprint: 'sha256:abc12345',
        scope: 'cli',
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found', path: req.url }));
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        port: addr.port,
        url: `http://127.0.0.1:${addr.port}`,
        state,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

module.exports = { startStubOAuthServer };
