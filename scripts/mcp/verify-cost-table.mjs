#!/usr/bin/env node
// Phase 202 Plan 10 Task 3: verify lib/markos/mcp/cost-table.cjs MODEL_RATES
// against live Anthropic API. Manual trigger (VALIDATION.md §Manual-Only Verifications).
// Requires ANTHROPIC_API_KEY env.
//
// Exits:
//   0 on success (all models reachable)
//   1 on drift (any model unreachable or 4xx/5xx)
//   0 on no-API-key (dry-run with TODO)

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MODEL_RATES } = require('../../lib/markos/mcp/cost-table.cjs');

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('ANTHROPIC_API_KEY unset — skipping live verification.');
  console.log('TODO: run against production console before marketplace submission.');
  process.exit(0);
}

const anthropicMod = await import('@anthropic-ai/sdk');
const AnthropicCtor = anthropicMod.default || anthropicMod;
const client = new AnthropicCtor({ apiKey: process.env.ANTHROPIC_API_KEY });

const drift = [];
for (const [model, rates] of Object.entries(MODEL_RATES)) {
  try {
    const resp = await client.messages.create({
      model,
      max_tokens: 20,
      messages: [{ role: 'user', content: 'ping' }],
    });
    const { input_tokens = 0, output_tokens = 0 } = resp.usage || {};
    // Anthropic API does not return per-call cost; rates need manual cross-check vs pricing page.
    console.log(
      `OK ${model}: ${input_tokens}+${output_tokens} tokens; ` +
      `documented rates ${rates.input_per_1k}/${rates.output_per_1k} cents per 1k`
    );
  } catch (e) {
    drift.push({ model, error: e.message });
  }
}

if (drift.length > 0) {
  console.error('Drift detected:');
  for (const d of drift) console.error(`  ${d.model}: ${d.error}`);
  process.exit(1);
}
console.log('All MODEL_RATES models reachable.');
console.log('Manually cross-check pricing on https://platform.claude.com/docs/en/about-claude/pricing before marketplace submission.');
