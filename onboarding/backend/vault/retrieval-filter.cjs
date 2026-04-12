'use strict';

/**
 * retrieval-filter.cjs — Pure AND-filter for vault audit entries by discipline and audience tags.
 *
 * ROLEV-02 implementation. Filters audit entries based on discipline and audience_tags.
 * AND semantics: all specified audience_tags must be present in the entry.
 * Empty or missing filter returns all entries unchanged.
 */

/**
 * Apply a pure filter over audit entries by discipline and/or audience_tags.
 *
 * @param {array} entries — Array of audit entry objects
 * @param {object} filter — { discipline?: string, audience_tags?: string[] }
 *   - discipline: entry.discipline must equal this value (case-sensitive)
 *   - audience_tags: entry.audience_tags must include ALL of these values (AND semantics)
 * @returns {array} Filtered entries (new array, original entries not mutated)
 */
function applyFilter(entries, filter = {}) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const { discipline = null, audience_tags: filterTags = null } = filter;

  return entries.filter((entry) => {
    // Discipline filter (if specified)
    if (discipline !== null && entry.discipline !== discipline) {
      return false;
    }

    // Audience tags filter with AND semantics (if specified)
    if (filterTags !== null && Array.isArray(filterTags) && filterTags.length > 0) {
      const entryAudienceTags = Array.isArray(entry.audience_tags) ? entry.audience_tags : [];
      const hasAllTags = filterTags.every((tag) => entryAudienceTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    return true;
  });
}

module.exports = {
  applyFilter,
};
