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
 * After running, contracts/openapi.json is a valid OpenAPI 3.1 document and
 * passes both `openapi-typescript` and the Spectral lint.
 *
 * Usage: node scripts/openapi/cleanup-malformed-schemas.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const TARGET = path.resolve(__dirname, '..', '..', 'contracts', 'openapi.json');

let parsedCount = 0;
let unquotedKeyCount = 0;

/**
 * If a string looks like YAML flow ({...} or [...]), parse and return the
 * parsed value. Otherwise return the string unchanged.
 */
// Placeholder for `#` inside YAML flow strings — js-yaml treats `#` as a
// comment-start marker which truncates string values like `#RRGGBB`. We
// substitute, parse, then restore.
const HASH_PLACEHOLDER = 'HASH';

function restoreHashes(value) {
  if (typeof value === 'string') return value.replace(/HASH/g, '#');
  if (Array.isArray(value)) return value.map(restoreHashes);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k.replace(/HASH/g, '#')] = restoreHashes(v);
    }
    return out;
  }
  return value;
}

function maybeParseYamlFlow(s) {
  if (typeof s !== 'string') return s;
  const trimmed = s.trim();
  if (
    !(
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    )
  ) {
    return s;
  }
  // Substitute # so js-yaml doesn't treat it as comment
  const safe = trimmed.replace(/#/g, HASH_PLACEHOLDER);
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

/**
 * Some keys in the source are wrapped in single quotes (e.g. `'400'`) because
 * the YAML emitter quoted them. In OpenAPI JSON, status codes are bare string
 * keys ("400"). Unquote.
 */
function unquoteKey(key) {
  if (typeof key !== 'string') return key;
  if (key.length >= 2 && key.startsWith("'") && key.endsWith("'")) {
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
  // Multi-pass: a parsed flow-map may itself contain flow-strings inside.
  // Re-walk until stable (max 5 iterations to avoid infinite loop).
  let prev = JSON.stringify(cleaned);
  let next;
  for (let i = 0; i < 5; i++) {
    next = JSON.stringify(walk(JSON.parse(prev)));
    if (next === prev) break;
    prev = next;
  }
  const out = JSON.parse(prev);
  fs.writeFileSync(TARGET, JSON.stringify(out, null, 2) + '\n');
  console.log(`Cleaned ${TARGET}`);
  console.log(`  Pseudo-YAML strings parsed: ${parsedCount}`);
  console.log(`  Single-quoted keys unquoted: ${unquotedKeyCount}`);
}

main();
