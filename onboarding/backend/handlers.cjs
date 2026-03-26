'use strict';

const fs = require('fs');
const path = require('path');
const { IncomingForm } = require('formidable');
const orchestrator = require('./agents/orchestrator.cjs');
const chroma = require('./chroma-client.cjs');
const writeMIR = require('./write-mir.cjs');

// Parsers & Scrapers
const tavilyScraper = require('./scrapers/tavily-scraper.cjs');
const pdfParser = require('./parsers/pdf-parser.cjs');
const docxParser = require('./parsers/docx-parser.cjs');
const csvParser = require('./parsers/csv-parser.cjs');
const textParser = require('./parsers/text-parser.cjs');

// Extractors & Scorers
const schemaExtractor = require('./extractors/schema-extractor.cjs');
const confidenceScorer = require('./confidences/confidence-scorer.cjs');

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

async function handleExtractSources(req, res) {
  try {
    const config = getConfig();
    const form = new IncomingForm({ maxTotalFileSize: 10 * 1024 * 1024, maxFiles: 5 }); // 10MB limit

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return json(res, 400, { success: false, error: 'File upload error: ' + err.message });
      }

      let extractedText = '';

      // 1. Scrape URL if provided
      const url = fields.url && fields.url[0];
      if (url) {
        try {
          // Assume tavily config exists in the onboarding-config
          const scrapeData = await tavilyScraper.scrapeDomain(url, config.tavily_api_key || process.env.TAVILY_API_KEY);
          extractedText += scrapeData + '\n';
        } catch (e) {
          console.warn(`Scrape failed for ${url}:`, e.message);
          extractedText += `--- TAVILY SCRAPE FAILED FOR ${url} ---\n(User provided URL but scraping failed: ${e.message})\n\n`;
        }
      }

      // 2. Parse dropped files if provided
      const uploadedFiles = files['files[]'] || files['files'] || [];
      const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
      
      for (const file of fileArray) {
        try {
          const buffer = fs.readFileSync(file.filepath);
          const ext = path.extname(file.originalFilename).toLowerCase();
          let parsedFileText = '';

          switch (ext) {
            case '.pdf':
              parsedFileText = await pdfParser.parsePdf(buffer);
              break;
            case '.docx':
              parsedFileText = await docxParser.parseDocx(buffer);
              break;
            case '.csv':
              parsedFileText = csvParser.parseCsv(buffer);
              break;
            case '.txt':
            case '.md':
              parsedFileText = textParser.parseText(buffer);
              break;
            default:
              console.warn(`Unsupported extraction extension: ${ext}`);
          }
          if (parsedFileText) {
            extractedText += `\n[File: ${file.originalFilename}]\n${parsedFileText}\n`;
          }
        } catch (e) {
          console.warn(`Failed to parse file ${file.originalFilename}:`, e.message);
        }
      }

      json(res, 200, { success: true, text: extractedText.trim() });
    });
  } catch (err) {
    console.error('[POST /api/extract-sources] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleExtractAndScore(req, res) {
  try {
    const { text } = await readBody(req);
    if (!text) {
      return json(res, 400, { success: false, error: 'No text provided for extraction' });
    }

    const jsonMap = await schemaExtractor.extractToSchema(text);
    const scoredMap = confidenceScorer.scoreFields(jsonMap);

    json(res, 200, { success: true, data: jsonMap, scores: scoredMap });
  } catch (err) {
    console.error('[POST /api/extract-and-score] Error:', err.message);
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
  handleExtractSources,
  handleExtractAndScore,
  handleCorsPreflight
};
