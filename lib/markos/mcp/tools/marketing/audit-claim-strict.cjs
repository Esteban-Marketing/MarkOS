'use strict';

// Tool: audit_claim_strict. Sonnet LLM. Stricter claim auditor — forces canon cite + confidence.
// D-15 tenant scope: canon loaded via session.tenant_id; tenant_id echoed in output.
// Unlike audit_claim (Haiku, lenient), this one is Sonnet and requires at least
// one evidence row — the fallback path provides a default placeholder so schema
// validation still passes for the degraded case.

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

async function runClassifier(claim, canon, deps) {
  const llm = deps.llm;
  if (!llm) {
    // Fallback: supported=false, confidence=0, minimal-placeholder evidence row.
    // Downstream strict mode will report the claim as unsupported.
    return {
      supported: false,
      confidence: 0,
      evidence: [{ source: 'canon-unavailable', quote: 'llm-fallback', score: 0 }],
      input_tokens: 0,
      output_tokens: 0,
    };
  }
  const canonSummary = (canon || [])
    .slice(0, 8)
    .map((c, i) => `[${i + 1}] ${c.title || c.source || ''}: ${(c.text || c.content || '').slice(0, 600)}`)
    .join('\n');
  const resp = await llm.messages.create({
    model: COST_TABLE.audit_claim_strict.model,
    max_tokens: 1000,
    system:
      'You are a STRICT claim auditor. You MUST cite at least one canon source with a direct quote. Return strict JSON { supported: boolean, confidence: number (0..1), evidence: [{ source: string, quote: string, score: number }] } — evidence array MUST contain at least 1 entry.',
    messages: [{ role: 'user', content: `Claim: ${claim}\nCanon:\n${canonSummary}` }],
  });
  let parsed;
  try {
    parsed = JSON.parse((resp.content && resp.content[0] && resp.content[0].text) || '{}');
  } catch {
    parsed = { supported: false, confidence: 0, evidence: [] };
  }
  const evidence = Array.isArray(parsed.evidence) && parsed.evidence.length > 0
    ? parsed.evidence
    : [{ source: 'unclassified', quote: 'no_evidence_returned', score: 0 }];
  return {
    supported: parsed.supported === true,
    confidence: Number(parsed.confidence) || 0,
    evidence,
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
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tenant_id: session.tenant_id, // D-15
            claim: args.claim,
            supported: result.supported,
            confidence: result.confidence,
            evidence: result.evidence,
            strict: true,
          },
          null,
          2,
        ),
      },
    ],
    _usage: { input_tokens: result.input_tokens, output_tokens: result.output_tokens },
  };
}

const descriptor = {
  name: 'audit_claim_strict',
  description:
    'Strict claim auditor — Sonnet-powered; forces at least one canon citation + confidence score.',
  latency_tier: 'llm',
  mutating: false,
  cost_model: COST_TABLE.audit_claim_strict,
  inputSchema,
  outputSchema,
  handler,
};

module.exports = { descriptor, inputSchema, outputSchema, handler };
