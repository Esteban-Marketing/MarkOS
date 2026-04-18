'use strict';

// Tool: rank_draft_variants. Haiku LLM. Scores N variants → returns ranked list.
// D-15 tenant scope: tenant_id embedded in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['variants'],
  additionalProperties: false,
  properties: {
    variants: {
      type: 'array',
      minItems: 2,
      maxItems: 10,
      items: { type: 'string', minLength: 1, maxLength: 10000 },
    },
    brief: { type: 'object', additionalProperties: true },
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

async function invokeLLM(variants, brief, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        ranked: variants.map((v, i) => ({ variant: v, score: 0, rank: i + 1, reasons: ['llm-fallback'] })),
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.rank_draft_variants.model,
    max_tokens: 1000,
    system:
      'You score marketing variants against brand voice, neuro-audit, and claim integrity. Return strict JSON { ranked: [{ variant: string, score: number (0..1), rank: integer, reasons: [string] }] } sorted by score desc.',
    messages: [
      {
        role: 'user',
        content: `Brief: ${JSON.stringify(brief || {})}\nVariants:\n${variants
          .map((v, i) => `[${i + 1}] ${v}`)
          .join('\n')}`,
      },
    ],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"ranked":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.variants, args.brief, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      ranked: args.variants.map((v, i) => ({
        variant: v,
        score: 0,
        rank: i + 1,
        reasons: ['parse_failed'],
      })),
    };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            count: Array.isArray(parsed.ranked) ? parsed.ranked.length : 0,
            ranked: Array.isArray(parsed.ranked) ? parsed.ranked : [],
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
  name: 'rank_draft_variants',
  description:
    'Score N drafts (2..10) against brand voice + neuro-audit + claim-check. Returns a ranked list.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.rank_draft_variants,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
