'use strict';

const { buildTailoredFixture, buildGenericOutputFixture } = require('../../phase-99/fixtures/generic-vs-tailored-fixtures.cjs');

function buildPremiumQualityFixture(overrides = {}) {
  const base = buildTailoredFixture();
  return {
    ...base,
    draft: 'Revenue operators need proof they can trust. This draft names the call objections, shows the pipeline friction causing stalls, and gives a concrete next step for reducing manual follow-up without hype.',
    candidate: {
      provider: 'premium-grounded',
      grounding: 94,
      evidence_sufficiency: 92,
      personalization: 91,
      delta_safety: 90,
      efficiency: 72,
      quality_signals: {
        personalization_depth: 92,
        icp_fit: 91,
        neuro_fit: 84,
        naturality: 88,
        specificity: 90,
        grounded_usefulness: 89,
      },
    },
    previews: [
      {
        artifact_id: 'premium-proof-led-draft',
        evidence: [{ citation: 'case-study-01' }],
        warnings: [],
        contradictions: [],
      },
    ],
    route_trace: [{ step: 'research' }, { step: 'evaluation' }],
    provider_attempts: [{ provider: 'openai', status: 'ok' }],
    ...overrides,
  };
}

function buildBorderlineQualityFixture(overrides = {}) {
  const base = buildPremiumQualityFixture();
  return {
    ...base,
    draft: 'Revenue operators want better growth outcomes and smoother workflows. This draft is okay, but it stays a bit broad and light on specifics.',
    candidate: {
      ...base.candidate,
      provider: 'borderline-review',
      quality_signals: {
        personalization_depth: 82,
        icp_fit: 81,
        neuro_fit: 76,
        naturality: 68,
        specificity: 72,
        grounded_usefulness: 79,
      },
    },
    ...overrides,
  };
}

function buildManipulativeQualityFixture(overrides = {}) {
  const base = buildGenericOutputFixture();
  return {
    ...base,
    draft: 'Trigger dopamine spikes and pressure buyers before they think too hard. Use fear, urgency, and brain-hack language to force action now.',
    candidate: {
      provider: 'manipulative-copy',
      grounding: 61,
      evidence_sufficiency: 40,
      personalization: 52,
      delta_safety: 35,
      efficiency: 80,
      quality_signals: {
        personalization_depth: 45,
        icp_fit: 48,
        neuro_fit: 20,
        naturality: 30,
        specificity: 46,
        grounded_usefulness: 32,
      },
    },
    previews: [
      {
        artifact_id: 'unsafe-neuro-draft',
        evidence: [],
        warnings: ['uses unsupported pressure language'],
        contradictions: ['unsupported persuasion claim'],
      },
    ],
    ...overrides,
  };
}

function buildBaselineRegressionFixture(overrides = {}) {
  const base = buildPremiumQualityFixture();
  return {
    ...base,
    route_trace: [],
    provider_attempts: [],
    baseline_regressions: {
      preview_safe: false,
      provenance_required: false,
      read_safe: true,
      write_disabled: true,
      route_trace_present: false,
      provider_audit_present: false,
    },
    ...overrides,
  };
}

module.exports = {
  buildPremiumQualityFixture,
  buildBorderlineQualityFixture,
  buildManipulativeQualityFixture,
  buildBaselineRegressionFixture,
};
