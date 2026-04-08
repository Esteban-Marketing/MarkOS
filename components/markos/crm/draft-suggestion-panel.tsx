"use client";

import React from 'react';

import { useExecutionStore } from '../../../app/(markos)/crm/execution/execution-store';

export function DraftSuggestionPanel() {
  const { detail, syncActionResult, setErrorMessage } = useExecutionStore();
  const draft = detail?.drafts?.[0];

  if (!draft) {
    return null;
  }

  async function dismissDraft() {
    setErrorMessage(null);
    const response = await fetch('/api/crm/execution/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion_id: draft.suggestion_id }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setErrorMessage(payload?.message || payload?.error || 'Draft dismissal failed');
      return;
    }
    syncActionResult({ drafts: [] });
  }

  return (
    <section className="rounded border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">Suggestion-Only Draft</h3>
        <span className="text-xs uppercase tracking-wider text-amber-800">Non-executable</span>
      </div>
      <p className="mt-2 text-sm text-[#475569]">{draft.preview}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#475569]">
        <span>Channel: {draft.channel}</span>
        <span>Send disabled: {String(draft.send_disabled)}</span>
        <span>Sequence disabled: {String(draft.sequence_disabled)}</span>
      </div>
      <button type="button" className="mt-3 rounded border border-amber-300 px-3 py-2 text-sm" onClick={dismissDraft}>Dismiss Suggestion</button>
    </section>
  );
}