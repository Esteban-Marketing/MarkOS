'use strict';

const fs = require('fs');
const path = require('path');
const orchestrator = require('./agents/orchestrator.cjs');
const chroma = require('./chroma-client.cjs');
const writeMIR = require('./write-mir.cjs');

const ONBOARDING_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = path.join(ONBOARDING_DIR, 'onboarding-config.json');
const MIR_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  '.agent/marketing-get-shit-done/templates/MIR'
);

function getConfig() {
  let config = {
    port: 4242,
    auto_open_browser: true,
    output_path: '../onboarding-seed.json',
    chroma_host: process.env.CHROMA_CLOUD_URL || 'http://localhost:8000',
    project_slug: 'mgsd-client',
    mir_output_path: null,
    posthog_api_key: process.env.MGSD_TELEMETRY !== 'false' ? process.env.POSTHOG_API_KEY : null,
    posthog_host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  };
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    config = { ...config, ...raw };
  } catch (e) {}
  return config;
}

function resolveMirOutputPath(config, slug) {
  if (process.env.VERCEL) {
    // Hosted mode dynamically writes to .mgsd-data/${slug}
    return path.resolve(PROJECT_ROOT, `.mgsd-data/${slug}/MIR`);
  }
  return config.mir_output_path
    ? path.resolve(PROJECT_ROOT, config.mir_output_path)
    : path.join(PROJECT_ROOT, '.mgsd-local/MIR');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    // Vercel pre-parses req.body
    if (req.body) return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data, null, 2));
}

async function handleConfig(req, res) {
  const config = getConfig();
  json(res, 200, config);
}

async function handleStatus(req, res) {
  const config = getConfig();
  chroma.configure(config.chroma_host);
  const chromaHealth = await chroma.healthCheck();

  let mirGateStatus = { total: 0, complete: 0, gate1Ready: false };
  // Default to local MIR for status check if slug unknown
  const mirOutputPath = resolveMirOutputPath(config, 'mgsd-client');
  try {
    const stateContent = fs.readFileSync(path.join(mirOutputPath, 'STATE.md'), 'utf8');
    const rows = stateContent.match(/\|\s*`[^`]+`\s*\|\s*`(empty|complete)`/g) || [];
    mirGateStatus.total = rows.length;
    mirGateStatus.complete = rows.filter(r => r.includes('complete')).length;
    mirGateStatus.gate1Ready = mirGateStatus.complete >= 5;
  } catch (e) {}

  json(res, 200, { chromadb: chromaHealth, mir: mirGateStatus });
}

async function handleSubmit(req, res) {
  try {
    const config = getConfig();
    chroma.configure(config.chroma_host);
    const body = await readBody(req);
    const seed = body.seed || body; // Support payload {"seed": {...}, "project_slug": "..."}

    // Determine slug
    const crypto = require('crypto');
    let slug = body.project_slug || (new URL('http://localhost' + req.url).searchParams.get('client'));
    
    if (!slug) {
      const baseSlug = config.project_slug || (seed.company?.name || 'mgsd-client').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    if (!process.env.VERCEL) {
      const projectConfigPath = path.resolve(PROJECT_ROOT, '.mgsd-project.json');
      try {
        const configObj = fs.existsSync(projectConfigPath) ? JSON.parse(fs.readFileSync(projectConfigPath, 'utf8')) : {};
        if (!configObj.project_slug) {
          configObj.project_slug = slug;
          fs.writeFileSync(projectConfigPath, JSON.stringify(configObj, null, 2), 'utf8');
        } else {
          slug = configObj.project_slug; // override with existing local slug
        }
      } catch (e) {}
    }

    let seedPath = null;
    if (!process.env.VERCEL) {
      const outputPath = path.resolve(ONBOARDING_DIR, config.output_path);
      fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
      console.log(`\n✓ onboarding-seed.json written to: ${outputPath}`);
      seedPath = outputPath;
    }

    console.log('\n🤖 Running AI draft generation for:', slug);
    const { drafts, chromaResults, errors } = await orchestrator.orchestrate(seed, slug);

    json(res, 200, {
      success: true,
      seed_path: seedPath,
      slug,
      drafts,
      chroma: chromaResults,
      errors,
    });
  } catch (err) {
    console.error('[POST /submit] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleRegenerate(req, res) {
  try {
    const config = getConfig();
    chroma.configure(config.chroma_host);
    const { section, seed, slug } = await readBody(req);
    
    const mirFiller = require('./agents/mir-filler.cjs');
    const mspFiller = require('./agents/msp-filler.cjs');

    const generators = {
      company_profile: () => mirFiller.generateCompanyProfile(seed),
      mission_values: () => mirFiller.generateMissionVisionValues(seed),
      audience: () => mirFiller.generateAudienceProfile(seed),
      competitive: () => mirFiller.generateCompetitiveLandscape(seed),
      brand_voice: () => mspFiller.generateBrandVoice(seed),
      channel_strategy: () => mspFiller.generateChannelStrategy(seed),
    };

    if (!generators[section]) {
      return json(res, 400, { error: `Unknown section: ${section}` });
    }

    const result = await generators[section]();
    if (result.ok && slug) {
      await chroma.storeDraft(slug, section, result.text);
    }

    json(res, 200, { success: result.ok, content: result.text, error: result.error });
  } catch (err) {
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleApprove(req, res) {
  try {
    const config = getConfig();
    chroma.configure(config.chroma_host);
    const { approvedDrafts, slug } = await readBody(req);
    const projectSlug = slug || 'mgsd-client';
    
    const mirOutputPath = resolveMirOutputPath(config, projectSlug);
    // Ensure nested dirs exist if dynamic
    if (process.env.VERCEL) {
      fs.mkdirSync(mirOutputPath, { recursive: true });
    }

    const { written, stateUpdated, errors } = writeMIR.applyDrafts(mirOutputPath, MIR_TEMPLATE_PATH, approvedDrafts);

    console.log(`\n✓ MIR files written: ${written.join(', ')}`);
    console.log(`  STATE.md updated: ${stateUpdated}`);

    for (const [section, content] of Object.entries(approvedDrafts)) {
      await chroma.storeDraft(projectSlug, `approved-${section}`, content);
    }

    json(res, 200, { success: true, written, stateUpdated, errors });
  } catch (err) {
    console.error('[POST /approve] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

function handleCorsPreflight(req, res) {
  res.writeHead(204, { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Headers': 'Content-Type', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' 
  });
  res.end();
}

module.exports = {
  handleConfig,
  handleStatus,
  handleSubmit,
  handleRegenerate,
  handleApprove,
  handleCorsPreflight
};
