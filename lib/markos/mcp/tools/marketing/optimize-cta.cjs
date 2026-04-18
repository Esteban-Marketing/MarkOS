'use strict';

// Tool: optimize_cta. Haiku LLM. Returns CTA alternatives ranked by predicted lift.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['draft'],
  additionalProperties: false,
  properties: {
    draft: { type: 'string', minLength: 1, maxLength: 10000 },
  },
};

const outputSchema = {
  type: 'object',
  required: ['content', '_usage'],
  additionalProperties: true,
  properties: {
    content: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'text'],
        properties: { type: { enum: ['text'] }, text: { type: 'string' } },
      },
    },
    _usage: {
      type: 'object',
      required: ['input_tokens', 'output_tokens'],
      properties: {
        input_tokens: { type: 'integer', minimum: 0 },
        output_tokens: { type: 'integer', minimum: 0 },
      },
    },
  },
};

async function invokeLLM(draft, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        alternatives: [
          { cta: 'Learn more', predicted_lift: 0, source: 'llm-fallback' },
          { cta: 'Get started', predicted_lift: 0, source: 'llm-fallback' },
          { cta: 'Try it free', predicted_lift: 0, source: 'llm-fallback' },
        ],
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.optimize_cta.model,
    max_tokens: 800,
    system:
      'You generate ranked CTA alternatives for a marketing draft. Return strict JSON { alternatives: [{ cta: string, predicted_lift: number (0..1), source: string }] } sorted by predicted_lift desc.',
    messages: [{ role: 'user', content: `Draft:\n${draft}` }],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"alternatives":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.draft, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { alternatives: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            count: Array.isArray(parsed.alternatives) ? parsed.alternatives.length : 0,
            alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
          },
          null,
          2,
        ),
      },
    ],
    _usage: { input_tokens, output_tokens },
  };
}

const descriptor = {
  name: 'optimize_cta',
  description:
    'Return alternative CTA options for a marketing draft, ranked by predicted click-weight heuristic.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.optimize_cta,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
