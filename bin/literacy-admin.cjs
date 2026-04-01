#!/usr/bin/env node
'use strict';

const runtime = require('../onboarding/backend/runtime-context.cjs');
const vectorStore = require('../onboarding/backend/vector-store-client.cjs');

function usage() {
  console.log('Usage: node bin/literacy-admin.cjs <query|ttl-report|deprecate> [flags]');
}

function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    out[arg.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  }
  return out;
}

async function runQuery(flags) {
  const discipline = flags.discipline;
  const query = flags.query || 'summary';
  if (!discipline) throw new Error('--discipline is required for query');
  const topK = Number(flags.topK || 5) || 5;
  const filters = {
    business_model: flags.business_model || null,
    funnel_stage: flags.funnel_stage || null,
    content_type: flags.content_type || null,
  };
  const matches = await vectorStore.getLiteracyContext(discipline, query, filters, topK);
  return { command: 'query', discipline, query, filters, topK, matches };
}

async function runTtlReport() {
  return {
    command: 'ttl-report',
    note: 'TTL reporting uses markos_literacy_chunks directly; implement SQL reporting in DB client contexts.',
  };
}

async function runDeprecate(flags) {
  if (!flags.doc_id) throw new Error('--doc_id is required for deprecate');
  const result = await vectorStore.supersedeLiteracyDoc(flags.doc_id);
  return { command: 'deprecate', doc_id: flags.doc_id, result };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    usage();
    process.exit(command ? 0 : 1);
  }

  const secretCheck = runtime.validateRequiredSecrets({
    runtimeMode: 'local',
    operation: 'literacy_admin_write',
    env: process.env,
  });
  if (!secretCheck.ok) {
    throw new Error(secretCheck.error);
  }

  vectorStore.configure(runtime.loadRuntimeConfig(process.env));
  const flags = parseFlags(rest);

  let payload;
  if (command === 'query') payload = await runQuery(flags);
  else if (command === 'ttl-report') payload = await runTtlReport();
  else if (command === 'deprecate') payload = await runDeprecate(flags);
  else throw new Error(`Unsupported command: ${command}`);

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
