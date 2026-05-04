'use strict';

const { runDraft } = require('../../../../../bin/lib/generate-runner.cjs');

async function invokeDraftMessage({ tool_input } = {}) {
  const result = await runDraft(tool_input || {});
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    _usage: {
      input_tokens: result.input_tokens || 0,
      output_tokens: result.output_tokens || 0,
    },
  };
}

module.exports = invokeDraftMessage;
module.exports.invokeDraftMessage = invokeDraftMessage;
