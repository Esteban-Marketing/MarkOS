#!/usr/bin/env node
/**
 * validate-flow-contracts.cjs
 * Phase 45 — Operations Flow Inventory & Canonical Contract Map
 *
 * Validates flow contract YAML files against contracts/schema.json.
 * Supports subset mode for wave-safe first-batch execution.
 *
 * Usage:
 *   node bin/validate-flow-contracts.cjs --help
 *   node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json
 *   node bin/validate-flow-contracts.cjs --schema contracts/schema.json --registry contracts/flow-registry.json --subset F-01,F-02,F-03
 *
 * Exit codes:
 *   0 — all contracts valid
 *   1 — validation failure or missing required arguments
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal YAML parser — handles the simple flat structure used in MarkOS
// contract stubs (string scalars, nested objects). No dependencies required.
// ---------------------------------------------------------------------------
function parseYaml(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1 }];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*#/.test(raw) || /^\s*$/.test(raw)) continue;

    const indent = raw.search(/\S/);
    const line = raw.trim();

    // Pop stack to current indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    const parent = stack[stack.length - 1].obj;

    if (rest === '' || rest === null) {
      // Nested object — look ahead to see if next non-empty line is deeper
      const nested = {};
      parent[key] = nested;
      stack.push({ obj: nested, indent });
    } else {
      // Scalar value — strip optional quotes
      let val = rest;
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      parent[key] = val;
    }
  }

  return root;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function validateContract(contract, schema, filePath) {
  const errors = [];

  // Required top-level fields
  for (const req of schema.required || []) {
    if (!(req in contract)) {
      errors.push(`Missing required field: ${req}`);
    }
  }

  // flow_id pattern
  if (contract.flow_id && !/^F-[0-9]{2}$/.test(contract.flow_id)) {
    errors.push(`flow_id "${contract.flow_id}" does not match pattern ^F-[0-9]{2}$`);
  }

  // version pattern
  if (contract.version && !/^v[0-9]+$/.test(contract.version)) {
    errors.push(`version "${contract.version}" does not match pattern ^v[0-9]+$`);
  }

  // openapi const
  if (contract.openapi && contract.openapi !== '3.0.3') {
    errors.push(`openapi must be "3.0.3" (D-07), got "${contract.openapi}"`);
  }

  // domain enum
  const domainEnum = schema.properties.domain.enum;
  if (contract.domain && !domainEnum.includes(contract.domain)) {
    errors.push(`domain "${contract.domain}" not in locked enum: ${domainEnum.join(', ')}`);
  }

  // flow_type enum
  const flowTypeEnum = schema.properties.flow_type.enum;
  if (contract.flow_type && !flowTypeEnum.includes(contract.flow_type)) {
    errors.push(`flow_type "${contract.flow_type}" not in locked enum: ${flowTypeEnum.join(', ')}`);
  }

  // D-17: Reject event/async-only contract types
  const asyncKeywords = ['event', 'async', 'websocket', 'sse', 'stream'];
  const contractText = JSON.stringify(contract).toLowerCase();
  for (const kw of asyncKeywords) {
    if (contractText.includes(`"flow_type":"${kw}"`) || contractText.includes(`"type":"${kw}"`)) {
      errors.push(`D-17 violation: async/event contract type "${kw}" is prohibited in Phase 45`);
    }
  }

  // x-markos-meta actor enum
  if (contract['x-markos-meta'] && contract['x-markos-meta'].actor) {
    const actorEnum = schema.properties['x-markos-meta'].properties.actor.enum;
    if (!actorEnum.includes(contract['x-markos-meta'].actor)) {
      errors.push(`x-markos-meta.actor "${contract['x-markos-meta'].actor}" not in enum: ${actorEnum.join(', ')}`);
    }
  }

  // x-markos-meta slo_tier enum
  if (contract['x-markos-meta'] && contract['x-markos-meta'].slo_tier) {
    const sloEnum = schema.properties['x-markos-meta'].properties.slo_tier.enum;
    if (!sloEnum.includes(contract['x-markos-meta'].slo_tier)) {
      errors.push(`x-markos-meta.slo_tier "${contract['x-markos-meta'].slo_tier}" not in enum: ${sloEnum.join(', ')}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { schema: null, registry: null, subset: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--help': case '-h':
        args.help = true;
        break;
      case '--schema':
        args.schema = argv[++i];
        break;
      case '--registry':
        args.registry = argv[++i];
        break;
      case '--subset':
        args.subset = argv[++i];
        break;
    }
  }
  return args;
}

function printHelp() {
  console.log(`
validate-flow-contracts.cjs — Phase 45 contract schema validator

Usage:
  node bin/validate-flow-contracts.cjs --schema <path> --registry <path> [--subset <ids>]
  node bin/validate-flow-contracts.cjs --help

Options:
  --schema <path>      Path to contracts/schema.json (required)
  --registry <path>    Path to contracts/flow-registry.json (required)
  --subset <ids>       Comma-separated flow IDs to validate (e.g. F-01,F-02,F-03)
                       When omitted, validates all flows listed in the registry.
  --help               Show this help message

Modes:
  Full-registry mode   Validates ALL flows in registry have a matching contract
                       and each contract passes schema validation.
  Subset mode          Validates only the specified flow IDs. Useful for wave-safe
                       first-batch execution before all contracts exist.

Exit codes:
  0   All validated contracts pass
  1   One or more validation failures, missing contracts, or argument errors

Examples:
  node bin/validate-flow-contracts.cjs \\
    --schema contracts/schema.json \\
    --registry contracts/flow-registry.json

  node bin/validate-flow-contracts.cjs \\
    --schema contracts/schema.json \\
    --registry contracts/flow-registry.json \\
    --subset F-01,F-02,F-03,F-04,F-05,F-06,F-07,F-08
`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.schema || !args.registry) {
    console.error('Error: --schema and --registry are required arguments');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  // Load schema
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(args.schema, 'utf8'));
  } catch (err) {
    console.error(`Error: Could not load schema from "${args.schema}": ${err.message}`);
    process.exit(1);
  }

  // Load registry
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(args.registry, 'utf8'));
  } catch (err) {
    console.error(`Error: Could not load registry from "${args.registry}": ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(registry.flows)) {
    console.error('Error: registry.flows is not an array');
    process.exit(1);
  }

  // Determine which flow IDs to validate
  let targetIds;
  if (args.subset) {
    targetIds = args.subset.split(',').map(s => s.trim()).filter(Boolean);
    // Validate subset IDs exist in registry
    const registryIds = new Set(registry.flows.map(f => f.flow_id));
    const unknown = targetIds.filter(id => !registryIds.has(id));
    if (unknown.length > 0) {
      console.error(`Error: Subset contains unknown flow IDs: ${unknown.join(', ')}`);
      process.exit(1);
    }
    console.log(`Subset mode: validating ${targetIds.length} flows (${targetIds.join(', ')})`);
  } else {
    targetIds = registry.flows.map(f => f.flow_id);
    console.log(`Full-registry mode: validating ${targetIds.length} flows`);
  }

  // Resolve contract files directory
  const contractsDir = path.dirname(args.schema);

  let totalErrors = 0;
  let validated = 0;

  for (const flowId of targetIds) {
    // Find YAML file matching the flow ID
    let contractFile;
    try {
      const files = fs.readdirSync(contractsDir);
      const match = files.find(f => f.startsWith(`${flowId}-`) && f.endsWith('.yaml'));
      if (!match) {
        console.error(`  ✗ ${flowId}: No contract file found (expected ${flowId}-*.yaml in ${contractsDir})`);
        totalErrors++;
        continue;
      }
      contractFile = path.join(contractsDir, match);
    } catch (err) {
      console.error(`  ✗ ${flowId}: Could not read contracts directory: ${err.message}`);
      totalErrors++;
      continue;
    }

    // Load and parse YAML
    let contract;
    try {
      const text = fs.readFileSync(contractFile, 'utf8');
      contract = parseYaml(text);
    } catch (err) {
      console.error(`  ✗ ${flowId}: Failed to parse YAML in ${contractFile}: ${err.message}`);
      totalErrors++;
      continue;
    }

    // Validate
    const errors = validateContract(contract, schema, contractFile);
    if (errors.length > 0) {
      console.error(`  ✗ ${flowId} (${path.basename(contractFile)}): ${errors.length} error(s)`);
      for (const e of errors) {
        console.error(`      - ${e}`);
      }
      totalErrors += errors.length;
    } else {
      console.log(`  ✓ ${flowId} (${path.basename(contractFile)})`);
      validated++;
    }
  }

  console.log(`\n${validated}/${targetIds.length} contracts valid${totalErrors > 0 ? ` · ${totalErrors} error(s)` : ''}`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
