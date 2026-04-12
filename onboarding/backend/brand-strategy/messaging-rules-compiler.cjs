'use strict';

const {
  CHANNELS,
  validateMessagingRules,
} = require('./messaging-rules-schema.cjs');

const DEFAULT_VOICE_PROFILE = Object.freeze({
  tone: 'pragmatic',
  formality: 'professional',
  energy: 'balanced',
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function collectDoGuidanceFromArtifact(artifact) {
  const guidance = [];
  asArray(artifact && artifact.messaging_pillars).forEach((pillar) => {
    const pillarName = String((pillar && pillar.pillar) || 'Messaging pillar').trim() || 'Messaging pillar';
    asArray(pillar && pillar.claims).forEach((claim) => {
      const claimText = String((claim && (claim.claim || claim.claim_text)) || '').trim();
      if (!claimText) {
        return;
      }

      guidance.push({
        guidance: claimText,
        example: `Example: ${pillarName} - ${claimText}`,
        evidence_node_ids: normalizeEvidenceIds(claim && claim.evidence_node_ids),
      });
    });
  });

  return guidance;
}

function collectDontGuidanceFromArtifact(artifact) {
  return asArray(artifact && artifact.disallowed_claims)
    .map((claim) => {
      const claimText = String((claim && (claim.claim || claim.claim_text)) || '').trim();
      if (!claimText) {
        return null;
      }
      return {
        guidance: claimText,
        example: `Avoid: ${claimText}`,
        evidence_node_ids: normalizeEvidenceIds(claim && claim.evidence_node_ids),
      };
    })
    .filter(Boolean);
}

function fromTextList(entries, label, evidenceNodeIds) {
  return asArray(entries)
    .map((text) => String(text || '').trim())
    .filter(Boolean)
    .map((text) => ({
      guidance: text,
      example: `${label}: ${text}`,
      evidence_node_ids: normalizeEvidenceIds(evidenceNodeIds),
    }));
}

function uniqueGuidanceEntries(entries) {
  const byKey = new Map();
  entries.forEach((entry) => {
    const guidance = String(entry && entry.guidance || '').trim();
    if (!guidance) {
      return;
    }

    const key = guidance.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, {
        guidance,
        example: String(entry.example || '').trim(),
        evidence_node_ids: normalizeEvidenceIds(entry.evidence_node_ids),
      });
      return;
    }

    const current = byKey.get(key);
    byKey.set(key, {
      guidance: current.guidance,
      example: current.example || String(entry.example || '').trim(),
      evidence_node_ids: normalizeEvidenceIds(current.evidence_node_ids.concat(entry.evidence_node_ids || [])),
    });
  });

  return Array.from(byKey.values()).sort((a, b) => a.guidance.localeCompare(b.guidance));
}

function deriveVoiceProfile(validation) {
  if (validation && validation.valid && validation.resolved_channel_rules) {
    const siteRule = validation.resolved_channel_rules.site || {};
    if (siteRule.tone && siteRule.formality && siteRule.energy) {
      return {
        tone: siteRule.tone,
        formality: siteRule.formality,
        energy: siteRule.energy,
      };
    }
  }

  return { ...DEFAULT_VOICE_PROFILE };
}

function compileMessagingRules(artifact, rawMessagingRules, opts = {}) {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error('compileMessagingRules: artifact is required');
  }

  const rulesetVersion = typeof opts.ruleset_version === 'string' && opts.ruleset_version.trim().length > 0
    ? opts.ruleset_version
    : String(artifact.ruleset_version || '74.03.0');

  const validation = rawMessagingRules && typeof rawMessagingRules === 'object'
    ? validateMessagingRules(rawMessagingRules)
    : null;

  const voiceProfile = deriveVoiceProfile(validation);
  const channelSeeds = validation && validation.valid && validation.resolved_channel_rules
    ? validation.resolved_channel_rules
    : {};

  const doFromArtifact = collectDoGuidanceFromArtifact(artifact);
  const dontFromArtifact = collectDontGuidanceFromArtifact(artifact);
  const contradictionNotes = asArray(artifact.conflict_annotations).map((entry) => ({
    conflict_key: entry.conflict_key,
    severity: entry.severity,
    description: entry.description,
    evidence_node_ids: normalizeEvidenceIds(entry.evidence_node_ids),
  }));

  const channelRules = {};
  CHANNELS.forEach((channel) => {
    const seed = channelSeeds[channel] || {};

    const inheritedVoice = {
      tone: seed.tone || voiceProfile.tone,
      formality: seed.formality || voiceProfile.formality,
      energy: seed.energy || voiceProfile.energy,
    };

    const seedDo = fromTextList(seed.do, `${channel} do`, []);
    const seedDont = fromTextList(seed.dont, `${channel} do-not`, []);

    channelRules[channel] = {
      ...inheritedVoice,
      do: uniqueGuidanceEntries(doFromArtifact.concat(seedDo)),
      dont: uniqueGuidanceEntries(dontFromArtifact.concat(seedDont)),
      contradiction_annotations: contradictionNotes,
    };
  });

  return {
    ruleset_version: rulesetVersion,
    voice_profile: voiceProfile,
    channel_rules: channelRules,
  };
}

module.exports = {
  compileMessagingRules,
  DEFAULT_VOICE_PROFILE,
};
