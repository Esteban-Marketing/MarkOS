'use strict';

// Tool: generate_channel_copy. Sonnet LLM. Produces channel-ready blocks per channel.
// D-15 tenant scope.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['channel', 'brief'],
  additionalProperties: false,
  properties: {
    channel: { type: 'string', enum: ['email', 'x', 'linkedin', 'sms'] },
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

async function invokeLLM(channel, brief, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        blocks: {
          subject: channel === 'email' ? 'Placeholder subject' : null,
          preview: channel === 'email' ? 'Placeholder preview' : null,
          body: 'llm-fallback body',
          cta: 'Learn more',
        },
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.generate_channel_copy.model,
    max_tokens: 1500,
    system:
      'You produce channel-ready marketing copy. Return strict JSON { blocks: { subject?: string, preview?: string, body: string, cta: string } } appropriate to the channel.',
    messages: [
      {
        role: 'user',
        content: `Channel: ${channel}\nBrief: ${JSON.stringify(brief)}`,
      },
    ],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{"blocks":{}}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session } = ctx;
  const deps = ctx.deps || {};
  const { text, input_tokens, output_tokens } = await invokeLLM(args.channel, args.brief || {}, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { blocks: { body: 'parse_failed', cta: '' } };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            channel: args.channel,
            blocks: parsed.blocks || {},
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
  name: 'generate_channel_copy',
  description:
    'Produce channel-ready blocks (subject + preview + body + CTA where applicable) for a specific channel + brief.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.generate_channel_copy,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
