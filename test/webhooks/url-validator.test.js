'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateWebhookUrl,
  resolvePinnedAgent,
  DEFAULT_MAX_REDIRECTS,
  DENIED_PROTOCOLS,
} = require('../../lib/markos/webhooks/url-validator.cjs');

function stubLookup(result) {
  return async (_host, _opts) => result;
}

function stubLookupMany(results) {
  return async (_host, _opts) => results;
}

test('validateWebhookUrl allows public https://example.com', async () => {
  const result = await validateWebhookUrl('https://example.com/hook', {
    lookup: stubLookup([{ address: '93.184.216.34', family: 4 }]),
  });
  assert.equal(result.ok, true);
  assert.equal(result.resolvedIp, '93.184.216.34');
  assert.equal(result.resolvedFamily, 'A');
  assert.equal(result.hostname, 'example.com');
});

test('validateWebhookUrl allows public https://api.partner.example', async () => {
  const result = await validateWebhookUrl('https://api.partner.example/webhooks', {
    lookup: stubLookup([{ address: '203.0.113.10', family: 4 }]),
  });
  assert.equal(result.ok, true);
  assert.equal(result.resolvedIp, '203.0.113.10');
  assert.equal(result.resolvedFamily, 'A');
  assert.equal(result.hostname, 'api.partner.example');
});

test('validateWebhookUrl allows http://localhost only with allowLocalhostHttp', async () => {
  const result = await validateWebhookUrl('http://localhost/hook', {
    allowLocalhostHttp: true,
  });
  assert.equal(result.ok, true);
  assert.equal(result.resolvedIp, '127.0.0.1');
  assert.equal(result.resolvedFamily, 'A');
  assert.equal(result.detail, 'localhost-http-allowed');
});

test('validateWebhookUrl rejects http://example.com by default', async () => {
  const result = await validateWebhookUrl('http://example.com/hook');
  assert.deepEqual(result, { ok: false, reason: 'protocol_http_denied' });
});

test('validateWebhookUrl rejects file: protocol', async () => {
  const result = await validateWebhookUrl('file:///etc/passwd');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_denied');
  assert.equal(result.detail, 'file:');
});

test('validateWebhookUrl rejects gopher: protocol', async () => {
  const result = await validateWebhookUrl('gopher://internal/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_denied');
  assert.equal(result.detail, 'gopher:');
});

test('validateWebhookUrl rejects data: protocol', async () => {
  const result = await validateWebhookUrl('data:text/html,<x>');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_denied');
  assert.equal(result.detail, 'data:');
});

test('validateWebhookUrl rejects ftp: protocol', async () => {
  const result = await validateWebhookUrl('ftp://internal/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_denied');
  assert.equal(result.detail, 'ftp:');
});

test('validateWebhookUrl rejects dict: protocol', async () => {
  const result = await validateWebhookUrl('dict://internal/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'protocol_denied');
  assert.equal(result.detail, 'dict:');
});

test('validateWebhookUrl rejects https://169.254.169.254/latest/meta-data', async () => {
  const result = await validateWebhookUrl('https://169.254.169.254/latest/meta-data');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cloud_metadata');
  assert.equal(result.detail, '169.254.169.254');
});

test('validateWebhookUrl rejects https://10.0.0.1/', async () => {
  const result = await validateWebhookUrl('https://10.0.0.1/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rfc1918');
  assert.equal(result.detail, '10.0.0.1');
});

test('validateWebhookUrl rejects https://172.16.0.1/', async () => {
  const result = await validateWebhookUrl('https://172.16.0.1/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rfc1918');
  assert.equal(result.detail, '172.16.0.1');
});

test('validateWebhookUrl rejects https://192.168.1.1/', async () => {
  const result = await validateWebhookUrl('https://192.168.1.1/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rfc1918');
  assert.equal(result.detail, '192.168.1.1');
});

test('validateWebhookUrl rejects https://127.0.0.1/', async () => {
  const result = await validateWebhookUrl('https://127.0.0.1/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'loopback');
  assert.equal(result.detail, '127.0.0.1');
});

test('validateWebhookUrl rejects https://0.0.0.0/', async () => {
  const result = await validateWebhookUrl('https://0.0.0.0/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unspecified');
  assert.equal(result.detail, '0.0.0.0');
});

test('validateWebhookUrl rejects https://[::1]/', async () => {
  const result = await validateWebhookUrl('https://[::1]/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ipv6_loopback');
  assert.equal(result.detail, '::1');
});

test('validateWebhookUrl rejects https://[fe80::1]/', async () => {
  const result = await validateWebhookUrl('https://[fe80::1]/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ipv6_link_local');
  assert.equal(result.detail, 'fe80::1');
});

test('validateWebhookUrl rejects https://[fc00::1]/', async () => {
  const result = await validateWebhookUrl('https://[fc00::1]/');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'ipv6_unique_local');
  assert.equal(result.detail, 'fc00::1');
});

test('validateWebhookUrl rejects IPv4-mapped loopback', async () => {
  const result = await validateWebhookUrl('https://[::ffff:127.0.0.1]/');
  assert.equal(result.ok, false);
  assert.ok(['ipv4_mapped', 'ipv6_loopback'].includes(result.reason));
});

test('validateWebhookUrl rejects attacker DNS that resolves to 10.0.0.1', async () => {
  const result = await validateWebhookUrl('https://attacker.example/', {
    lookup: stubLookupMany([{ address: '10.0.0.1', family: 4 }]),
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rfc1918');
  assert.equal(result.detail, '10.0.0.1');
});

test('validateWebhookUrl rejects attacker DNS when ANY resolved address is blocked', async () => {
  const result = await validateWebhookUrl('https://attacker.example/', {
    lookup: stubLookupMany([
      { address: '1.1.1.1', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]),
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rfc1918');
  assert.equal(result.detail, '10.0.0.1');
});

test('validateWebhookUrl rejects dns_no_results', async () => {
  const result = await validateWebhookUrl('https://empty.example/', {
    lookup: stubLookupMany([]),
  });
  assert.deepEqual(result, { ok: false, reason: 'dns_no_results' });
});

test('validateWebhookUrl rejects invalid url syntax', async () => {
  const result = await validateWebhookUrl('not-a-url');
  assert.deepEqual(result, { ok: false, reason: 'invalid_url' });
});

test('validateWebhookUrl surfaces dns_lookup_failed', async () => {
  const result = await validateWebhookUrl('https://lookup-fail.example/', {
    lookup: async () => {
      throw new Error('ENOTFOUND');
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'dns_lookup_failed');
  assert.match(result.detail, /ENOTFOUND/);
});

test('validateWebhookUrl prefers IPv4 when both public A and AAAA exist', async () => {
  const result = await validateWebhookUrl('https://dualstack.example/', {
    lookup: stubLookupMany([
      { address: '2001:4860:4860::8888', family: 6 },
      { address: '8.8.8.8', family: 4 },
    ]),
  });
  assert.equal(result.ok, true);
  assert.equal(result.resolvedIp, '8.8.8.8');
  assert.equal(result.resolvedFamily, 'A');
});

test('resolvePinnedAgent sets explicit servername for SNI and pins lookup', (t) => {
  const agent = resolvePinnedAgent('1.1.1.1', 'A', 'partner.example');
  assert.equal(agent.options.servername, 'partner.example');

  return new Promise((resolve, reject) => {
    agent.options.lookup('any-host.example', {}, (error, address, family) => {
      try {
        assert.equal(error, null);
        assert.equal(address, '1.1.1.1');
        assert.equal(family, 4);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
});

test('export surfaces include DEFAULT_MAX_REDIRECTS and denied protocols', () => {
  assert.equal(DEFAULT_MAX_REDIRECTS, 3);
  assert.ok(DENIED_PROTOCOLS.includes('file:'));
  assert.ok(DENIED_PROTOCOLS.includes('gopher:'));
  assert.ok(DENIED_PROTOCOLS.includes('data:'));
  assert.ok(DENIED_PROTOCOLS.includes('ftp:'));
  assert.ok(DENIED_PROTOCOLS.includes('dict:'));
});
