const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

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

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function createPhase75Seed() {
  return {
    company: {
      name: 'Identity Integration Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Identity Integration',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Platform teams',
      pain_points: ['Inconsistent role mapping', 'Unclear lineage'],
    },
    market: {
      competitors: [
        { name: 'Vendor One', positioning: 'Branding-only' },
        { name: 'Vendor Two', positioning: 'Token-only' },
      ],
      market_trends: ['Design governance', 'Accessibility-first delivery'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Identity Integration Labs',
        mission_statement: 'Lineage-safe deterministic identity artifacts.',
      },
      audience_segments: [
        {
          segment_id: 'seg-ops',
          segment_name: 'Platform teams',
          pains: [{ pain: 'Pipeline drift', rationale: 'Different teams interpret briefs differently.' }],
          needs: [{ need: 'Stable identity contracts', rationale: 'Deployments require deterministic outputs.' }],
          expectations: [{ expectation: 'Traceable lineage', rationale: 'Audits require upstream linkage.' }],
          desired_outcomes: ['Safer rollout'],
        },
        {
          segment_id: 'seg-comp',
          segment_name: 'Compliance leads',
          pains: [{ pain: 'Late accessibility findings', rationale: 'Checks often happen at release time.' }],
          needs: [{ need: 'Deterministic gate checks', rationale: 'Governance expects repeatable diagnostics.' }],
          expectations: [{ expectation: 'Explicit publish readiness status', rationale: 'Release decisions must be machine-readable.' }],
          desired_outcomes: ['No surprise blockers'],
        },
      ],
    },
  };
}

test('75-03-02: submit returns additive identity metadata and accessibility report without contract regression', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');

  await withMockedModule(vectorStorePath, {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
  }, async () => {
    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({
        drafts: {
          company_profile: 'Drafted company profile',
          channel_strategy: 'Drafted channel strategy',
        },
        vectorStoreResults: [{ discipline: 'Paid_Media', status: 'ok' }],
        errors: [],
      }),
    }, async () => {
      await withMockedModule(readinessPath, {
        evaluateLiteracyReadiness: async () => ({ readiness: 'ready', disciplines_available: ['Paid_Media'], gaps: [] }),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const req = createJsonRequest({ seed: createPhase75Seed(), project_slug: 'phase-75-identity-integration' }, '/submit');
        const res = createMockResponse();

        await handlers.handleSubmit(req, res);

        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);

        assert.equal(payload.success, true);
        assert.ok(payload.slug);
        assert.ok(payload.validation);
        assert.ok(payload.vector_store);
        assert.ok(payload.drafts);

        assert.ok(payload.strategy_artifact_metadata);
        assert.ok(payload.identity_artifact);
        assert.ok(payload.identity_artifact_metadata);
        assert.ok(payload.identity_artifact_write);
        assert.ok(payload.accessibility_gate_report);
        assert.ok(payload.publish_readiness);

        const gateStatus = payload.accessibility_gate_report.gate_status;
        assert.ok(gateStatus === 'pass' || gateStatus === 'blocked');
        assert.equal(payload.publish_readiness.status, gateStatus === 'blocked' ? 'blocked' : 'ready');
        assert.equal(payload.publish_readiness.blocked, gateStatus === 'blocked');

        assert.equal(
          payload.identity_artifact_metadata.strategy_fingerprint,
          payload.strategy_artifact_metadata.deterministic_fingerprint
        );
        assert.ok(Array.isArray(payload.accessibility_gate_report.checks));
        assert.ok(payload.accessibility_gate_report.checks.length > 0);
        assert.ok(Array.isArray(payload.publish_readiness.reason_codes));
        assert.ok(Array.isArray(payload.publish_readiness.diagnostics));
      });
    });
  });
});
