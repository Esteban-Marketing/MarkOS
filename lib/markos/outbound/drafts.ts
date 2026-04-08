'use strict';

function buildOutboundDraftSuggestion(input = {}) {
  const channel = String(input.channel || 'email').trim().toLowerCase();
  const prompt = String(input.prompt || '').trim();
  const recordId = String(input.record_id || '').trim();

  return {
    suggestion_id: `draft-${channel}-${recordId || 'record'}`,
    channel,
    preview: prompt ? `Draft suggestion for ${channel}: ${prompt}` : `Draft suggestion for ${channel}`,
    send_disabled: true,
    sequence_disabled: true,
    autonomous_execution: false,
    operator_triggered_only: true,
  };
}

module.exports = {
  buildOutboundDraftSuggestion,
};