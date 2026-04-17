#!/usr/bin/env node
'use strict';

const { runDraft } = require('./lib/generate-runner.cjs');

function parseArgs(argv) {
  const parsed = { brief: null, inline: {} };
  const inlineKeys = ['channel', 'audience', 'pain', 'promise', 'brand'];
  if (argv[0] === 'generate') argv = argv.slice(1);
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--brief' && argv[i + 1]) {
      parsed.brief = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith('--brief=')) {
      parsed.brief = token.slice('--brief='.length);
      continue;
    }
    const eqMatch = token.match(/^--([A-Za-z0-9_-]+)=(.*)$/);
    if (eqMatch && inlineKeys.includes(eqMatch[1])) {
      parsed.inline[eqMatch[1]] = eqMatch[2];
      continue;
    }
    if (!parsed.brief && !token.startsWith('--')) {
      parsed.brief = token;
    }
  }
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = args.brief || args.inline;
  if (typeof source === 'string' && !source) {
    process.stderr.write('usage: markos generate <brief.yaml> | --brief=<path> | --channel=... --audience=... --pain=... --promise=... --brand=...\n');
    process.exit(2);
  }
  if (typeof source === 'object' && Object.keys(source).length === 0) {
    process.stderr.write('no brief provided. Pass a file path or inline flags.\n');
    process.exit(2);
  }

  let result;
  try {
    result = await runDraft(source);
  } catch (error) {
    process.stdout.write(JSON.stringify({ success: false, error: 'RUNTIME_ERROR', message: error.message }) + '\n');
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.success || (result.audit && result.audit.status === 'fail')) {
    process.exit(1);
  }
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, main };
