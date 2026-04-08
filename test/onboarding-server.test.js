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

function createPhase34ValidSeed(overrides = {}) {
  const base = {
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

  return {
    ...base,
    ...overrides,
    company: { ...base.company, ...(overrides.company || {}) },
    product: { ...base.product, ...(overrides.product || {}) },
    audience: { ...base.audience, ...(overrides.audience || {}) },
    market: { ...base.market, ...(overrides.market || {}) },
    content: { ...base.content, ...(overrides.content || {}) },
  };
}

function seedPhase34LinearTemplates(tmpRoot) {
  const linearTemplatesDir = path.join(tmpRoot, '.agent', 'markos', 'templates', 'LINEAR-TASKS');
  fs.mkdirSync(linearTemplatesDir, { recursive: true });
  fs.writeFileSync(path.join(linearTemplatesDir, '_CATALOG.md'), [
    '| TOKEN_ID | File | Category | Triggers | Gate | Status |',
    '|----------|------|----------|----------|------|--------|',
    '| MARKOS-ITM-OPS-03 | `LINEAR-TASKS/MARKOS-ITM-OPS-03.md` | Intake Ops | R001-R008 | none | active |',
    '| MARKOS-ITM-INT-01 | `LINEAR-TASKS/MARKOS-ITM-INT-01.md` | Intake Validation | R001-R008 | none | active |',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(linearTemplatesDir, 'MARKOS-ITM-OPS-03.md'), [
    '**Linear Title format:** `[MARKOS] Intake: {client_name} — {company_stage}`',
    '',
    '# Intake Received',
  ].join('\n'));
  fs.writeFileSync(path.join(linearTemplatesDir, 'MARKOS-ITM-INT-01.md'), [
    '**Linear Title format:** `[MARKOS] Intake Validation: {client_name} — Data Quality Check`',
    '',
    '# Intake Validation',
  ].join('\n'));
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

async function getAvailablePortPair() {
  const net = require('net');

  async function getEphemeralPort() {
    return await new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.unref();
      probe.once('error', reject);
      probe.listen(0, '127.0.0.1', () => {
        const { port } = probe.address();
        probe.close((error) => error ? reject(error) : resolve(port));
      });
    });
  }

  async function isPortFree(port) {
    return await new Promise((resolve) => {
      const probe = net.createServer();
      probe.unref();
      probe.once('error', () => resolve(false));
      probe.listen(port, '127.0.0.1', () => {
        probe.close(() => resolve(true));
      });
    });
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const port = await getEphemeralPort();
    if (port < 65534 && await isPortFree(port + 1)) {
      return port;
    }
  }

  throw new Error('Unable to find a free localhost port pair for onboarding tests');
}

function writeOnboardingConfig(tmpRoot, overrides = {}) {
  const configPath = path.join(tmpRoot, 'onboarding', 'onboarding-config.json');
  fs.writeFileSync(configPath, JSON.stringify({
    auto_open_browser: false,
    port: 4242,
    output_path: '../mock-onboarding-seed.json',
    ...overrides,
  }));
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
    const basePort = await getAvailablePortPair();
    writeOnboardingConfig(env.dir, { port: basePort });

    // Occupy 4242 port artificially to trigger fallback logic
    const net = require('net');
    const dummyServer = net.createServer();
    await new Promise((resolve) => dummyServer.listen(basePort, '127.0.0.1', resolve));

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

    assert.match(stdout, new RegExp(`Port ${basePort} in use, trying ${basePort + 1}`), 'Port fallback protocol failed to trigger');

    // Native fetch Request (Node >18)
    const res = await fetch(`http://127.0.0.1:${basePort + 1}/`);
    assert.equal(res.status, 200, 'HTTP response should be 200 OK');
    const html = await res.text();
    assert.match(html, /<!DOCTYPE html>/i, 'Should reliably serve the index.html payload');
    assert.match(html, /id="privacyNotice"/i, 'Should include the dismissible privacy banner for OpenAI awareness');

    // Tear down
    child.kill();
    await new Promise(r => dummyServer.close(r));
  });

  await t.test('3.3 Data Form Submission', async () => {
    const basePort = await getAvailablePortPair();
    writeOnboardingConfig(env.dir, { port: basePort });

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
    
    const res = await fetch(`http://127.0.0.1:${basePort}/submit`, {
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
        active_tenant_id: 'tenant-123',
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
            captureProviderAttempt: (payload) => payload,
            captureRunClose: (payload) => payload,
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
        active_tenant_id: 'tenant-456',
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
        active_tenant_id: 'tenant-789',
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

  await t.test('3.16 Literacy admin endpoints require secret and return diagnostics', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
    const oldAdminSecret = process.env.MARKOS_ADMIN_SECRET;
    process.env.MARKOS_ADMIN_SECRET = 'test-secret';

    try {
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ status: 'providers_ready', providers: { supabase: { configured: true }, upstash_vector: { configured: true } } }),
        getLiteracyContext: async () => ([{ text: 'match one', metadata: { status: 'canonical' }, score: 0.9 }]),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);

        const deniedHealthRes = createMockResponse();
        await handlers.handleLiteracyHealth({ method: 'GET', url: '/admin/literacy/health', headers: {} }, deniedHealthRes);
        assert.equal(deniedHealthRes.statusCode, 401);

        const allowedHealthRes = createMockResponse();
        await handlers.handleLiteracyHealth({ method: 'GET', url: '/admin/literacy/health', headers: { 'x-markos-admin-secret': 'test-secret' } }, allowedHealthRes);
        assert.equal(allowedHealthRes.statusCode, 200);
        const healthPayload = JSON.parse(allowedHealthRes.body);
        assert.equal(healthPayload.success, true);
        assert.equal(healthPayload.literacy.status, 'providers_ready');

        const deniedQueryRes = createMockResponse();
        await handlers.handleLiteracyQuery(createJsonRequest({ discipline: 'Paid Media' }, '/admin/literacy/query'), deniedQueryRes);
        assert.equal(deniedQueryRes.statusCode, 401);

        const queryRes = createMockResponse();
        const queryReq = createJsonRequest({
          discipline: 'Paid Media',
          query: 'cta hooks',
          business_model: 'B2B',
          topK: 3,
        }, '/admin/literacy/query');
        queryReq.headers['x-markos-admin-secret'] = 'test-secret';

        await handlers.handleLiteracyQuery(queryReq, queryRes);
        assert.equal(queryRes.statusCode, 200);
        const queryPayload = JSON.parse(queryRes.body);
        assert.equal(queryPayload.success, true);
        assert.equal(queryPayload.diagnostics.returned, 1);
        assert.equal(queryPayload.matches[0].text, 'match one');
      });
    } finally {
      if (oldAdminSecret === undefined) {
        delete process.env.MARKOS_ADMIN_SECRET;
      } else {
        process.env.MARKOS_ADMIN_SECRET = oldAdminSecret;
      }
    }
  });

  await t.test('3.17 Phase 34: Intake Validation Rule R001 - company.name required', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    const handlers = loadFreshModule(handlersPath);
    const invalidRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ company: { name: '' } }), '/submit'),
      invalidRes
    );
    assert.equal(invalidRes.statusCode, 400);
    const invalidPayload = JSON.parse(invalidRes.body);
    assert.equal(invalidPayload.error, 'INTAKE_VALIDATION_FAILED');
    assert.ok(invalidPayload.failed_rules.includes('R001'));

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: { company_profile: 'ok' }, vectorStoreResults: [], errors: [] }),
    }, async () => {
      const refreshedHandlers = loadFreshModule(handlersPath);
      const validRes = createMockResponse();
      await refreshedHandlers.handleSubmit(
        createJsonRequest(createPhase34ValidSeed(), '/submit'),
        validRes
      );
      assert.equal(validRes.statusCode, 200);
    });
  });

  await t.test('3.18 Phase 34: Intake Validation Rule R002 - company.stage enum', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    const handlers = loadFreshModule(handlersPath);
    const invalidRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ company: { stage: 'invalid-stage' } }), '/submit'),
      invalidRes
    );
    assert.equal(invalidRes.statusCode, 400);
    const invalidPayload = JSON.parse(invalidRes.body);
    assert.ok(invalidPayload.failed_rules.includes('R002'));

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: { company_profile: 'ok' }, vectorStoreResults: [], errors: [] }),
    }, async () => {
      const refreshedHandlers = loadFreshModule(handlersPath);
      const validRes = createMockResponse();
      await refreshedHandlers.handleSubmit(
        createJsonRequest(createPhase34ValidSeed({ company: { stage: '+10M MRR' } }), '/submit'),
        validRes
      );
      assert.equal(validRes.statusCode, 200);
    });
  });

  await t.test('3.19 Phase 34: Intake Validation Rule R004 - audience.pain_points min 2', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    const handlers = loadFreshModule(handlersPath);

    const missingRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ audience: { pain_points: [] } }), '/submit'),
      missingRes
    );
    assert.equal(missingRes.statusCode, 400);
    assert.ok(JSON.parse(missingRes.body).failed_rules.includes('R004'));

    const oneRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ audience: { pain_points: ['only one'] } }), '/submit'),
      oneRes
    );
    assert.equal(oneRes.statusCode, 400);
    assert.ok(JSON.parse(oneRes.body).failed_rules.includes('R004'));

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: { audience: 'ok' }, vectorStoreResults: [], errors: [] }),
    }, async () => {
      const refreshedHandlers = loadFreshModule(handlersPath);
      const validRes = createMockResponse();
      await refreshedHandlers.handleSubmit(
        createJsonRequest(createPhase34ValidSeed({ audience: { pain_points: ['pain one', 'pain two'] } }), '/submit'),
        validRes
      );
      assert.equal(validRes.statusCode, 200);
    });
  });

  await t.test('3.20 Phase 34: Intake Validation Rule R005 - market.competitors min 2 with positioning', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    const handlers = loadFreshModule(handlersPath);

    const missingRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ market: { competitors: [] } }), '/submit'),
      missingRes
    );
    assert.equal(missingRes.statusCode, 400);
    assert.ok(JSON.parse(missingRes.body).failed_rules.includes('R005'));

    const invalidShapeRes = createMockResponse();
    await handlers.handleSubmit(
      createJsonRequest(createPhase34ValidSeed({ market: { competitors: [{ name: 'A' }, { name: 'B', positioning: '' }] } }), '/submit'),
      invalidShapeRes
    );
    assert.equal(invalidShapeRes.statusCode, 400);
    assert.ok(JSON.parse(invalidShapeRes.body).failed_rules.includes('R005'));

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: { competitive: 'ok' }, vectorStoreResults: [], errors: [] }),
    }, async () => {
      const refreshedHandlers = loadFreshModule(handlersPath);
      const validRes = createMockResponse();
      await refreshedHandlers.handleSubmit(
        createJsonRequest(createPhase34ValidSeed(), '/submit'),
        validRes
      );
      assert.equal(validRes.statusCode, 200);
    });
  });

  await t.test('3.21 Phase 34: Linear automation creates intake tickets when configured', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
    const linearClientPath = path.join(env.dir, 'onboarding', 'backend', 'linear-client.cjs');

    const oldLinearApiKey = process.env.LINEAR_API_KEY;
    process.env.LINEAR_API_KEY = 'linear_test_key';
    seedPhase34LinearTemplates(env.dir);

    try {
      await withMockedModule(linearClientPath, {
        getTeamId: async () => 'team-123',
        getUserId: async () => null,
        createIssue: async (input) => ({
          id: `id-${input.title}`,
          identifier: input.title.includes('Validation') ? 'MKT-202' : 'MKT-201',
          title: input.title,
          url: `https://linear.app/acme/issue/${input.title.includes('Validation') ? 'MKT-202' : 'MKT-201'}`,
        }),
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: { company_profile: 'ok' }, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
          assert.equal(res.statusCode, 200);

          const payload = JSON.parse(res.body);
          assert.ok(Array.isArray(payload.linear_tickets));
          assert.equal(payload.linear_tickets.length, 2);
          assert.equal(payload.linear_tickets[0].token, 'MARKOS-ITM-OPS-03');
          assert.equal(payload.linear_tickets[1].token, 'MARKOS-ITM-INT-01');
        });
      });
    } finally {
      if (oldLinearApiKey === undefined) {
        delete process.env.LINEAR_API_KEY;
      } else {
        process.env.LINEAR_API_KEY = oldLinearApiKey;
      }
    }
  });

  await t.test('3.22 Phase 34: Linear automation degrades gracefully when unavailable', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
    const linearClientPath = path.join(env.dir, 'onboarding', 'backend', 'linear-client.cjs');

    const oldLinearApiKey = process.env.LINEAR_API_KEY;
    process.env.LINEAR_API_KEY = 'linear_test_key';
    seedPhase34LinearTemplates(env.dir);

    try {
      await withMockedModule(linearClientPath, {
        getTeamId: async () => { throw new Error('linear unavailable'); },
        getUserId: async () => null,
        createIssue: async () => { throw new Error('should not run'); },
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: { company_profile: 'ok' }, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
          assert.equal(res.statusCode, 200);

          const payload = JSON.parse(res.body);
          assert.equal(payload.success, true);
          assert.equal(payload.linear_tickets.length, 0);
          assert.equal(payload.linear_skipped.length, 2);
          assert.match(payload.linear_error, /linear unavailable/);
        });
      });
    } finally {
      if (oldLinearApiKey === undefined) {
        delete process.env.LINEAR_API_KEY;
      } else {
        process.env.LINEAR_API_KEY = oldLinearApiKey;
      }
    }
  });

  await t.test('3.23 Phase 34: submit response includes validation, drafts, and session url', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({
        drafts: {
          company_profile: 'company draft',
          mission_values: 'mission draft',
          audience: 'audience draft',
          competitive: 'competitive draft',
          brand_voice: 'brand voice draft',
          channel_strategy: 'channel strategy draft',
        },
        vectorStoreResults: [{ ok: true }],
        errors: [],
      }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const res = createMockResponse();
      await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);

      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.success, true);
      assert.equal(payload.validation.valid, true);
      assert.equal(payload.validation.applied, true);
      assert.equal(typeof payload.session_url, 'string');
      assert.match(payload.session_url, /\?slug=/);
      assert.ok(payload.drafts.company_profile);
      assert.ok(payload.drafts.channel_strategy);
    });
  });

  await t.test('3.24 Phase 34: legacy intake payload remains compatible (validation not applied)', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');

    const legacySeed = {
      company: { name: 'Legacy Corp', industry: 'SaaS' },
      product: { name: 'Legacy Product' },
      audience: { segment_name: 'founders' },
      market: { maturity: 'early' },
    };

    await withMockedModule(orchestratorPath, {
      orchestrate: async () => ({ drafts: { company_profile: 'ok' }, vectorStoreResults: [], errors: [] }),
    }, async () => {
      const handlers = loadFreshModule(handlersPath);
      const res = createMockResponse();
      await handlers.handleSubmit(createJsonRequest(legacySeed, '/submit'), res);

      assert.equal(res.statusCode, 200);
      const payload = JSON.parse(res.body);
      assert.equal(payload.validation.applied, false);
      assert.equal(payload.validation.valid, true);
    });
  });

  await t.test('3.25 Phase 34: end-to-end intake response includes automation contract fields', async () => {
    const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
    const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
    const linearClientPath = path.join(env.dir, 'onboarding', 'backend', 'linear-client.cjs');

    const oldLinearApiKey = process.env.LINEAR_API_KEY;
    process.env.LINEAR_API_KEY = 'linear_test_key';
    seedPhase34LinearTemplates(env.dir);

    try {
      await withMockedModule(linearClientPath, {
        getTeamId: async () => 'team-123',
        getUserId: async () => null,
        createIssue: async (input) => ({
          id: `id-${input.title}`,
          identifier: input.title.includes('Validation') ? 'MKT-302' : 'MKT-301',
          title: input.title,
          url: `https://linear.app/acme/issue/${input.title.includes('Validation') ? 'MKT-302' : 'MKT-301'}`,
        }),
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({
            drafts: {
              company_profile: 'company',
              mission_values: 'mission',
              audience: 'audience',
              competitive: 'competitive',
              brand_voice: 'brand',
              channel_strategy: 'channel',
            },
            vectorStoreResults: [{ ok: true }],
            errors: [],
          }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);

          assert.equal(res.statusCode, 200);
          const payload = JSON.parse(res.body);
          assert.equal(payload.success, true);
          assert.equal(payload.validation.valid, true);
          assert.equal(payload.linear_tickets.length, 2);
          assert.equal(typeof payload.seed_path, 'string');
          assert.equal(typeof payload.session_url, 'string');
          assert.ok(payload.drafts.company_profile);
          assert.deepEqual(payload.errors, []);
        });
      });
    } finally {
      if (oldLinearApiKey === undefined) {
        delete process.env.LINEAR_API_KEY;
      } else {
        process.env.LINEAR_API_KEY = oldLinearApiKey;
      }
    }
  });

    // ─── Phase 43 Wave 0: Nyquist Contract Stubs ─────────────────────────────────
    // Contracts for LIT-13 / LIT-14 / LIT-15. All are `todo` until Waves 2-3
    // wire evaluateLiteracyReadiness into handleSubmit / handleStatus.

    // --- 43-01-01: submit readiness states (LIT-13) ----------------------------

    await t.test('[43-02-01 LIT-13] submit returns literacy.readiness=ready when providers healthy', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ ok: true, mode: 'cloud', status: 'providers_ready' }),
        getLiteracyContext: async () => ([{ text: 'paid media tactic', metadata: {}, score: 0.9 }]),
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
          assert.equal(res.statusCode, 200);
          const payload = JSON.parse(res.body);
          assert.equal(typeof payload.literacy, 'object', 'submit must include literacy block');
          assert.equal(payload.literacy.readiness, 'ready');
          assert.ok(Array.isArray(payload.literacy.disciplines_available));
          assert.ok(Array.isArray(payload.literacy.gaps));
        });
      });
    });

    await t.test('[43-03-01 LIT-13] submit returns literacy.readiness=partial when some disciplines empty', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      let callCount = 0;
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ ok: true, mode: 'cloud', status: 'providers_ready' }),
        getLiteracyContext: async () => { callCount++; return callCount <= 1 ? [{ text: 'content seo', metadata: {}, score: 0.8 }] : []; },
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
          assert.equal(res.statusCode, 200);
          const payload = JSON.parse(res.body);
          assert.equal(typeof payload.literacy, 'object', 'submit must include literacy block');
          assert.equal(payload.literacy.readiness, 'partial');
          assert.ok(payload.literacy.gaps.length > 0, 'gaps must list missing disciplines');
        });
      });
    });

    await t.test('[43-03-03 LIT-13] submit remains successful when literacy is unconfigured', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ ok: false, mode: 'cloud', status: 'providers_unconfigured' }),
        getLiteracyContext: async () => [],
      }, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const res = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
          assert.equal(res.statusCode, 200, 'submit must succeed even when literacy unconfigured');
          const payload = JSON.parse(res.body);
          assert.equal(payload.success, true, 'submit success must not depend on literacy state');
          assert.equal(typeof payload.literacy, 'object', 'literacy block must be present');
          assert.equal(payload.literacy.readiness, 'unconfigured');
        });
      });
    });

    // --- 43-01-02: status literacy block contract (LIT-14) ----------------------

    await t.test('[43-04-01 LIT-14] status response includes literacy block with correct field shapes', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      await withMockedModule(vectorStorePath, {
        configure: () => {},
        healthCheck: async () => ({ ok: true, mode: 'cloud', status: 'providers_ready' }),
        getLiteracyContext: async () => ([{ text: 'lifecycle email tactic', metadata: {}, score: 0.85 }]),
      }, async () => {
        const handlers = loadFreshModule(handlersPath);
        const res = createMockResponse();
        await handlers.handleStatus({ method: 'GET', url: '/status' }, res);
        assert.equal(res.statusCode, 200);
        const payload = JSON.parse(res.body);
        assert.equal(typeof payload.literacy, 'object', 'status must include literacy block');
        assert.ok(['ready', 'partial', 'unconfigured'].includes(payload.literacy.readiness));
        assert.ok(Array.isArray(payload.literacy.disciplines_available));
        assert.ok(Array.isArray(payload.literacy.gaps));
        assert.ok(Object.prototype.hasOwnProperty.call(payload.literacy, 'last_ingestion_at'), 'last_ingestion_at must be present');
      });
    });

    await t.test('[43-04-02 LIT-14] submit and status produce same readiness under identical mocked conditions', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      const sharedVectorMock = {
        configure: () => {},
        healthCheck: async () => ({ ok: false, mode: 'cloud', status: 'providers_unconfigured' }),
        getLiteracyContext: async () => [],
      };
      let submitReadiness;
      let statusReadiness;
      await withMockedModule(vectorStorePath, sharedVectorMock, async () => {
        await withMockedModule(orchestratorPath, {
          orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
        }, async () => {
          const handlers = loadFreshModule(handlersPath);
          const submitRes = createMockResponse();
          await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), submitRes);
          submitReadiness = JSON.parse(submitRes.body)?.literacy?.readiness;
          const statusRes = createMockResponse();
          await handlers.handleStatus({ method: 'GET', url: '/status' }, statusRes);
          statusReadiness = JSON.parse(statusRes.body)?.literacy?.readiness;
        });
      });
      assert.equal(submitReadiness, 'unconfigured', 'submit readiness must be unconfigured');
      assert.equal(statusReadiness, 'unconfigured', 'status readiness must match submit');
      assert.equal(submitReadiness, statusReadiness, 'readiness must be identical across submit and status');
    });

    // --- 43-01-03: activation telemetry contract (LIT-15) -----------------------

    await t.test('[43-05-03 LIT-15] submit emits one literacy_activation_observed event with normalized payload', async () => {
      const handlersPath = path.join(env.dir, 'onboarding', 'backend', 'handlers.cjs');
      const orchestratorPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'orchestrator.cjs');
      const vectorStorePath = path.join(env.dir, 'onboarding', 'backend', 'vector-store-client.cjs');
      const telemetryPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'telemetry.cjs');
      const captured = [];
      await withMockedModule(telemetryPath, {
        capture: (eventName, properties) => captured.push({ eventName, properties }),
        captureRolloutEndpointEvent: () => {},
        captureExecutionCheckpoint: () => {},
      }, async () => {
        await withMockedModule(vectorStorePath, {
          configure: () => {},
          healthCheck: async () => ({ ok: true, mode: 'cloud', status: 'providers_ready' }),
          getLiteracyContext: async () => ([{ text: 'paid media content', metadata: {}, score: 0.9 }]),
        }, async () => {
          await withMockedModule(orchestratorPath, {
            orchestrate: async () => ({ drafts: {}, vectorStoreResults: [], errors: [] }),
          }, async () => {
            const handlers = loadFreshModule(handlersPath);
            const res = createMockResponse();
            await handlers.handleSubmit(createJsonRequest(createPhase34ValidSeed(), '/submit'), res);
            assert.equal(res.statusCode, 200);
            const activationEvents = captured.filter((e) => e.eventName === 'literacy_activation_observed');
            assert.equal(activationEvents.length, 1, 'exactly one literacy_activation_observed event per submit');
            const evt = activationEvents[0].properties;
            assert.ok(['ready', 'partial', 'unconfigured'].includes(evt.readiness_status));
            assert.ok(Array.isArray(evt.disciplines_available));
            assert.ok(Array.isArray(evt.disciplines_missing));
            assert.equal(typeof evt.business_model, 'string');
            assert.equal(typeof evt.pain_point_count, 'number');
            // LIT-15: no raw pain-point strings in telemetry
            const rawPainPoints = createPhase34ValidSeed().audience.pain_points;
            const evtStr = JSON.stringify(evt);
            for (const pp of rawPainPoints) {
              assert.ok(!evtStr.includes(pp), `raw pain point "${pp}" must not appear in telemetry`);
            }
          });
        });
      });
    });

});

