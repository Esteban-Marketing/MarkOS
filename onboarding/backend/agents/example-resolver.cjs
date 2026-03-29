#!/usr/bin/env node
/**
 * example-resolver.cjs — Business-Model Example Injection Utility
 * ═══════════════════════════════════════════════════════════════════════════════
 * PURPOSE:
 *   Reads the correct model-specific sibling example file for a given template
 *   and wraps it in a standardized markdown injection block for LLM prompts.
 *   Called by mir-filler.cjs and msp-filler.cjs before each LLM call.
 *
 * HOW IT WORKS:
 *   1. Receives templateName (e.g. 'AUDIENCES') and businessModel (e.g. 'B2B')
 *   2. Resolves path: {basePath}/_AUDIENCES-b2b.example.md
 *   3. Reads file content
 *   4. Wraps in ## 📌 Reference Example markdown block
 *   5. Returns the full injection string (or '' if file not found — no crash)
 *
 * EXAMPLE FILE NAMING CONVENTION:
 *   _AUDIENCES-b2b.example.md
 *   _AUDIENCES-b2c.example.md
 *   _ICPs-saas.example.md
 *   _BRAND-VOICE-agents-aas.example.md
 *   (always lowercase model slug, underscore-prefixed)
 *
 * VALID BUSINESS MODELS:
 *   B2B | B2C | B2B2C | DTC | Marketplace | SaaS | Agents-aaS
 *
 * RELATED FILES:
 *   onboarding/backend/agents/mir-filler.cjs  (imports resolveExample)
 *   onboarding/backend/agents/msp-filler.cjs  (imports resolveExample)
 *   .agent/markos/templates/ (example files live here)
 *   onboarding/onboarding-seed.schema.json    (business_model field definition)
 * ═══════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ─── DEFAULT BASE PATH ─────────────────────────────────────────────────────────
// Resolves to .agent/markos/templates/ relative to repo root.
// Callers can override this for testing.
const { TEMPLATES_DIR } = require('../path-constants.cjs');
const DEFAULT_BASE = TEMPLATES_DIR;

// ─── MODEL SLUG MAP ────────────────────────────────────────────────────────────
// Normalizes the business_model enum value to a filename-safe slug.
const MODEL_SLUG = {
  'B2B':        'b2b',
  'B2C':        'b2c',
  'B2B2C':      'b2b2c',
  'DTC':        'dtc',
  'Marketplace':'marketplace',
  'SaaS':       'saas',
  'Agents-aaS': 'agents-aas',
};

/**
 * resolveExample
 * ──────────────
 * @param {string} templateName   - Template identifier, e.g. 'AUDIENCES', 'ICPs', 'BRAND-VOICE'
 * @param {string} businessModel  - Seed value e.g. 'B2B', 'SaaS', 'Agents-aaS'
 * @param {string} [templateSubdir] - Subdirectory within templates/, e.g. 'MIR/Market_Audiences'
 * @param {string} [basePath]     - Override for the templates root (used in tests)
 * @returns {string} Full markdown injection block, or '' if example file not found.
 *
 * @example
 *   const block = resolveExample('AUDIENCES', 'B2B', 'MIR/Market_Audiences');
 *   // Returns: "## 📌 Reference Example (B2B)\n_This is a...\n\n[file content]\n\n---\nNow fill..."
 */
function resolveExample(templateName, businessModel, templateSubdir = '', basePath = DEFAULT_BASE) {
  const slug = MODEL_SLUG[businessModel];

  // Graceful degradation: unknown model → skip injection silently
  if (!slug) {
    return '';
  }

  // Build file path: {basePath}/{templateSubdir}/_TEMPLATE-slug.example.md
  const fileName = `_${templateName}-${slug}.example.md`;
  const filePath = templateSubdir
    ? path.join(basePath, templateSubdir, fileName)
    : path.join(basePath, fileName);

  // Graceful degradation: file not found → skip injection silently (no crash)
  if (!fs.existsSync(filePath)) {
    return '';
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8').trim();
  } catch (_err) {
    return '';
  }

  // ── Injection wrapper (Option 2 — Markdown section) ────────────────────────
  return [
    `## 📌 Reference Example (${businessModel})`,
    `_This is a completed real-world example of the section below. Use it as a quality benchmark — match the length, depth, and specificity. Do NOT copy it; generate equivalent quality for the client data above._`,
    '',
    content,
    '',
    '---',
    'Now fill the same template for THIS client using the data provided above.',
    '',
  ].join('\n');
}

// ─── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = { resolveExample, MODEL_SLUG, DEFAULT_BASE };
