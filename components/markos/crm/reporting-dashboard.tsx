"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

export function ReportingDashboard() {
  const { cockpit, readiness, selectedAttributionRecordId, setSelectedAttributionRecordId } = useReportingStore();
  const highlightedRecord = cockpit.pipeline_health.find((entry: any) => entry.record_id === selectedAttributionRecordId) || cockpit.pipeline_health[0] || null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pipeline health and productivity</h2>
          <p className="mt-1 text-sm text-slate-600">Pipeline health, conversion context, SLA risk, and productivity all use the same reporting truth layer.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-semibold">Readiness:</span> {readiness.status}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Pipeline health</p>
          <p className="mt-2 text-2xl font-semibold">{cockpit.pipeline_health.length}</p>
          <p className="mt-1 text-sm text-slate-600">Tracked deals in the reporting cockpit.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">SLA risk</p>
          <p className="mt-2 text-2xl font-semibold">{cockpit.sla_risk.at_risk_records}</p>
          <p className="mt-1 text-sm text-slate-600">Records that need operator review.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Productivity</p>
          <p className="mt-2 text-2xl font-semibold">{cockpit.productivity.open_task_count}</p>
          <p className="mt-1 text-sm text-slate-600">Open tasks linked to CRM records.</p>
        </article>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pipeline health drill-down</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="border-b border-slate-200 pb-2">Record</th>
                  <th className="border-b border-slate-200 pb-2">Stage</th>
                  <th className="border-b border-slate-200 pb-2">Risk</th>
                  <th className="border-b border-slate-200 pb-2">Stalled days</th>
                  <th className="border-b border-slate-200 pb-2">Overdue tasks</th>
                </tr>
              </thead>
              <tbody>
                {cockpit.pipeline_health.map((entry: any) => (
                  <tr
                    key={entry.record_id}
                    className={entry.record_id === highlightedRecord?.record_id ? 'bg-teal-50' : undefined}
                  >
                    <td className="border-b border-slate-100 py-3">
                      <button type="button" onClick={() => setSelectedAttributionRecordId(entry.record_id)} className="font-semibold text-slate-900">
                        {entry.display_name}
                      </button>
                    </td>
                    <td className="border-b border-slate-100 py-3">{entry.stage_key || 'unmapped'}</td>
                    <td className="border-b border-slate-100 py-3">{entry.risk_level}</td>
                    <td className="border-b border-slate-100 py-3">{entry.stalled_days}</td>
                    <td className="border-b border-slate-100 py-3">{entry.overdue_task_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Attribution focus</h3>
          {highlightedRecord ? (
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p><span className="font-semibold">Record:</span> {highlightedRecord.display_name}</p>
              <p><span className="font-semibold">Stage:</span> {highlightedRecord.stage_key || 'unmapped'}</p>
              <p><span className="font-semibold">Risk:</span> {highlightedRecord.risk_level}</p>
              <p><span className="font-semibold">Inbound touches:</span> {highlightedRecord.inbound_touch_count}</p>
              <p className="text-slate-600">Attribution drill-down stays attached to CRM evidence instead of a detached analytics studio.</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No pipeline health records are available yet.</p>
          )}
        </aside>
      </div>
    </section>
  );
}