'use strict';

// Tool: clone_persona_voice. Sonnet LLM. Returns voice-cloned draft + voice markers.
// D-15 tenant scope: archetype/persona loaded via session.tenant_id; tenant_id echoed in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['persona_slug', 'topic'],
  additionalProperties: false,
  properties: {
    persona_slug: { type: 'string', minLength: 1, maxLength: 200 },
    topic: { type: 'string', minLength: 1, maxLength: 1000 },
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

async function loadPersona(supabase, tenant_id, persona_slug, deps) {
  if (deps && deps.loadPersona) return deps.loadPersona(supabase, tenant_id, persona_slug);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      const pack = await loadPackForTenant(supabase, tenant_id);
      const found = (pack.archetypes || []).find((a) => (a.slug || a.name) === persona_slug);
      return found || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function invokeLLM(topic, persona, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({
        cloned_draft: `[${persona?.slug || 'persona'}] ${topic}`,
        voice_markers: ['llm-fallback'],
      }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const resp = await llm.messages.create({
    model: COST_TABLE.clone_persona_voice.model,
    max_tokens: 1200,
    system:
      'You clone a persona voice. Given persona attributes and a topic, return strict JSON { cloned_draft: string, voice_markers: [string] }.',
    messages: [
      {
        role: 'user',
        content: `Persona: ${JSON.stringify(persona || {})}\nTopic: ${topic}`,
      },
    ],
  });
  return {
    text: (resp.content && resp.content[0] && resp.content[0].text) || '{}',
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const persona = await loadPersona(supabase, session.tenant_id, args.persona_slug, deps); // D-15
  const { text, input_tokens, output_tokens } = await invokeLLM(args.topic, persona, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { cloned_draft: args.topic, voice_markers: ['parse_failed'] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            persona_slug: args.persona_slug,
            cloned_draft: parsed.cloned_draft || '',
            voice_markers: Array.isArray(parsed.voice_markers) ? parsed.voice_markers : [],
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
  name: 'clone_persona_voice',
  description:
    'Given a persona archetype + topic, return a voice-cloned draft with voice markers.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.clone_persona_voice,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
