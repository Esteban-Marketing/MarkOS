'use strict';

function slugify(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'markos';
}

function buildNoteId({ vaultFamily, noteFamily, projectSlug, suffix = null }) {
  const parts = [slugify(vaultFamily), slugify(noteFamily), slugify(projectSlug)];
  if (suffix) {
    parts.push(slugify(suffix));
  }
  return parts.join('-');
}

function buildCompactTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function buildFileTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function buildRunReportId({ projectSlug, mode, date = new Date() }) {
  return buildNoteId({
    vaultFamily: 'Memory',
    noteFamily: 'migration-report',
    projectSlug,
    suffix: `${mode}-${buildCompactTimestamp(date)}`,
  });
}

module.exports = {
  slugify,
  buildNoteId,
  buildCompactTimestamp,
  buildFileTimestamp,
  buildRunReportId,
};