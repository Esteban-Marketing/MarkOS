'use strict';

const { banner } = require('./cli-runtime.cjs');
const { loadRuntimeConfig } = require('../onboarding/backend/runtime-context.cjs');
const { planImport, applyImportPlan } = require('../onboarding/backend/vault/import-engine.cjs');

function summarizeItems(items = []) {
  return items.reduce((totals, item) => {
    const key = item?.outcome || item?.proposed_outcome;
    if (Object.prototype.hasOwnProperty.call(totals, key)) {
      totals[key] += 1;
    }
    return totals;
  }, {
    imported: 0,
    imported_with_warnings: 0,
    blocked: 0,
    skipped: 0,
  });
}

function writeLine(output, line = '') {
  output(String(line));
}

function resolveProjectSlug(cli, config) {
  return cli.projectSlug || config.project_slug || 'markos-client';
}

function printPlan(output, items) {
  if (items.length === 0) {
    writeLine(output, 'No importable MIR or MSP markdown files were found.');
    return;
  }

  writeLine(output, 'Canonical destination preview:');
  for (const item of items) {
    const outcome = item.proposed_outcome || item.outcome || 'skipped';
    writeLine(output, `- [${outcome}] ${item.source_path} -> ${item.destination_path}`);
    if (item.reason) {
      writeLine(output, `  Reason: ${item.reason}`);
    }
    if (Array.isArray(item.warnings) && item.warnings.length > 0) {
      writeLine(output, `  Warnings: ${item.warnings.join(' | ')}`);
    }
  }
}

function printTotals(output, totals) {
  writeLine(output, 'Outcome totals:');
  writeLine(output, `- imported: ${totals.imported}`);
  writeLine(output, `- imported_with_warnings: ${totals.imported_with_warnings}`);
  writeLine(output, `- blocked: ${totals.blocked}`);
  writeLine(output, `- skipped: ${totals.skipped}`);
}

async function runImportLegacyCLI({
  cli = {},
  output = console.log,
  runtimeLoader = loadRuntimeConfig,
  planner = planImport,
  applier = applyImportPlan,
} = {}) {
  const config = runtimeLoader(process.env);
  const projectSlug = resolveProjectSlug(cli, config);

  banner('MarkOS Legacy Importer');
  writeLine(output, `Project slug: ${projectSlug}`);
  writeLine(output, `Canonical vault root: ${config.canonical_vault?.root_path || config.vault_root_path || 'MarkOS-Vault'}`);
  writeLine(output, 'Mode: one-way import from legacy MIR/MSP into canonical vault notes');
  writeLine(output, 'Legacy MIR/MSP content remains untouched and stays as migration reference only.');
  writeLine(output);

  const plan = planner({ config, projectSlug });
  const plannedItems = plan.items || [];
  printPlan(output, plannedItems);
  printTotals(output, summarizeItems(plannedItems));

  if (!cli.apply) {
    writeLine(output);
    writeLine(output, 'Scan complete. Re-run with --apply to write canonical vault notes and a durable report note.');
    return { ok: true, mode: 'scan', plan };
  }

  writeLine(output);
  writeLine(output, 'Applying import plan...');
  const applied = applier({
    config,
    projectSlug,
    plan,
    surface: 'cli',
  });
  const totals = summarizeItems(applied.items || []);
  printTotals(output, totals);
  writeLine(output, `Report note: ${applied.report_note_path}`);
  writeLine(output, 'Apply complete. Legacy MIR/MSP files remain in place.');

  return { ok: true, mode: 'apply', plan, applied };
}

module.exports = {
  runImportLegacyCLI,
  summarizeItems,
};