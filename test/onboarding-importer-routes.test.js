const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { createTestEnvironment, createJsonRequest } = require('./setup.js');

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function createMockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

test('importer scan previews eligible canonical destinations', async () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const handlers = loadFresh(handlersPath);

    const mirProfilePath = path.join(env.dir, '.markos-local', 'MIR', 'Core_Strategy', '01_COMPANY', 'PROFILE.md');
    const mspChannelPath = path.join(env.dir, '.markos-local', 'MSP', 'Strategy', '00_MASTER-PLAN', 'CHANNEL-STRATEGY.md');
    fs.mkdirSync(path.dirname(mirProfilePath), { recursive: true });
    fs.mkdirSync(path.dirname(mspChannelPath), { recursive: true });
    fs.writeFileSync(mirProfilePath, '# Company Profile\n\nLegacy truth', 'utf8');
    fs.writeFileSync(mspChannelPath, '# Channel Strategy\n\nLegacy execution plan', 'utf8');

    const req = createJsonRequest({ slug: 'acme' }, '/api/importer/scan');
    const res = createMockResponse();
    await handlers.handleImporterScan(req, res);

    assert.equal(res.statusCode, 200);
    const payload = JSON.parse(res.body);
    assert.equal(payload.phase, 'scan');
    assert.equal(payload.success, true);
    assert.equal(payload.totals.total, 2);
    assert.equal(payload.totals.eligible, 2);
    assert.equal(payload.report_note_path, null);
    assert.deepEqual(payload.items.map((item) => item.destination_path).sort(), [
      'MarkOS-Vault/Execution/channel-system.md',
      'MarkOS-Vault/Strategy/company.md',
    ]);
  } finally {
    env.cleanup();
  }
});

test('importer apply returns report note path and preserves blocked canonical notes', async () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const handlers = loadFresh(handlersPath);

    const mirProfilePath = path.join(env.dir, '.markos-local', 'MIR', 'Core_Strategy', '01_COMPANY', 'PROFILE.md');
    const canonicalPath = path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md');
    fs.mkdirSync(path.dirname(mirProfilePath), { recursive: true });
    fs.mkdirSync(path.dirname(canonicalPath), { recursive: true });
    fs.writeFileSync(mirProfilePath, '# Company Profile\n\nLegacy truth', 'utf8');
    fs.writeFileSync(canonicalPath, 'existing canonical note', 'utf8');

    const req = createJsonRequest({ slug: 'acme' }, '/api/importer/apply');
    const res = createMockResponse();
    await handlers.handleImporterApply(req, res);

    assert.equal(res.statusCode, 200);
    const payload = JSON.parse(res.body);
    assert.equal(payload.phase, 'apply');
    assert.equal(payload.success, true);
    assert.equal(typeof payload.report_note_path, 'string');
    assert.match(payload.report_note_path, /^MarkOS-Vault\/Memory\/Migration Reports\//);
    assert.equal(payload.totals.blocked, 1);
    assert.equal(fs.readFileSync(canonicalPath, 'utf8'), 'existing canonical note');
  } finally {
    env.cleanup();
  }
});