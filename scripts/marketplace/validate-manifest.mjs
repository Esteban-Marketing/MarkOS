#!/usr/bin/env node
// Phase 202 Plan 10 Task 1: AJV-validate .claude-plugin/marketplace.json against
// the Anthropic Claude Marketplace schema. Falls back to a structural check when
// the schema URL is unreachable (offline / network-restricted CI).
//
// QA-01 automated check: exits non-zero on any violation.
//
// Usage: node scripts/marketplace/validate-manifest.mjs

import { readFileSync } from 'node:fs';

const MANIFEST_PATH = '.claude-plugin/marketplace.json';
const SCHEMA_URL = 'https://schemas.anthropic.com/claude-marketplace/v1.json';

const REQUIRED_TOP = ['$schema', 'name', 'version', 'description', 'server', 'tools'];
const REQUIRED_SERVER = ['type', 'url', 'protocolVersion'];

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const errors = [];

// --- Structural checks (always run) ---

for (const k of REQUIRED_TOP) {
  if (!manifest[k]) errors.push(`missing top-level field: ${k}`);
}

if (manifest.server) {
  for (const k of REQUIRED_SERVER) {
    if (!manifest.server[k]) errors.push(`missing server.${k}`);
  }
  if (manifest.server.protocolVersion && manifest.server.protocolVersion !== '2025-06-18') {
    errors.push(`server.protocolVersion must be "2025-06-18" (got "${manifest.server.protocolVersion}")`);
  }
  if (manifest.server.url && !manifest.server.url.startsWith('https://')) {
    errors.push(`server.url must be https (got "${manifest.server.url}")`);
  }
}

if (!Array.isArray(manifest.tools) || manifest.tools.length !== 30) {
  errors.push(`tools must be an array of exactly 30 entries (got ${manifest.tools?.length ?? 'undefined'})`);
}

if (manifest.version !== '2.0.0') {
  errors.push(`version must be "2.0.0" for Phase 202 (got "${manifest.version}")`);
}

if (!manifest.icon) {
  errors.push('icon field missing (marketplace cert requires 512x512 PNG reference)');
}

if (!manifest.pricing || !Array.isArray(manifest.pricing.tiers)) {
  errors.push('pricing.tiers must be an array (D-21 tier disclosure)');
} else {
  const tierNames = manifest.pricing.tiers.map((t) => t.name);
  if (!tierNames.includes('free')) errors.push('pricing.tiers must include "free"');
  if (!tierNames.includes('paid')) errors.push('pricing.tiers must include "paid"');
}

// Ensure every tool entry has name + description
if (Array.isArray(manifest.tools)) {
  for (const [i, tool] of manifest.tools.entries()) {
    if (!tool.name) errors.push(`tools[${i}] missing name`);
    if (!tool.description) errors.push(`tools[${i}] (${tool.name || 'unnamed'}) missing description`);
  }
}

// --- Attempt live schema validation (best-effort) ---

let schemaValidated = false;
let schemaFetchError = null;
try {
  const res = await fetch(SCHEMA_URL, { signal: AbortSignal.timeout(5000) });
  if (res.ok) {
    const schema = await res.json();
    // Lazy-load Ajv so the structural check still works if deps are missing.
    const AjvMod = await import('ajv');
    const AjvCtor = AjvMod.default || AjvMod;
    const addFormatsMod = await import('ajv-formats');
    const addFormats = addFormatsMod.default || addFormatsMod;
    const ajv = new AjvCtor({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    if (!validate(manifest)) {
      for (const err of validate.errors || []) {
        errors.push(`schema: ${err.instancePath || '/'} ${err.message}`);
      }
    }
    schemaValidated = true;
  } else {
    schemaFetchError = `HTTP ${res.status}`;
  }
} catch (err) {
  schemaFetchError = err.message;
}

// --- Report ---

if (errors.length > 0) {
  console.error('Marketplace manifest validation FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const suffix = schemaValidated
  ? 'schema: fetched + validated'
  : `schema: offline (${schemaFetchError || 'unreachable'}) — structural check only`;
console.log(`[validate-manifest] OK (${suffix})`);
