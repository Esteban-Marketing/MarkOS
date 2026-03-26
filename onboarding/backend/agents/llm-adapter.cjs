#!/usr/bin/env node
/**
 * llm-adapter.cjs — Unified Multi-Model LLM Call Wrapper
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Single entry point for all LLM calls in the MGSD onboarding pipeline.
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
async function call(systemPrompt, userPrompt, options = {}) {
  try {
    const start = Date.now();
    let result = { text: '', usage: {} };
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
    // If it was explicitly an ollama connection refused error, it means we don't have AI available
    if (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')) {
       return {
         ok: false,
         error: 'NO_AI_AVAILABLE',
         text: `[DRAFT UNAVAILABLE — NO_AI_AVAILABLE]`,
       };
    }
    
    return {
      ok: false,
      error: err.message === 'NO_AI_AVAILABLE' ? 'NO_AI_AVAILABLE' : err.message,
      text: `[DRAFT UNAVAILABLE — ${err.message}]`,
    };
  }
}

module.exports = { call };
