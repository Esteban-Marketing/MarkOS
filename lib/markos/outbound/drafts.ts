export type __ModuleMarker = import('node:fs').Stats;

'use strict';

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function buildOutboundDraftSuggestion(input: Record<string, unknown> = {}) {
  const channel = toTrimmedString(input.channel, 'email').toLowerCase();
  const prompt = toTrimmedString(input.prompt);
  const recordId = toTrimmedString(input.record_id);

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