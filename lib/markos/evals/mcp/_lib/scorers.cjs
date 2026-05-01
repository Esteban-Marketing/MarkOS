'use strict';

// Deterministic eval scorers for the Phase 200 MCP tool suites.
// The brand rubric below is pinned from obsidian/brain/Brand Stance.md.

const BRAND_PREFERRED_DEV_VOCAB = Object.freeze([
  'Docs-first',
  'CLI',
  'API',
  'MCP',
  'contracts',
  'migrations',
  'SDK diffs',
  'Open primitives',
  'webhooks',
  'operator',
  'brief',
  'ship',
  'audit',
  'contract',
  'signal',
  'pipeline',
]);

const BRAND_PREFERRED_AI_PHRASES = Object.freeze([
  'first-class substrate',
  'agent',
  'Grounded in your first-party data',
  'Claude',
  'OpenAI',
  'Gemini',
  'human approval',
]);

const BRAND_PREFERRED_REGISTERS = Object.freeze([
  'quietly confident',
  'restraint',
  'precision',
  'Direct',
  'data-dense',
  'professional-conversational',
  'one sentence per claim',
]);

const BRAND_PREFERRED = Object.freeze([
  ...BRAND_PREFERRED_DEV_VOCAB,
  ...BRAND_PREFERRED_AI_PHRASES,
  ...BRAND_PREFERRED_REGISTERS,
]);

const BRAND_ANTI = Object.freeze([
  'revolutionize',
  'elevate',
  'unlock',
  'leverage',
  'delve',
  'intersection',
  'journey',
  'transform',
  'seamless',
  'cutting-edge',
  'AI-powered',
]);

const NEURO_PILLARS = Object.freeze({
  psychological_safety: Object.freeze(['psychological safety', 'safe to ship', 'safe rollout']),
  loss_aversion: Object.freeze(['loss aversion', 'avoid churn', 'avoid drift', 'avoid regression']),
  social_proof: Object.freeze(['social proof', 'peer proof', 'case study', 'benchmark']),
  reciprocity: Object.freeze(['reciprocity', 'give first', 'return the value']),
  anchoring: Object.freeze(['anchoring', 'anchor the price', 'anchor the claim']),
  status: Object.freeze(['status', 'operator-grade', 'peer providers']),
  scarcity: Object.freeze(['scarcity', 'window closes', 'limited window']),
  agency: Object.freeze(['agency', 'you stay in control', 'operator control', 'human approval']),
  identity: Object.freeze(['identity', 'operator', 'developer-native', 'growth-stage']),
});

const ARCHETYPE_TOKENS = Object.freeze({
  'founder-sam': Object.freeze(['founder', 'pipeline', 'approval', 'operator', 'growth-stage']),
  solopreneur: Object.freeze(['solopreneur', 'scrappy', 'time-poor', 'lean', 'solo']),
  'vibe-coder': Object.freeze(['vibe-coder', 'prototype', 'stack', 'API', 'MCP']),
  'agency-ops': Object.freeze(['agency', 'handoff', 'queue', 'retainer', 'client']),
  builder: Object.freeze(['builder', 'ship', 'contracts', 'CLI', 'webhooks']),
  operator: Object.freeze(['operator', 'audit', 'contract', 'human approval', 'data-dense']),
});

function normalizeText(value) {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function toSearchPhrases(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function uniquePush(target, value) {
  if (!value) return;
  if (!target.includes(value)) target.push(value);
}

function collectTextFragments(value, out = []) {
  if (value == null) return out;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) out.push(trimmed);
    return out;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectTextFragments(entry, out);
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === '_usage') continue;
      if (typeof entry === 'string') out.push(entry);
      collectTextFragments(entry, out);
    }
  }
  return out;
}

function collectExactEvidenceIds(value, out = []) {
  if (value == null) return out;
  if (typeof value === 'string') {
    const matches = value.match(/evidence[_-][a-z0-9_-]+/gi) || [];
    for (const match of matches) uniquePush(out, match.toLowerCase());
    return out;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectExactEvidenceIds(entry, out);
    return out;
  }
  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'evidence_id' && typeof entry === 'string') {
        uniquePush(out, entry.toLowerCase());
      }
      if (key === 'evidence_ids' && Array.isArray(entry)) {
        for (const evidenceId of entry) {
          if (typeof evidenceId === 'string') uniquePush(out, evidenceId.toLowerCase());
        }
      }
      collectExactEvidenceIds(entry, out);
    }
  }
  return out;
}

function matchTokens(text, tokens) {
  const haystack = normalizeText(text);
  const matches = [];
  for (const token of tokens) {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken) continue;
    if (haystack.includes(normalizedToken)) matches.push(token);
  }
  return matches;
}

function countMatchesAcrossGroups(text, groups) {
  const hits = [];
  for (const token of groups) {
    const normalizedToken = normalizeText(token);
    if (!normalizedToken) continue;
    if (normalizeText(text).includes(normalizedToken)) hits.push(token);
  }
  return hits;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function preferredCollectionsFromOptions(opts = {}) {
  return {
    dev: opts.dev_vocab || BRAND_PREFERRED_DEV_VOCAB,
    ai: opts.ai_phrases || BRAND_PREFERRED_AI_PHRASES,
    registers: opts.registers || BRAND_PREFERRED_REGISTERS,
    anti: opts.anti || BRAND_ANTI,
  };
}

function scoreWeightedBrandVoice(text, opts = {}) {
  const groups = preferredCollectionsFromOptions(opts);
  const devHits = countMatchesAcrossGroups(text, groups.dev);
  const aiHits = countMatchesAcrossGroups(text, groups.ai);
  const registerHits = countMatchesAcrossGroups(text, groups.registers);
  const antiHits = countMatchesAcrossGroups(text, groups.anti);

  let score = 0;
  score += Math.min(45, devHits.length * 7.5);
  score += Math.min(30, aiHits.length * 10);
  score += Math.min(25, registerHits.length * 8.5);

  if (devHits.length > 0 && aiHits.length > 0 && registerHits.length > 0) {
    score += 5;
  }

  score -= antiHits.length * 15;
  return {
    score: clampScore(score),
    breakdown: {
      dev_hits: devHits,
      ai_hits: aiHits,
      register_hits: registerHits,
      anti_hits: antiHits,
    },
  };
}

function evidenceIdsFromArtifact(artifact) {
  const explicit = collectExactEvidenceIds(artifact);
  if (explicit.length > 0) return explicit;

  const textFragments = collectTextFragments(artifact);
  const fallback = [];
  for (const fragment of textFragments) {
    const matches = fragment.match(/evidence[_-][a-z0-9_-]+/gi) || [];
    for (const match of matches) uniquePush(fallback, match.toLowerCase());
  }
  return fallback;
}

function normalizeEvidenceList(expectedEvidenceIds) {
  return toSearchPhrases(expectedEvidenceIds)
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function resolvePillarAliases(expectedNeuroPillar) {
  const normalized = normalizeText(expectedNeuroPillar);
  if (!normalized) return [];
  if (NEURO_PILLARS[normalized.replace(/\s+/g, '_')]) {
    return NEURO_PILLARS[normalized.replace(/\s+/g, '_')];
  }
  return [normalized];
}

function archetypeSearchTokens(expectedArchetype) {
  const normalized = normalizeText(expectedArchetype);
  if (!normalized) return [];
  return ARCHETYPE_TOKENS[normalized.replace(/\s+/g, '-')] || [normalized];
}

function pillarScoreFromText(text, expectedNeuroPillar) {
  const expectedAliases = resolvePillarAliases(expectedNeuroPillar);
  const expectedHit = expectedAliases.length > 0 && expectedAliases.some((token) => normalizeText(text).includes(normalizeText(token)));
  if (expectedHit) return 55;

  for (const aliases of Object.values(NEURO_PILLARS)) {
    if (aliases.some((token) => normalizeText(text).includes(normalizeText(token)))) {
      return 30;
    }
  }
  return 0;
}

function archetypeScoreFromText(text, expectedArchetype) {
  const tokens = archetypeSearchTokens(expectedArchetype);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => normalizeText(text).includes(normalizeText(token)));
  if (hits.length >= 2) return 30;
  if (hits.length === 1) return 20;
  return 0;
}

function scoringTextFromArtifact(artifact) {
  if (artifact && typeof artifact === 'object' && typeof artifact.scoring_text === 'string') {
    return artifact.scoring_text;
  }
  return collectTextFragments(artifact).join('\n');
}

function buildBrandVoiceDebug(text, opts = {}) {
  const { score, breakdown } = scoreWeightedBrandVoice(text, opts);
  return {
    score,
    preferred_total: BRAND_PREFERRED.length,
    anti_total: BRAND_ANTI.length,
    ...breakdown,
  };
}

function buildClaimCheckDebug(artifact, expectedEvidenceIds) {
  const normalizedExpected = normalizeEvidenceList(expectedEvidenceIds);
  const seenEvidenceIds = evidenceIdsFromArtifact(artifact);
  return {
    expected: normalizedExpected,
    observed: seenEvidenceIds,
    matched: normalizedExpected.filter((id) => seenEvidenceIds.includes(id)),
  };
}

function buildNeuroDebug(text, expectedNeuroPillar, expectedArchetype) {
  return {
    expected_pillar: expectedNeuroPillar || null,
    expected_pillar_aliases: resolvePillarAliases(expectedNeuroPillar),
    expected_archetype: expectedArchetype || null,
    expected_archetype_tokens: archetypeSearchTokens(expectedArchetype),
    text_preview: String(text || '').slice(0, 240),
  };
}

function brandVoiceScore(textOutput, opts = {}) {
  return scoreWeightedBrandVoice(textOutput, opts).score;
}

function claimCheckScore(toolOutput, expectedEvidenceIds) {
  const normalizedExpected = normalizeEvidenceList(expectedEvidenceIds);
  if (normalizedExpected.length === 0) return true;

  const seenEvidenceIds = evidenceIdsFromArtifact(toolOutput);
  return normalizedExpected.some((id) => seenEvidenceIds.includes(id));
}

function neuroSpecScore(toolOutput, expectedNeuroPillar, expectedArchetype) {
  const text = scoringTextFromArtifact(toolOutput);

  const pillarScore = pillarScoreFromText(text, expectedNeuroPillar);
  const archetypeScore = archetypeScoreFromText(text, expectedArchetype);
  const synergy = pillarScore > 0 && archetypeScore > 0 ? 15 : 0;

  return clampScore(pillarScore + archetypeScore + synergy);
}

module.exports = {
  ARCHETYPE_TOKENS,
  BRAND_PREFERRED_DEV_VOCAB,
  BRAND_PREFERRED_AI_PHRASES,
  BRAND_PREFERRED_REGISTERS,
  BRAND_PREFERRED,
  BRAND_ANTI,
  NEURO_PILLARS,
  brandVoiceScore,
  claimCheckScore,
  neuroSpecScore,
  collectTextFragments,
  evidenceIdsFromArtifact,
  scoringTextFromArtifact,
  buildBrandVoiceDebug,
  buildClaimCheckDebug,
  buildNeuroDebug,
};
