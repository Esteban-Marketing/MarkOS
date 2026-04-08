"use client";

import React from 'react';

import { useCopilotStore } from '../../../app/(markos)/crm/copilot/copilot-store';

export function CopilotApprovalPackage() {
  const { selectedPackage, approvalPackages, selectedRecommendation } = useCopilotStore();

  if (!selectedPackage) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-[#475569]">
        <p>No approval package is selected yet.</p>
        <p>The next package will carry rationale, evidence, and bounded mutation details for {selectedRecommendation?.label || 'the current recommendation'}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Package status</p>
        <h3 className="mt-2 text-base font-semibold text-[#0f172a]">{selectedPackage.status}</h3>
        <p className="mt-2 text-sm text-[#334155]">{selectedPackage.mutation_family} for {selectedPackage.target_record_kind}:{selectedPackage.target_record_id}</p>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Review queue</p>
        <ul className="mt-3 space-y-2 text-sm text-[#334155]">
          {approvalPackages.map((entry: any) => (
            <li key={entry.package_id}>{entry.package_id} · {entry.status}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}