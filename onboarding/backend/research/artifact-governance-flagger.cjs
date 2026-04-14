'use strict';

const { collectArtifactIssues } = require('./evaluation-diagnostics.cjs');

function flagArtifacts(previews = []) {
  return (Array.isArray(previews) ? previews : []).map((preview, index) => {
    const issues = collectArtifactIssues(preview, index);
    const evidenceRefs = Array.isArray(preview?.evidence)
      ? preview.evidence.map((entry, evidenceIndex) => entry?.id || `ev-${evidenceIndex + 1}`)
      : [];

    let status = 'ok';
    if (issues.blockers.length > 0) {
      status = 'blocked';
    } else if (issues.warnings.length > 0) {
      status = 'warning';
    }

    return {
      artifact_id: issues.artifact_id,
      status,
      warnings: issues.warnings,
      blockers: issues.blockers,
      evidence_refs: evidenceRefs,
    };
  });
}

module.exports = {
  flagArtifacts,
};
