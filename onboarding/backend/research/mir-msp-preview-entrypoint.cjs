'use strict';

const { generatePatchPreview } = require('./mir-msp-delta-engine.cjs');
const { packagePatchReview } = require('./preview-review-packager.cjs');
const { adaptPreviewForSurface } = require('./cross-surface-preview-adapter.cjs');

async function buildMirMspPreviewBundle(input = {}) {
  const preview = generatePatchPreview({
    artifact_family: input.targetIntent && input.targetIntent.artifact_family ? input.targetIntent.artifact_family : 'MIR',
    artifact_type: input.targetIntent && input.targetIntent.artifact_type ? input.targetIntent.artifact_type : 'strategy_note',
    section_key: input.targetIntent && input.targetIntent.section_key ? input.targetIntent.section_key : null,
    context_pack: input.researchPack && input.researchPack.context_pack ? input.researchPack.context_pack : {},
    current_content: input.currentContent || '',
    proposed_content: input.proposedContent || '',
  });

  return {
    preview,
    review: packagePatchReview(preview),
    surfaces: {
      api: adaptPreviewForSurface(preview, 'api'),
      cli: adaptPreviewForSurface(preview, 'cli'),
      mcp: adaptPreviewForSurface(preview, 'mcp'),
      editor: adaptPreviewForSurface(preview, 'editor'),
    },
  };
}

module.exports = {
  buildMirMspPreviewBundle,
};
