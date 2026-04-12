'use strict';

const fs = require('fs');
const path = require('path');

const { PROJECT_ROOT } = require('../path-constants.cjs');
const { buildFileTimestamp, buildRunReportId } = require('./note-id.cjs');
const { formatCanonicalNote } = require('./note-format.cjs');
const { normalizeRelativePath } = require('./destination-map.cjs');
const { resolveCanonicalVaultRoot } = require('./vault-writer.cjs');

function summarizeOutcomes(items) {
  return items.reduce((totals, item) => {
    const key = item.outcome || 'unknown';
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, { imported: 0, imported_with_warnings: 0, blocked: 0, skipped: 0 });
}

function buildReportBody({ mode, surface, projectSlug, vaultRoot, legacyRoots, items }) {
  const totals = summarizeOutcomes(items);
  const rows = items.map((item) => {
    const source = item.source_key || item.legacy_origin?.relative_path || 'unknown';
    const destination = item.destination_path || 'n/a';
    const noteId = item.note_id || 'n/a';
    const details = [];
    if (item.reason) details.push(item.reason);
    if (item.warnings && item.warnings.length > 0) details.push(...item.warnings);
    if (item.errors && item.errors.length > 0) details.push(...item.errors);
    const detailText = details.join('; ').replace(/\|/g, '/');
    return `| ${source.replace(/\|/g, '/')} | ${destination.replace(/\|/g, '/')} | ${noteId.replace(/\|/g, '/')} | ${item.outcome || 'unknown'} | ${detailText || 'ok'} |`;
  }).join('\n');

  return [
    `Run mode: ${mode}`,
    `Operator surface: ${surface}`,
    `Project slug: ${projectSlug}`,
    `Vault root: ${vaultRoot.relative_root}`,
    `Legacy roots scanned: ${(legacyRoots || []).map((entry) => entry.relative_root || entry).join(', ') || 'none'}`,
    '',
    '## Outcome Totals',
    '',
    `- imported: ${totals.imported}`,
    `- imported_with_warnings: ${totals.imported_with_warnings}`,
    `- blocked: ${totals.blocked}`,
    `- skipped: ${totals.skipped}`,
    '',
    'Legacy MIR/MSP content remains in place as migration reference only.',
    '',
    '## Per-Item Outcomes',
    '',
    '| Source | Destination | Note ID | Outcome | Details |',
    '| --- | --- | --- | --- | --- |',
    rows || '| none | none | none | skipped | No items processed |',
    '',
  ].join('\n');
}

function writeRunReport({ config, projectSlug, mode, surface, items, legacyRoots = [], timestamp = new Date() }) {
  const vaultRoot = resolveCanonicalVaultRoot(config);
  const reportFileName = `${buildFileTimestamp(timestamp)}-${mode}.md`;
  const relativePath = normalizeRelativePath(`${vaultRoot.relative_root}/Memory/Migration Reports/${reportFileName}`);
  const absolutePath = path.resolve(PROJECT_ROOT, relativePath);
  const isoTimestamp = timestamp.toISOString();
  const title = `Migration Report: ${mode}`;
  const body = buildReportBody({
    mode,
    surface,
    projectSlug,
    vaultRoot,
    legacyRoots,
    items,
  });

  const document = formatCanonicalNote({
    title,
    metadata: {
      id: buildRunReportId({ projectSlug, mode, date: timestamp }),
      title,
      vault_family: 'Memory',
      note_family: 'migration_report',
      status: 'complete',
      owner: projectSlug,
      review_cycle: 'monthly',
      created_at: isoTimestamp,
      updated_at: isoTimestamp,
      source_mode: 'native',
      summary: `Run report for ${mode} with ${items.length} item(s).`,
      tags: ['migration-report', mode],
    },
    body,
  });

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, document, 'utf8');

  return {
    report_note_path: relativePath,
    absolute_path: absolutePath,
    note_id: buildRunReportId({ projectSlug, mode, date: timestamp }),
  };
}

module.exports = {
  summarizeOutcomes,
  writeRunReport,
};