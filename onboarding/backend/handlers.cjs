'use strict';

const {
  PROJECT_ROOT,
  ONBOARDING_DIR,
  CONFIG_PATH,
  MIR_TEMPLATES
} = require('./path-constants.cjs');
const fs = require('fs');
const path = require('path');
const { IncomingForm } = require('formidable');
const orchestrator = require('./agents/orchestrator.cjs');
const chroma = require('./chroma-client.cjs');
const writeMIR = require('./write-mir.cjs');

const { readBody, json } = require('./utils.cjs');

// Extractors & Scorers
const schemaExtractor = require('./extractors/schema-extractor.cjs');
const confidenceScorer = require('./confidences/confidence-scorer.cjs');
const { getGroupingPrompt, getGroupingSystemPrompt } = require('./prompts/grouping-prompt.js');
const { getSparkPrompt } = require('./prompts/spark-prompt.js');
const { discoverCompetitors } = require('./enrichers/competitor-enricher.cjs');

const mirFiller = require('./agents/mir-filler.cjs');
const mspFiller = require('./agents/msp-filler.cjs');

// Scrapers & Parsers
const tavilyScraper = require('./scrapers/tavily-scraper.cjs');
const pdfParser     = require('./parsers/pdf-parser.cjs');
const docxParser    = require('./parsers/docx-parser.cjs');
const csvParser     = require('./parsers/csv-parser.cjs');
const textParser    = require('./parsers/text-parser.cjs');

const llm = require('./agents/llm-adapter.cjs');

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

// (utils.cjs handles readBody and json)

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
  const mirOutputPath = config.mir_output_path
    ? path.resolve(PROJECT_ROOT, config.mir_output_path)
    : path.join(PROJECT_ROOT, '.mgsd-local/MIR');
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

    const { written, stateUpdated, errors } = writeMIR.applyDrafts(mirOutputPath, MIR_TEMPLATES, approvedDrafts);

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

      const url = fields.url;
      // 1. Parallel Scraping & Parsing
      const scrapePromise = url ? tavilyScraper.scrapeDomain(url, config.tavily_api_key || process.env.TAVILY_API_KEY).catch(e => {
        console.warn(`Scrape failed for ${url}:`, e.message);
        return `--- TAVILY SCRAPE FAILED FOR ${url} ---\n(User provided URL but scraping failed: ${e.message})\n\n`;
      }) : Promise.resolve('');

      const uploadedFiles = files['files[]'] || files['files'] || [];
      const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];

      const parserPromises = fileArray.map(async (file) => {
        try {
          const buffer = fs.readFileSync(file.filepath);
          const ext = path.extname(file.originalFilename).toLowerCase();
          let text = '';
          switch (ext) {
            case '.pdf':  text = await pdfParser.parsePdf(buffer); break;
            case '.docx': text = await docxParser.parseDocx(buffer); break;
            case '.csv':  text = csvParser.parseCsv(buffer); break;
            case '.txt':
            case '.md':   text = textParser.parseText(buffer); break;
          }
          return text ? `\n[File: ${file.originalFilename}]\n${text}\n` : '';
        } catch (e) {
          console.warn(`Failed to parse file ${file.originalFilename}:`, e.message);
          return '';
        }
      });

      const [webText, ...fileTexts] = await Promise.all([scrapePromise, ...parserPromises]);
      const fileText = fileTexts.join('\n').trim();

      json(res, 200, { 
        success: true, 
        webText: webText.trim(), 
        fileText: fileText
      });
    });
  } catch (err) {
    console.error('[POST /api/extract-sources] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleExtractAndScore(req, res) {
  try {
    const { webText, fileText, chatText } = await readBody(req);
    // Backward compatibility for single 'text' field
    const w = webText || '';
    const f = fileText || '';
    const c = chatText || '';

    const jsonMap = await schemaExtractor.extractToSchema(w, f, c);
    
    let scoredMap = {};
    try {
      scoredMap = confidenceScorer.scoreFields(jsonMap);
    } catch (scoreErr) {
      console.error('[HANDLERS] Scorer failed:', scoreErr.message);
    }

    json(res, 200, { success: true, data: jsonMap, scores: scoredMap });
  } catch (err) {
    console.error('[POST /api/extract-and-score] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleGenerateQuestion(req, res) {
  try {
    const body = await readBody(req);
    const schema = body.schema || body.seed || {};
    const businessModel = body.businessModel || schema.company?.business_model || 'B2B';
    const scores = body.scores || {};
    
    // Helper to extract missing fields from scores
    const extractMissing = (scoresObj, prefix = '') => {
      let missing = [];
      for (const [key, meta] of Object.entries(scoresObj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (meta && typeof meta === 'object' && meta.score !== undefined) {
          if (meta.score === 'Red' || meta.score === 'Yellow') {
            missing.push(path);
          }
        } else if (meta && typeof meta === 'object') {
          missing = missing.concat(extractMissing(meta, path));
        }
      }
      return missing;
    };

    const missingFields = body.missingFields || (Object.keys(scores).length > 0 ? extractMissing(scores) : []);

    if (!missingFields || missingFields.length === 0) {
      return json(res, 200, { success: true, question: null }); // Everything complete
    }

    const userPrompt = getGroupingPrompt(businessModel, missingFields.slice(0, 3));
    const systemPrompt = getGroupingSystemPrompt();

    const llmRes = await llm.call(systemPrompt, userPrompt, { temperature: 0.6 });
    if (!llmRes.ok) throw new Error(llmRes.error);

    json(res, 200, { success: true, question: llmRes.text.trim(), missingFields });
  } catch (err) {
    console.error('[POST /api/generate-question] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleParseAnswer(req, res) {
  try {
    const body = await readBody(req);
    const existingData = body.existingData || body.schema || body.seed || {};
    const userAnswer   = body.userAnswer || body.answer;

    if (!existingData || !userAnswer) {
      return json(res, 400, { success: false, error: 'existingData and userAnswer (answer) required.' });
    }

    const jsonMap = await schemaExtractor.extractPartialToSchema(existingData, userAnswer);
    const scoredMap = confidenceScorer.scoreFields(jsonMap);

    json(res, 200, { success: true, data: jsonMap, updatedSchema: jsonMap, scores: scoredMap });
  } catch (err) {
    console.error('[POST /api/parse-answer] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleSparkSuggestion(req, res) {
  try {
    const { fieldName, currentState } = await readBody(req);
    if (!fieldName || !currentState) {
      return json(res, 400, { success: false, error: 'fieldName and currentState are required' });
    }

    const contextString = JSON.stringify(currentState, null, 2);
    const prompt = getSparkPrompt(fieldName, contextString);
    
    // Call LLM adapter
    const llmRes = await llm.call(
      "You are a helpful AI that strictly outputs JSON arrays of strings. No preamble.",
      prompt,
      { max_tokens: 300, temperature: 0.7 }
    );
    
    if (!llmRes.ok) {
      if (llmRes.error === 'NO_AI_AVAILABLE') {
        return json(res, 503, { success: false, error: 'NO_AI_AVAILABLE' });
      }
      throw new Error(llmRes.error);
    }

    let parsed = [];
    try {
      const jsonStart = llmRes.text.indexOf('[');
      const jsonEnd = llmRes.text.lastIndexOf(']');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        parsed = JSON.parse(llmRes.text.substring(jsonStart, jsonEnd + 1));
      } else {
        parsed = JSON.parse(llmRes.text);
      }
    } catch (e) {
      throw new Error('LLM did not return a valid JSON array. Response: ' + llmRes.text);
    }

    json(res, 200, { success: true, suggestions: parsed });
  } catch(err) {
    console.error('[POST /api/spark-suggestion] Error:', err.message);
    json(res, 500, { success: false, error: err.message });
  }
}

async function handleCompetitorDiscovery(req, res) {
  try {
    const { companyName, industry } = await readBody(req);
    const result = await discoverCompetitors(companyName, industry);
    if (!result.success) {
      if (result.reason === "No TAVILY_API_KEY provided") {
        return json(res, 400, { success: false, reason: "No API Key" });
      }
      return json(res, 500, { success: false, error: result.reason });
    }
    json(res, 200, { success: true, enrichedData: result.enrichedData });
  } catch (err) {
    console.error('[POST /api/competitor-discovery] Error:', err.message);
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
  handleGenerateQuestion,
  handleParseAnswer,
  handleSparkSuggestion,
  handleCompetitorDiscovery,
  handleCorsPreflight
};
