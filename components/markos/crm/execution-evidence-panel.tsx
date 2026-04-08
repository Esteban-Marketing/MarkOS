"use client";

import React from 'react';

import { useExecutionStore } from '../../../app/(markos)/crm/execution/execution-store';

function EvidenceSection({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="mb-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0f172a] mb-2">{title}</h4>
      <div className="rounded bg-gray-50 p-3 text-sm text-[#334155]">{children}</div>
    </section>
  );
}

export function ExecutionEvidencePanel() {
  const { detail, selectedRecommendation } = useExecutionStore();

  if (!detail || !selectedRecommendation) {
    return <p className="text-sm text-[#475569]">No recommendation selected.</p>;
  }

  return (
    <div>
      <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
        <p className="font-medium">Immutable execution evidence</p>
        <p className="mt-1">Rationale, source signals, and resulting task or note lineage remain read-only here.</p>
      </div>
      <EvidenceSection title="Rationale">
        <p>{selectedRecommendation.rationale_summary}</p>
      </EvidenceSection>
      <EvidenceSection title="Signals">
        <ul className="space-y-1">
          {selectedRecommendation.source_signals.map((signal: any) => (
            <li key={signal.key}>{signal.label}: {String(signal.value ?? '—')}</li>
          ))}
        </ul>
      </EvidenceSection>
      <EvidenceSection title="Timeline">
        <p>Events: {detail.timeline.length}</p>
        <p>Tasks: {detail.tasks.length}</p>
        <p>Notes: {detail.notes.length}</p>
      </EvidenceSection>
      <EvidenceSection title="Allowed Actions">
        <ul className="space-y-1">
          {selectedRecommendation.bounded_actions.map((action: any) => (
            <li key={action.action_key}>{action.label}</li>
          ))}
        </ul>
      </EvidenceSection>
    </div>
  );
}