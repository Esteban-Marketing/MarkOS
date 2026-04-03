'use strict';

const { rankDisciplines } = require('../agents/discipline-router.cjs');
const { recordDisciplineActivationEvidence } = require('../mir-lineage.cjs');

const DEFAULT_DISCIPLINE_FALLBACK = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email'];

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function buildMirInputs(seed) {
  return {
    business_model: seed && seed.company ? seed.company.business_model || null : null,
    pain_points: seed && seed.audience ? uniqueStrings(seed.audience.pain_points) : [],
    active_channels: seed && seed.content ? uniqueStrings(seed.content.active_channels) : [],
  };
}

function buildSelectedRationale(discipline) {
  return `${discipline} selected because purchased service context authorizes activation and MIR inputs support execution.`;
}

function buildUnselectedRationale(discipline) {
  return `${discipline} remains unselected because service context does not include a purchased service for activation.`;
}

/**
 * Returns up to 5 ordered disciplines most relevant to the seed.
 * Falls back to DEFAULT_DISCIPLINE_FALLBACK when ranking is unavailable.
 *
 * @param {object} seed - onboarding seed object
 * @returns {string[]} ordered discipline list
 */
function resolveRequiredDisciplines(seed) {
  try {
    const ranked = rankDisciplines(seed);
    if (Array.isArray(ranked) && ranked.length > 0) {
      return ranked;
    }
    return [...DEFAULT_DISCIPLINE_FALLBACK];
  } catch {
    return [...DEFAULT_DISCIPLINE_FALLBACK];
  }
}

function selectDisciplinesForActivation(seed, options = {}) {
  const gate1Readiness = options.gate1Readiness || { readiness: 'ready', missing_entities: [] };
  if (gate1Readiness.readiness !== 'ready') {
    throw new Error(`MIR Gate 1 blocked: ${(gate1Readiness.missing_entities || []).join(', ')}`);
  }

  const serviceContext = options.serviceContext;
  if (!serviceContext || !Array.isArray(serviceContext.purchased_disciplines)) {
    throw new Error('service context with purchased disciplines is required for activation');
  }

  const purchasedDisciplines = uniqueStrings(serviceContext.purchased_disciplines);
  const previousDisciplines = uniqueStrings(serviceContext.previous_disciplines);
  const deactivationRationaleByDiscipline = serviceContext.deactivation_rationale_by_discipline || {};
  const orderedDisciplines = uniqueStrings([
    ...resolveRequiredDisciplines(seed),
    ...purchasedDisciplines,
    ...previousDisciplines,
  ]);
  const mirInputs = buildMirInputs(seed);
  const selectedDisciplines = [];
  const unselectedDisciplines = [];

  for (const discipline of orderedDisciplines) {
    const selected = purchasedDisciplines.includes(discipline);
    const deactivationRationale = deactivationRationaleByDiscipline[discipline];
    const rationale = selected
      ? buildSelectedRationale(discipline)
      : buildUnselectedRationale(discipline);
    const evidence = recordDisciplineActivationEvidence({
      tenantId: options.tenantId || serviceContext.tenant_id,
      projectSlug: options.projectSlug || serviceContext.project_slug,
      discipline,
      selected,
      rationale,
      deactivationRationale,
      mirInputs,
      serviceContext: {
        purchased_disciplines: purchasedDisciplines,
        previous_disciplines: previousDisciplines,
      },
      runId: options.runId,
      persistence: options.persistence,
      recordedAt: options.recordedAt,
    });

    if (selected) {
      selectedDisciplines.push(evidence);
    } else {
      unselectedDisciplines.push(evidence);
    }
  }

  return {
    required_disciplines: orderedDisciplines,
    selected_disciplines: selectedDisciplines,
    unselected_disciplines: unselectedDisciplines,
  };
}

module.exports = {
  DEFAULT_DISCIPLINE_FALLBACK,
  resolveRequiredDisciplines,
  selectDisciplinesForActivation,
};
