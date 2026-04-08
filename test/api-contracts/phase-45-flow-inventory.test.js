/**
 * test/api-contracts/phase-45-flow-inventory.test.js
 *
 * Automated gate for Phase 45 flow inventory and contract mapping integrity.
 * Covers: inventory shape, unique flow_id values, taxonomy enum constraints,
 * mapping completeness, orphan detection, schema/contract file existence.
 *
 * Run: node --test test/api-contracts/phase-45-flow-inventory.test.js
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// ─── Paths ───────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '../..');
const REGISTRY_PATH = path.join(ROOT, 'contracts', 'flow-registry.json');
const TAXONOMY_PATH = path.join(ROOT, '.planning', 'FLOW-TAXONOMY.json');
const INVENTORY_PATH = path.join(ROOT, '.planning', 'FLOW-INVENTORY.md');
const CONTRACTS_MD_PATH = path.join(ROOT, '.planning', 'FLOW-CONTRACTS.md');
const SCHEMA_PATH = path.join(ROOT, 'contracts', 'schema.json');
const VALIDATOR_PATH = path.join(ROOT, 'bin', 'validate-flow-contracts.cjs');
const CONTRACTS_DIR = path.join(ROOT, 'contracts');

// ─── Fixtures ──────────────────────────────────────────────────────────────
const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
const inventoryMd = fs.readFileSync(INVENTORY_PATH, 'utf8');
const contractsMd = fs.readFileSync(CONTRACTS_MD_PATH, 'utf8');

const EXPECTED_FLOW_IDS = [
  'F-01','F-02','F-03','F-04','F-05','F-06','F-07','F-08','F-09',
  'F-10','F-11','F-12','F-13','F-14','F-15','F-16','F-17',
];
const registryIds = new Set(registry.flows.map((flow) => flow.flow_id));

// ─── Group 1: FLOW-INVENTORY.md shape and presence ─────────────────────────
test('FLOW-INVENTORY contains at least 10 flow rows', () => {
  const rows = inventoryMd.match(/^\| F-\d+/gm) || [];
  assert.ok(rows.length >= 10, `Expected >=10 flow rows, got ${rows.length}`);
});

test('FLOW-INVENTORY contains exactly 17 flow rows', () => {
  const rows = inventoryMd.match(/^\| F-\d+/gm) || [];
  assert.equal(rows.length, 17, `Expected 17 flow rows, got ${rows.length}`);
});

test('FLOW-INVENTORY references FLOW-CONTRACTS.md (traceability)', () => {
  assert.ok(
    inventoryMd.includes('FLOW-CONTRACTS') || inventoryMd.includes('flow-registry'),
    'FLOW-INVENTORY.md should reference the registry or contracts ledger'
  );
});

// ─── Group 2: flow-registry.json shape ─────────────────────────────────────
test('flow-registry contains exactly 17 flows', () => {
  assert.equal(registry.flows.length, 17, `Expected 17, got ${registry.flows.length}`);
});

test('flow-registry flow_ids match expected set', () => {
  const ids = registry.flows.map(f => f.flow_id).sort();
  assert.deepEqual(ids, EXPECTED_FLOW_IDS.slice().sort());
});

test('flow-registry flow_ids are unique', () => {
  const ids = registry.flows.map(f => f.flow_id);
  const unique = new Set(ids);
  assert.equal(unique.size, ids.length, `Duplicate flow_id found: ${ids.join(',')}`);
});

test('every registry flow has required fields', () => {
  const required = ['flow_id','flow_name','domain','flow_type','method','handler','actor','slo_tier'];
  for (const flow of registry.flows) {
    for (const field of required) {
      assert.ok(flow[field], `Flow ${flow.flow_id} missing field: ${field}`);
    }
  }
});

// ─── Group 3: Taxonomy enum constraints ────────────────────────────────────
test('all registry domains are valid taxonomy enums', () => {
  const validDomains = new Set(taxonomy.domains);
  for (const flow of registry.flows) {
    assert.ok(
      validDomains.has(flow.domain),
      `Flow ${flow.flow_id} has unknown domain: "${flow.domain}". Valid: ${[...validDomains].join(',')}`
    );
  }
});

test('all registry flow_types are valid taxonomy enums', () => {
  const validTypes = new Set(taxonomy.flow_types);
  for (const flow of registry.flows) {
    assert.ok(
      validTypes.has(flow.flow_type),
      `Flow ${flow.flow_id} has unknown flow_type: "${flow.flow_type}". Valid: ${[...validTypes].join(',')}`
    );
  }
});

test('unknown domain label fails assertion (D-17 guard)', () => {
  const validDomains = new Set(taxonomy.domains);
  assert.ok(!validDomains.has('event'), 'event should not be a valid domain');
  assert.ok(!validDomains.has('async'), 'async should not be a valid domain');
});

test('unknown flow_type label fails assertion (D-17 guard)', () => {
  const validTypes = new Set(taxonomy.flow_types);
  assert.ok(!validTypes.has('event'), 'event should not be a valid flow_type');
  assert.ok(!validTypes.has('async'), 'async should not be a valid flow_type');
  assert.ok(!validTypes.has('webhook'), 'webhook should not be a valid flow_type');
});

// ─── Group 4: Contract file existence ───────────────────────────────────────
test('every registry flow has a corresponding contract YAML file', () => {
  const contractFiles = fs.readdirSync(CONTRACTS_DIR).filter(f => /^F-\d{2}.*-v1\.yaml$/.test(f));
  for (const flow of registry.flows) {
    const match = contractFiles.find(f => f.startsWith(flow.flow_id + '-'));
    assert.ok(match, `No contract file found for ${flow.flow_id} (${flow.flow_name})`);
    const fullPath = path.join(CONTRACTS_DIR, match);
    assert.ok(fs.existsSync(fullPath), `Contract file missing on disk: ${fullPath}`);
  }
});

test('phase 45 registry flows each map to exactly one v1 contract YAML file', () => {
  const contractFiles = fs.readdirSync(CONTRACTS_DIR).filter(f => /^F-\d{2}.*-v1\.yaml$/.test(f));
  const registryContractFiles = contractFiles.filter((file) => registryIds.has(file.match(/^(F-\d{2})/)[1]));

  assert.equal(
    registryContractFiles.length,
    registry.flows.length,
    `Expected ${registry.flows.length} phase-45 contract files, got ${registryContractFiles.length}`
  );

  for (const flow of registry.flows) {
    const matches = registryContractFiles.filter((file) => file.startsWith(flow.flow_id + '-'));
    assert.equal(matches.length, 1, `Expected exactly one contract file for ${flow.flow_id}, got ${matches.length}`);
  }
});

test('phase 45 registry has no orphaned contracts within its own flow-id scope', () => {
  const contractFiles = fs.readdirSync(CONTRACTS_DIR).filter(f => /^F-\d{2}.*-v1\.yaml$/.test(f));
  for (const file of contractFiles) {
    const id = file.match(/^(F-\d{2})/)[1];
    if (EXPECTED_FLOW_IDS.includes(id)) {
      assert.ok(registryIds.has(id), `Phase 45 contract file ${file} is missing a registry entry`);
    }
  }
});

// ─── Group 5: FLOW-CONTRACTS.md ledger integrity ────────────────────────────
test('FLOW-CONTRACTS.md declares total_flows=17', () => {
  assert.ok(contractsMd.includes('total_flows=17'), 'FLOW-CONTRACTS.md must declare total_flows=17');
});

test('FLOW-CONTRACTS.md declares orphaned_flows=0', () => {
  assert.ok(contractsMd.includes('orphaned_flows=0'), 'FLOW-CONTRACTS.md must declare orphaned_flows=0');
});

test('FLOW-CONTRACTS.md declares flows_without_contracts=0', () => {
  assert.ok(contractsMd.includes('flows_without_contracts=0'), 'FLOW-CONTRACTS.md must declare flows_without_contracts=0');
});

test('FLOW-CONTRACTS.md references FLOW-INVENTORY.md (traceability)', () => {
  assert.ok(
    contractsMd.includes('FLOW-INVENTORY') || contractsMd.includes('flow-registry'),
    'FLOW-CONTRACTS.md must reference FLOW-INVENTORY.md or flow-registry.json'
  );
});

// ─── Group 6: Schema validation via validate-flow-contracts.cjs ─────────────
test('validate-flow-contracts passes full-registry mode (all 17 valid)', () => {
  let output = '';
  try {
    output = execFileSync(
      process.execPath,
      [VALIDATOR_PATH, '--schema', SCHEMA_PATH, '--registry', REGISTRY_PATH],
      { encoding: 'utf8', cwd: ROOT }
    );
  } catch (err) {
    assert.fail(`Validator exited non-zero:\n${err.stdout || ''}\n${err.stderr || ''}`);
  }
  assert.ok(output.includes('17/17 contracts valid'), `Expected "17/17 contracts valid" in output:\n${output}`);
});
