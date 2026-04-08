const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const {
  createTestEnvironment,
  createJsonRequest,
  withMockedModule,
} = require('../setup.js');

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

function createValidSeed() {
  return {
    company: {
      name: 'Acme Corp',
      stage: 'pre-launch',
      industry: 'Cybersecurity',
    },
    product: {
      name: 'Acme Shield',
      category: 'Software',
    },
    audience: {
      segment_name: 'CISOs',
      pain_points: ['Noisy tooling', 'Unclear attribution'],
    },
    market: {
      competitors: [
        { name: 'Corp A', positioning: 'Enterprise-first' },
        { name: 'Corp B', positioning: 'SMB-first' },
      ],
      market_trends: ['AI-assisted security triage'],
    },
    content: {
      content_maturity: 'basic',
    },
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function copyRecursiveSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

test('TEN-04: submit blocks new project creation when project capacity is exhausted', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  copyRecursiveSync(
    path.resolve(__dirname, '../../lib/markos/billing'),
    path.join(env.dir, 'lib', 'markos', 'billing')
  );
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

  let orchestrateCalled = false;

  await withMockedModule(vectorStorePath, {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
  }, async () => {
    await withMockedModule(orchestratorPath, {
      orchestrate: async () => {
        orchestrateCalled = true;
        return { drafts: {}, vectorStoreResults: [], errors: [] };
      },
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        seed: createValidSeed(),
      }, '/submit');
      req.entitlementSnapshot = {
        allowances: { projects: 1 },
        usage_to_date: { projects: 1 },
        quota_state: { projects: 'at_limit' },
      };
      const res = createMockResponse();

      await handlers.handleSubmit(req, res);

      assert.equal(res.statusCode, 403);
      const payload = JSON.parse(res.body);
      assert.equal(payload.error, 'PROJECT_CAP_EXCEEDED');
      assert.equal(payload.outcome?.code, 'PROJECT_CAP_EXCEEDED');
      assert.equal(orchestrateCalled, false);
    });
  });
});