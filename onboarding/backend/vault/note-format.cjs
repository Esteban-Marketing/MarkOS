'use strict';

const FRONTMATTER_ORDER = Object.freeze([
  'id',
  'title',
  'vault_family',
  'note_family',
  'status',
  'owner',
  'review_cycle',
  'review_owner',
  'review_state',
  'last_reviewed_at',
  'created_at',
  'updated_at',
  'source_mode',
  'summary',
  'tags',
  'priority',
  'linked_entities',
  'evidence_level',
  'confidence',
  'campaign_window',
  'legacy_origin',
  'migrated_at',
  'migration_notes',
  'archive_reason',
]);

function quoteScalar(value) {
  const stringValue = String(value ?? '');
  if (stringValue === '') {
    return '""';
  }

  if (/^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '\\"')}"`;
  }

  if (/[:#\[\]{}>|%@`]/.test(stringValue) || /^\s|\s$/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '\\"')}"`;
  }

  return stringValue;
}

function formatYamlValue(value, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value.map((entry) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const nested = formatYamlObject(entry, indentLevel + 1);
        return `${indent}-\n${nested}`;
      }
      return `${indent}- ${formatYamlValue(entry, indentLevel + 1).trimStart()}`;
    }).join('\n');
  }

  if (value && typeof value === 'object') {
    return `\n${formatYamlObject(value, indentLevel + 1)}`;
  }

  return quoteScalar(value);
}

function formatYamlObject(objectValue, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  return Object.entries(objectValue)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const formatted = formatYamlValue(value, indentLevel);
      if (formatted.startsWith('\n')) {
        return `${indent}${key}:${formatted}`;
      }
      return `${indent}${key}: ${formatted}`;
    })
    .join('\n');
}

function stripFrontmatter(markdown) {
  const source = String(markdown || '').replace(/^\uFEFF/, '');
  return source.replace(/^---\n[\s\S]*?\n---\n*/, '');
}

function sanitizeMarkdownBody(markdown) {
  return stripFrontmatter(markdown).trim();
}

function extractSummary(markdown) {
  const body = sanitizeMarkdownBody(markdown);
  if (!body) {
    return null;
  }

  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^#+\s/.test(line) && !/^[-*]\s/.test(line));

  if (lines.length === 0) {
    return null;
  }

  return lines[0].slice(0, 180);
}

function orderMetadata(metadata) {
  const ordered = {};

  for (const key of FRONTMATTER_ORDER) {
    if (metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '') {
      ordered[key] = metadata[key];
    }
  }

  const extraKeys = Object.keys(metadata)
    .filter((key) => !(key in ordered) && metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== '')
    .sort();

  for (const key of extraKeys) {
    ordered[key] = metadata[key];
  }

  return ordered;
}

function formatCanonicalNote({ title, metadata, body }) {
  const ordered = orderMetadata(metadata);
  const frontmatter = formatYamlObject(ordered);
  const cleanBody = sanitizeMarkdownBody(body);
  const heading = `# ${title}`;
  const bodyText = cleanBody ? `\n\n${cleanBody}\n` : '\n';

  return `---\n${frontmatter}\n---\n\n${heading}${bodyText}`;
}

module.exports = {
  FRONTMATTER_ORDER,
  extractSummary,
  formatCanonicalNote,
  sanitizeMarkdownBody,
  stripFrontmatter,
};