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
      name: 'Identity Pipeline Co',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Identity Pipeline',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Design operators',
      pain_points: ['Inconsistent contracts', 'Unclear publish gates'],
    },
    market: {
      competitors: [
        { name: 'Vendor One', positioning: 'Template-first' },
        { name: 'Vendor Two', positioning: 'Design-system-first' },
      ],
      market_trends: ['Accessibility compliance', 'Deterministic tooling'],
    },
    content: {
      content_maturity: 'basic',
    },
    brand_input: {
      brand_profile: {
        primary_name: 'Identity Pipeline Co',
        mission_statement: 'Deterministic identity and accessibility gates.',
      },
      audience_segments: [
        {
          segment_id: 'seg-1',
          segment_name: 'Design operators',
          pains: [{ pain: 'Manual palette drift', rationale: 'Teams diverge at handoff.' }],
          needs: [{ need: 'Stable semantic role outputs', rationale: 'Builds need deterministic keys.' }],
          expectations: [{ expectation: 'Clear publish blocking reasons', rationale: 'Approvals need objective diagnostics.' }],
          desired_outcomes: ['Fewer release regressions'],
        },
        {
          segment_id: 'seg-2',
          segment_name: 'Accessibility owners',
          pains: [{ pain: 'Late blocking checks', rationale: 'Issues surface close to release.' }],
          needs: [{ need: 'Fail-closed gate behavior', rationale: 'Unsafe outputs cannot be published.' }],
          expectations: [{ expectation: 'Machine-readable reason codes', rationale: 'Automation needs deterministic diagnostics.' }],
          desired_outcomes: ['Predictable governance'],
        },
      ],
    },
  };
}

test('75-03-01: submit blocks publish readiness when required accessibility checks fail', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');
  const identityCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-compiler.cjs');
  const accessibilityGatesPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'accessibility-gates.cjs');
  const identityWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-artifact-writer.cjs');

  const callOrder = [];

  await withMockedModule(vectorStorePath, {
    configure: () => {},
    upsertSeed: async () => [],
    storeDraft: async () => ({ ok: true }),
  }, async () => {
    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
    }, async () => {
      await withMockedModule(readinessPath, {
        evaluateLiteracyReadiness: async () => ({ readiness: 'ready', disciplines_available: [], gaps: [] }),
      }, async () => {
        await withMockedModule(identityCompilerPath, {
          compileIdentityArtifact: () => {
            callOrder.push('compile');
            return {
              artifact: {
                semantic_color_roles: {
                  'text.primary': '#ffffff',
                  'surface.default': '#ffffff',
                },
              },
              metadata: {
                deterministic_fingerprint: 'identity-fingerprint-1',
                strategy_fingerprint: 'strategy-fingerprint-1',
                ruleset_version: '75.02.0',
              },
            };
          },
        }, async () => {
          await withMockedModule(accessibilityGatesPath, {
            evaluateAccessibilityGates: () => {
              callOrder.push('gates');
              return {
                gate_status: 'blocked',
                checks: [
                  {
                    id: 'contrast.text.primary_on_surface.default',
                    status: 'fail',
                    blocking: true,
                    reason_code: 'ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD',
                    observed_ratio: 1,
                    required_ratio: 4.5,
                  },
                ],
                diagnostics: [
                  {
                    check_id: 'contrast.text.primary_on_surface.default',
                    blocking: true,
                    reason_code: 'ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD',
                    message: 'contrast below threshold',
                    observed_ratio: 1,
                    required_ratio: 4.5,
                  },
                ],
              };
            },
          }, async () => {
            await withMockedModule(identityWriterPath, {
              persistIdentityArtifact: () => {
                callOrder.push('persist');
                return {
                  created: true,
                  committed: true,
                  artifact_id: 'tenant:identity:1',
                  artifact_fingerprint: 'identity-fingerprint-1',
                  ruleset_version: '75.02.0',
                  upsert_count: 1,
                };
              },
            }, async () => {
              const handlers = loadFreshModule(handlersPath);
              const req = createJsonRequest({ seed: createPhase75Seed(), project_slug: 'phase-75-publish-block' }, '/submit');
              const res = createMockResponse();

              await handlers.handleSubmit(req, res);

              assert.equal(res.statusCode, 200);
              const payload = JSON.parse(res.body);
              assert.equal(payload.success, true);
              assert.equal(payload.publish_readiness.status, 'blocked');
              assert.equal(payload.publish_readiness.blocked, true);
              assert.deepEqual(payload.publish_readiness.reason_codes, ['ACCESSIBILITY_CONTRAST_BELOW_THRESHOLD']);
              assert.equal(payload.publish_readiness.reason_codes.some((code) => /^TOKEN_|^COMPONENT_|^STARTER_|^ROLE_|^LINEAGE_|^BRAND_GOV_/.test(code)), false);
              assert.equal(payload.accessibility_gate_report.gate_status, 'blocked');
              assert.equal(payload.accessibility_gate_report.diagnostics.length, 1);
              assert.deepEqual(callOrder, ['compile', 'gates', 'persist']);
            });
          });
        });
      });
    });
  });
});

