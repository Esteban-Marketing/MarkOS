'use strict';

const fs = require('fs');
const path = require('path');

const { PROJECT_ROOT } = require('../path-constants.cjs');
const {
  getCanonicalVaultRootPath,
  getDestinationForSection,
  getDestinationForLegacySource,
  normalizeRelativePath,
} = require('./destination-map.cjs');
const { formatCanonicalNote, extractSummary, sanitizeMarkdownBody } = require('./note-format.cjs');

function normalizeAbsolutePathForCompare(targetPath) {
  const resolved = path.resolve(targetPath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isPathWithinBase(targetPath, basePath) {
  const normalizedTarget = normalizeAbsolutePathForCompare(targetPath);
  const normalizedBase = normalizeAbsolutePathForCompare(basePath);
  if (normalizedTarget === normalizedBase) {
    return true;
  }
  return normalizedTarget.startsWith(`${normalizedBase}${path.sep}`);
}

function resolveCanonicalVaultRoot(config) {
  const relativeRoot = getCanonicalVaultRootPath(config);
  const absoluteRoot = path.resolve(PROJECT_ROOT, relativeRoot);

  if (!isPathWithinBase(absoluteRoot, PROJECT_ROOT)) {
    throw new Error('CANONICAL_VAULT_PATH_OUT_OF_BOUNDS');
  }

  return {
    relative_root: normalizeRelativePath(relativeRoot),
    absolute_root: absoluteRoot,
  };
}

function buildCanonicalMetadata({ destination, projectSlug, sourceMode, legacyOrigin, timestamp, summary, metadata = {} }) {
  const createdAt = metadata.created_at || timestamp;
  const updatedAt = metadata.updated_at || timestamp;
  const finalSourceMode = sourceMode || destination.source_mode || 'generated';

  return {
    id: destination.note_id,
    title: destination.title,
    vault_family: destination.vault_family,
    note_family: destination.note_family,
    status: metadata.status || 'active',
    owner: metadata.owner || projectSlug,
    review_cycle: metadata.review_cycle || 'quarterly',
    created_at: createdAt,
    updated_at: updatedAt,
    source_mode: finalSourceMode,
    summary: metadata.summary || summary || extractSummary(metadata.body || ''),
    legacy_origin: legacyOrigin || undefined,
    migrated_at: finalSourceMode === 'imported' ? (metadata.migrated_at || timestamp) : undefined,
    ...metadata,
  };
}

function prepareCanonicalEntry({
  config,
  projectSlug,
  content,
  sectionKey = null,
  legacySource = null,
  sourceMode = 'generated',
  title = null,
  metadata = {},
  warnings = [],
  timestamp = new Date().toISOString(),
}) {
  const cleanBody = sanitizeMarkdownBody(content);

  let destination = null;
  if (sectionKey) {
    destination = getDestinationForSection(sectionKey, { config, projectSlug, sourceMode, legacyOrigin: metadata.legacy_origin });
  } else if (legacySource) {
    destination = getDestinationForLegacySource({
      sourceRoot: legacySource.source_root,
      relativePath: legacySource.relative_path,
      config,
      projectSlug,
      sourceMode,
      legacyOrigin: metadata.legacy_origin || legacySource.legacy_origin,
    });
  }

  if (!destination) {
    return {
      source_key: sectionKey || normalizeRelativePath(`${legacySource?.source_root || 'UNKNOWN'}/${legacySource?.relative_path || ''}`),
      source_mode: sourceMode,
      outcome: 'blocked',
      destination_path: null,
      absolute_path: null,
      note_id: null,
      title: title || null,
      warnings: Array.from(warnings),
      errors: ['No deterministic canonical destination exists for this source.'],
      reason: 'UNSUPPORTED_DESTINATION',
      body: cleanBody,
      legacy_origin: metadata.legacy_origin || legacySource?.legacy_origin || null,
    };
  }

  const vaultRoot = resolveCanonicalVaultRoot(config);
  const absolutePath = path.resolve(PROJECT_ROOT, destination.destination_path);
  if (!isPathWithinBase(absolutePath, vaultRoot.absolute_root)) {
    throw new Error('CANONICAL_DESTINATION_OUT_OF_BOUNDS');
  }

  const canonicalMetadata = buildCanonicalMetadata({
    destination,
    projectSlug,
    sourceMode,
    legacyOrigin: metadata.legacy_origin || destination.legacy_origin,
    timestamp,
    summary: extractSummary(cleanBody),
    metadata: { ...metadata, body: cleanBody },
  });
  delete canonicalMetadata.body;

  const document = formatCanonicalNote({
    title: title || destination.title,
    metadata: canonicalMetadata,
    body: cleanBody,
  });

  return {
    source_key: sectionKey || normalizeRelativePath(`${legacySource.source_root}/${legacySource.relative_path}`),
    source_mode: sourceMode,
    destination_path: destination.destination_path,
    absolute_path: absolutePath,
    note_id: destination.note_id,
    title: title || destination.title,
    vault_family: destination.vault_family,
    note_family: destination.note_family,
    warnings: Array.from(warnings),
    errors: [],
    reason: null,
    document,
    body: cleanBody,
    legacy_origin: metadata.legacy_origin || destination.legacy_origin || null,
  };
}

function classifyPreparedEntry(prepared) {
  if (!prepared || prepared.destination_path === null) {
    return prepared;
  }

  if (!prepared.body) {
    return {
      ...prepared,
      outcome: 'skipped',
      reason: 'SOURCE_CONTENT_EMPTY',
      errors: prepared.errors.concat('Source content was empty after removing frontmatter.'),
    };
  }

  if (fs.existsSync(prepared.absolute_path)) {
    const existing = fs.readFileSync(prepared.absolute_path, 'utf8');
    if (existing === prepared.document) {
      return {
        ...prepared,
        outcome: 'skipped',
        reason: 'DESTINATION_ALREADY_CURRENT',
      };
    }

    return {
      ...prepared,
      outcome: 'blocked',
      reason: 'DESTINATION_CONFLICT',
      errors: prepared.errors.concat('Canonical destination already exists with different content.'),
    };
  }

  return {
    ...prepared,
    outcome: prepared.warnings.length > 0 ? 'imported_with_warnings' : 'imported',
  };
}

function commitPreparedEntry(prepared) {
  const classified = classifyPreparedEntry(prepared);
  if (!classified || !['imported', 'imported_with_warnings'].includes(classified.outcome)) {
    return classified;
  }

  fs.mkdirSync(path.dirname(classified.absolute_path), { recursive: true });
  fs.writeFileSync(classified.absolute_path, classified.document, 'utf8');
  return {
    ...classified,
    wrote: true,
  };
}

function writeApprovedDrafts({ config, projectSlug, approvedDrafts = {} }) {
  const items = [];
  const errors = [];

  for (const [sectionKey, content] of Object.entries(approvedDrafts)) {
    const prepared = prepareCanonicalEntry({
      config,
      projectSlug,
      sectionKey,
      content,
      sourceMode: 'generated',
    });
    const result = commitPreparedEntry(prepared);
    items.push(result);

    if (result.errors.length > 0) {
      errors.push(...result.errors.map((message) => `${sectionKey}: ${message}`));
    }
  }

  return {
    vault_root: resolveCanonicalVaultRoot(config),
    items,
    written: items
      .filter((item) => ['imported', 'imported_with_warnings'].includes(item.outcome))
      .map((item) => item.destination_path),
    errors,
  };
}

module.exports = {
  resolveCanonicalVaultRoot,
  prepareCanonicalEntry,
  classifyPreparedEntry,
  commitPreparedEntry,
  writeApprovedDrafts,
};