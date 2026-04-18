#!/usr/bin/env node
// Phase 202 Plan 07: YAML → _generated/tool-schemas.json codegen for AJV runtime validation.
// Reads F-90..F-93 tool contracts, walks the `.tools` map, resolves inline `$ref` pointers
// against each document's `shared` block, and emits { tool_id: { input, output } } JSON.
// Consumed by lib/markos/mcp/ajv.cjs compileToolSchemas at module load (Plan 202-04).
//
// Usage: node scripts/openapi/build-mcp-schemas.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');

const CONTRACTS = [
  'contracts/F-90-mcp-tools-marketing-v1.yaml',
  'contracts/F-91-mcp-tools-crm-v1.yaml',
  'contracts/F-92-mcp-tools-literacy-v1.yaml',
  'contracts/F-93-mcp-tools-tenancy-v1.yaml',
];

const OUT = 'lib/markos/mcp/_generated/tool-schemas.json';

function resolveRef(doc, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  const parts = ref.slice(2).split('/');
  let cur = doc;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return null;
    cur = cur[p];
  }
  return cur;
}

function dereference(schema, doc) {
  if (!schema || typeof schema !== 'object') return schema;
  if (schema.$ref) {
    const resolved = resolveRef(doc, schema.$ref);
    if (!resolved) throw new Error(`unresolved_ref:${schema.$ref}`);
    return dereference(resolved, doc);
  }
  if (Array.isArray(schema)) return schema.map((s) => dereference(s, doc));
  const out = {};
  for (const [k, v] of Object.entries(schema)) out[k] = dereference(v, doc);
  return out;
}

const registry = {};
for (const rel of CONTRACTS) {
  const abs = resolve(ROOT, rel);
  let src;
  try {
    src = readFileSync(abs, 'utf8');
  } catch (err) {
    throw new Error(`contract ${rel} missing: ${err.message}`);
  }
  const doc = YAML.load(src);
  if (!doc || !doc.tools || typeof doc.tools !== 'object') {
    throw new Error(`contract ${rel} missing tools map`);
  }
  for (const [tool_id, spec] of Object.entries(doc.tools)) {
    if (!spec.input || !spec.output) {
      throw new Error(`${rel}:${tool_id} missing input or output`);
    }
    const input = dereference(spec.input, doc);
    const output = dereference(spec.output, doc);
    registry[tool_id] = { input, output };
  }
}

const outAbs = resolve(ROOT, OUT);
mkdirSync(dirname(outAbs), { recursive: true });
writeFileSync(outAbs, JSON.stringify(registry, null, 2) + '\n');

console.log(`[build-mcp-schemas] wrote ${Object.keys(registry).length} tool schemas → ${OUT}`);
