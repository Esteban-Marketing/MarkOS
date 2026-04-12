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
    company: { name: 'Gate Recovery Inc', stage: 'pre-launch', industry: 'Software' },
    product: { name: 'Gate Recovery', category: 'SaaS' },
    audience: { segment_name: 'Ops teams', pain_points: ['Missing runtime proofs', 'Unclear gate state'] },
    market: {
      competitors: [
        { name: 'Competitor A', positioning: 'Legacy ops' },
        { name: 'Competitor B', positioning: 'Manual checks' },
      ],
      market_trends: ['Deterministic governance'],
    },
    content: { content_maturity: 'basic' },
    brand_input: {
      brand_profile: { primary_name: 'Gate Recovery Inc', mission_statement: 'Always show gate evidence.' },
      audience_segments: [
        {
          segment_id: 'seg-1',
          segment_name: 'Ops teams',
          pains: [{ pain: 'Late failures', rationale: 'No early proof.' }],
          needs: [{ need: 'Immediate evidence', rationale: 'Need confidence to ship.' }],
          expectations: [{ expectation: 'Gate triplet visibility', rationale: 'Need all checks visible.' }],
          desired_outcomes: ['No hidden denials'],
        },
        {
          segment_id: 'seg-2',
          segment_name: 'Platform leads',
          pains: [{ pain: 'Inconsistent diagnostics', rationale: 'Hard to debug.' }],
          needs: [{ need: 'Machine-readable contracts', rationale: 'Automation compatibility.' }],
          expectations: [{ expectation: 'Deterministic payloads', rationale: 'Repeatable runs.' }],
          desired_outcomes: ['Stable closure flow'],
        },
      ],
    },
  };
}

test('79-02: submit payload includes closure gate evidence after successful bundle creation', async (t) => {
  const env = createTestEnvironment();
  env.seedOnboarding();
  t.after(() => env.cleanup());

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

  let verificationHashSet = false;

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
                      persistStrategyArtifact: () => ({ artifact_id: 'tenant:strategy:1', artifact_fingerprint: 'fp-strategy' }),
                    }, async () => {
                      await withMockedModule(identityCompilerPath, {
                        compileIdentityArtifact: () => ({ artifact: {}, metadata: {} }),
                      }, async () => {
                        await withMockedModule(accessibilityPath, {
                          evaluateAccessibilityGates: () => ({ gate_status: 'ready', diagnostics: [] }),
                        }, async () => {
                          await withMockedModule(identityWriterPath, {
                            persistIdentityArtifact: () => ({ artifact_id: 'tenant:identity:1', artifact_fingerprint: 'fp-identity' }),
                          }, async () => {
                            await withMockedModule(tokenPath, {
                              compileTokenContract: () => ({ token_contract: {}, metadata: {}, diagnostics: [] }),
                            }, async () => {
                              await withMockedModule(componentPath, {
                                compileComponentContractManifest: () => ({ component_contract_manifest: {}, metadata: {}, diagnostics: [] }),
                              }, async () => {
                                await withMockedModule(designWriterPath, {
                                  persistDesignSystemArtifacts: () => ({ artifact_id: 'tenant:design-system:1', token_contract_fingerprint: 'fp-design-system' }),
                                }, async () => {
                                  await withMockedModule(starterCompilerPath, {
                                    compileStarterDescriptor: () => ({ starter_descriptor: {}, metadata: {} }),
                                  }, async () => {
                                    await withMockedModule(rolePacksPath, {
                                      projectRoleHandoffPacks: () => ({ role_pack_contract: {}, metadata: {}, diagnostics: [] }),
                                    }, async () => {
                                      await withMockedModule(starterWriterPath, {
                                        persistStarterArtifacts: () => ({ artifact_id: 'tenant:nextjs-starter:1', starter_fingerprint: 'fp-starter' }),
                                      }, async () => {
                                        await withMockedModule(bundlePath, {
                                          createBundle: () => ({ tenant_id: 'tenant', bundle_id: 'bundle-1', lineage_fingerprints: {} }),
                                          getBundle: () => null,
                                          setVerificationEvidence: (_tenantId, _bundleId, evidenceHash) => {
                                            if (evidenceHash === 'evidence-hash-1') {
                                              verificationHashSet = true;
                                            }
                                            return {};
                                          },
                                        }, async () => {
                                          await withMockedModule(closurePath, {
                                            runClosureGates: () => ({
                                              passed: true,
                                              gates: {
                                                determinism: { passed: true, reason_code: null, detail: null },
                                                tenant_isolation: { passed: true, reason_code: null, detail: null },
                                                contract_integrity: { passed: true, reason_code: null, detail: null },
                                              },
                                            }),
                                          }, async () => {
                                            await withMockedModule(driftPath, {
                                              auditDrift: () => ({ tenant_id: 'tenant', has_drift: false, expected_fingerprint: 'abc', active_fingerprint: 'abc' }),
                                            }, async () => {
                                              await withMockedModule(evidencePath, {
                                                writeGovernanceEvidence: () => ({
                                                  tenant_id: 'tenant',
                                                  bundle_id: 'bundle-1',
                                                  gate_results: {
                                                    passed: true,
                                                    gates: {
                                                      determinism: { passed: true, reason_code: null, detail: null },
                                                      tenant_isolation: { passed: true, reason_code: null, detail: null },
                                                      contract_integrity: { passed: true, reason_code: null, detail: null },
                                                    },
                                                  },
                                                  drift_summary: { has_drift: false },
                                                  evidence_hash: 'evidence-hash-1',
                                                  written_at: '2026-04-12T00:00:00.000Z',
                                                }),
                                              }, async () => {
                                                const handlers = loadFreshModule(handlersPath);
                                                const req = createJsonRequest({ seed: createSeed(), project_slug: 'phase-79-gate-recovery' }, '/submit');
                                                const res = createMockResponse();

                                                await handlers.handleSubmit(req, res);

                                                assert.equal(res.statusCode, 200);
                                                const payload = JSON.parse(res.body);
                                                assert.equal(payload.success, true);
                                                assert.ok(payload.branding_governance.gate_results, 'gate_results must exist');
                                                assert.ok(payload.branding_governance.gate_results.gates.determinism, 'determinism gate must exist');
                                                assert.ok(payload.branding_governance.gate_results.gates.tenant_isolation, 'tenant isolation gate must exist');
                                                assert.ok(payload.branding_governance.gate_results.gates.contract_integrity, 'contract integrity gate must exist');
                                                assert.equal(payload.branding_governance.evidence_hash, 'evidence-hash-1');
                                                assert.equal(typeof payload.branding_governance.written_at, 'string');
                                                assert.equal(verificationHashSet, true, 'setVerificationEvidence should receive evidence hash');
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
});
