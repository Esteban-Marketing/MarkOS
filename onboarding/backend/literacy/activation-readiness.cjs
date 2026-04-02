'use strict';

const { resolveRequiredDisciplines } = require('./discipline-selection.cjs');

const DEFAULT_TOP_K_PROBE = 1;
const DEFAULT_MAX_DISCIPLINES = 3;

/**
 * Evaluates literacy readiness for the given seed against live vector-store
 * providers. Uses inline require for vector-store so that test mocks applied
 * via withMockedModule are picked up at call time.
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
  // Inline require so that withMockedModule patches are visible at call time.
  const vectorStore = require('../vector-store-client.cjs');

  if (runtimeConfig) {
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
}

module.exports = { evaluateLiteracyReadiness };
