'use strict';

// Tool: remix_draft. Sonnet LLM. Produces N remixed variants per a directive.
// D-15 tenant scope: tenant_id embedded in output JSON.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['draft', 'directive'],
  additionalProperties: false,
  properties: {
    draft: { type: 'string', minLength: 1, maxLength: 10000 },
    directive: { type: 'string', minLength: 1, maxLength: 500 },
    variants: { type: 'integer', minimum: 1, maximum: 5 },
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

async function invokeLLM(draft, directive, variants, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({ variants: [{ remixed: draft, why: 'llm-fallback' }] }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.remix_draft.model,
    max_tokens: 1500,
    system:
      'You remix a marketing draft per a directive. Return strict JSON { variants: [{ remixed: string, why: string }] }.',
    messages: [
      {
        role: 'user',
        content: `Directive: ${directive}\nVariants: ${variants || 3}\nDraft:\n${draft}`,
      },
    ],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"variants":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(
    args.draft,
    args.directive,
    args.variants,
    deps,
  );
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { variants: [{ remixed: args.draft, why: 'parse_failed' }] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            directive: args.directive,
            variants: Array.isArray(parsed.variants) ? parsed.variants : [],
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
  name: 'remix_draft',
  description:
    'Remix a marketing draft per a directive (e.g. "shorter", "more formal", "different angle"). Returns N variants.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.remix_draft,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
