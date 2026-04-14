'use strict';

function adaptPreviewForSurface(preview, surface = 'api') {
  return {
    surface,
    payload: preview,
    presentation: {
      title: `${preview.artifact_family || 'MIR'} patch preview`,
      summary: preview.summary || '',
    },
  };
}

module.exports = {
  adaptPreviewForSurface,
};
