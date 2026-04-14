'use strict';

const { normalizeNeuroLiteracyMetadata } = require('./neuro-literacy-schema.cjs');
const { mergeTailoringProfiles } = require('./neuro-literacy-overlay.cjs');

const AUTHORITY_TOKEN = 'MARKOS-REF-NEU-01';
const ALLOWED_ARCHETYPES = Object.freeze(['ruler', 'hero', 'creator', 'sage', 'outlaw', 'caregiver']);
const FUNNEL_STAGES = new Set(['awareness', 'consideration', 'decision', 'onboarding', 'retention']);

function normalizeToken(value) {
  return String(value == null ? '' : value).trim();
}

function uniqueSorted(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map((value) => normalizeToken(value).toLowerCase()).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeArchetypeTags(value) {
  return uniqueSorted(value).filter((entry) => ALLOWED_ARCHETYPES.includes(entry));
}

function normalizeFunnelStage(value) {
  const normalized = normalizeToken(value).toLowerCase();
  if (FUNNEL_STAGES.has(normalized)) return normalized;
  if (normalized === 'cold') return 'awareness';
  if (normalized === 'warm') return 'consideration';
  return 'consideration';
}

function inferArchetypeTags(input = {}) {
  const joined = [
    ...(Array.isArray(input.icp_segment_tags) ? input.icp_segment_tags : []),
    normalizeToken(input.business_model),
  ].join(' ').toLowerCase();

  if (/founder|ceo/.test(joined)) return ['hero'];
  if (/enterprise|compliance|procurement/.test(joined)) return ['ruler'];
  if (/owner|smb|small_business/.test(joined)) return ['caregiver'];
  if (/revops|developer|technical|operator/.test(joined)) return ['sage'];
  return ['sage'];
}

function normalizeIcpSignals(input = {}) {
  const merged = mergeTailoringProfiles({
    company: input.company || {},
    icp: input.icp || {},
    stage: input.stage || {},
  });

  const normalizedMeta = normalizeNeuroLiteracyMetadata({
    ...merged,
    ...input,
    ...(input.icp || {}),
    ...(input.stage || {}),
  });

  const discipline = normalizeToken(input.discipline) || 'Paid_Media';
  const business_model = normalizeToken(input.business_model || input.businessModel || input.company?.business_model || '');
  const tenant_scope = normalizeToken(input.tenant_scope || input.tenantId || input.claims?.tenantId || 'global') || 'global';
  const funnel_stage = normalizeFunnelStage(input.funnel_stage || input.stage?.funnel_stage || input.stage_name);
  const archetype_tags = normalizeArchetypeTags([...(normalizedMeta.archetype_tags || []), ...((input.icp && input.icp.archetype_tags) || [])]);
  const finalArchetypes = archetype_tags.length > 0 ? archetype_tags : inferArchetypeTags({ ...normalizedMeta, business_model });

  return {
    authority_token: AUTHORITY_TOKEN,
    discipline,
    business_model,
    tenant_scope,
    funnel_stage,
    pain_point_tags: normalizedMeta.pain_point_tags || [],
    desired_outcome_tags: normalizedMeta.desired_outcome_tags || [],
    objection_tags: normalizedMeta.objection_tags || [],
    trust_driver_tags: normalizedMeta.trust_driver_tags || [],
    trust_blocker_tags: normalizedMeta.trust_blocker_tags || [],
    emotional_state_tags: normalizedMeta.emotional_state_tags || [],
    neuro_trigger_tags: normalizedMeta.neuro_trigger_tags || [],
    archetype_tags: finalArchetypes,
    naturality_tags: normalizedMeta.naturality_tags || [],
    icp_segment_tags: normalizedMeta.icp_segment_tags || [],
    company_tailoring_profile: merged.company_tailoring_profile || {},
    icp_tailoring_profile: merged.icp_tailoring_profile || {},
    stage_tailoring_profile: merged.stage_tailoring_profile || {},
    layer_order: Array.isArray(merged.layer_order) ? merged.layer_order.slice() : ['company', 'icp', 'stage'],
    neuro_profile: {
      ...(normalizedMeta.neuro_profile || {}),
      trigger_tags: normalizedMeta.neuro_trigger_tags || [],
      evidence_required: true,
      manipulation_blocked: true,
    },
  };
}

module.exports = {
  AUTHORITY_TOKEN,
  ALLOWED_ARCHETYPES,
  FUNNEL_STAGES,
  normalizeArchetypeTags,
  normalizeFunnelStage,
  normalizeIcpSignals,
};
