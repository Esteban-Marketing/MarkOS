'use strict';

// Tool: generate_preview_text. Haiku LLM. Returns 5 preview-text candidates for email subject+body.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['subject', 'body'],
  additionalProperties: false,
  properties: {
    subject: { type: 'string', minLength: 1, maxLength: 500 },
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

async function invokeLLM(subject, body, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        previews: Array.from({ length: 5 }, (_, i) => ({
          text: `Preview ${i + 1}`,
          score: 0,
        })),
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.generate_preview_text.model,
    max_tokens: 500,
    system:
      'You generate 5 ranked email preview-text candidates for a subject + body. Return strict JSON { previews: [{ text: string, score: number (0..1) }] } sorted by score desc.',
    messages: [{ role: 'user', content: `Subject: ${subject}\nBody:\n${body}` }],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"previews":[]}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.subject, args.body, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { previews: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            subject: args.subject,
            count: Array.isArray(parsed.previews) ? parsed.previews.length : 0,
            previews: Array.isArray(parsed.previews) ? parsed.previews : [],
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
  name: 'generate_preview_text',
  description:
    'Return 5 ranked email preview-text candidates for a subject + body pair.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.generate_preview_text,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
