'use strict';

const { OVERLAY_DOCS, resolveBusinessModelFamily } = require('./template-family-map.cjs');

const STAGE_TRIGGER_MAP = Object.freeze({
  awareness: ['B05', 'B07'],
  consideration: ['B03', 'B04'],
  decision: ['B02', 'B04', 'B06'],
  onboarding: ['B01', 'B08', 'B10'],
  retention: ['B03', 'B08', 'B01'],
});

function normalizeToken(value) {
  return String(value == null ? '' : value).trim();
}

function uniqueSorted(values = []) {
  return Array.from(new Set((Array.isArray(values) ? values : [values]).map((value) => normalizeToken(value)).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
}

function resolvePrimaryOverlayKey(signals = {}) {
  const family = resolveBusinessModelFamily(signals.business_model || '');
  const familySlug = family?.slug || '';
  if (OVERLAY_DOCS[familySlug]) return familySlug;
  if (familySlug === 'services') return 'consulting';
  if (familySlug === 'agency') return 'consulting';
  return 'saas';
}

function buildOverlayPriority(signals = {}) {
  const allKeys = Object.keys(OVERLAY_DOCS);
  const primary = resolvePrimaryOverlayKey(signals);
  return [primary, ...allKeys.filter((entry) => entry !== primary)];
}

function buildIcpCandidates(signals = {}) {
  const overlayKeys = buildOverlayPriority(signals).slice(0, 3);
  const triggers = uniqueSorted([...(signals.neuro_trigger_tags || []), ...((STAGE_TRIGGER_MAP[signals.funnel_stage] || []).slice(0, 2))]).slice(0, 3);
  const archetypes = uniqueSorted((signals.archetype_tags || []).length > 0 ? signals.archetype_tags : ['sage']).slice(0, 2);
  const businessModelList = normalizeToken(signals.business_model) ? [normalizeToken(signals.business_model)] : [];

  const candidates = [];
  for (const overlay_key of overlayKeys) {
    for (const archetype of archetypes) {
      for (const primary_trigger of triggers) {
        candidates.push({
          candidate_id: `${overlay_key}-${archetype}-${primary_trigger}`,
          overlay_key,
          family_slug: overlay_key,
          primary_trigger,
          archetype,
          retrieval_filters: {
            tenant_scope: signals.tenant_scope || 'global',
            business_model: businessModelList,
            pain_point_tags: signals.pain_point_tags || [],
            desired_outcome_tags: signals.desired_outcome_tags || [],
            trust_driver_tags: signals.trust_driver_tags || [],
            objection_tags: signals.objection_tags || [],
            emotional_state_tags: signals.emotional_state_tags || [],
            neuro_trigger_tags: [primary_trigger],
            archetype_tags: [archetype],
            naturality_tags: signals.naturality_tags || [],
            icp_segment_tags: signals.icp_segment_tags || [],
          },
        });

        if (candidates.length >= 6) {
          return candidates.sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));
        }
      }
    }
  }

  return candidates.sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));
}

module.exports = {
  STAGE_TRIGGER_MAP,
  buildIcpCandidates,
  resolvePrimaryOverlayKey,
};
