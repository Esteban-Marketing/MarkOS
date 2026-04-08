"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

export function ReportingExecutiveSummary() {
  const { executiveSummary } = useReportingStore();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Executive summary</h2>
      <p className="mt-1 text-sm text-slate-600">The executive summary condenses the same reporting truth layer instead of creating a forked dashboard.</p>
      <div className="mt-4 grid gap-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Readiness</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{executiveSummary.readiness_status}</p>
          <p className="mt-1 text-sm text-slate-600">{executiveSummary.readiness_summary}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Deal count</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{executiveSummary.deal_count}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">At-risk records</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{executiveSummary.at_risk_records}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Open tasks</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{executiveSummary.open_task_count}</p>
        </article>
      </div>
      <p className="mt-4 text-sm text-slate-600">Executive views stay role-aware without hiding attribution lineage irretrievably.</p>
    </section>
  );
}