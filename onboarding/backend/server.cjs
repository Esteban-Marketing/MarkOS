#!/usr/bin/env node
/**
 * server.cjs — MGSD Onboarding Backend & AI Orchestration Server
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   HTTP interface for the client onboarding form. Handles local file serving,
 *   AI draft generation via the Orchestrator, and persistent MIR/MSP writing.
 *
 * ENDPOINTS:
 *   GET  /              → serves `onboarding/index.html`
 *   GET  /config        → returns `onboarding-config.json` + environment status
 *   GET  /status        → returns ChromaDB heartbeat + MIR STATE.md progress
 *   POST /submit        → PERSISTS seed JSON → RUNS AI AGENTS → returns draft snippets
 *   POST /regenerate    → re-runs a specific agent for a single section
 *   POST /approve       → triggers `write-mir.cjs` to write drafts to `.mgsd-local/`
 *
 * INITIALIZATION SEQUENCE:
 *   1. Load `.env` from project root.
 *   2. Load `onboarding-config.json`.
 *   3. Configure `chroma-client.cjs` with host.
 *   4. Run `bin/ensure-chroma.cjs` heartbeat to revive daemon if dead.
 *
 * PERSISTENCE RULES:
 *   - project_slug is written to `.mgsd-project.json` on the first POST /submit.
 *   - This slug becomes the permanent namespace for ChromaDB collections.
 *   - Drafts are stored in ChromaDB before being approved by the human.
 *
 * RELATED FILES:
 *   onboarding/backend/agents/orchestrator.cjs  (Parallel draft generation)
 *   onboarding/backend/write-mir.cjs            (Fuzzy MIR file management)
 *   onboarding/backend/chroma-client.cjs        (Vector storage)
 *   bin/ensure-chroma.cjs                       (Auto-healing daemon)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { exec } = require('child_process');
const handlers = require('./handlers.cjs');
const { createRuntimeContext } = require('./runtime-context.cjs');

const { 
  PROJECT_ROOT, 
  ONBOARDING_DIR, 
  CONFIG_PATH 
} = require('./path-constants.cjs');

// Load .env from project root.
try {
  require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });
} catch (e) {}

const orchestrator = require('./agents/orchestrator.cjs');
const chroma       = require('./chroma-client.cjs');
const writeMIR     = require('./write-mir.cjs');

const runtime = createRuntimeContext();
const { config } = runtime;

// Apply chroma config
chroma.configure(config.chroma_host);

// ── MIME Types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
};

// (utils.cjs handles readBody and json)

// ── Server ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

  // CORS preflight
  if (req.method === 'OPTIONS') return handlers.handleCorsPreflight(req, res);

  // ── Route matching ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/config') return handlers.handleConfig(req, res);
  if (req.method === 'GET' && req.url === '/status') return handlers.handleStatus(req, res);
  if (req.method === 'POST' && req.url.startsWith('/submit')) return handlers.handleSubmit(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/extract-sources')) return handlers.handleExtractSources(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/extract-and-score')) return handlers.handleExtractAndScore(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/generate-question')) return handlers.handleGenerateQuestion(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/parse-answer')) return handlers.handleParseAnswer(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/spark-suggestion')) return handlers.handleSparkSuggestion(req, res);
  if (req.method === 'POST' && req.url.startsWith('/api/competitor-discovery')) return handlers.handleCompetitorDiscovery(req, res);
  if (req.method === 'POST' && req.url.startsWith('/regenerate')) return handlers.handleRegenerate(req, res);
  if (req.method === 'POST' && req.url.startsWith('/approve')) return handlers.handleApprove(req, res);


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

// ── Boot Sequence ────────────────────────────────────────────────────────────
const ensureChromaPath = path.resolve(__dirname, '../../bin/ensure-chroma.cjs');
let bootDB = Promise.resolve();
if (fs.existsSync(ensureChromaPath)) {
  bootDB = require(ensureChromaPath).ensureChroma();
}

bootDB.then((bootReport) => {
  if (typeof chroma.setBootReport === 'function') {
    chroma.setBootReport(bootReport);
  }

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
    console.log(` MarkOS Onboarding v2.0 → ${url}`);
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
});
