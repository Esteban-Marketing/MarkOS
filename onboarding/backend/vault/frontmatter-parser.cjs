'use strict';

/**
 * frontmatter-parser.cjs — Minimal YAML frontmatter extractor for Obsidian markdown files.
 *
 * Parses the standard `---\nkey: value\n---` block from markdown content without
 * requiring external dependencies. Handles string scalars and block-sequence arrays.
 * Phase 85 scope: extracting audience metadata fields from vault documents.
 */

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

/**
 * Parse a YAML frontmatter block from markdown content.
 *
 * Supported field forms:
 *   discipline: messaging
 *   audience:
 *     - ICP:SMB_FOUNDER
 *     - SEGMENT:EARLY_ADOPTER
 *   business_model: saas
 *   pain_point_tags:
 *     - PAIN:NO_PIPELINE
 *
 * @param {string} content  Raw markdown file content
 * @returns {object}        Parsed key-value pairs (arrays for sequence nodes)
 */
function parseFrontmatter(content) {
  if (typeof content !== 'string') {
    return {};
  }

  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return {};
  }

  const lines = match[1].split(/\r?\n/);
  const result = {};
  let currentKey = null;
  let currentIsArray = false;

  for (const line of lines) {
    // Blank line — reset continuation only
    if (!line.trim()) {
      continue;
    }

    // Sequence item continuation: "  - value"
    const seqMatch = line.match(/^\s{2,}-\s+(.+)$/);
    if (seqMatch && currentKey !== null && currentIsArray) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      result[currentKey].push(seqMatch[1].trim());
      continue;
    }

    // Key-value or key-only: "key: value" or "key:"
    const kvMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const rawValue = kvMatch[2].trim();

      if (rawValue === '') {
        // Block sequence follows
        result[currentKey] = [];
        currentIsArray = true;
      } else {
        // Inline string value
        result[currentKey] = rawValue;
        currentIsArray = false;
      }
      continue;
    }

    // Inline list item at top level: "- value"
    const topSeqMatch = line.match(/^-\s+(.+)$/);
    if (topSeqMatch && currentKey !== null && currentIsArray) {
      if (!Array.isArray(result[currentKey])) {
        result[currentKey] = [];
      }
      result[currentKey].push(topSeqMatch[1].trim());
    }
  }

  return result;
}

/**
 * Extract the audience-metadata fields required by audience-schema.cjs from
 * a parsed frontmatter object. Returns only the known MarkOS metadata keys.
 *
 * @param {object} fm  Output of parseFrontmatter()
 * @returns {object}   Subset with discipline, audience, business_model, pain_point_tags
 */
function extractAudienceMetadata(fm) {
  const out = {};

  if (fm.discipline !== undefined) {
    out.discipline = fm.discipline;
  }

  if (fm.audience !== undefined) {
    out.audience = Array.isArray(fm.audience) ? fm.audience : [fm.audience];
  }

  if (fm.business_model !== undefined) {
    out.business_model = fm.business_model;
  }

  if (fm.pain_point_tags !== undefined) {
    out.pain_point_tags = Array.isArray(fm.pain_point_tags) ? fm.pain_point_tags : [fm.pain_point_tags];
  }

  return out;
}

module.exports = {
  parseFrontmatter,
  extractAudienceMetadata,
};
