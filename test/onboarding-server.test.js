const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const {
  createTestEnvironment,
  createJsonRequest,
  withMockedModule,
  ONBOARDING_EXTRACTION_FIXTURES,
} = require('./setup.js');

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
    }
  };
}

function loadFreshModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function toBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createUnsignedJwt(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.`;
}

test('Suite 3: Web-Based Onboarding Engine', async (t) => {
  let env;

  t.beforeEach(() => {
    env = createTestEnvironment();
    env.seedOnboarding();
  });

  t.afterEach(() => {
    env.cleanup();
  });

  await t.test('3.1 & 3.2 Server Port Fallback and Static Serving', async () => {
    // Occupy 4242 port artificially to trigger fallback logic
    const net = require('net');
    const dummyServer = net.createServer();
    await new Promise((resolve) => dummyServer.listen(4242, '127.0.0.1', resolve));

    // Spawn the securely copied onboarding server
    const serverScript = path.join(env.dir, 'onboarding', 'backend', 'server.cjs');
    const rootNodeModules = path.resolve(__dirname, '../node_modules');
    const childEnv = { ...process.env, UPSTASH_VECTOR_REST_URL: 'http://127.0.0.1:8000', NODE_PATH: rootNodeModules };
    const child = spawn(process.execPath, [serverScript], { cwd: env.dir, env: childEnv }); // Keep provider env deterministic during startup
    child.stderr.on('data', d => console.error('child1 err:', d.toString()));

    // Wait for text indicator it started
    let stdout = '';
    await new Promise((resolve, reject) => {
      let to;
      child.stdout.on('data', (d) => {
        stdout += d.toString();
        if (stdout.includes('Complete the form')) {
          clearTimeout(to);
          resolve();
        }
      });
      to = setTimeout(() => { child.kill(); reject(new Error('Server did not start in time: ' + stdout)); }, 5000);
    });

    assert.match(stdout, /Port 4242 in use, trying 4243/, 'Port fallback protocol failed to trigger');

    // Native fetch Request (Node >18)
    const res = await fetch('http://127.0.0.1:4243/');
    assert.equal(res.status, 200, 'HTTP response should be 200 OK');
    const html = await res.text();
    assert.match(html, /<!DOCTYPE html>/i, 'Should reliably serve the index.html payload');
    assert.match(html, /id="privacyNotice"/i, 'Should include the dismissible privacy banner for OpenAI awareness');

    // Tear down
    child.kill();
    await new Promise(r => dummyServer.close(r));
  });

  await t.test('3.3 Data Form Submission', async () => {
    // Spawn server normally (expecting 4242)
    const serverScript = path.join(env.dir, 'onboarding', 'backend', 'server.cjs');
    const rootNodeModules = path.resolve(__dirname, '../node_modules');
    const childEnv = { ...process.env, UPSTASH_VECTOR_REST_URL: 'http://127.0.0.1:8000', NODE_PATH: rootNodeModules };
    const child = spawn(process.execPath, [serverScript], { cwd: env.dir, env: childEnv });

    child.stderr.on('data', d => console.error('child err:', d.toString()));

    await new Promise((resolve, reject) => {
      let to;
      child.stdout.on('data', (d) => {
        if (d.toString().includes('Complete the form')) {
          clearTimeout(to);
          resolve();
        }
      });
      to = setTimeout(() => { child.kill(); reject(new Error('Timeout starting server')); }, 5000);
    });

    // Seed mock client parameters
    const mockSeed = {
      company: { name: 'Acme Corp', industry: 'Cybersecurity' },
      product: { name: 'Acme Shield', category: 'Software', primary_benefit: 'Security' },
      audience: { segment_name: 'CISOs', job_title: 'CISO' },
      market: { maturity: 'High', biggest_trend: 'AI' },
      competitive: { top_competitor_name: 'Corp B', differentiator: 'Speed' }
    };
    
    const res = await fetch('http://127.0.0.1:4242/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockSeed)
    });
    
    assert.equal(res.status, 200, 'Submit endpoint should return HTTP 200');
    const data = await res.json();
    assert.equal(data.success, true);

    // Validation: Server actually writes the JSON intelligence strictly to the location configured
    const expectedPath = path.join(env.dir, 'mock-onboarding-seed.json');
    assert.ok(fs.existsSync(expectedPath), 'Server failed to write the onboarding seed file correctly to disk');
    
    const written = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    assert.deepEqual(written, mockSeed, 'Written seed file JSON does not structurally match submission payload');

    child.kill(); // Short circuit 3 second delayed exit block
  });

  await t.test('3.4 API wrappers enforce hosted auth and guard hosted writes', async () => {
    const oldVercel = process.env.VERCEL;
    const oldNodePath = process.env.NODE_PATH;
    const oldSupabaseAud = process.env.MARKOS_SUPABASE_AUD;

    process.env.VERCEL = '1';
    process.env.NODE_PATH = path.resolve(__dirname, '../node_modules');
    process.env.MARKOS_SUPABASE_AUD = 'authenticated';

    try {
      const projectSlug = 'demo-project';
      const token = createUnsignedJwt({
        aud: 'authenticated',
        sub: 'user-123',
        app_metadata: { project_slugs: [projectSlug] },
      });

      const configHandler = loadFreshModule(path.join(env.dir, 'api', 'config.js'));
      const configReq = {
        method: 'GET',
        url: '/config',
        headers: {
          authorization: `Bearer ${token}`,
          'x-markos-project-slug': projectSlug,
        },
      };
      const configRes = createMockResponse();

      await configHandler(configReq, configRes);

      assert.equal(configRes.statusCode, 200, 'Config wrapper should return HTTP 200');
      const configPayload = JSON.parse(configRes.body);
      assert.equal(configPayload.runtime_mode, 'hosted', 'API config wrapper should report hosted mode');
      assert.equal(configPayload.local_persistence, false, 'API config wrapper should report local persistence as unavailable');
      assert.equal(configPayload.markosdb.auth.id, 'user-123', 'Config wrapper should expose authenticated principal context');

      const statusHandler = loadFreshModule(path.join(env.dir, 'api', 'status.js'));
      const statusDeniedReq = {
        method: 'GET',
        url: `/status?project_slug=${projectSlug}`,
        headers: {},
      };
      const statusDeniedRes = createMockResponse();
      await statusHandler(statusDeniedReq, statusDeniedRes);
      assert.equal(statusDeniedRes.statusCode, 401, 'Hosted status wrapper should require authentication');

      const approveHandler = loadFreshModule(path.join(env.dir, 'api', 'approve.js'));
      const approveReq = {
        method: 'POST',
        url: '/approve',
        body: {
          slug: 'demo-project',
          approvedDrafts: {
            company_profile: '## Company Snapshot\n\nHosted write should be rejected.'
          }
        }
      };
      const approveRes = createMockResponse();

      await approveHandler(approveReq, approveRes);

      assert.equal(approveRes.statusCode, 501, 'Hosted approve wrapper should reject local write attempts');
      const approvePayload = JSON.parse(approveRes.body);
      assert.equal(approvePayload.error, 'LOCAL_PERSISTENCE_UNAVAILABLE');
      assert.equal(approvePayload.outcome?.state, 'failure');
      assert.equal(approvePayload.outcome?.code, 'LOCAL_PERSISTENCE_UNAVAILABLE');
      assert.ok(!fs.existsSync(path.join(env.dir, '.markos-local', 'MIR')), 'Hosted approve wrapper must not create local MIR persistence paths');
    } finally {
      if (oldVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = oldVercel;
      }

      if (oldNodePath === undefined) {
        delete process.env.NODE_PATH;
      } else {
        process.env.NODE_PATH = oldNodePath;
      }

      if (oldSupabaseAud === undefined) {
        delete process.env.MARKOS_SUPABASE_AUD;
      } else {
        process.env.MARKOS_SUPABASE_AUD = oldSupabaseAud;
      }
    }
  });

  await t.test('3.5 Extract-and-score fixtures cover URL, file, and mixed-source inputs', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const schemaExtractorPath = path.join(env.dir, 'onboarding', 'backend', 'extractors', 'schema-extractor.cjs');

    for (const fixture of Object.values(ONBOARDING_EXTRACTION_FIXTURES)) {
      await withMockedModule(schemaExtractorPath, {
        extractToSchema: async () => fixture.expectedSchema,
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const req = createJsonRequest(fixture.input, '/api/extract-and-score');
        const res = createMockResponse();

        await handlers.handleExtractAndScore(req, res);
        assert.equal(res.statusCode, 200);

        const payload = JSON.parse(res.body);
        assert.equal(payload.success, true);
        assert.deepEqual(payload.data, fixture.expectedSchema);
        assert.equal(typeof payload.scores, 'object');
      });
    }
  });

  await t.test('3.6 Confidence edge cases drive missing-field routing contract', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const llmPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'llm-adapter.cjs');
    const scorerPath = path.join(env.dir, 'onboarding', 'backend', 'confidences', 'confidence-scorer.cjs');
    const confidenceScorer = require(scorerPath);

    const schema = {
      company: {
        name: 'A',
        tagline: 'short',
        mission: '',
      },
      audience: {
        segment_name: 'SMB founders',
      },
      market: {
        categories: [''],
        trends: ['automation'],
      },
    };

    const scores = confidenceScorer.scoreFields(schema);
    assert.equal(scores.company.name.score, 'Yellow');
    assert.equal(scores.company.mission.score, 'Red');
    assert.equal(scores.market.categories.score, 'Red');
    assert.equal(scores.market.trends.score, 'Yellow');

    let capturedPrompt = '';
    await withMockedModule(llmPath, {
      call: async (_system, userPrompt) => {
        capturedPrompt = userPrompt;
        return { ok: true, text: 'Could you share your mission and category focus?', usage: {} };
      }
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({ schema, scores }, '/api/generate-question');
      const res = createMockResponse();

      await handlers.handleGenerateQuestion(req, res);
      assert.equal(res.statusCode, 200);

      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.ok(Array.isArray(payload.missingFields));
      assert.ok(payload.missingFields.includes('company.mission'));
      assert.ok(payload.missingFields.includes('market.categories'));
      assert.match(capturedPrompt, /company\.mission|market\.categories/);
    });
  });

  await t.test('3.7 Regenerate and approve expose structured outcome states', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const mirFillerPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'mir-filler.cjs');
    const mspFillerPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'msp-filler.cjs');
    const llmPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'llm-adapter.cjs');
    const telemetryPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'telemetry.cjs');
    const writeMirPath = path.join(env.dir, 'onboarding', 'backend', 'write-mir.cjs');

    await withMockedModule(mirFillerPath, {
      generateCompanyProfile: async () => ({
        ok: true,
        isFallback: true,
        error: 'NO_AI_AVAILABLE',
        text: '[NO AI AVAILABLE] Placeholder',
      }),
      generateMissionVisionValues: async () => ({ ok: true, text: 'unused' }),
      generateAudienceProfile: async () => ({ ok: true, text: 'unused' }),
      generateCompetitiveLandscape: async () => ({ ok: true, text: 'unused' }),
    }, async () => {
      await withMockedModule(mspFillerPath, {
        generateBrandVoice: async () => ({ ok: true, text: 'unused' }),
        generateChannelStrategy: async () => ({ ok: true, text: 'unused' }),
      }, async () => {
        await withMockedModule(vectorStorePath, {
          configure: () => {},
          storeDraft: async () => true,
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const regenReq = createJsonRequest({
            section: 'company_profile',
            seed: { company: { name: 'Acme' } },
            slug: 'acme-slug',
          }, '/regenerate');
          const regenRes = createMockResponse();

          await handlers.handleRegenerate(regenReq, regenRes);
          assert.equal(regenRes.statusCode, 200);

          const regenPayload = JSON.parse(regenRes.body);
          assert.equal(regenPayload.success, true);
          assert.equal(regenPayload.outcome.state, 'degraded');
          assert.equal(regenPayload.outcome.code, 'REGENERATE_FALLBACK');
        });
      });
    });

    await withMockedModule(writeMirPath, {
      applyDrafts: () => ({
        written: ['Core_Strategy/01_COMPANY/PROFILE.md'],
        stateUpdated: true,
        errors: [],
        mergeEvents: [{ file: 'Core_Strategy/01_COMPANY/PROFILE.md', type: 'header-fallback-append', header: 'New Header' }],
      }),
    }, async () => {
      const emittedCheckpoints = [];
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        storeDraft: async () => ({ ok: false, error: 'mock returned vector persistence error' }),
      }, async () => {
        await withMockedModule(telemetryPath, {
          captureExecutionCheckpoint: (eventName, properties) => emittedCheckpoints.push({ eventName, properties }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const approveReq = createJsonRequest({
            slug: 'acme-slug',
            approvedDrafts: { company_profile: '## New Header\n\nDraft body' }
          }, '/approve');
          const approveRes = createMockResponse();

          await handlers.handleApprove(approveReq, approveRes);
          assert.equal(approveRes.statusCode, 200);

          const approvePayload = JSON.parse(approveRes.body);
          assert.equal(approvePayload.success, true);
          assert.equal(approvePayload.outcome.state, 'warning');
          assert.equal(approvePayload.outcome.code, 'APPROVE_PARTIAL_WARNING');
          assert.match((approvePayload.outcome.warnings || []).join(' '), /mock returned vector persistence error/);
          assert.equal(approvePayload.handoff.execution_readiness.status, 'blocked');
          assert.ok((approvePayload.handoff.execution_readiness.blocking_checks || []).length > 0, 'Blocked readiness should include blocking checks');
          assert.ok(emittedCheckpoints.some((entry) => entry.eventName === 'execution_readiness_blocked'), 'Approve warning path should emit execution_readiness_blocked');
        });
      });
    });

    await withMockedModule(mirFillerPath, {
      generateCompanyProfile: async () => ({ ok: true, text: 'company draft text' }),
      generateMissionVisionValues: async () => ({ ok: true, text: 'mission draft text' }),
      generateAudienceProfile: async () => ({ ok: false, error: 'skip neuro path', text: '[DRAFT UNAVAILABLE]' }),
      generateCompetitiveLandscape: async () => ({ ok: true, text: 'competitive draft text' }),
    }, async () => {
      await withMockedModule(mspFillerPath, {
        generateBrandVoice: async () => ({ ok: true, text: 'brand voice draft text' }),
        generateChannelStrategy: async () => ({ ok: true, text: 'channel strategy draft text' }),
      }, async () => {
        await withMockedModule(llmPath, {
          call: async () => ({ ok: true, text: 'neuro check' }),
        }, async () => {
          await withMockedModule(telemetryPath, {
            capture: () => {},
          }, async () => {
            await withMockedModule(vectorStorePath, {
              configure: () => {},
              upsertSeed: async () => [],
              storeDraft: async () => ({ ok: false, error: 'mock returned vector persistence error' }),
            }, async () => {
              const orchestrator = loadFreshModule(orchestratorPath);
              const result = await orchestrator.orchestrate({ company: { name: 'Acme' } }, 'acme-slug');
              assert.ok(result.errors.some((entry) => entry.phase === 'vector-store-company_profile'), 'Orchestrator should surface non-throwing storeDraft failures');
            });
          });
        });
      });
    });
  });

  await t.test('3.8 Status endpoint exposes memory mode semantics', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      healthCheck: async () => ({
        ok: false,
        mode: 'cloud',
        status: 'providers_degraded',
        error: 'ECONNREFUSED',
      }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = { method: 'GET', url: '/status' };
      const res = createMockResponse();

      await handlers.handleStatus(req, res);
      assert.equal(res.statusCode, 200);

      const payload = JSON.parse(res.body);
      assert.equal(payload.vector_memory.status, 'providers_degraded');
      assert.equal(payload.memory.status, 'providers_degraded');
      assert.equal(payload.memory.mode, 'cloud');
      assert.equal(payload.memory.requires_operator_action, true);
    });
  });

  await t.test('3.9 Approve success emits readiness-ready and loop-completed checkpoints', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const writeMirPath = path.join(env.dir, 'onboarding', 'backend', 'write-mir.cjs');
    const telemetryPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'telemetry.cjs');

    const requiredCatalogs = [
      'Paid_Media',
      'Lifecycle_Email',
      'Content_SEO',
      'Social',
      'Landing_Pages',
    ];

    for (const discipline of requiredCatalogs) {
      const winnersPath = path.join(env.dir, '.markos-local', 'MSP', discipline, 'WINNERS');
      fs.mkdirSync(winnersPath, { recursive: true });
      fs.writeFileSync(path.join(winnersPath, '_CATALOG.md'), '# winners\n', 'utf8');
    }

    const emittedCheckpoints = [];

    await withMockedModule(writeMirPath, {
      applyDrafts: () => ({
        written: ['Core_Strategy/01_COMPANY/PROFILE.md'],
        stateUpdated: true,
        errors: [],
        mergeEvents: [],
      }),
    }, async () => {
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        storeDraft: async () => ({ ok: true }),
      }, async () => {
        await withMockedModule(telemetryPath, {
          captureExecutionCheckpoint: (eventName, properties) => emittedCheckpoints.push({ eventName, properties }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const approveReq = createJsonRequest({
            slug: 'acme-slug',
            approvedDrafts: {
              company_profile: 'ok',
              mission_values: 'ok',
              audience: 'ok',
              competitive: 'ok',
              brand_voice: 'ok',
              channel_strategy: 'ok',
            }
          }, '/approve');
          const approveRes = createMockResponse();

          await handlers.handleApprove(approveReq, approveRes);
          assert.equal(approveRes.statusCode, 200);

          const payload = JSON.parse(approveRes.body);
          assert.equal(payload.success, true);
          assert.equal(payload.handoff.execution_readiness.status, 'ready');
          assert.ok(emittedCheckpoints.some((entry) => entry.eventName === 'approval_completed'));
          assert.ok(emittedCheckpoints.some((entry) => entry.eventName === 'execution_readiness_ready'));
          assert.ok(emittedCheckpoints.some((entry) => entry.eventName === 'execution_loop_completed'));
        });
      });
    });
  });

  await t.test('3.10 Approve rejects out-of-bounds MIR output paths and allows in-root custom paths', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const writeMirPath = path.join(env.dir, 'onboarding', 'backend', 'write-mir.cjs');
    const configPath = path.join(env.dir, 'onboarding', 'onboarding-config.json');

    const outsideDirName = `phase28-outside-${Date.now()}`;
    const outsideDirPath = path.resolve(env.dir, '..', outsideDirName);
    fs.writeFileSync(configPath, JSON.stringify({
      auto_open_browser: false,
      port: 4242,
      output_path: '../mock-onboarding-seed.json',
      mir_output_path: `../${outsideDirName}`,
    }));

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      storeDraft: async () => ({ ok: true }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const rejectReq = createJsonRequest({
        slug: 'acme-slug',
        approvedDrafts: { company_profile: '## Company Snapshot\n\nSafe draft content.' },
      }, '/approve');
      const rejectRes = createMockResponse();

      await handlers.handleApprove(rejectReq, rejectRes);
      assert.equal(rejectRes.statusCode, 400);

      const rejectPayload = JSON.parse(rejectRes.body);
      assert.equal(rejectPayload.error, 'MIR_OUTPUT_PATH_OUT_OF_BOUNDS');
      assert.equal(rejectPayload.outcome?.code, 'MIR_OUTPUT_PATH_OUT_OF_BOUNDS');
      assert.ok(!fs.existsSync(outsideDirPath), 'Out-of-bounds MIR path should not be created');
    });

    const customInRootPath = '.markos-local/custom-mir-output';
    fs.writeFileSync(configPath, JSON.stringify({
      auto_open_browser: false,
      port: 4242,
      output_path: '../mock-onboarding-seed.json',
      mir_output_path: customInRootPath,
    }));

    let capturedMirOutputPath = null;

    await withMockedModule(writeMirPath, {
      applyDrafts: (mirOutputPath) => {
        capturedMirOutputPath = mirOutputPath;
        return {
          written: ['Core_Strategy/01_COMPANY/PROFILE.md'],
          stateUpdated: true,
          errors: [],
          mergeEvents: [],
        };
      },
    }, async () => {
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        storeDraft: async () => ({ ok: true }),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const allowReq = createJsonRequest({
          slug: 'acme-slug',
          approvedDrafts: {
            company_profile: 'ok',
            mission_values: 'ok',
            audience: 'ok',
            competitive: 'ok',
            brand_voice: 'ok',
            channel_strategy: 'ok',
          },
        }, '/approve');
        const allowRes = createMockResponse();

        await handlers.handleApprove(allowReq, allowRes);
        assert.equal(allowRes.statusCode, 200);

        const allowPayload = JSON.parse(allowRes.body);
        assert.equal(allowPayload.success, true);
        assert.equal(capturedMirOutputPath, path.resolve(env.dir, customInRootPath));
      });
    });
  });

  await t.test('3.11 Generate-question enforces five-question cap', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const llmPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'llm-adapter.cjs');

    await withMockedModule(llmPath, {
      call: async () => ({ ok: true, text: 'What is your primary conversion goal this quarter?' }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);

      const activeReq = createJsonRequest({
        schema: { company: { business_model: 'B2B' } },
        scores: { company: { mission: { score: 'Red', source: 'Extraction' } } },
        questionCount: 0,
      }, '/api/generate-question');
      const activeRes = createMockResponse();
      await handlers.handleGenerateQuestion(activeReq, activeRes);
      assert.equal(activeRes.statusCode, 200);
      const activePayload = JSON.parse(activeRes.body);
      assert.equal(typeof activePayload.question, 'string');
      assert.equal(activePayload.maxQuestions, 5);

      const cappedReq = createJsonRequest({
        schema: { company: { business_model: 'B2B' } },
        scores: { company: { mission: { score: 'Red', source: 'Extraction' } } },
        questionCount: 5,
      }, '/api/generate-question');
      const cappedRes = createMockResponse();
      await handlers.handleGenerateQuestion(cappedReq, cappedRes);
      assert.equal(cappedRes.statusCode, 200);
      const cappedPayload = JSON.parse(cappedRes.body);
      assert.equal(cappedPayload.question, null);
      assert.equal(cappedPayload.completionReason, 'max_questions_reached');
    });
  });

  await t.test('3.12 Linear sync returns deterministic issues and setup errors', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const linearClientPath = path.join(env.dir, 'onboarding', 'backend', 'linear-client.cjs');

    const linearTemplatesDir = path.join(env.dir, '.agent', 'markos', 'templates', 'LINEAR-TASKS');
    fs.mkdirSync(linearTemplatesDir, { recursive: true });
    fs.writeFileSync(path.join(linearTemplatesDir, '_CATALOG.md'), [
      '| TOKEN_ID | File | Category | Triggers | Gate | Status |',
      '|----------|------|----------|----------|------|--------|',
      '| MARKOS-ITM-OPS-01 | `LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` | Campaign Ops | N/A | Gate 1 + Gate 2 | active |',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(linearTemplatesDir, 'MARKOS-ITM-OPS-01-campaign-launch.md'), [
      '**Linear Title format:** `[MARKOS] Launch: {campaign_name} — Go/No-Go`',
      '',
      '# Launch Checklist',
      '',
      '- Verify launch gate readiness.',
    ].join('\n'));

    const oldLinearApiKey = process.env.LINEAR_API_KEY;
    process.env.LINEAR_API_KEY = 'linear_test_key';

    await withMockedModule(linearClientPath, {
      getTeamId: async () => 'team-123',
      getUserId: async (hint) => hint ? `user-for-${hint}` : null,
      createIssue: async (input) => ({
        id: 'issue-1',
        identifier: 'MKT-101',
        title: input.title,
        url: 'https://linear.app/acme/issue/MKT-101',
      }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        slug: 'acme-launch',
        phase: '29',
        team: 'MKT',
        assignee_map: { OPS: 'ops@acme.com' },
        tasks: [
          {
            token: 'MARKOS-ITM-OPS-01',
            variables: { campaign_name: 'Q2 Launch' },
          },
        ],
      }, '/linear/sync');
      const res = createMockResponse();

      await handlers.handleLinearSync(req, res);
      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.equal(payload.created.length, 1);
      assert.equal(payload.created[0].identifier, 'MKT-101');
      assert.equal(payload.created[0].assignee, 'ops@acme.com');
    });

    if (oldLinearApiKey === undefined) {
      delete process.env.LINEAR_API_KEY;
    } else {
      process.env.LINEAR_API_KEY = oldLinearApiKey;
    }

    await withMockedModule(linearClientPath, {
      getTeamId: async () => {
        const err = new Error('Missing LINEAR_API_KEY. Configure it in .env before calling /linear/sync.');
        err.name = 'LinearSetupError';
        err.code = 'LINEAR_API_KEY_MISSING';
        throw err;
      },
      getUserId: async () => null,
      createIssue: async () => {
        throw new Error('should not execute');
      },
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        slug: 'acme-launch',
        phase: '29',
        tasks: ['MARKOS-ITM-OPS-01'],
      }, '/linear/sync');
      const res = createMockResponse();

      await handlers.handleLinearSync(req, res);
      assert.equal(res.statusCode, 503);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, false);
      assert.equal(payload.error, 'LINEAR_API_KEY_MISSING');
    });
  });

  await t.test('3.13 Campaign result appends winners catalog and stores classification metadata', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      storeCampaignOutcome: async (_slug, _payload, metadata) => ({ ok: true, metadata }),
      storeDraft: async () => ({ ok: true }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        slug: 'acme-launch',
        discipline: 'Paid_Media',
        asset: 'META-AD-001',
        metric: 'CTR',
        value: '4.2%',
        outcome: 'success',
        notes: 'Strong CTR against benchmark',
      }, '/campaign/result');
      const res = createMockResponse();

      await handlers.handleCampaignResult(req, res);
      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.equal(payload.metadata.outcome_classification, 'SUCCESS');

      const catalogPath = path.join(env.dir, '.markos-local', 'MSP', 'Paid_Media', 'WINNERS', '_CATALOG.md');
      const catalog = fs.readFileSync(catalogPath, 'utf8');
      assert.match(catalog, /META-AD-001/);
      assert.match(catalog, /CTR: 4\.2%/);
    });

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      storeCampaignOutcome: async () => ({ ok: true }),
      storeDraft: async () => ({ ok: true }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const req = createJsonRequest({
        slug: 'acme-launch',
        discipline: 'Paid_Media',
      }, '/campaign/result');
      const res = createMockResponse();

      await handlers.handleCampaignResult(req, res);
      assert.equal(res.statusCode, 400);
      const payload = JSON.parse(res.body);
      assert.equal(payload.error, 'VALIDATION_ERROR');
    });
  });

  await t.test('3.11 MarkOSDB migration dry-run is deterministic and replay is idempotent', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const compatibilityRoot = path.join(env.dir, '.markos-local');

    const mirFile = path.join(compatibilityRoot, 'MIR', 'Core_Strategy', '01_COMPANY', 'PROFILE.md');
    const winnersFile = path.join(compatibilityRoot, 'MSP', 'Paid_Media', 'WINNERS', '_CATALOG.md');
    fs.mkdirSync(path.dirname(mirFile), { recursive: true });
    fs.mkdirSync(path.dirname(winnersFile), { recursive: true });
    fs.writeFileSync(mirFile, '# Profile\n\nAcme profile draft', 'utf8');
    fs.writeFileSync(winnersFile, '# Winners\n\n| Asset | Why |\n|---|---|', 'utf8');

    const upsertedIds = new Set();

    await withMockedModule(vectorStorePath, {
      configure: () => {},
      getCanonicalCollectionPrefix: () => 'markos',
      getCollectionReadPrefixes: () => ['markos', 'markos'],
      upsertMarkosdbArtifact: async (_slug, artifact) => {
        upsertedIds.add(artifact.artifact_id);
        return {
          ok: true,
          collection: 'markos-acme-markosdb',
          artifact_id: artifact.artifact_id,
        };
      },
    }, async () => {
      const handlers = loadFreshModule(handlersPath);

      const dryRunReqA = createJsonRequest({ project_slug: 'acme', dry_run: true }, '/migrate/local-to-cloud');
      const dryRunResA = createMockResponse();
      await handlers.handleMarkosdbMigration(dryRunReqA, dryRunResA);
      assert.equal(dryRunResA.statusCode, 200);
      const dryRunPayloadA = JSON.parse(dryRunResA.body);

      const dryRunReqB = createJsonRequest({ project_slug: 'acme', dry_run: true }, '/migrate/local-to-cloud');
      const dryRunResB = createMockResponse();
      await handlers.handleMarkosdbMigration(dryRunReqB, dryRunResB);
      assert.equal(dryRunResB.statusCode, 200);
      const dryRunPayloadB = JSON.parse(dryRunResB.body);

      assert.deepEqual(
        dryRunPayloadA.records.map((entry) => entry.artifact_id),
        dryRunPayloadB.records.map((entry) => entry.artifact_id),
        'Dry-run output should remain deterministic for unchanged artifacts'
      );

      const migrateReqA = createJsonRequest({ project_slug: 'acme', dry_run: false }, '/migrate/local-to-cloud');
      const migrateResA = createMockResponse();
      await handlers.handleMarkosdbMigration(migrateReqA, migrateResA);
      assert.equal(migrateResA.statusCode, 200);

      const afterFirstRun = upsertedIds.size;

      const migrateReqB = createJsonRequest({ project_slug: 'acme', dry_run: false }, '/migrate/local-to-cloud');
      const migrateResB = createMockResponse();
      await handlers.handleMarkosdbMigration(migrateReqB, migrateResB);
      assert.equal(migrateResB.statusCode, 200);

      assert.equal(upsertedIds.size, afterFirstRun, 'Replay should upsert same deterministic artifact ids (no duplicate keys)');
    });
  });

  await t.test('3.12 Hosted migration wrapper enforces scoped project access', async () => {
    const oldVercel = process.env.VERCEL;
    const oldNodePath = process.env.NODE_PATH;
    const oldSupabaseAud = process.env.MARKOS_SUPABASE_AUD;

    process.env.VERCEL = '1';
    process.env.NODE_PATH = path.resolve(__dirname, '../node_modules');
    process.env.MARKOS_SUPABASE_AUD = 'authenticated';

    try {
      const migrateHandler = loadFreshModule(path.join(env.dir, 'api', 'migrate.js'));

      const deniedToken = createUnsignedJwt({
        aud: 'authenticated',
        sub: 'user-456',
        app_metadata: { project_slugs: ['another-project'] },
      });

      const deniedReq = {
        method: 'POST',
        url: '/migrate/local-to-cloud?project_slug=acme',
        headers: {
          authorization: `Bearer ${deniedToken}`,
        },
        body: {
          project_slug: 'acme',
          dry_run: true,
        },
      };
      const deniedRes = createMockResponse();
      await migrateHandler(deniedReq, deniedRes);
      assert.equal(deniedRes.statusCode, 403, 'Hosted migration must deny tokens outside project scope');

      const allowedToken = createUnsignedJwt({
        aud: 'authenticated',
        sub: 'user-789',
        app_metadata: { project_slugs: ['acme'] },
      });
      const allowedReq = {
        method: 'POST',
        url: '/migrate/local-to-cloud?project_slug=acme',
        headers: {
          authorization: `Bearer ${allowedToken}`,
        },
        body: {
          project_slug: 'acme',
          dry_run: true,
        },
      };
      const allowedRes = createMockResponse();
      await migrateHandler(allowedReq, allowedRes);
      assert.equal(allowedRes.statusCode, 200, 'Hosted migration should allow scoped Supabase tokens');
    } finally {
      if (oldVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = oldVercel;
      }

      if (oldNodePath === undefined) {
        delete process.env.NODE_PATH;
      } else {
        process.env.NODE_PATH = oldNodePath;
      }

      if (oldSupabaseAud === undefined) {
        delete process.env.MARKOS_SUPABASE_AUD;
      } else {
        process.env.MARKOS_SUPABASE_AUD = oldSupabaseAud;
      }
    }
  });

  await t.test('3.14 Rollout endpoint telemetry emits stable payload for four endpoints', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const telemetryPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'telemetry.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
    const writeMirPath = path.join(env.dir, 'onboarding', 'backend', 'write-mir.cjs');
    const linearClientPath = path.join(env.dir, 'onboarding', 'backend', 'linear-client.cjs');

    const emitted = [];

    await withMockedModule(telemetryPath, {
      captureRolloutEndpointEvent: (endpoint, properties) => emitted.push({ endpoint, properties }),
      captureExecutionCheckpoint: () => {},
    }, async () => {
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        storeCampaignOutcome: async () => ({ ok: true }),
        storeDraft: async () => ({ ok: true }),
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
        }, async () => {
          await withMockedModule(writeMirPath, {
            applyDrafts: () => ({ written: ['Core_Strategy/01_COMPANY/PROFILE.md'], stateUpdated: true, errors: [], mergeEvents: [] }),
          }, async () => {
            await withMockedModule(linearClientPath, {
              getTeamId: async () => 'team-1',
              getUserId: async () => null,
              createIssue: async () => ({ identifier: 'MKT-1', id: 'issue-1', title: 'ok', url: 'https://linear.app/test/MKT-1' }),
            }, async () => {
              const linearTemplatesDir = path.join(env.dir, '.agent', 'markos', 'templates', 'LINEAR-TASKS');
              fs.mkdirSync(linearTemplatesDir, { recursive: true });
              fs.writeFileSync(path.join(linearTemplatesDir, '_CATALOG.md'), [
                '| TOKEN_ID | File | Category | Triggers | Gate | Status |',
                '|----------|------|----------|----------|------|--------|',
                '| MARKOS-ITM-OPS-01 | `LINEAR-TASKS/MARKOS-ITM-OPS-01-campaign-launch.md` | Campaign Ops | N/A | Gate 1 + Gate 2 | active |',
                '',
              ].join('\n'));
              fs.writeFileSync(path.join(linearTemplatesDir, 'MARKOS-ITM-OPS-01-campaign-launch.md'), '**Linear Title format:** `[MARKOS] Launch: {campaign_name} — Go/No-Go`\n');

              const handlers = loadFreshModule(handlersPath);

              const oldLinearApiKey = process.env.LINEAR_API_KEY;
              process.env.LINEAR_API_KEY = 'linear_test_key';

              const submitRes = createMockResponse();
              await handlers.handleSubmit(createJsonRequest({ seed: { company: { name: 'Acme' } }, project_slug: 'acme' }, '/submit'), submitRes);
              assert.equal(submitRes.statusCode, 200);

              const approveRes = createMockResponse();
              await handlers.handleApprove(createJsonRequest({ slug: 'acme', approvedDrafts: { company_profile: 'ok' } }, '/approve'), approveRes);
              assert.equal(approveRes.statusCode, 200);

              const linearRes = createMockResponse();
              await handlers.handleLinearSync(createJsonRequest({ slug: 'acme', tasks: [{ token: 'MARKOS-ITM-OPS-01' }] }, '/linear/sync'), linearRes);
              assert.equal(linearRes.statusCode, 200);

              const campaignRes = createMockResponse();
              await handlers.handleCampaignResult(createJsonRequest({ slug: 'acme', discipline: 'Paid_Media', asset: 'A', metric: 'CTR', value: '1.1%', outcome: 'success' }, '/campaign/result'), campaignRes);
              assert.equal(campaignRes.statusCode, 200);

              const expectedEndpoints = new Set(['/submit', '/approve', '/linear/sync', '/campaign/result']);
              const seenEndpoints = new Set(emitted.map((entry) => entry.endpoint));

              for (const endpoint of expectedEndpoints) {
                assert.ok(seenEndpoints.has(endpoint), `Missing rollout telemetry for ${endpoint}`);
              }

              for (const entry of emitted) {
                assert.equal(typeof entry.properties.duration_ms, 'number');
                assert.ok(entry.properties.duration_ms >= 0);
                assert.ok(entry.properties.runtime_mode === 'local' || entry.properties.runtime_mode === 'hosted');
                assert.ok(Object.prototype.hasOwnProperty.call(entry.properties, 'status_code'));
                assert.ok(Object.prototype.hasOwnProperty.call(entry.properties, 'outcome_state'));
              }

              if (oldLinearApiKey === undefined) {
                delete process.env.LINEAR_API_KEY;
              } else {
                process.env.LINEAR_API_KEY = oldLinearApiKey;
              }
            });
          });
        });
      });
    });
  });

  await t.test('3.15 Migration promotion controls enforce checkpoint progression', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const checkpointsPath = path.join(env.dir, '.planning', 'phases', '31-rollout-hardening', '31-MIGRATION-CHECKPOINTS.json');
    const oldMode = process.env.MARKOS_ROLLOUT_MODE;

    const checkpoints = {
      current_mode: 'dry-run',
      transitions: [],
    };
    fs.mkdirSync(path.dirname(checkpointsPath), { recursive: true });
    fs.writeFileSync(checkpointsPath, JSON.stringify(checkpoints, null, 2), 'utf8');

    process.env.MARKOS_ROLLOUT_MODE = 'dual-write';

    try {
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        upsertMarkosdbArtifact: async (_slug, artifact) => ({ ok: true, collection: 'markos-test', artifact_id: artifact.artifact_id }),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);

        const denyRes = createMockResponse();
        await handlers.handleMarkosdbMigration(createJsonRequest({ project_slug: 'acme', dry_run: false }, '/migrate/local-to-cloud'), denyRes);
        assert.equal(denyRes.statusCode, 409);

        const updated = JSON.parse(fs.readFileSync(checkpointsPath, 'utf8'));
        updated.transitions.push({
          from_mode: 'dry-run',
          to_mode: 'dual-write',
          project_slug: 'acme',
          owner: 'ops',
          approved_at: '2026-03-29T00:00:00.000Z',
          checkpoint_id: 'cp-1',
          verification_ref: 'test',
          rollback_mode: 'dry-run',
          rollback_command: 'MARKOS_ROLLOUT_MODE=dry-run',
          status: 'approved',
        });
        fs.writeFileSync(checkpointsPath, JSON.stringify(updated, null, 2), 'utf8');

        const allowRes = createMockResponse();
        await handlers.handleMarkosdbMigration(createJsonRequest({ project_slug: 'acme', dry_run: false }, '/migrate/local-to-cloud'), allowRes);
        assert.equal(allowRes.statusCode, 200);
        const payload = JSON.parse(allowRes.body);
        assert.equal(payload.rollout_mode, 'dual-write');
        assert.equal(payload.promotion_checkpoint.valid, true);
      });
    } finally {
      if (oldMode === undefined) {
        delete process.env.MARKOS_ROLLOUT_MODE;
      } else {
        process.env.MARKOS_ROLLOUT_MODE = oldMode;
      }
    }
  });
});

