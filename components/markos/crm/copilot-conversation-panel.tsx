"use client";

import React from 'react';

import { useCopilotStore } from '../../../app/(markos)/crm/copilot/copilot-store';

export function CopilotConversationPanel() {
  const { selectedConversation, bundle, evidenceEntries } = useCopilotStore();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Conversation context</p>
        <h3 className="mt-2 text-base font-semibold text-[#0f172a]">
          {selectedConversation ? `Conversation ${selectedConversation.conversation_id}` : 'No conversation selected'}
        </h3>
        <p className="mt-2 text-sm text-[#334155]">
          {bundle.outbound_history.length} grounded message or activity item(s) connected to this CRM thread.
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Evidence trail</p>
        <ul className="mt-3 space-y-2 text-sm text-[#334155]">
          {evidenceEntries.map((entry: any, index: number) => (
            <li key={`${entry.type}:${entry.label}:${index}`}>{entry.label}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}