"use client";

import React from 'react';

export function CopilotOversightPanel({ playbooks = [], targetTenantId = null }: Readonly<{ playbooks?: Array<any>; targetTenantId?: string | null }>) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Oversight</p>
      <p className="mt-2 text-sm text-[#334155]">Target tenant: {targetTenantId || 'current tenant only'}</p>
      <ul className="mt-3 space-y-2 text-sm text-[#334155]">
        {playbooks.map((playbook) => (
          <li key={playbook.playbook_id}>{playbook.tenant_id} · {playbook.status} · {playbook.run_id}</li>
        ))}
      </ul>
    </section>
  );
}