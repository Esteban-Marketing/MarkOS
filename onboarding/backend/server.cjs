#!/usr/bin/env node
// server.cjs — MGSD Enhanced Onboarding Backend Server v2.0
// Serves the onboarding UI + handles AI agent orchestration + ChromaDB persistence
//
// Endpoints:
//   GET  /              → serves index.html
//   GET  /status        → ChromaDB health + MIR gate status
//   POST /submit        → persists seed + runs AI agents → returns drafts
//   POST /regenerate    → regenerates a single draft section
//   POST /approve       → writes approved drafts to MIR/MSP files
//   GET  /config        → serves current config to browser

'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { exec } = require('child_process');

// Load .env from project root
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {}

const orchestrator = require('./agents/orchestrator.cjs');
const chroma       = require('./chroma-client.cjs');
const writeMIR     = require('./write-mir.cjs');

const ONBOARDING_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT   = path.resolve(__dirname, '../..');
const CONFIG_PATH    = path.join(ONBOARDING_DIR, 'onboarding-config.json');
const MIR_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  '.agent/marketing-get-shit-done/templates/MIR'
);

// ── Load Config ──────────────────────────────────────────────────────────────
let config = {
  port: 4242,
  auto_open_browser: true,
  output_path: '../onboarding-seed.json',
  chroma_host: 'http://localhost:8000',
  project_slug: 'mgsd-client',
  mir_output_path: null, // defaults to MIR_TEMPLATE_PATH
};

try {
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  config = { ...config, ...raw };
} catch (e) {}

// Apply chroma config
chroma.configure(config.chroma_host);

const mirOutputPath = config.mir_output_path
  ? path.resolve(PROJECT_ROOT, config.mir_output_path)
  : MIR_TEMPLATE_PATH;

// ── MIME Types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
};

// ── Body Parser Helper ───────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data, null, 2));
}

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
    res.end();
    return;
  }

  // ── GET /config ────────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/config') {
    json(res, 200, config);
    return;
  }

  // ── GET /status ────────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/status') {
    const chromaHealth = await chroma.healthCheck();

    // Read MIR STATE.md and count complete/total
    let mirGateStatus = { total: 0, complete: 0, gate1Ready: false };
    try {
      const stateContent = fs.readFileSync(path.join(mirOutputPath, 'STATE.md'), 'utf8');
      const rows = stateContent.match(/\|\s*`[^`]+`\s*\|\s*`(empty|complete)`/g) || [];
      mirGateStatus.total    = rows.length;
      mirGateStatus.complete = rows.filter(r => r.includes('complete')).length;
      // Gate 1 = 5 identity files complete
      mirGateStatus.gate1Ready = mirGateStatus.complete >= 5;
    } catch (e) {}

    json(res, 200, { chromadb: chromaHealth, mir: mirGateStatus });
    return;
  }

  // ── POST /submit ───────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/submit') {
    try {
      const seed = await readBody(req);
      
      // Write seed file
      const outputPath = path.resolve(ONBOARDING_DIR, config.output_path);
      fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
      console.log(`\n✓ onboarding-seed.json written to: ${outputPath}`);

      // Determine project slug from company name, appended with partial UUID to prevent collisions
      const crypto = require('crypto');
      const baseSlug = config.project_slug ||
        (seed.company?.name || 'mgsd-client').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

      // Run orchestrator
      console.log('\n🤖 Running AI draft generation...');
      const { drafts, chromaResults, errors } = await orchestrator.orchestrate(seed, slug);

      json(res, 200, {
        success: true,
        seed_path: outputPath,
        slug,
        drafts,
        chroma: chromaResults,
        errors,
      });
    } catch (err) {
      console.error('[POST /submit] Error:', err.message);
      json(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // ── POST /regenerate ───────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/regenerate') {
    try {
      const { section, seed, slug } = await readBody(req);
      
      const mirFiller = require('./agents/mir-filler.cjs');
      const mspFiller = require('./agents/msp-filler.cjs');

      const generators = {
        company_profile:  () => mirFiller.generateCompanyProfile(seed),
        mission_values:   () => mirFiller.generateMissionVisionValues(seed),
        audience:         () => mirFiller.generateAudienceProfile(seed),
        competitive:      () => mirFiller.generateCompetitiveLandscape(seed),
        brand_voice:      () => mspFiller.generateBrandVoice(seed),
        channel_strategy: () => mspFiller.generateChannelStrategy(seed),
      };

      if (!generators[section]) {
        json(res, 400, { error: `Unknown section: ${section}` });
        return;
      }

      const result = await generators[section]();
      if (result.ok && slug) {
        await chroma.storeDraft(slug, section, result.text);
      }

      json(res, 200, { success: result.ok, content: result.text, error: result.error });
    } catch (err) {
      json(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // ── POST /approve ──────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/approve') {
    try {
      const { approvedDrafts, slug } = await readBody(req);

      const { written, stateUpdated, errors } = writeMIR.applyDrafts(mirOutputPath, approvedDrafts);

      console.log(`\n✓ MIR files written: ${written.join(', ')}`);
      console.log(`  STATE.md updated: ${stateUpdated}`);

      // Store approved drafts in Chroma
      for (const [section, content] of Object.entries(approvedDrafts)) {
        await chroma.storeDraft(slug || 'mgsd-client', `approved-${section}`, content);
      }

      json(res, 200, { success: true, written, stateUpdated, errors });
    } catch (err) {
      console.error('[POST /approve] Error:', err.message);
      json(res, 500, { success: false, error: err.message });
    }
    return;
  }

  // ── Static File Serving ────────────────────────────────────────────────────
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Strip query strings
  filePath = filePath.split('?')[0];
  filePath = path.join(ONBOARDING_DIR, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// ── Port Fallback ────────────────────────────────────────────────────────────
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const fallback = config.port + 1;
    console.log(`Port ${config.port} in use, trying ${fallback}...`);
    server.listen(fallback);
  }
});

server.listen(config.port, '127.0.0.1', () => {
  const addr = server.address();
  const url  = `http://127.0.0.1:${addr.port}`;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` MGSD Onboarding v2.0 → ${url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' ✓ ChromaDB integration active');
  console.log(' ✓ OpenAI AI draft generation ready');
  console.log(' Ensure OPENAI_API_KEY is set in .env');
  console.log(' Complete the form → get AI drafts → publish\n');

  if (config.auto_open_browser) {
    const cmd = process.platform === 'win32' ? `start ${url}` :
                process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(cmd, (err) => { if (err) console.log(`Open manually: ${url}`); });
  }
});
