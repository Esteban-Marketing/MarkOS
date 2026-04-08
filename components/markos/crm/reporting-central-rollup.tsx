"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

export function ReportingCentralRollup() {
  const { centralRollup } = useReportingStore();

  if (!centralRollup) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Central rollup is only available to governed central operators.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Central rollup</h2>
          <p className="mt-1 text-sm text-slate-600">Central rollup keeps multi-tenant summaries explicit and governed drill-down requests separate from tenant reporting.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {centralRollup.governance.summary}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="border-b border-slate-200 pb-2">Tenant</th>
              <th className="border-b border-slate-200 pb-2">Readiness</th>
              <th className="border-b border-slate-200 pb-2">Deal count</th>
              <th className="border-b border-slate-200 pb-2">At-risk records</th>
              <th className="border-b border-slate-200 pb-2">Open tasks</th>
            </tr>
          </thead>
          <tbody>
            {centralRollup.tenants.map((entry: any) => (
              <tr key={entry.tenant_id}>
                <td className="border-b border-slate-100 py-3 font-semibold text-slate-900">{entry.tenant_id}</td>
                <td className="border-b border-slate-100 py-3">{entry.readiness_status}</td>
                <td className="border-b border-slate-100 py-3">{entry.deal_count}</td>
                <td className="border-b border-slate-100 py-3">{entry.at_risk_records}</td>
                <td className="border-b border-slate-100 py-3">{entry.open_task_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-slate-600">Governed drill-down requests only. No silent cross-tenant widening is allowed in this surface.</p>
    </section>
  );
}