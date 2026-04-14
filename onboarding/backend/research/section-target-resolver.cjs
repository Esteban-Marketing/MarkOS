'use strict';

const { getDestinationForSection } = require('../vault/destination-map.cjs');

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function chooseSectionKey(input = {}) {
  const explicit = normalizeToken(input.section_key);
  if (explicit) {
    return explicit;
  }

  const artifactFamily = normalizeToken(input.artifact_family || 'mir');
  const filters = input.filters && typeof input.filters === 'object' ? input.filters : {};
  const evidenceText = (Array.isArray(input.evidence) ? input.evidence : [])
    .map((entry) => `${entry.implication || ''} ${entry.claim || ''}`.toLowerCase())
    .join(' ');

  if (artifactFamily === 'msp' || normalizeToken(filters.strategic_intent).includes('channel') || evidenceText.includes('channel')) {
    return 'channel_strategy';
  }

  if (Array.isArray(filters.audience) && filters.audience.length > 0 || evidenceText.includes('audience')) {
    return 'audience';
  }

  if (evidenceText.includes('competitive')) {
    return 'competitive';
  }

  if (evidenceText.includes('voice') || evidenceText.includes('messaging')) {
    return 'brand_voice';
  }

  if (evidenceText.includes('mission') || evidenceText.includes('positioning')) {
    return 'mission_values';
  }

  return 'company_profile';
}

function buildChannelStrategyFallback() {
  return {
    section_key: 'channel_strategy',
    title: 'Channel System',
    relative_path: 'Execution/channel-system.md',
    destination_path: 'MarkOS-Vault/Execution/channel-system.md',
    note_id: 'execution-channel-system',
    vault_family: 'Execution',
    discipline: 'execution',
  };
}

function resolvePreviewTarget(input = {}) {
  const sectionKey = chooseSectionKey(input);
  const discipline = sectionKey === 'channel_strategy' ? 'execution' : 'strategy';

  let destination;
  try {
    destination = getDestinationForSection(sectionKey, { discipline });
  } catch (error) {
    if (error?.code === 'E_UNSTABLE_SLUG' && sectionKey === 'channel_strategy') {
      destination = buildChannelStrategyFallback();
    } else {
      throw error;
    }
  }

  return {
    section_key: sectionKey,
    ...destination,
    heading_path: [`# ${destination.title}`],
  };
}

module.exports = {
  resolvePreviewTarget,
};
