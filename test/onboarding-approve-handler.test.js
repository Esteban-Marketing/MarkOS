const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { createTestEnvironment, createJsonRequest, withMockedModule } = require('./setup.js');

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(chunk = '') {
      this.body += chunk || '';
    },
  };
}

function loadFresh(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('approve handler writes canonical notes and durable report metadata', async () => {
  const env = createTestEnvironment();
  env.seedOnboarding();

  try {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const telemetryPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'telemetry.cjs');
    const skeletonGeneratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'skeleton-generator.cjs');

    const winnersPath = path.join(env.dir, '.markos-local', 'MSP', 'Paid_Media', 'WINNERS');
    fs.mkdirSync(winnersPath, { recursive: true });
    fs.writeFileSync(path.join(winnersPath, '_CATALOG.md'), '# winners\n', 'utf8');

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      storeDraft: async () => ({ ok: true }),
    }, async () => {
      await withMockedModule(telemetryPath, {
        captureExecutionCheckpoint: () => {},
        captureRolloutEndpointEvent: () => {},
      }, async () => {
        await withMockedModule(skeletonGeneratorPath, {
          generateSkeletons: async () => [],
        }, async () => {
          const handlers = loadFresh(handlersPath);
          const req = createJsonRequest({
            slug: 'acme-slug',
            approvedDrafts: {
              company_profile: '## Snapshot\n\nCanonical company truth.',
            },
          }, '/approve');
          const res = createMockResponse();

          await handlers.handleApprove(req, res);
          assert.equal(res.statusCode, 200);

          const payload = JSON.parse(res.body);
          assert.equal(payload.success, true);
          assert.equal(payload.canonical_notes_written, 1);
          assert.equal(payload.report_note_path.startsWith('MarkOS-Vault/Memory/Migration Reports/'), true);
          assert.deepEqual(payload.written, ['MarkOS-Vault/Strategy/company.md']);
          assert.equal(payload.note_outcomes[0].outcome, 'imported');

          const notePath = path.join(env.dir, 'MarkOS-Vault', 'Strategy', 'company.md');
          const reportPath = path.join(env.dir, payload.report_note_path);
          assert.ok(fs.existsSync(notePath));
          assert.ok(fs.existsSync(reportPath));
          assert.match(fs.readFileSync(notePath, 'utf8'), /source_mode: generated/);
          assert.match(fs.readFileSync(reportPath, 'utf8'), /Legacy MIR\/MSP content remains in place as migration reference only\./);
        });
      });
    });
  } finally {
    env.cleanup();
  }
});