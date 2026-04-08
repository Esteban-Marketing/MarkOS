"use client";

import React from 'react';

export function CopilotPlaybookReview({ playbooks = [] }: Readonly<{ playbooks?: Array<any> }>) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Playbook review</p>
      <ul className="mt-3 space-y-3 text-sm text-[#334155]">
        {playbooks.map((playbook) => (
          <li key={playbook.playbook_id}>
            <span className="font-medium text-[#0f172a]">{playbook.playbook_key}</span> · {playbook.status} · {playbook.steps.length} step(s)
          </li>
        ))}
      </ul>
    </section>
  );
}