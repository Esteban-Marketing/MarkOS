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

function createSeed() {
  return {
    company: {
      name: 'Phase 79 Labs',
      stage: 'pre-launch',
      industry: 'Software',
    },
    product: {
      name: 'Lineage Guard',
      category: 'SaaS',
    },
    audience: {
      segment_name: 'Product teams',
      pain_points: ['Unstable handoffs', 'Missing governance proofs'],
    },
    market: {
      competitors: [
        { name: 'Competitor A', positioning: 'Manual workflows' },
        { name: 'Competitor B', positioning: 'Template heavy' },
      ],
      market_trends: ['Deterministic governance'],
    },
    content: { content_maturity: 'basic' },
    brand_input: {
      brand_profile: {
        primary_name: 'Phase 79 Labs',
        mission_statement: 'Deterministic lineage handoff.',
      },
      audience_segments: [
        {
          segment_id: 'seg-1',
          segment_name: 'Product teams',
          pains: [{ pain: 'Lineage drift', rationale: 'Manual joins break contracts.' }],
          needs: [{ need: 'Deterministic handoff', rationale: 'Automation needs stable lanes.' }],
          expectations: [{ expectation: 'Machine-readable denials', rationale: 'Runtime must explain failures.' }],
          desired_outcomes: ['Reliable publish gates'],
        },
        {
          segment_id: 'seg-2',
          segment_name: 'Engineering leads',
          pains: [{ pain: 'Late gate failures', rationale: 'Discovery happens too late.' }],
          needs: [{ need: 'Explicit reason codes', rationale: 'Faster remediation.' }],
          expectations: [{ expectation: 'Stable lane naming', rationale: 'Avoid semantic drift.' }],
          desired_outcomes: ['Predictable submits'],
        },
      ],
    },
  };
}

async function runSubmitWithMocks(env, options) {
  const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
  const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
  const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
  const readinessPath = path.join(env.dir, 'onboarding', 'backend', 'literacy', 'activation-readiness.cjs');
  const normalizePath = path.join(env.dir, 'onboarding', 'backend', 'brand-inputs', 'normalize-brand-input.cjs');
  const graphPath = path.join(env.dir, 'onboarding', 'backend', 'brand-inputs', 'evidence-graph-writer.cjs');
  const strategySynthPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'strategy-synthesizer.cjs');
  const contradictionPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'contradiction-detector.cjs');
  const messagingPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'messaging-rules-compiler.cjs');
  const roleViewsPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'role-view-projector.cjs');
  const strategyWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-strategy', 'strategy-artifact-writer.cjs');
  const identityCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-compiler.cjs');
  const accessibilityPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'accessibility-gates.cjs');
  const identityWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-identity', 'identity-artifact-writer.cjs');
  const tokenPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'token-compiler.cjs');
  const componentPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'component-contract-compiler.cjs');
  const designWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-design-system', 'design-system-artifact-writer.cjs');
  const starterCompilerPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-descriptor-compiler.cjs');
  const rolePacksPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'role-handoff-pack-projector.cjs');
  const starterWriterPath = path.join(env.dir, 'onboarding', 'backend', 'brand-nextjs', 'starter-artifact-writer.cjs');
  const bundlePath = path.join(env.dir, 'onboarding', 'backend', 'brand-governance', 'bundle-registry.cjs');
  const closurePath = path.join(env.dir, 'onboarding', 'backend', 'brand-governance', 'closure-gates.cjs');
  const driftPath = path.join(env.dir, 'onboarding', 'backend', 'brand-governance', 'drift-auditor.cjs');
  const evidencePath = path.join(env.dir, 'onboarding', 'backend', 'brand-governance', 'governance-artifact-writer.cjs');

  const captured = { canonicalArtifacts: null };

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
        await withMockedModule(normalizePath, {
          normalizeBrandInput: () => ({ content_fingerprint: 'brand-fp', normalized_segments: [] }),
          verifyDeterminism: () => ({ match: true }),
        }, async () => {
          await withMockedModule(graphPath, {
            upsertNormalizedSegments: async () => ({ profile_upserted: true, segments_upserted: [], edges_created: [] }),
            queryEvidenceByTenant: async () => [],
          }, async () => {
            await withMockedModule(strategySynthPath, {
              synthesizeStrategyArtifact: () => ({ artifact: { pillars: [] }, metadata: { ruleset_version: '74.02.0' } }),
            }, async () => {
              await withMockedModule(contradictionPath, {
                detectContradictions: () => [],
              }, async () => {
                await withMockedModule(messagingPath, {
                  compileMessagingRules: () => ({ compiled: true }),
                }, async () => {
                  await withMockedModule(roleViewsPath, {
                    projectRoleViews: () => ({ strategy: {} }),
                  }, async () => {
                    await withMockedModule(strategyWriterPath, {
                      persistStrategyArtifact: () => options.strategyWrite,
                    }, async () => {
                      await withMockedModule(identityCompilerPath, {
                        compileIdentityArtifact: () => ({ artifact: {}, metadata: {} }),
                      }, async () => {
                        await withMockedModule(accessibilityPath, {
                          evaluateAccessibilityGates: () => ({ gate_status: 'ready', diagnostics: [] }),
                        }, async () => {
                          await withMockedModule(identityWriterPath, {
                            persistIdentityArtifact: () => options.identityWrite,
                          }, async () => {
                            await withMockedModule(tokenPath, {
                              compileTokenContract: () => ({ token_contract: {}, metadata: {}, diagnostics: [] }),
                            }, async () => {
                              await withMockedModule(componentPath, {
                                compileComponentContractManifest: () => ({ component_contract_manifest: {}, metadata: {}, diagnostics: [] }),
                              }, async () => {
                                await withMockedModule(designWriterPath, {
                                  persistDesignSystemArtifacts: () => options.designWrite,
                                }, async () => {
                                  await withMockedModule(starterCompilerPath, {
                                    compileStarterDescriptor: () => ({ starter_descriptor: {}, metadata: {} }),
                                  }, async () => {
                                    await withMockedModule(rolePacksPath, {
                                      projectRoleHandoffPacks: () => ({ role_pack_contract: {}, metadata: {}, diagnostics: [] }),
                                    }, async () => {
                                      await withMockedModule(starterWriterPath, {
                                        persistStarterArtifacts: () => options.starterWrite,
                                      }, async () => {
                                        await withMockedModule(bundlePath, {
                                          createBundle: (_tenantId, canonicalArtifacts) => {
                                            captured.canonicalArtifacts = canonicalArtifacts;
                                            return options.bundleResult;
                                          },
                                          getBundle: () => null,
                                          setVerificationEvidence: () => ({}),
                                        }, async () => {
                                          await withMockedModule(closurePath, {
                                            runClosureGates: () => ({ passed: true, gates: {} }),
                                          }, async () => {
                                            await withMockedModule(driftPath, {
                                              auditDrift: () => ({ tenant_id: 'tenant', has_drift: false, expected_fingerprint: 'x', active_fingerprint: 'x' }),
                                            }, async () => {
                                              await withMockedModule(evidencePath, {
                                                writeGovernanceEvidence: () => ({
                                                  tenant_id: 'tenant',
                                                  bundle_id: 'bundle-1',
                                                  gate_results: { passed: true, gates: {} },
                                                  drift_summary: { has_drift: false },
                                                  evidence_hash: 'evidence-1',
                                                  written_at: '2026-04-12T00:00:00.000Z',
                                                }),
                                              }, async () => {
                                                const handlers = loadFreshModule(handlersPath);
                                                const req = createJsonRequest({ seed: createSeed(), project_slug: 'phase-79-submit' }, '/submit');
                                                const res = createMockResponse();
                                                await handlers.handleSubmit(req, res);

                                                options.assertions({ res, captured });
                                              });
                                            });
                                          });
                                        });
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

test('79-02: submit handoff forwards lineage_fingerprints to governance bundle creation', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  await runSubmitWithMocks(env, {
    strategyWrite: { artifact_id: 'tenant:strategy:1', artifact_fingerprint: 'fp-strategy' },
    identityWrite: { artifact_id: 'tenant:identity:1', artifact_fingerprint: 'fp-identity' },
    designWrite: { artifact_id: 'tenant:design-system:1', token_contract_fingerprint: 'fp-design-system' },
    starterWrite: { artifact_id: 'tenant:nextjs-starter:1', starter_fingerprint: 'fp-starter' },
    bundleResult: { tenant_id: 'tenant', bundle_id: 'bundle-1', lineage_fingerprints: {} },
    assertions: ({ res, captured }) => {
      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.ok(captured.canonicalArtifacts, 'createBundle should receive canonicalArtifacts');
      assert.equal(captured.canonicalArtifacts.strategy_artifact_id, 'tenant:strategy:1');
      assert.equal(captured.canonicalArtifacts.identity_artifact_id, 'tenant:identity:1');
      assert.equal(captured.canonicalArtifacts.design_system_artifact_id, 'tenant:design-system:1');
      assert.equal(captured.canonicalArtifacts.starter_artifact_id, 'tenant:nextjs-starter:1');
      assert.deepEqual(captured.canonicalArtifacts.lineage_fingerprints, {
        strategy: 'fp-strategy',
        identity: 'fp-identity',
        design_system: 'fp-design-system',
        starter: 'fp-starter',
      });
    },
  });
});

test('79-02: governance deny remains additive and machine-readable while submit succeeds', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

  await runSubmitWithMocks(env, {
    strategyWrite: null,
    identityWrite: null,
    designWrite: null,
    starterWrite: null,
    bundleResult: { denied: true, reason_code: 'BRAND_GOV_MISSING_LANE' },
    assertions: ({ res }) => {
      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.equal(payload.branding_governance.error, 'bundle_creation_denied');
      assert.equal(payload.branding_governance.reason_code, 'BRAND_GOV_MISSING_LANE');
      assert.equal(payload.branding_governance.machine_readable, true);
    },
  });
});
