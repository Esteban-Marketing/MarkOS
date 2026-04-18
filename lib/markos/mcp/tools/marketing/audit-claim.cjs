'use strict';

// Tool: audit_claim. LLM tier (Haiku classifier). Canon-grounded claim verification.
// D-15 tenant scope: tenant_id embedded in output; canon pulled via session.tenant_id.

const { COST_TABLE } = require('../../cost-table.cjs');

const inputSchema = {
  type: 'object', required: ['claim'], additionalProperties: false,
  properties: {
    claim: { type: 'string', minLength: 1, maxLength: 2000 },
    model: { type: 'string', maxLength: 200 },
  },
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

async function loadCanon(supabase, tenant_id, deps) {
  if (deps && deps.loadCanon) return deps.loadCanon(supabase, tenant_id);
  try {
    const { loadPackForTenant } = require('../../../packs/pack-loader.cjs');
    if (typeof loadPackForTenant === 'function') {
      const pack = await loadPackForTenant(supabase, tenant_id);
      return pack.canon || [];
    }
    return [];
  } catch { return []; }
}

async function runClassifier(claim, canon, deps) {
  const llm = deps.llm;
  if (!llm) {
    return { supported: false, confidence: 0.0, evidence: [], input_tokens: 0, output_tokens: 0 };
  }
  const sys = 'You are a claim auditor. Given a claim and canon evidence, return strict JSON { supported: boolean, confidence: number (0..1), evidence: [{ source, quote, score }] }.';
  const canonSummary = (canon || [])
    .slice(0, 5)
    .map((c, i) => `[${i + 1}] ${c.title || c.source || ''}: ${(c.text || c.content || '').slice(0, 500)}`)
    .join('\n');
  const user = `Claim: ${claim}\nCanon:\n${canonSummary}`;
  const resp = await llm.messages.create({
    model: COST_TABLE.audit_claim.model,
    max_tokens: 600,
    system: sys,
    messages: [{ role: 'user', content: user }],
  });
  let parsed;
  try {
    parsed = JSON.parse((resp.content && resp.content[0] && resp.content[0].text) || '{}');
  } catch {
    parsed = { supported: false, confidence: 0.0, evidence: [] };
  }
  return {
    supported: parsed.supported === true,
    confidence: Number(parsed.confidence) || 0,
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    input_tokens: (resp.usage && resp.usage.input_tokens) || 0,
    output_tokens: (resp.usage && resp.usage.output_tokens) || 0,
  };
}

async function handler(ctx) {
  const { args, session, supabase } = ctx;
  const deps = ctx.deps || {};
  const canon = await loadCanon(supabase, session.tenant_id, deps); // D-15
  const result = await runClassifier(args.claim, canon, deps);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        claim: args.claim,
        tenant_id: session.tenant_id, // D-15
        supported: result.supported,
        confidence: result.confidence,
        evidence: result.evidence,
      }, null, 2),
    }],
    _usage: { input_tokens: result.input_tokens, output_tokens: result.output_tokens },
  };
}

const descriptor = {
  name: 'audit_claim',
  description: 'Verify whether a marketing claim is supported by canon evidence. Returns { supported, confidence, evidence }.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.audit_claim,
  inputSchema, outputSchema, handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
