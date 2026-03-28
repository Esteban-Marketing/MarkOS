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
    const childEnv = { ...process.env, CHROMA_CLOUD_URL: 'http://127.0.0.1:8000', NODE_PATH: rootNodeModules };
    const child = spawn(process.execPath, [serverScript], { cwd: env.dir, env: childEnv }); // Mock CHROMA to not error
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
    const childEnv = { ...process.env, CHROMA_CLOUD_URL: 'http://127.0.0.1:8000', NODE_PATH: rootNodeModules };
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

  await t.test('3.4 API wrappers share runtime context and guard hosted writes', async () => {
    const oldVercel = process.env.VERCEL;
    const oldNodePath = process.env.NODE_PATH;

    process.env.VERCEL = '1';
    process.env.NODE_PATH = path.resolve(__dirname, '../node_modules');

    try {
      const configHandler = loadFreshModule(path.join(env.dir, 'api', 'config.js'));
      const configReq = { method: 'GET', url: '/config' };
      const configRes = createMockResponse();

      await configHandler(configReq, configRes);

      assert.equal(configRes.statusCode, 200, 'Config wrapper should return HTTP 200');
      const configPayload = JSON.parse(configRes.body);
      assert.equal(configPayload.runtime_mode, 'hosted', 'API config wrapper should report hosted mode');
      assert.equal(configPayload.local_persistence, false, 'API config wrapper should report local persistence as unavailable');

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
      assert.ok(!fs.existsSync(path.join(env.dir, '.mgsd-local', 'MIR')), 'Hosted approve wrapper must not create local MIR persistence paths');
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
    const chromaPath = path.join(env.dir, 'onboarding', 'backend', 'chroma-client.cjs');
    const mirFillerPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'mir-filler.cjs');
    const mspFillerPath = path.join(env.dir, 'onboarding', 'backend', 'agents', 'msp-filler.cjs');
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
        await withMockedModule(chromaPath, {
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
      await withMockedModule(chromaPath, {
        configure: () => {},
        storeDraft: async () => {
          throw new Error('mock chroma persistence error');
        },
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
      });
    });
  });
});
