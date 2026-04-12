'use strict';

const fs = require('fs');
const path = require('path');

const { PROJECT_ROOT } = require('../path-constants.cjs');
const { listSupportedLegacyMappings, normalizeRelativePath } = require('./destination-map.cjs');
const { prepareCanonicalEntry, classifyPreparedEntry, commitPreparedEntry } = require('./vault-writer.cjs');
const { writeRunReport } = require('./run-report.cjs');
const { sanitizeMarkdownBody } = require('./note-format.cjs');

function resolveLegacyRoots(config) {
  const roots = [];
  const mirRelative = normalizeRelativePath(config?.legacy_outputs?.mir?.output_path || '.markos-local/MIR');
  const mspRelative = normalizeRelativePath(config?.legacy_outputs?.msp?.output_path || '.markos-local/MSP');

  roots.push({ source_root: 'MIR', relative_root: mirRelative, absolute_root: path.resolve(PROJECT_ROOT, mirRelative) });
  roots.push({ source_root: 'MSP', relative_root: mspRelative, absolute_root: path.resolve(PROJECT_ROOT, mspRelative) });
  return roots;
}

function deriveWarnings(content) {
  const warnings = [];
  const sectionCount = (String(content || '').match(/^##\s+/gm) || []).length;
  if (sectionCount >= 5) {
    warnings.push('Source note contains multiple sub-sections and may need manual review.');
  }
  return warnings;
}

function planImport({ config, projectSlug }) {
  const roots = resolveLegacyRoots(config);
  const rootMap = new Map(roots.map((entry) => [entry.source_root, entry]));
  const items = [];

  for (const mapping of listSupportedLegacyMappings()) {
    const root = rootMap.get(mapping.source_root);
    if (!root) {
      continue;
    }

    const absolutePath = path.join(root.absolute_root, ...mapping.relative_path.split('/'));
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const rawContent = fs.readFileSync(absolutePath, 'utf8');
    const body = sanitizeMarkdownBody(rawContent);
    const legacyOrigin = {
      source_root: root.relative_root,
      relative_path: mapping.relative_path,
    };
    const prepared = prepareCanonicalEntry({
      config,
      projectSlug,
      content: body,
      sourceMode: 'imported',
      legacySource: {
        source_root: mapping.source_root,
        relative_path: mapping.relative_path,
        legacy_origin: legacyOrigin,
      },
      metadata: {
        legacy_origin: legacyOrigin,
      },
      warnings: deriveWarnings(body),
    });
    const classified = classifyPreparedEntry(prepared);

    items.push({
      ...classified,
      source_path: normalizeRelativePath(`${root.relative_root}/${mapping.relative_path}`),
      proposed_outcome: classified.outcome,
    });
  }

  return {
    items,
    legacy_roots: roots,
  };
}

function applyImportPlan({ config, projectSlug, plan, surface = 'cli' }) {
  const items = (plan?.items || []).map((item) => {
    if (!['imported', 'imported_with_warnings'].includes(item.proposed_outcome || item.outcome)) {
      return {
        ...item,
        outcome: item.proposed_outcome || item.outcome,
      };
    }

    return commitPreparedEntry(item);
  });

  const report = writeRunReport({
    config,
    projectSlug,
    mode: 'legacy_import',
    surface,
    items,
    legacyRoots: plan?.legacy_roots || [],
  });

  return {
    items,
    legacy_roots: plan?.legacy_roots || [],
    report_note_path: report.report_note_path,
  };
}

module.exports = {
  resolveLegacyRoots,
  planImport,
  applyImportPlan,
};