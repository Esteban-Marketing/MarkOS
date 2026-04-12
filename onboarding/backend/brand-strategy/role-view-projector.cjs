'use strict';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeEvidenceIds(ids) {
  const unique = new Set();
  asArray(ids).forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (trimmed.length > 0) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

function collectLineage(artifact) {
  const ids = [];

  if (artifact.positioning) {
    ids.push(...asArray(artifact.positioning.evidence_node_ids));
  }
  if (artifact.value_promise) {
    ids.push(...asArray(artifact.value_promise.evidence_node_ids));
  }

  asArray(artifact.differentiators).forEach((claim) => {
    ids.push(...asArray(claim && claim.evidence_node_ids));
  });
  asArray(artifact.disallowed_claims).forEach((claim) => {
    ids.push(...asArray(claim && claim.evidence_node_ids));
  });
  asArray(artifact.confidence_notes).forEach((claim) => {
    ids.push(...asArray(claim && claim.evidence_node_ids));
  });
  asArray(artifact.messaging_pillars).forEach((pillar) => {
    asArray(pillar && pillar.claims).forEach((claim) => {
      ids.push(...asArray(claim && claim.evidence_node_ids));
    });
  });

  return normalizeEvidenceIds(ids);
}

function buildSharedEnvelope(synthesized, compiledMessagingRules) {
  const artifact = synthesized.artifact;
  return {
    tenant_id: synthesized.metadata.tenant_id,
    ruleset_version: synthesized.metadata.ruleset_version,
    deterministic_fingerprint: synthesized.metadata.deterministic_fingerprint,
    lineage_root: synthesized.metadata.content_fingerprint || null,
    lineage_evidence_node_ids: collectLineage(artifact),
    strategy_artifact: copy(artifact),
    messaging_rules: copy(compiledMessagingRules),
  };
}

function projectRoleViews(synthesized, compiledMessagingRules) {
  if (!synthesized || typeof synthesized !== 'object' || !synthesized.artifact || !synthesized.metadata) {
    throw new Error('projectRoleViews: synthesized canonical artifact is required');
  }
  if (!compiledMessagingRules || typeof compiledMessagingRules !== 'object') {
    throw new Error('projectRoleViews: compiled messaging rules are required');
  }

  const shared = buildSharedEnvelope(synthesized, compiledMessagingRules);

  return {
    strategist: {
      ...copy(shared),
      role: 'strategist',
      strategy_snapshot: {
        positioning: copy(synthesized.artifact.positioning),
        value_promise: copy(synthesized.artifact.value_promise),
        differentiators: copy(synthesized.artifact.differentiators),
        messaging_pillars: copy(synthesized.artifact.messaging_pillars),
        confidence_notes: copy(synthesized.artifact.confidence_notes),
        conflict_annotations: copy(synthesized.artifact.conflict_annotations || []),
      },
    },
    founder: {
      ...copy(shared),
      role: 'founder',
      executive_snapshot: {
        positioning: copy(synthesized.artifact.positioning),
        value_promise: copy(synthesized.artifact.value_promise),
        top_differentiators: copy(asArray(synthesized.artifact.differentiators).slice(0, 2)),
        key_risks: copy(synthesized.artifact.conflict_annotations || []),
        disallowed_claims: copy(synthesized.artifact.disallowed_claims),
      },
    },
    content: {
      ...copy(shared),
      role: 'content',
      execution_snapshot: {
        messaging_pillars: copy(synthesized.artifact.messaging_pillars),
        channel_rules: copy(compiledMessagingRules.channel_rules),
        disallowed_claims: copy(synthesized.artifact.disallowed_claims),
      },
    },
  };
}

module.exports = {
  projectRoleViews,
};
