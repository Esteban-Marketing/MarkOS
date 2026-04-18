'use strict';

// Tool: generate_subject_lines. Haiku LLM. Returns 10 scored subject-line candidates.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['body'],
  additionalProperties: false,
  properties: {
    body: { type: 'string', minLength: 1, maxLength: 10000 },
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

async function invokeLLM(body, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        subjects: Array.from({ length: 10 }, (_, i) => ({
          text: `Subject candidate ${i + 1}`,
          score: 0,
          reasoning: 'llm-fallback',
        })),
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.generate_subject_lines.model,
    max_tokens: 800,
    system:
      'You generate 10 ranked email subject-line candidates for a body. Return strict JSON { subjects: [{ text: string, score: number (0..1), reasoning: string }] } sorted by score desc.',
    messages: [{ role: 'user', content: `Body:\n${body}` }],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"subjects":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.body, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { subjects: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            count: Array.isArray(parsed.subjects) ? parsed.subjects.length : 0,
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
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
  name: 'generate_subject_lines',
  description: 'Return 10 ranked subject-line candidates for a draft body.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.generate_subject_lines,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
