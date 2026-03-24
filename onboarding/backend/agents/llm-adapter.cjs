#!/usr/bin/env node
// llm-adapter.cjs — Unified LLM call wrapper (OpenAI)
// Reads OPENAI_API_KEY from .env or environment.
// mgsd-onboarding v2.0

'use strict';

const path = require('path');

// Load .env from project root (two levels up from onboarding/backend/agents/)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
} catch (e) {
  // dotenv optional — env vars may be set externally
}

const { OpenAI } = require('openai');

let _openai = null;

function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Create a .env file at the project root with:\n  OPENAI_API_KEY=sk-...'
      );
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/**
 * Call the LLM with a system prompt and user prompt.
 * Returns the generated text string.
 *
 * @param {string} systemPrompt  — Tight role + constraints prompt
 * @param {string} userPrompt    — The actual content/context to generate from
 * @param {object} options       — Optional overrides: { model, temperature, max_tokens }
 */
async function call(systemPrompt, userPrompt, options = {}) {
  const model       = options.model       || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.4;
  const max_tokens  = options.max_tokens  || 1200;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    return { ok: true, text };

  } catch (err) {
    // Return structured error so callers can surface placeholder content
    return {
      ok: false,
      error: err.message,
      text: `[DRAFT UNAVAILABLE — ${err.message}]`,
    };
  }
}

module.exports = { call };
