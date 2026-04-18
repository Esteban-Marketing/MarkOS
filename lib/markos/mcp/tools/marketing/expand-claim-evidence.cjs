'use strict';

// Tool: expand_claim_evidence. Sonnet LLM. Joins claim with canon → returns evidence + strengthening variants.
// D-15 tenant scope: canon loaded via session.tenant_id; tenant_id echoed in output.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object',
  required: ['claim'],
  additionalProperties: false,
  properties: {
    claim: { type: 'string', minLength: 1, maxLength: 2000 },
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

async function loadCanon(supabase, tenant_id, deps) {
  if (deps && deps.loadCanon) return deps.loadCanon(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      const pack = await loadPackForTenant(supabase, tenant_id);
      return pack.canon || [];
    }
    return [];
  } catch {
    return [];
  }
}

async function invokeLLM(claim, canon, deps) {
  const llm = deps.llm;
  if (!llm) {
    return {
      text: JSON.stringify({ canon_evidence: [], strengthening_variants: [] }),
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const canonSummary = (canon || [])
    .slice(0, 5)
    .map((c, i) => `[${i + 1}] ${c.title || c.source || ''}: ${(c.text || c.content || '').slice(0, 500)}`)
    .join('\n');
  const resp = await llm.messages.create({
    model: COST_TABLE.expand_claim_evidence.model,
    max_tokens: 1500,
    system:
      'Given a marketing claim and canon snippets, return strict JSON { canon_evidence: [{ source, quote, relevance }], strengthening_variants: [{ variant, why }] }.',
    messages: [{ role: 'user', content: `Claim: ${claim}\nCanon:\n${canonSummary}` }],
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
  const canon = await loadCanon(supabase, session.tenant_id, deps); // D-15
  const { text, input_tokens, output_tokens } = await invokeLLM(args.claim, canon, deps);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { canon_evidence: [], strengthening_variants: [] };
  }
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            claim: args.claim,
            canon_evidence: Array.isArray(parsed.canon_evidence) ? parsed.canon_evidence : [],
            strengthening_variants: Array.isArray(parsed.strengthening_variants)
              ? parsed.strengthening_variants
              : [],
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
  name: 'expand_claim_evidence',
  description:
    'Given a marketing claim, return supporting canon evidence + suggested strengthening variants.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.expand_claim_evidence,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
