#!/usr/bin/env node
/**
 * llm-adapter.cjs — Unified Multi-Model LLM Call Wrapper
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Single entry point for all LLM calls in the MARKOS onboarding pipeline.
 *   Abstracts away provider-specific APIs so all agents use the same interface.
 *
 * PROVIDER PRIORITY (auto-detected from .env):
 *   1. `options.provider`   — explicit override per call
 *   2. ANTHROPIC_API_KEY    — Claude (claude-3-5-haiku-20241022 default)
 *   3. OPENAI_API_KEY       — GPT-4o-mini (uses `openai` npm package)
 *   4. GEMINI_API_KEY       — Gemini 2.5 Flash (native fetch)
 *
 * EXPORTS:
 *   call(systemPrompt, userPrompt, options) → Promise<{ ok, text, provider, error? }>
 *
 * OPTIONS:
 *   provider    {string}  — force a specific provider ('openai' | 'anthropic' | 'gemini')
 *   model       {string}  — override the default model name
 *   max_tokens  {number}  — max completion tokens (default: 1200)
 *   temperature {number}  — sampling temperature (default: 0.4)
 *
 * RELATED FILES:
 *   onboarding/backend/agents/mir-filler.cjs    (calls this for MIR generation)
 *   onboarding/backend/agents/msp-filler.cjs    (calls this for MSP generation)
 *   onboarding/backend/agents/orchestrator.cjs   (drives all agent calls)
 *   .env                                         (API key source)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const path = require('path');

// Load .env from the project root (3 levels up from agents/).
// Wrapped in try/catch because dotenv is optional — callers may inject env vars externally.
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
} catch (e) {
  // dotenv optional — env vars may be set externally
}

// ── OpenAI SDK (lazy-initialized singleton to avoid repeated auth) ───────────
const { OpenAI } = require('openai');

let _openai = null;

/**
 * Returns a singleton OpenAI client, initialized on first call.
 * Throws if OPENAI_API_KEY is not set.
 */
function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// ── Native Fetch Adapters ───────────────────────────────────────────────────

async function callAnthropic(systemPrompt, userPrompt, options) {
  const model = options.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const payload = {
    model,
    max_tokens: options.max_tokens || 1200,
    temperature: options.temperature ?? 0.4,
    system: systemPrompt,
    messages: [ { role: 'user', content: userPrompt } ]
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic Error: ${res.status} ${err}`);
  }
  
  const data = await res.json();
  return { 
    text: data.content[0].text,
    usage: {
      promptTokens: data.usage?.input_tokens || 0,
      completionTokens: data.usage?.output_tokens || 0,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

async function callGemini(systemPrompt, userPrompt, options) {
  const model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  // Using the new v1alpha endpoint for standard chat
  // Alternatively fallback to v1beta 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: {
      parts: { text: systemPrompt }
    },
    contents: [
      { parts: [{ text: userPrompt }] }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.max_tokens || 1200
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    text: data.candidates[0].content.parts[0].text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0
    }
  };
}

async function callOpenAI(systemPrompt, userPrompt, options) {
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.max_tokens || 1200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
  });
  return {
    text: response.choices?.[0]?.message?.content?.trim() || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0
    }
  };
}

async function callOllama(systemPrompt, userPrompt, options) {
  let model = options.model;
  if (!model) {
    try {
      const configPath = path.resolve(__dirname, '../../onboarding-config.json');
      const config = require(configPath);
      model = config.ollama_model || 'llama3:8b';
    } catch(e) {
      model = 'llama3:8b';
    }
  }

  const payload = {
    model: model,
    prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.4,
      num_predict: options.max_tokens || 1200
    }
  };

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama Error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    text: data.response || '',
    usage: {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
    }
  };
}

/**
 * Call the LLM with a system/user prompt automatically determining the provider.
 * Priority: 1. provider option 2. ANTHROPIC key 3. OPENAI key 4. GEMINI key 5. OLLAMA
 */
/**
 * @llm_context
 * intent: Expose a stable provider-agnostic LLM contract so upstream generators can request
 * text output without branching per vendor SDK.
 * failure_boundaries:
 * - Provider/API failures must never crash onboarding orchestration.
 * - Returned object shape remains stable for both live and fallback responses.
 */
async function call(systemPrompt, userPrompt, options = {}) {
  try {
    const start = Date.now();
    let result = { text: '', usage: {} };
    /**
     * @llm_context
     * intent: Resolve provider deterministically based on explicit override first, then
     * configured API keys, and finally local Ollama fallback.
     * failure_boundaries:
     * - Missing cloud keys are expected and should fall through to remaining providers.
     * - Unknown provider value is treated as fatal and handled by outer fallback.
     */
    const provider = options.provider || 
                     (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 
                     (process.env.OPENAI_API_KEY ? 'openai' : 
                     (process.env.GEMINI_API_KEY ? 'gemini' : 'ollama')));

    if (provider === 'anthropic') {
      result = await callAnthropic(systemPrompt, userPrompt, options);
    } else if (provider === 'gemini') {
      result = await callGemini(systemPrompt, userPrompt, options);
    } else if (provider === 'openai') {
      result = await callOpenAI(systemPrompt, userPrompt, options);
    } else if (provider === 'ollama') {
      result = await callOllama(systemPrompt, userPrompt, options);
    } else {
      throw new Error('NO_AI_AVAILABLE');
    }

    const elapsed = Date.now() - start;
    return { 
      ok: true, 
      text: result.text, 
      usage: result.usage, 
      generationTimeMs: elapsed,
      provider 
    };
  } catch (err) {
    /**
     * @llm_context
     * intent: Convert hard provider failures into a static but structured fallback payload so
     * downstream steps can continue with visible degraded-mode output.
     * failure_boundaries:
     * - Fallback content is non-authoritative and should be treated as placeholder text.
     * - `isFallback: true` signals caller to skip retries that cannot improve output.
     */
    const fallbackText = getFallbackResponse(systemPrompt, userPrompt);
    
    return {
      ok: true, // We mark ok: true because we have a valid (fallback) string to show
      isFallback: true,
      provider: 'static-mock',
      error: err.message,
      fallback_kind: classifyFallbackKind(err.message),
      text: fallbackText
    };
  }
}

function classifyFallbackKind(message) {
  const normalized = String(message || '').toLowerCase();
  if (normalized.includes('api_key') || normalized.includes('not set')) return 'missing_credentials';
  if (normalized.includes('401') || normalized.includes('403')) return 'auth_error';
  if (normalized.includes('429')) return 'rate_limited';
  if (normalized.includes('timeout') || normalized.includes('econnrefused')) return 'transport_error';
  if (normalized.includes('no_ai_available')) return 'no_provider';
  return 'provider_error';
}

/**
 * Generates a realistic-looking static fallback when no AI is available.
 * Tailors response based on keywords in prompts.
 */
function getFallbackResponse(system, user) {
  const combined = (system + ' ' + user).toLowerCase();
  
  if (combined.includes('json array') && combined.includes('alternative')) {
    // Spark suggestions
    return `["Innovative alternative", "Premium approach", "Industry standard version"]`;
  }
  
  if (combined.includes('friendly question') || combined.includes('conversational')) {
    // Interview question
    return "To better tailor our strategy, could you tell me a bit more about your primary target audience and what their biggest pain point is?";
  }

  if (combined.includes('company profile')) {
    return "# COMPANY PROFILE (AUTO-FALLBACK)\n\nThis is a placeholder profile generated because the AI service is currently unavailable. \n\n**Mission:** To provide exceptional value through industry-leading solutions.\n**Key Strengths:** Innovation, reliability, and customer-centricity.";
  }

  if (combined.includes('brand voice')) {
    return "# BRAND VOICE GUIDE (AUTO-FALLBACK)\n\n**Tone:** Professional, authoritative, yet approachable.\n**Personality:** Expert guide, technical peer, and reliable partner.\n**Vocabulary:** Use precise, action-oriented language.";
  }

  if (combined.includes('audience')) {
    return "# AUDIENCE PERSONA (AUTO-FALLBACK)\n\n**Primary Persona:** The Savvy Decision Maker.\n**Needs:** Efficiency, ROI, clear communication.\n**Barriers:** Budget constraints, time limitations, complex procurement processes.";
  }

  return '[NO AI AVAILABLE] Please enter your content manually here while AI providers are unavailable.';
}

module.exports = { call };
