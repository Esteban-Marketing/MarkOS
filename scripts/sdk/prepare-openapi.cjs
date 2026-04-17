#!/usr/bin/env node
'use strict';

/**
 * Prepares contracts/openapi.json for SDK codegen by resolving or stubbing
 * broken $refs. build-openapi.cjs prefixes component schema keys with flow IDs,
 * but some F-NN contracts reference sibling fields (e.g. F_63A_ApprovalPackage
 * -> properties.mutation_family) that don't land as components of their own.
 *
 * This script:
 *   1. Reads contracts/openapi.json
 *   2. Walks every $ref
 *   3. If the $ref does not resolve, replaces it with `{ type: "object", additionalProperties: true }`
 *      so codegen emits a loose type instead of failing.
 *   4. Writes a trimmed copy to contracts/openapi.sdk.json.
 */

const fs = require('node:fs');
const path = require('node:path');

function resolveRef(doc, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/').map((p) => decodeURIComponent(p.replace(/~1/g, '/').replace(/~0/g, '~')));
  let node = doc;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return null;
    node = node[part];
  }
  return node;
}

function stripBadRefs(doc) {
  let stripped = 0;
  const walk = (node) => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node.$ref === 'string') {
      const target = resolveRef(doc, node.$ref);
      if (target === null || target === undefined) {
        stripped += 1;
        delete node.$ref;
        node.type = 'object';
        node.additionalProperties = true;
        node['x-sdk-stubbed-from'] = node['x-sdk-stubbed-from'] || 'unresolved-ref';
      }
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(doc);
  return stripped;
}

function unquoteKey(key) {
  if (typeof key !== 'string') return key;
  if (key.startsWith("'") && key.endsWith("'")) return key.slice(1, -1);
  if (key.startsWith('"') && key.endsWith('"')) return key.slice(1, -1);
  return key;
}

function normalizeResponseKeys(doc) {
  let renamed = 0;
  const normalizeObject = (node) => {
    if (node == null || typeof node !== 'object' || Array.isArray(node)) return;
    for (const [k, v] of Object.entries(node)) {
      const clean = unquoteKey(k);
      if (clean !== k) {
        node[clean] = v;
        delete node[k];
        renamed += 1;
      }
    }
  };
  const walk = (node) => {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node.responses && typeof node.responses === 'object') normalizeObject(node.responses);
    for (const value of Object.values(node)) walk(value);
  };
  walk(doc);
  return renamed;
}

function coerceStringSchemasToLoose(doc) {
  let coerced = 0;
  const walk = (node, inSchemaContext = false) => {
    if (node == null) return node;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        node[i] = walk(node[i], inSchemaContext);
      }
      return node;
    }
    if (typeof node !== 'object') return node;
    if (node.schema && typeof node.schema === 'string') {
      coerced += 1;
      node.schema = { type: 'object', additionalProperties: true, 'x-sdk-coerced-from': 'string-schema' };
    }
    if (node.properties && typeof node.properties === 'object') {
      for (const [propName, propValue] of Object.entries(node.properties)) {
        if (typeof propValue === 'string') {
          coerced += 1;
          node.properties[propName] = { type: 'object', additionalProperties: true, 'x-sdk-coerced-from': 'string-property' };
        }
      }
    }
    for (const [k, v] of Object.entries(node)) {
      node[k] = walk(v, inSchemaContext);
    }
    return node;
  };
  walk(doc);
  return coerced;
}

function main() {
  const input = path.resolve(__dirname, '..', '..', 'contracts', 'openapi.json');
  const output = path.resolve(__dirname, '..', '..', 'contracts', 'openapi.sdk.json');
  const doc = JSON.parse(fs.readFileSync(input, 'utf8'));
  const refs = stripBadRefs(doc);
  const keys = normalizeResponseKeys(doc);
  const schemas = coerceStringSchemasToLoose(doc);
  fs.writeFileSync(output, JSON.stringify(doc, null, 2));
  console.log(`Wrote ${output}`);
  console.log(`Stubbed ${refs} unresolved $refs, unquoted ${keys} response keys, coerced ${schemas} string-shaped schemas.`);
}

if (require.main === module) main();

module.exports = { stripBadRefs, resolveRef, normalizeResponseKeys, coerceStringSchemasToLoose };
