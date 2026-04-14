'use strict';

function buildOverrideEntry(input = {}) {
  return {
    override_id: String(input.override_id || `override_${Date.now()}`),
    entry_type: 'manual_override_note',
    append_only: true,
    actor_id: String(input.actor_id || 'unknown_actor'),
    rationale: String(input.rationale || '').trim(),
    evidence_refs: Array.isArray(input.evidence_refs) ? input.evidence_refs.slice() : [],
    blockers: Array.isArray(input.blockers) ? input.blockers.slice() : [],
    timestamp: input.timestamp || new Date().toISOString(),
  };
}

function appendOverrideNote(logOrInput, maybeInput) {
  if (Array.isArray(logOrInput)) {
    const entry = buildOverrideEntry(maybeInput || {});
    return [...logOrInput, entry];
  }

  return buildOverrideEntry(logOrInput || {});
}

module.exports = {
  appendOverrideNote,
  buildOverrideEntry,
};
