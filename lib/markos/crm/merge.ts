import type { Stats } from 'node:fs';

'use strict';

function ensureStore(store) {
  if (!store || typeof store !== 'object') {
    throw new Error('CRM_STORE_REQUIRED');
  }
  if (!Array.isArray(store.mergeDecisions)) {
    store.mergeDecisions = [];
  }
  if (!Array.isArray(store.mergeLineage)) {
    store.mergeLineage = [];
  }
  if (!Array.isArray(store.entities)) {
    store.entities = [];
  }
  return store;
}

function normalizeDecisionState(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!['accepted', 'rejected'].includes(normalized)) {
    throw new Error('CRM_MERGE_DECISION_INVALID:decision_state');
  }
  return normalized;
}

function recordMergeDecision(store, input) {
  const targetStore = ensureStore(store);
  const decisionState = normalizeDecisionState(input.decision_state);
  const decision = Object.freeze({
    merge_decision_id: String(input.merge_decision_id || `merge-decision-${targetStore.mergeDecisions.length + 1}`),
    tenant_id: String(input.tenant_id || '').trim(),
    canonical_record_kind: String(input.canonical_record_kind || '').trim(),
    canonical_record_id: String(input.canonical_record_id || '').trim(),
    decision_state: decisionState,
    confidence: Number(Number(input.confidence || 0).toFixed(2)),
    rationale: input.rationale ? String(input.rationale).trim() : null,
    reviewer_actor_id: String(input.reviewer_actor_id || '').trim(),
    source_event_ref: String(input.source_event_ref || '').trim(),
    source_record_refs: Object.freeze((input.source_record_refs || []).map((row) => Object.freeze({ ...row }))),
    created_at: new Date(input.created_at || Date.now()).toISOString(),
  });
  if (!decision.tenant_id || !decision.canonical_record_kind || !decision.canonical_record_id || !decision.reviewer_actor_id || !decision.source_event_ref || decision.source_record_refs.length === 0) {
    throw new Error('CRM_MERGE_DECISION_INVALID');
  }
  targetStore.mergeDecisions.push(decision);
  for (const row of decision.source_record_refs) {
    targetStore.mergeLineage.push(Object.freeze({
      lineage_id: `${decision.merge_decision_id}:${row.source_record_id}`,
      merge_decision_id: decision.merge_decision_id,
      tenant_id: decision.tenant_id,
      source_record_kind: row.source_record_kind,
      source_record_id: row.source_record_id,
      canonical_record_kind: decision.canonical_record_kind,
      canonical_record_id: decision.canonical_record_id,
      recorded_at: decision.created_at,
    }));
  }
  return decision;
}

function applyApprovedMerge(store, input) {
  const targetStore = ensureStore(store);
  const decision = recordMergeDecision(targetStore, {
    ...input,
    decision_state: 'accepted',
  });
  for (const sourceRef of decision.source_record_refs) {
    const index = targetStore.entities.findIndex((row) => row.entity_id === sourceRef.source_record_id && row.tenant_id === decision.tenant_id);
    if (index >= 0) {
      const row = targetStore.entities[index];
      targetStore.entities.splice(index, 1, Object.freeze({
        ...row,
        status: 'merged',
        merged_into: decision.canonical_record_id,
        updated_at: new Date().toISOString(),
      }));
    }
  }
  return decision;
}

module.exports = {
  recordMergeDecision,
  applyApprovedMerge,
};
