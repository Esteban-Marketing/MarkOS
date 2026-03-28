'use strict';

const {
  PROJECT_ROOT,
  ONBOARDING_DIR,
  CONFIG_PATH,
  MIR_TEMPLATES
} = require('./path-constants.cjs');
const fs = require('fs');
const path = require('path');
const writeMIR = require('./write-mir.cjs');
const {
  createRuntimeContext,
  resolveMirOutputPath,
  resolveProjectSlug,
  resolveRequestedProjectSlug,
  resolveSeedOutputPath,
} = require('./runtime-context.cjs');
const telemetry = require('./agents/telemetry.cjs');

const { readBody, json } = require('./utils.cjs');

// (utils.cjs handles readBody and json)

const EXECUTION_READINESS_CONTRACT = Object.freeze({
  requiredDraftSections: [
    'company_profile',
    'mission_values',
    'audience',
    'competitive',
    'brand_voice',
    'channel_strategy',
  ],
  requiredWinnersCatalogs: [
    '.mgsd-local/MSP/Paid_Media/WINNERS/_CATALOG.md',
    '.mgsd-local/MSP/Lifecycle_Email/WINNERS/_CATALOG.md',
    '.mgsd-local/MSP/Content_SEO/WINNERS/_CATALOG.md',
    '.mgsd-local/MSP/Social/WINNERS/_CATALOG.md',
    '.mgsd-local/MSP/Landing_Pages/WINNERS/_CATALOG.md',
  ],
});

function buildExecutionReadiness(approvedDrafts = {}) {
  const draftChecks = EXECUTION_READINESS_CONTRACT.requiredDraftSections.map((section) => {
    const approved = typeof approvedDrafts[section] === 'string' && approvedDrafts[section].trim().length > 0;
    return {
      type: 'approved_draft',
      key: section,
      ready: approved,
      blocking: !approved,
      detail: approved ? 'approved' : 'missing',
    };
  });

  const winnerChecks = EXECUTION_READINESS_CONTRACT.requiredWinnersCatalogs.map((relativePath) => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, relativePath));
    return {
      type: 'winners_catalog',
      key: relativePath,
      ready: exists,
      blocking: !exists,
      detail: exists ? 'present' : 'missing',
    };
  });

  const checks = [...draftChecks, ...winnerChecks];
  const blockingChecks = checks.filter((check) => check.blocking);

  return {
    status: blockingChecks.length === 0 ? 'ready' : 'blocked',
    checks,
    blocking_checks: blockingChecks,
  };
}

function createOutcome(state, code, message, details = {}) {
  return {
    state,
    code,
    message,
    warnings: details.warnings || [],
    errors: details.errors || [],
    fallback: Boolean(details.fallback),
  };
}

async function handleConfig(req, res) {
  const runtime = createRuntimeContext();
  json(res, 200, {
    ...runtime.config,
    runtime_mode: runtime.mode,
    local_persistence: runtime.canWriteLocalFiles,
  });
}

async function handleStatus(req, res) {
  const runtime = createRuntimeContext();
  const chroma = require('./chroma-client.cjs');
  chroma.configure(runtime.config.chroma_host);
  const chromaHealth = await chroma.healthCheck();

  let mirGateStatus = { total: 0, complete: 0, gate1Ready: false };
  const mirOutputPath = resolveMirOutputPath(runtime.config);
  try {
    const stateContent = fs.readFileSync(path.join(mirOutputPath, 'STATE.md'), 'utf8');
    const rows = stateContent.match(/\|\s*`[^`]+`\s*\|\s*`(empty|complete)`/g) || [];
    mirGateStatus.total = rows.length;
    mirGateStatus.complete = rows.filter(r => r.includes('complete')).length;
    mirGateStatus.gate1Ready = mirGateStatus.complete >= 5;
  } catch (e) {}

  json(res, 200, {
    chromadb: chromaHealth,
    memory: {
      ...chromaHealth,
      runtime_mode: runtime.mode,
      local_persistence: runtime.canWriteLocalFiles,
      requires_operator_action: !chromaHealth.ok,
    },
    mir: mirGateStatus,
    runtime_mode: runtime.mode,
    local_persistence: runtime.canWriteLocalFiles,
  });
}

async function handleSubmit(req, res) {
  try {
    const runtime = createRuntimeContext();
    const chroma = require('./chroma-client.cjs');
    chroma.configure(runtime.config.chroma_host);
    const body = await readBody(req);
    const seed = body.seed || body; // Support payload {"seed": {...}, "project_slug": "..."}

    // Determine slug
    const crypto = require('crypto');
    let querySlug = null;
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      querySlug = parsedUrl.searchParams.get('project_slug') || parsedUrl.searchParams.get('client');
    } catch {
      querySlug = null;
    }
    const requestedSlug = resolveRequestedProjectSlug({
      explicitSlug: body.project_slug,
      requestUrl: req.url,
      config: runtime.config,
      companyName: seed.company?.name || '',
    });
    let slug = requestedSlug;

    if (!body.project_slug && !querySlug) {
      slug = `${requestedSlug}-${crypto.randomUUID().slice(0, 8)}`;
    }

    slug = resolveProjectSlug(runtime, slug);

    let seedPath = null;
    if (runtime.canWriteLocalFiles) {
      const outputPath = resolveSeedOutputPath(runtime.config);
      fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
      console.log(`\n✓ onboarding-seed.json written to: ${outputPath}`);
      seedPath = outputPath;
    }

    console.log('\n🤖 Running MarkOS AI draft generation for:', slug);
    const orchestrator = require('./agents/orchestrator.cjs');
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
    const runtime = createRuntimeContext();
    const chroma = require('./chroma-client.cjs');
    chroma.configure(runtime.config.chroma_host);
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
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'unknown_regenerate_section',
        section,
      });
      return json(res, 400, { error: `Unknown section: ${section}` });
    }

    const result = await generators[section]();
    let persistenceWarning = null;
    if (result.ok && slug) {
      const storeResult = await chroma.storeDraft(slug, section, result.text);
      if (storeResult && storeResult.ok === false) {
        persistenceWarning = `Failed to persist regenerated-${section}: ${storeResult.error || 'Unknown Chroma persistence error'}`;
      }
    }

    if (!result.ok) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'regenerate',
        section,
        reason: result.error || 'unknown_regenerate_failure',
      });
      return json(res, 502, {
        success: false,
        content: result.text,
        error: result.error,
        outcome: createOutcome('failure', 'REGENERATE_FAILED', 'Section regeneration failed.', {
          errors: [result.error || 'Unknown regenerate failure'],
        }),
      });
    }

    if (result.isFallback) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'regenerate_fallback',
        section,
      });
      const warnings = [result.error || 'Provider unavailable; fallback content returned'];
      if (persistenceWarning) warnings.push(persistenceWarning);
      return json(res, 200, {
        success: true,
        content: result.text,
        error: result.error,
        outcome: createOutcome('degraded', 'REGENERATE_FALLBACK', 'Section regenerated using fallback content.', {
          fallback: true,
          warnings,
        }),
      });
    }

    if (persistenceWarning) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        reason: 'regenerate_persistence_warning',
        section,
      });
      return json(res, 200, {
        success: true,
        content: result.text,
        error: null,
        outcome: createOutcome('warning', 'REGENERATE_PERSIST_WARNING', 'Section regenerated but persistence warning occurred.', {
          warnings: [persistenceWarning],
        }),
      });
    }

    json(res, 200, {
      success: true,
      content: result.text,
      error: null,
      outcome: createOutcome('success', 'REGENERATE_OK', 'Section regenerated successfully.'),
    });
  } catch (err) {
    telemetry.captureExecutionCheckpoint('execution_failure', {
      checkpoint: 'regenerate',
      reason: err.message,
    });
    json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'REGENERATE_EXCEPTION', 'Unhandled regenerate failure.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleApprove(req, res) {
  try {
    const runtime = createRuntimeContext();
    const { approvedDrafts, slug } = await readBody(req);

    if (!runtime.canWriteLocalFiles) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'approve',
        reason: 'LOCAL_PERSISTENCE_UNAVAILABLE',
      });
      return json(res, 501, {
        success: false,
        error: 'LOCAL_PERSISTENCE_UNAVAILABLE',
        message: 'Approve/write flows require local filesystem access. Use the local onboarding server to persist approved drafts.',
        outcome: createOutcome('failure', 'LOCAL_PERSISTENCE_UNAVAILABLE', 'Approve/write flows require local filesystem access.', {
          errors: ['Approve/write flows require local filesystem access.'],
        }),
      });
    }

    const chroma = require('./chroma-client.cjs');
    chroma.configure(runtime.config.chroma_host);

    const projectSlug = resolveProjectSlug(
      runtime,
      slug || resolveRequestedProjectSlug({
        explicitSlug: slug,
        requestUrl: req.url,
        config: runtime.config,
      })
    );
    
    const mirOutputPath = resolveMirOutputPath(runtime.config);
    fs.mkdirSync(mirOutputPath, { recursive: true });

    const { written, stateUpdated, errors, mergeEvents } = writeMIR.applyDrafts(mirOutputPath, MIR_TEMPLATES, approvedDrafts);

    console.log(`\n✓ MIR files written: ${written.join(', ')}`);
    console.log(`  STATE.md updated: ${stateUpdated}`);

    const chromaErrors = [];
    for (const [section, content] of Object.entries(approvedDrafts)) {
      try {
        const storeResult = await chroma.storeDraft(projectSlug, `approved-${section}`, content);
        if (storeResult && storeResult.ok === false) {
          chromaErrors.push(`Failed to persist approved-${section}: ${storeResult.error || 'Unknown Chroma persistence error'}`);
        }
      } catch (storeErr) {
        chromaErrors.push(`Failed to persist approved-${section}: ${storeErr.message}`);
      }
    }

    const combinedErrors = [...errors, ...chromaErrors];
    const mergeFallbackWarnings = (mergeEvents || [])
      .filter((event) => event.type === 'header-fallback-append' || event.type === 'raw-fallback-append')
      .map((event) => {
        if (event.header) {
          return `Fallback append used for ${event.file} (${event.header})`;
        }
        return `Fallback append used for ${event.file}`;
      });

    if (written.length === 0) {
      telemetry.captureExecutionCheckpoint('execution_failure', {
        checkpoint: 'approve',
        reason: 'APPROVE_WRITE_FAILED',
      });
      return json(res, 500, {
        success: false,
        written,
        stateUpdated,
        errors: combinedErrors,
        mergeEvents,
        outcome: createOutcome('failure', 'APPROVE_WRITE_FAILED', 'No drafts were written to local MIR files.', {
          errors: combinedErrors.length > 0 ? combinedErrors : ['No files were written'],
        }),
      });
    }

    const readiness = buildExecutionReadiness(approvedDrafts || {});
    const onboardingCompleted = written.length > 0;

    if (combinedErrors.length > 0 || mergeFallbackWarnings.length > 0) {
      telemetry.captureExecutionCheckpoint('execution_readiness_blocked', {
        checkpoint: 'approve',
        project_slug: projectSlug,
        reason: 'APPROVE_PARTIAL_WARNING',
        blocking_count: readiness.blocking_checks.length,
      });
      return json(res, 200, {
        success: true,
        written,
        stateUpdated,
        errors: combinedErrors,
        mergeEvents,
        handoff: {
          onboarding_completed: onboardingCompleted,
          execution_readiness: readiness,
        },
        outcome: createOutcome('warning', 'APPROVE_PARTIAL_WARNING', 'Drafts were written with warnings.', {
          warnings: [...mergeFallbackWarnings, ...combinedErrors],
        }),
      });
    }

    telemetry.captureExecutionCheckpoint('approval_completed', {
      checkpoint: 'approve',
      project_slug: projectSlug,
      written_count: written.length,
    });
    telemetry.captureExecutionCheckpoint(
      readiness.status === 'ready' ? 'execution_readiness_ready' : 'execution_readiness_blocked',
      {
        checkpoint: 'approve',
        project_slug: projectSlug,
        blocking_count: readiness.blocking_checks.length,
      }
    );
    if (readiness.status === 'ready') {
      telemetry.captureExecutionCheckpoint('execution_loop_completed', {
        checkpoint: 'approve',
        project_slug: projectSlug,
      });
    }

    return json(res, 200, {
      success: true,
      written,
      stateUpdated,
      errors: [],
      mergeEvents,
      handoff: {
        onboarding_completed: onboardingCompleted,
        execution_readiness: readiness,
      },
      outcome: createOutcome('success', 'APPROVE_OK', 'Drafts were written successfully.'),
    });
  } catch (err) {
    console.error('[POST /approve] Error:', err.message);
    telemetry.captureExecutionCheckpoint('execution_failure', {
      checkpoint: 'approve',
      reason: err.message,
    });
    json(res, 500, {
      success: false,
      error: err.message,
      outcome: createOutcome('failure', 'APPROVE_EXCEPTION', 'Unhandled approve failure.', {
        errors: [err.message],
      }),
    });
  }
}

async function handleExtractSources(req, res) {
  try {
    const runtime = createRuntimeContext();
    const { IncomingForm } = require('formidable');
    const tavilyScraper = require('./scrapers/tavily-scraper.cjs');
    const pdfParser = require('./parsers/pdf-parser.cjs');
    const docxParser = require('./parsers/docx-parser.cjs');
    const csvParser = require('./parsers/csv-parser.cjs');
    const textParser = require('./parsers/text-parser.cjs');
    const form = new IncomingForm({ maxTotalFileSize: 10 * 1024 * 1024, maxFiles: 5 }); // 10MB limit

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return json(res, 400, { success: false, error: 'File upload error: ' + err.message });
      }

      const url = fields.url;
      // 1. Parallel Scraping & Parsing
      const scrapePromise = url ? tavilyScraper.scrapeDomain(url, runtime.config.tavily_api_key || process.env.TAVILY_API_KEY).catch(e => {
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
    const schemaExtractor = require('./extractors/schema-extractor.cjs');
    const confidenceScorer = require('./confidences/confidence-scorer.cjs');
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
    const { getGroupingPrompt, getGroupingSystemPrompt } = require('./prompts/grouping-prompt.js');
    const llm = require('./agents/llm-adapter.cjs');
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
    const schemaExtractor = require('./extractors/schema-extractor.cjs');
    const confidenceScorer = require('./confidences/confidence-scorer.cjs');
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
    const { getSparkPrompt } = require('./prompts/spark-prompt.js');
    const llm = require('./agents/llm-adapter.cjs');
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
    const { discoverCompetitors } = require('./enrichers/competitor-enricher.cjs');
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
