const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createTestEnvironment } = require('./setup.js');

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
    const childEnv = { ...process.env, CHROMA_CLOUD_URL: 'mock', NODE_PATH: rootNodeModules };
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
    const childEnv = { ...process.env, CHROMA_CLOUD_URL: 'mock', NODE_PATH: rootNodeModules };
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
});
