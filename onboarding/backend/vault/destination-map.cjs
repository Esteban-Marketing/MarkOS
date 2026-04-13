'use strict';

const { buildNoteId } = require('./note-id.cjs');
const { buildSemanticIndexManifests } = require('./semantic-index-manifest.cjs');

const DISCIPLINE_REGISTRY = Object.freeze({
  strategy: Object.freeze({ key: 'strategy', title: 'Strategy' }),
  execution: Object.freeze({ key: 'execution', title: 'Execution' }),
  memory: Object.freeze({ key: 'memory', title: 'Memory' }),
});

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

function createContractError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeStableSlug(value) {
  const raw = String(value || '').trim();
  const normalized = normalizeSlug(raw);

  if (!normalized) {
    throw createContractError('E_UNSTABLE_SLUG', 'Slug must normalize to a non-empty canonical token.');
  }

  if (raw !== normalized) {
    throw createContractError('E_UNSTABLE_SLUG', 'Slug must already be canonical and stable.');
  }

  return normalized;
}

function normalizeDiscipline(value) {
  const key = String(value || '').trim().toLowerCase();
  const discipline = DISCIPLINE_REGISTRY[key];

  if (!discipline) {
    throw createContractError('E_UNKNOWN_DISCIPLINE', `Discipline is not recognized: ${value}`);
  }

  return discipline;
}

function getDisciplineRoot(value) {
  return normalizeDiscipline(value).title;
}

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

function resolveDeterministicDestination({
  config,
  discipline,
  sectionKey,
  slug,
  projectSlug,
  sourceMode = 'generated',
  legacyOrigin = null,
  audience = [],
  funnel = [],
  concepts = [],
}) {
  const entry = SECTION_REGISTRY[sectionKey];
  if (!entry) {
    throw createContractError('E_UNKNOWN_SECTION', `Section is not recognized: ${sectionKey}`);
  }

  const resolvedDiscipline = normalizeDiscipline(discipline || entry.vault_family);
  const canonicalSlug = normalizeStableSlug(slug || entry.note_family);
  const canonicalRoot = getCanonicalVaultRootPath(config);
  // Use the section registry's canonical relative_path only when no custom slug is supplied.
  // A custom slug (different from the default note_family) gets placed under Disciplines/.
  const relPath = canonicalSlug !== entry.note_family
    ? `Disciplines/${resolvedDiscipline.title}/${canonicalSlug}.md`
    : (entry.relative_path || `Disciplines/${resolvedDiscipline.title}/${canonicalSlug}.md`);
  const disciplineRootPath = `${canonicalRoot}/Disciplines/${resolvedDiscipline.title}`;
  const destinationPath = `${canonicalRoot}/${relPath}`;

  const destination = {
    section_key: sectionKey,
    title: entry.title,
    vault_family: resolvedDiscipline.title,
    note_family: entry.note_family,
    discipline: resolvedDiscipline.key,
    discipline_root: resolvedDiscipline.title,
    canonical_slug: canonicalSlug,
    relative_path: relPath,
    destination_path: destinationPath,
    discipline_root_path: disciplineRootPath,
    source_mode: sourceMode,
    canonical_root: canonicalRoot,
    note_id: buildNoteId({
      vaultFamily: resolvedDiscipline.title,
      noteFamily: entry.note_family,
      projectSlug,
      suffix: canonicalSlug !== entry.note_family ? canonicalSlug : null,
    }),
    legacy_origin: legacyOrigin,
  };

  return {
    ...destination,
    semantic_manifests: buildSemanticIndexManifests({
      destination,
      audience,
      funnel,
      concepts,
    }),
  };
}

function buildDestination(sectionKey, entry, options = {}) {
  return resolveDeterministicDestination({
    config: options.config,
    discipline: options.discipline || entry.vault_family,
    sectionKey,
    slug: options.slug || entry.note_family,
    projectSlug: options.projectSlug,
    sourceMode: options.sourceMode || 'generated',
    legacyOrigin: options.legacyOrigin || null,
    audience: options.audience || [],
    funnel: options.funnel || [],
    concepts: options.concepts || [],
  });
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
  DISCIPLINE_REGISTRY,
  SECTION_REGISTRY,
  LEGACY_SOURCE_MAP,
  normalizeRelativePath,
  getCanonicalVaultRootPath,
  getDisciplineRoot,
  resolveDeterministicDestination,
  getLegacySourceKey,
  getDestinationForSection,
  getDestinationForLegacySource,
  listSupportedLegacyMappings,
};