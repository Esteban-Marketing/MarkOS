#!/usr/bin/env node
/**
 * cleanup-malformed-schemas.cjs
 *
 * One-shot cleanup for `contracts/openapi.json`. Phase 200-01 build-openapi.cjs
 * emits some schema fragments as YAML-flow STRINGS (e.g.
 * `"issuer": "{ type: string, format: uri }"`) instead of proper JSON
 * objects. This trips both `openapi-typescript` (typescript SDK gen) and any
 * downstream OpenAPI 3.1 validator.
 *
 * This script:
 *   1. Reads contracts/openapi.json
 *   2. Walks every value
 *   3. For any string starting with `{` and ending with `}`, parses as YAML
 *      flow-map and replaces with the parsed object
 *   4. For any string starting with `[` and ending with `]`, parses as YAML
 *      flow-array and replaces with the parsed array
 *   5. For object keys quoted as `'400'`, unquotes to `400` (status codes are
 *      plain string keys in OpenAPI; the inner single-quotes were leaked from
 *      YAML)
 *   6. Writes the cleaned JSON back
 *
 * Hash placeholder note: js-yaml treats `#` as a comment-start marker which
 * truncates string values like `#RRGGBB`. We substitute `#` with the literal
 * sequence `MARKOS_HASH_TOKEN` before parsing, then restore.
 *
 * Usage: node scripts/openapi/cleanup-malformed-schemas.cjs
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const TARGET = path.resolve(__dirname, '..', '..', 'contracts', 'openapi.json');
const HASH_TOKEN = 'MARKOS_HASH_TOKEN';

let parsedCount = 0;
let unquotedKeyCount = 0;

function restoreHashes(value) {
  if (typeof value === 'string') return value.split(HASH_TOKEN).join('#');
  if (Array.isArray(value)) return value.map(restoreHashes);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k.split(HASH_TOKEN).join('#')] = restoreHashes(v);
    }
    return out;
  }
  return value;
}

function maybeParseYamlFlow(s) {
  if (typeof s !== 'string') return s;
  const trimmed = s.trim();
  const isFlowMap = trimmed.startsWith('{') && trimmed.endsWith('}');
  const isFlowArr = trimmed.startsWith('[') && trimmed.endsWith(']');
  if (!isFlowMap && !isFlowArr) return s;
  const safe = trimmed.split('#').join(HASH_TOKEN);
  try {
    const parsed = yaml.load(safe);
    if (parsed !== null && parsed !== undefined && typeof parsed === 'object') {
      parsedCount++;
      return restoreHashes(parsed);
    }
  } catch (e) {
    // Not parseable — leave as string
  }
  return s;
}

function unquoteKey(key) {
  if (typeof key !== 'string') return key;
  if (key.length >= 2 && key.charCodeAt(0) === 39 && key.charCodeAt(key.length - 1) === 39) {
    unquotedKeyCount++;
    return key.slice(1, -1);
  }
  return key;
}

function walk(value) {
  if (Array.isArray(value)) {
    return value.map((v) => walk(maybeParseYamlFlow(v)));
  }
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const cleanKey = unquoteKey(k);
      out[cleanKey] = walk(maybeParseYamlFlow(v));
    }
    return out;
  }
  return value;
}

function main() {
  const raw = fs.readFileSync(TARGET, 'utf8');
  const doc = JSON.parse(raw);
  const cleaned = walk(doc);
  fs.writeFileSync(TARGET, JSON.stringify(cleaned, null, 2) + '\n');
  console.log('Cleaned ' + TARGET);
  console.log('  Pseudo-YAML strings parsed: ' + parsedCount);
  console.log('  Single-quoted keys unquoted: ' + unquotedKeyCount);
}

main();
