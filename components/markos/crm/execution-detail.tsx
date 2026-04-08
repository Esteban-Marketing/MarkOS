"use client";

import React from 'react';

import { useExecutionStore } from '../../../app/(markos)/crm/execution/execution-store';
import { DraftSuggestionPanel } from './draft-suggestion-panel';

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return {
    ok: response.ok,
    payload: await response.json(),
  };
}

export function ExecutionDetail() {
  const {
    detail,
    selectedRecommendation,
    syncActionResult,
    setErrorMessage,
  } = useExecutionStore();

  if (!detail || !selectedRecommendation) {
    return <p className="text-sm text-[#475569]">Select a recommendation to inspect the record context and safe actions.</p>;
  }

  async function runAction(actionKey: string) {
    setErrorMessage(null);
    const body: Record<string, unknown> = {
      action_key: actionKey,
      recommendation_id: selectedRecommendation.recommendation_id,
      record_kind: selectedRecommendation.record_kind,
      record_id: selectedRecommendation.record_id,
      owner_actor_id: selectedRecommendation.owner_actor_id,
    };
    if (actionKey === 'create_task') {
      body.title = `Follow up: ${selectedRecommendation.display_name}`;
      body.priority = selectedRecommendation.risk_level;
      body.due_at = new Date(Date.now() + 86400000).toISOString();
    }
    if (actionKey === 'append_note') {
      body.title = `Execution note for ${selectedRecommendation.display_name}`;
      body.body_markdown = selectedRecommendation.rationale_summary;
    }
    if (actionKey === 'update_record') {
      body.priority = 'high';
      body.status = 'active';
    }

    const { ok, payload } = await postJson('/api/crm/execution/actions', body);
    if (!ok) {
      setErrorMessage(payload?.message || payload?.error || 'Execution action failed');
      return;
    }
    syncActionResult({
      recommendation: payload.recommendation,
      record: payload.record,
      task: payload.task,
      note: payload.note,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{selectedRecommendation.display_name}</h2>
        <p className="text-sm text-[#475569] mt-1">{selectedRecommendation.rationale_summary}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#0f172a]">Source Signals</h3>
        <ul className="mt-2 space-y-1 text-sm text-[#334155]">
          {selectedRecommendation.source_signals.map((signal: any) => (
            <li key={signal.key}>{signal.label}: {String(signal.value ?? '—')}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#0f172a]">Bounded Actions</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedRecommendation.bounded_actions.map((action: any) => {
            if (action.action_key === 'view_draft_suggestion') {
              return <span key={action.action_key} className="rounded bg-gray-100 px-2 py-1 text-xs">Draft suggestion available</span>;
            }
            return (
              <button key={action.action_key} type="button" className="rounded border border-gray-200 px-3 py-2 text-sm" onClick={() => runAction(action.action_key)}>
                {action.label}
              </button>
            );
          })}
          {!selectedRecommendation.bounded_actions.some((action: any) => action.action_key === 'update_record') ? null : (
            <button type="button" className="rounded border border-gray-200 px-3 py-2 text-sm" onClick={() => runAction('update_record')}>
              Raise Priority
            </button>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#0f172a]">Record Context</h3>
        <p className="text-sm mt-2">Tasks: {detail.tasks.length} • Notes: {detail.notes.length} • Timeline events: {detail.timeline.length}</p>
      </div>
      <DraftSuggestionPanel />
    </div>
  );
}