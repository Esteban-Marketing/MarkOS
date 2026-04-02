#!/usr/bin/env node
/**
 * extract-flows.cjs — Read-only flow extraction CLI (Phase 45)
 *
 * Parses source files using fs.readFileSync + regex/string scanning ONLY.
 * Does NOT require() any runtime modules (satisfies D-11).
 *
 * Usage:
 *   node bin/extract-flows.cjs --out contracts/flow-registry.json
 *   node bin/extract-flows.cjs --out contracts/flow-registry.json --taxonomy .planning/FLOW-TAXONOMY.json
 *
 * Exit codes:
 *   0 — success
 *   1 — validation failure (missing route, handler, wrapper, or enum violation)
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Canonical flow registry (sourced from 45-RESEARCH.md) ──────────────────
// flow_id     : locked F-01..F-17
// method      : HTTP method
// local_path  : path on onboarding/backend/server.cjs
// hosted_path : path in api/* wrapper, or "" for local-only flows
// handler     : exported name in handlers.cjs
// actor       : Operator | System | Admin
// auth_local  : auth requirement on local entrypoint
// auth_hosted : auth requirement on hosted entrypoint
// slo_tier    : critical | standard
// domain      : locked enum
// flow_type   : locked enum
// flow_name   : kebab-case canonical name
const CANONICAL_FLOWS = [
  { flow_id: 'F-01', flow_name: 'client-intake-submit',     method: 'POST', local_path: '/submit',                    hosted_path: '/api/submit',              handler: 'handleSubmit',             actor: 'Operator', auth_local: 'none',                     auth_hosted: 'none',                          slo_tier: 'critical',  domain: 'onboarding',   flow_type: 'submission'    },
  { flow_id: 'F-02', flow_name: 'draft-approve',            method: 'POST', local_path: '/approve',                   hosted_path: '/api/approve',             handler: 'handleApprove',            actor: 'Operator', auth_local: 'none',                     auth_hosted: 'none',                          slo_tier: 'standard',  domain: 'execution',    flow_type: 'approval'     },
  { flow_id: 'F-03', flow_name: 'section-regenerate',       method: 'POST', local_path: '/regenerate',                hosted_path: '/api/regenerate',          handler: 'handleRegenerate',         actor: 'Operator', auth_local: 'none',                     auth_hosted: 'none',                          slo_tier: 'standard',  domain: 'execution',    flow_type: 'regeneration' },
  { flow_id: 'F-04', flow_name: 'system-config-read',       method: 'GET',  local_path: '/config',                    hosted_path: '/api/config',              handler: 'handleConfig',             actor: 'System',   auth_local: 'none',                     auth_hosted: 'config_read Supabase JWT',      slo_tier: 'standard',  domain: 'reporting',    flow_type: 'query'        },
  { flow_id: 'F-05', flow_name: 'system-status-health',     method: 'GET',  local_path: '/status',                    hosted_path: '/api/status',              handler: 'handleStatus',             actor: 'System',   auth_local: 'none',                     auth_hosted: 'status_read Supabase JWT',      slo_tier: 'standard',  domain: 'reporting',    flow_type: 'health_check' },
  { flow_id: 'F-06', flow_name: 'linear-task-sync',         method: 'POST', local_path: '/linear/sync',               hosted_path: '/api/linear/sync',         handler: 'handleLinearSync',         actor: 'System',   auth_local: 'none',                     auth_hosted: 'none',                          slo_tier: 'standard',  domain: 'integration',  flow_type: 'sync'         },
  { flow_id: 'F-07', flow_name: 'campaign-result-record',   method: 'POST', local_path: '/campaign/result',           hosted_path: '/api/campaign/result',     handler: 'handleCampaignResult',     actor: 'System',   auth_local: 'none',                     auth_hosted: 'none',                          slo_tier: 'standard',  domain: 'integration',  flow_type: 'record'       },
  { flow_id: 'F-08', flow_name: 'markosdb-migrate',         method: 'POST', local_path: '/migrate/local-to-cloud',    hosted_path: '/api/migrate',             handler: 'handleMarkosdbMigration',  actor: 'Operator', auth_local: 'none',                     auth_hosted: 'migration_write Supabase JWT',  slo_tier: 'standard',  domain: 'migration',    flow_type: 'migration'    },
  { flow_id: 'F-09', flow_name: 'literacy-coverage-report', method: 'GET',  local_path: '/api/literacy/coverage',     hosted_path: '/api/literacy/coverage',   handler: 'handleLiteracyCoverage',   actor: 'Operator', auth_local: 'none',                     auth_hosted: 'status_read Supabase JWT',      slo_tier: 'standard',  domain: 'reporting',    flow_type: 'query'        },
  { flow_id: 'F-10', flow_name: 'literacy-admin-health',    method: 'GET',  local_path: '/admin/literacy/health',     hosted_path: '',                         handler: 'handleLiteracyHealth',     actor: 'Admin',    auth_local: 'Admin secret header',      auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'admin',        flow_type: 'health_check' },
  { flow_id: 'F-11', flow_name: 'literacy-admin-query',     method: 'POST', local_path: '/admin/literacy/query',      hosted_path: '',                         handler: 'handleLiteracyQuery',      actor: 'Admin',    auth_local: 'Admin secret header',      auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'admin',        flow_type: 'query'        },
  { flow_id: 'F-12', flow_name: 'ai-interview-generate-q',  method: 'POST', local_path: '/api/generate-question',     hosted_path: '',                         handler: 'handleGenerateQuestion',   actor: 'System',   auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'query'        },
  { flow_id: 'F-13', flow_name: 'ai-interview-parse-answer', method: 'POST', local_path: '/api/parse-answer',         hosted_path: '',                         handler: 'handleParseAnswer',        actor: 'System',   auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'query'        },
  { flow_id: 'F-14', flow_name: 'source-extraction',        method: 'POST', local_path: '/api/extract-sources',       hosted_path: '',                         handler: 'handleExtractSources',     actor: 'System',   auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'enrichment'   },
  { flow_id: 'F-15', flow_name: 'extract-and-score',        method: 'POST', local_path: '/api/extract-and-score',     hosted_path: '',                         handler: 'handleExtractAndScore',    actor: 'System',   auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'enrichment'   },
  { flow_id: 'F-16', flow_name: 'spark-suggestion',         method: 'POST', local_path: '/api/spark-suggestion',      hosted_path: '',                         handler: 'handleSparkSuggestion',    actor: 'System',   auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'enrichment'   },
  { flow_id: 'F-17', flow_name: 'competitor-discovery',     method: 'POST', local_path: '/api/competitor-discovery',  hosted_path: '',                         handler: 'handleCompetitorDiscovery', actor: 'System',  auth_local: 'none',                     auth_hosted: 'N/A (local only)',              slo_tier: 'standard',  domain: 'enrichment',   flow_type: 'enrichment'   },
];

// ── Hosted API wrapper mapping: hosted_path → api/* file path ──────────────
const HOSTED_WRAPPER_MAP = {
  '/api/submit':            'api/submit.js',
  '/api/approve':           'api/approve.js',
  '/api/regenerate':        'api/regenerate.js',
  '/api/config':            'api/config.js',
  '/api/status':            'api/status.js',
  '/api/linear/sync':       'api/linear/sync.js',
  '/api/campaign/result':   'api/campaign/result.js',
  '/api/migrate':           'api/migrate.js',
  '/api/literacy/coverage': 'api/literacy/coverage.js',
};

// ── Parse CLI args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const taxIdx = args.indexOf('--taxonomy');
const helpIdx = args.indexOf('--help');

if (helpIdx !== -1) {
  console.log('Usage: node bin/extract-flows.cjs --out <output.json> [--taxonomy <taxonomy.json>]');
  process.exit(0);
}

if (outIdx === -1 || !args[outIdx + 1]) {
  console.error('Error: --out <path> is required');
  process.exit(1);
}

const outPath      = args[outIdx + 1];
const taxonomyPath = taxIdx !== -1 ? args[taxIdx + 1] : null;

if (taxIdx !== -1 && !taxonomyPath) {
  console.error('Error: --taxonomy requires a path argument');
  process.exit(1);
}

// ── Resolve paths ──────────────────────────────────────────────────────────
const ROOT          = path.resolve(__dirname, '..');
const SERVER_PATH   = path.join(ROOT, 'onboarding', 'backend', 'server.cjs');
const HANDLERS_PATH = path.join(ROOT, 'onboarding', 'backend', 'handlers.cjs');

// ── Read source files (string scan only — no require()) ────────────────────
const serverSrc   = fs.readFileSync(SERVER_PATH, 'utf8');
const handlersSrc = fs.readFileSync(HANDLERS_PATH, 'utf8');

const errors = [];

// ── Validate: find unique flow_id values ───────────────────────────────────
const seenIds = new Set();
for (const f of CANONICAL_FLOWS) {
  if (seenIds.has(f.flow_id)) {
    errors.push(`Duplicate flow_id: ${f.flow_id}`);
  }
  seenIds.add(f.flow_id);
}

// ── Validate: each route appears in server.cjs ─────────────────────────────
for (const f of CANONICAL_FLOWS) {
  // Build patterns to search for: method STRING and local_path STRING near the handler
  const methodPat = f.method === 'GET' ? 'GET' : 'POST';
  const routeQuote = f.local_path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const routeRe = new RegExp(`req\\.method.*===.*['"]${methodPat}['"].*${routeQuote}|${routeQuote}.*req\\.method.*${methodPat}`, 'i');
  if (!routeRe.test(serverSrc)) {
    errors.push(`Route not found in server.cjs: ${f.method} ${f.local_path}`);
  }
}

// ── Validate: each handler appears in handlers.cjs exports ───────────────
for (const f of CANONICAL_FLOWS) {
  if (!handlersSrc.includes(f.handler)) {
    errors.push(`Handler not found in handlers.cjs: ${f.handler}`);
  }
}

// ── Validate: hosted_path wrappers exist in api/* ─────────────────────────
for (const f of CANONICAL_FLOWS) {
  if (!f.hosted_path) continue;    // local-only flow, skip
  const wrapperRel = HOSTED_WRAPPER_MAP[f.hosted_path];
  if (!wrapperRel) {
    errors.push(`No wrapper mapping registered for hosted_path: ${f.hosted_path} (${f.flow_id})`);
    continue;
  }
  const wrapperPath = path.join(ROOT, wrapperRel);
  if (!fs.existsSync(wrapperPath)) {
    errors.push(`Hosted wrapper file missing: ${wrapperRel} (${f.flow_id} ${f.hosted_path})`);
    continue;
  }
  // Verify wrapper calls the correct handler
  const wrapperSrc = fs.readFileSync(wrapperPath, 'utf8');
  if (!wrapperSrc.includes(f.handler)) {
    errors.push(`Hosted wrapper ${wrapperRel} does not reference handler ${f.handler}`);
  }
}

// ── Validate: taxonomy enums (if --taxonomy provided) ────────────────────
let taxonomy = null;
if (taxonomyPath) {
  const taxAbsolute = path.isAbsolute(taxonomyPath) ? taxonomyPath : path.join(ROOT, taxonomyPath);
  if (!fs.existsSync(taxAbsolute)) {
    errors.push(`Taxonomy file not found: ${taxonomyPath}`);
  } else {
    try {
      taxonomy = JSON.parse(fs.readFileSync(taxAbsolute, 'utf8'));
    } catch (e) {
      errors.push(`Failed to parse taxonomy JSON: ${e.message}`);
    }
  }
}

if (taxonomy) {
  const validDomains    = new Set(taxonomy.domains || []);
  const validFlowTypes  = new Set(taxonomy.flow_types || []);
  for (const f of CANONICAL_FLOWS) {
    if (!validDomains.has(f.domain)) {
      errors.push(`Unknown domain '${f.domain}' in ${f.flow_id} (not in taxonomy)`);
    }
    if (!validFlowTypes.has(f.flow_type)) {
      errors.push(`Unknown flow_type '${f.flow_type}' in ${f.flow_id} (not in taxonomy)`);
    }
    // Ensure every flow_id in registry has classification in taxonomy
    if (taxonomy.classification && !taxonomy.classification[f.flow_id]) {
      errors.push(`Missing classification for ${f.flow_id} in taxonomy`);
    }
  }
}

// ── Report errors and exit on failure ────────────────────────────────────
if (errors.length > 0) {
  console.error('Extraction validation failed:');
  for (const e of errors) {
    console.error(`  ✗ ${e}`);
  }
  process.exit(1);
}

// ── Build output registry (sorted by flow_id) ────────────────────────────
const registry = {
  generated_at: new Date().toISOString(),
  phase:        '45-operations-flow-inventory-contract-map',
  source_files: [
    'onboarding/backend/server.cjs',
    'onboarding/backend/handlers.cjs',
  ],
  total_flows: CANONICAL_FLOWS.length,
  flows: CANONICAL_FLOWS.map(f => ({
    flow_id:     f.flow_id,
    flow_name:   f.flow_name,
    method:      f.method,
    local_path:  f.local_path,
    hosted_path: f.hosted_path,
    handler:     f.handler,
    actor:       f.actor,
    auth_local:  f.auth_local,
    auth_hosted: f.auth_hosted,
    slo_tier:    f.slo_tier,
    domain:      f.domain,
    flow_type:   f.flow_type,
  })),
};

// ── Write output ──────────────────────────────────────────────────────────
const outAbsolute = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath);
const outDir = path.dirname(outAbsolute);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(outAbsolute, JSON.stringify(registry, null, 2) + '\n');
console.log(`✓ Flow registry written to ${outPath}`);
console.log(`  ${registry.total_flows} flows extracted and validated`);
if (taxonomy) {
  console.log(`  Taxonomy enum validation passed (${taxonomy.domains.length} domains, ${taxonomy.flow_types.length} flow_types)`);
}
