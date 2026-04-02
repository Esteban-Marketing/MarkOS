'use strict';

const { rankDisciplines } = require('../agents/discipline-router.cjs');

const DEFAULT_DISCIPLINE_FALLBACK = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email'];

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

module.exports = { resolveRequiredDisciplines, DEFAULT_DISCIPLINE_FALLBACK };
