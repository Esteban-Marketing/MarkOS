'use strict';

// Tool: generate_brief. LLM tier (Haiku per cost-table). Parses freeform prompt into structured brief.
// D-15 tenant scope: tenant_id embedded in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', required: ['prompt'], additionalProperties: false,
  properties: { prompt: { type: 'string', minLength: 1, maxLength: 5000 } },
};

const outputSchema = {
  type: 'object', required: ['content', '_usage'], additionalProperties: true,
  properties: {
    content: {
      type: 'array',
      items: {
        type: 'object', required: ['type', 'text'],
        properties: { type: { enum: ['text'] }, text: { type: 'string' } },
      },
    },
    _usage: {
      type: 'object', required: ['input_tokens', 'output_tokens'],
      properties: {
        input_tokens: { type: 'integer', minimum: 0 },
        output_tokens: { type: 'integer', minimum: 0 },
      },
    },
  },
};

async function invokeLLM(prompt, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        channel: 'email',
        audience: 'derived',
        pain: String(prompt).slice(0, 80),
        promise: 'derived',
        brand: 'markos',
        derived_from: 'llm-fallback',
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.generate_brief.model,
    max_tokens: 800,
    system: 'You extract marketing briefs from freeform prompts. Return strict JSON { channel, audience, pain, promise, brand, derived_from }.',
    messages: [{ role: 'user', content: prompt }],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.prompt, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      channel: 'email',
      audience: 'unknown',
      pain: String(args.prompt).slice(0, 80),
      promise: 'unknown',
      brand: 'markos',
      derived_from: 'parse_failed',
    };
  }
  parsed.tenant_id = session.tenant_id; // D-15
  return {
    content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
    _usage: { input_tokens, output_tokens },
  };
}

const descriptor = {
  name: 'generate_brief',
  description: 'Generate a structured marketing brief (channel, audience, pain, promise, brand) from a freeform prompt.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.generate_brief,
  inputSchema, outputSchema, handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
