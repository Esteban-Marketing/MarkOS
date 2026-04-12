'use strict';

const { buildNoteId } = require('./note-id.cjs');

const SECTION_REGISTRY = Object.freeze({
  company_profile: Object.freeze({
    title: 'Company',
    relative_path: 'Strategy/company.md',
    vault_family: 'Strategy',
    note_family: 'company',
  }),
  mission_values: Object.freeze({
    title: 'Positioning',
    relative_path: 'Strategy/positioning.md',
    vault_family: 'Strategy',
    note_family: 'positioning',
  }),
  audience: Object.freeze({
    title: 'Audience',
    relative_path: 'Strategy/audience.md',
    vault_family: 'Strategy',
    note_family: 'audience',
  }),
  competitive: Object.freeze({
    title: 'Competitive Landscape',
    relative_path: 'Strategy/competitive.md',
    vault_family: 'Strategy',
    note_family: 'competitive',
  }),
  brand_voice: Object.freeze({
    title: 'Messaging',
    relative_path: 'Strategy/messaging.md',
    vault_family: 'Strategy',
    note_family: 'messaging',
  }),
  channel_strategy: Object.freeze({
    title: 'Channel System',
    relative_path: 'Execution/channel-system.md',
    vault_family: 'Execution',
    note_family: 'channel_system',
  }),
});

const LEGACY_SOURCE_MAP = Object.freeze({
  'MIR:Core_Strategy/01_COMPANY/PROFILE.md': 'company_profile',
  'MIR:Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md': 'mission_values',
  'MIR:Market_Audiences/03_MARKET/AUDIENCES.md': 'audience',
  'MIR:Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md': 'competitive',
  'MIR:Core_Strategy/02_BRAND/VOICE-TONE.md': 'brand_voice',
  'MSP:Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md': 'channel_strategy',
});

function normalizeRelativePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .trim();
}

function getCanonicalVaultRootPath(config) {
  return normalizeRelativePath(config?.canonical_vault?.root_path || config?.vault_root_path || 'MarkOS-Vault');
}

function buildDestination(sectionKey, entry, options = {}) {
  const sourceMode = options.sourceMode || 'generated';
  const canonicalRoot = getCanonicalVaultRootPath(options.config);
  const destinationPath = `${canonicalRoot}/${entry.relative_path}`;

  return {
    section_key: sectionKey,
    title: entry.title,
    vault_family: entry.vault_family,
    note_family: entry.note_family,
    relative_path: entry.relative_path,
    destination_path: destinationPath,
    source_mode: sourceMode,
    note_id: buildNoteId({
      vaultFamily: entry.vault_family,
      noteFamily: entry.note_family,
      projectSlug: options.projectSlug,
    }),
    legacy_origin: options.legacyOrigin || null,
  };
}

function getDestinationForSection(sectionKey, options = {}) {
  const entry = SECTION_REGISTRY[sectionKey];
  if (!entry) {
    return null;
  }

  return buildDestination(sectionKey, entry, options);
}

function getLegacySourceKey(sourceRoot, relativePath) {
  return `${String(sourceRoot || '').toUpperCase()}:${normalizeRelativePath(relativePath)}`;
}

function getDestinationForLegacySource({ sourceRoot, relativePath, ...options }) {
  const key = getLegacySourceKey(sourceRoot, relativePath);
  const sectionKey = LEGACY_SOURCE_MAP[key];
  if (!sectionKey) {
    return null;
  }

  return getDestinationForSection(sectionKey, {
    ...options,
    sourceMode: options.sourceMode || 'imported',
    legacyOrigin: options.legacyOrigin || {
      source_root: String(sourceRoot || '').toUpperCase(),
      relative_path: normalizeRelativePath(relativePath),
    },
  });
}

function listSupportedLegacyMappings() {
  return Object.entries(LEGACY_SOURCE_MAP).map(([key, sectionKey]) => {
    const [sourceRoot, relativePath] = key.split(':');
    return {
      source_root: sourceRoot,
      relative_path: relativePath,
      section_key: sectionKey,
    };
  });
}

module.exports = {
  SECTION_REGISTRY,
  LEGACY_SOURCE_MAP,
  normalizeRelativePath,
  getCanonicalVaultRootPath,
  getLegacySourceKey,
  getDestinationForSection,
  getDestinationForLegacySource,
  listSupportedLegacyMappings,
};