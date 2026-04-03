'use strict';

const { resolveRequiredDisciplines } = require('./discipline-selection.cjs');
const {
  computeMissingGate1Entities,
  recordGate1Initialization,
} = require('../mir-lineage.cjs');

const DEFAULT_TOP_K_PROBE = 1;
const DEFAULT_MAX_DISCIPLINES = 3;

function evaluateActivationReadiness({ seed, gate1Snapshot, persistence, runId } = {}) {
  const snapshot = gate1Snapshot || {};
  const entityStatus = snapshot.entity_status || {};
  const initializationSnapshot = recordGate1Initialization({
    tenantId: snapshot.tenant_id,
    projectSlug: snapshot.project_slug,
    entityStatus,
    sourceReferences: snapshot.source_references,
    initializedAt: snapshot.initialized_at,
    runId,
    persistence,
  });
  const missingEntities = computeMissingGate1Entities(entityStatus);

  return {
    readiness: missingEntities.length === 0 ? 'ready' : 'blocked',
    gate1_status: missingEntities.length === 0 ? 'ready' : 'blocked',
    missing_entities: missingEntities,
    initialization_snapshot: initializationSnapshot,
    reason: missingEntities.length === 0
      ? 'MIR Gate 1 ready for MSP activation.'
      : `MIR Gate 1 blocked until required entities are complete: ${missingEntities.join(', ')}`,
    seed: seed || null,
  };
}

/**
 * Evaluates literacy readiness for the given seed against live vector-store
 * providers. Uses inline require for vector-store so that test mocks applied
 * via withMockedModule are picked up at call time.
 *
 * Returns `unconfigured` gracefully if providers are not set up or any
 * unexpected error occurs (LIT-13 graceful-degradation requirement).
 *
 * @param {object} seed - onboarding seed
 * @param {object|null} [runtimeConfig] - optional config forwarded to vectorStore.configure()
 * @param {{ maxDisciplines?: number }} [options]
 * @returns {Promise<{
 *   readiness: 'ready' | 'partial' | 'unconfigured',
 *   disciplines_available: string[],
 *   gaps: string[],
 *   required_disciplines: string[]
 * }>}
 */
async function evaluateLiteracyReadiness(seed, runtimeConfig, options = {}) {
  try {
    if (options.gate1Snapshot) {
      const activationReadiness = evaluateActivationReadiness({
        seed,
        gate1Snapshot: options.gate1Snapshot,
        persistence: options.persistence,
        runId: options.runId,
      });

      if (activationReadiness.readiness === 'blocked') {
        return {
          readiness: 'blocked',
          disciplines_available: [],
          gaps: [],
          required_disciplines: [],
          gate1_status: activationReadiness.gate1_status,
          missing_entities: activationReadiness.missing_entities,
          initialization_snapshot: activationReadiness.initialization_snapshot,
          reason: activationReadiness.reason,
        };
      }
    }

    // Inline require so that withMockedModule patches are visible at call time.
    const vectorStore = require('../vector-store-client.cjs');

    if (runtimeConfig && typeof vectorStore.configure === 'function') {
      vectorStore.configure(runtimeConfig);
    }

    const health = await vectorStore.healthCheck();

    if (!health.ok) {
      return {
        readiness: 'unconfigured',
        disciplines_available: [],
        gaps: [],
        required_disciplines: [],
      };
    }

    const maxDisciplines = (options && options.maxDisciplines) || DEFAULT_MAX_DISCIPLINES;
    const required = resolveRequiredDisciplines(seed).slice(0, maxDisciplines);

    const probeResults = await Promise.all(
      required.map(async (discipline) => {
        const results = await vectorStore.getLiteracyContext(discipline, 'health', {}, DEFAULT_TOP_K_PROBE);
        return { discipline, hasContent: Array.isArray(results) && results.length > 0 };
      })
    );

    const disciplines_available = probeResults.filter((r) => r.hasContent).map((r) => r.discipline);
    const gaps = probeResults.filter((r) => !r.hasContent).map((r) => r.discipline);

    const readiness = (gaps.length === 0 && disciplines_available.length > 0) ? 'ready' : 'partial';

    return {
      readiness,
      disciplines_available,
      gaps,
      required_disciplines: required,
    };
  } catch {
    return {
      readiness: 'unconfigured',
      disciplines_available: [],
      gaps: [],
      required_disciplines: [],
    };
  }
}

module.exports = {
  evaluateActivationReadiness,
  evaluateLiteracyReadiness,
};
