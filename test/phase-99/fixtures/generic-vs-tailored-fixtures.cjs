'use strict';

const { createContextPack } = require('../../../onboarding/backend/research/context-pack-contract.cjs');
const { createIcpRecommendation } = require('../../../onboarding/backend/research/icp-recommendation-contract.cjs');

function buildTailoredFixture(overrides = {}) {
  const contextPack = createContextPack({
    summary: 'Revenue operators need proof-led messaging that matches the ICP pain and trust posture.',
    findings: [
      {
        claim: 'Revenue ops teams distrust vague AI promises and want concrete workflow proof.',
        confidence: 'high',
        implication: 'Lead with precision, peer proof, and the operational cost of staying generic.',
      },
    ],
    tailoring_signals: {
      pain_point_tags: ['generic_pipeline_copy', 'slow_revenue_cycles'],
      desired_outcome_tags: ['predictable_pipeline', 'proof_led_growth'],
      objection_tags: ['sounds_like_every_agency', 'no_real_operator_proof'],
      trust_driver_tags: ['peer_case_proof', 'operator_specific_language'],
      trust_blocker_tags: ['template_language'],
      emotional_state_tags: ['skeptical', 'overextended'],
      neuro_trigger_tags: ['B04'],
      naturality_tags: ['plainspoken', 'specific'],
      company_tailoring_profile: { category: 'b2b_saas' },
      icp_tailoring_profile: { label: 'revenue_operators' },
      stage_tailoring_profile: { funnel_stage: 'consideration' },
    },
  });

  const reasoning = createIcpRecommendation({
    confidence_flag: 'high',
    candidate_shortlist: [
      {
        overlay_key: 'revenue-operators',
        candidate_id: 'revenue-operators-1',
        score: 92,
        confidence: 'high',
        primary_trigger: 'B04',
        archetype: 'sage',
        retrieval_filters: { tenant_scope: 'markos', stage: 'consideration' },
        matched_signals: {
          pain_points: ['generic_pipeline_copy'],
          trust_drivers: ['peer_case_proof'],
          objections: ['sounds_like_every_agency'],
        },
        why_it_fits_summary: 'Revenue operators respond to specific proof and operational clarity, not polished template language.',
      },
      {
        overlay_key: 'general-growth',
        candidate_id: 'general-growth-2',
        score: 71,
        confidence: 'medium',
        primary_trigger: 'B07',
        archetype: 'hero',
        retrieval_filters: { tenant_scope: 'markos', stage: 'consideration' },
        matched_signals: { pain_points: ['slow_revenue_cycles'] },
        why_it_fits_summary: 'Broad growth framing can work, but it is less exact for this ICP.',
      },
    ],
    winner: {
      overlay_key: 'revenue-operators',
      candidate_id: 'revenue-operators-1',
      score: 92,
      confidence: 'high',
      primary_trigger: 'B04',
      archetype: 'sage',
      retrieval_filters: { tenant_scope: 'markos', stage: 'consideration' },
      matched_signals: {
        pain_points: ['generic_pipeline_copy'],
        trust_drivers: ['peer_case_proof'],
        objections: ['sounds_like_every_agency'],
      },
      why_it_fits_summary: 'Revenue operators respond to specific proof and operational clarity, not polished template language.',
    },
    explanation: {
      summary: 'The governed winner keeps the message anchored to the ICP pain, peer proof, and low-hype naturality posture.',
      runner_up_reason: 'The backup angle is less specific to the operator audience.',
      uncertainty: [],
    },
    input: { tenant: 'markos', phase: 99 },
  });

  return {
    contextPack,
    reasoning,
    draft: 'Revenue operators do not need another AI promise. They need proof that the pipeline story matches the real objections prospects raise on live calls.',
    review: {
      status: 'passed',
      blocking_reasons: [],
      required_fixes: [],
    },
    ...overrides,
  };
}

function buildGenericOutputFixture(overrides = {}) {
  const tailored = buildTailoredFixture();
  return {
    ...tailored,
    draft: 'In today\'s fast-paced digital world, every business needs innovative solutions that unlock growth, save time, and empower success at scale.',
    review: {
      status: 'rewrite_required',
      blocking_reasons: [
        { code: 'GENERIC_OUTPUT_BLOCKED', detail: 'The draft sounds template-like and could fit any audience.' },
      ],
      required_fixes: [
        'Name the ICP pain in the opening.',
        'Replace vague claims with concrete operator proof.',
      ],
    },
    ...overrides,
  };
}

function buildMissingContractFixture() {
  const fixture = buildTailoredFixture();
  delete fixture.reasoning.winner.overlay_key;
  delete fixture.reasoning.winner.primary_trigger;
  fixture.contextPack.tailoring_signals.pain_point_tags = [];
  return fixture;
}

module.exports = {
  buildTailoredFixture,
  buildGenericOutputFixture,
  buildMissingContractFixture,
};
