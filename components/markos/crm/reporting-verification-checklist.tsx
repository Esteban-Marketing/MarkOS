"use client";

import React from 'react';

const checklist = [
  {
    requirementId: 'ATT-01',
    title: 'Attribution evidence review',
    status: 'ready_for_live_verification',
    detail: 'Confirm contact, deal, and campaign attribution drill-downs expose deterministic fixed-weight evidence in the CRM shell.',
  },
  {
    requirementId: 'REP-01',
    title: 'Reporting cockpit review',
    status: 'ready_for_live_verification',
    detail: 'Confirm pipeline health, conversion, attribution, SLA risk, and agent productivity remain in one CRM-native cockpit.',
  },
];

export function ReportingVerificationChecklist() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Live verification checklist</h2>
          <p className="mt-1 text-sm text-slate-600">This checklist captures commands, evidence, and closeout promotion requirements for ATT-01 and REP-01.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">Closeout promotion waits for recorded live verification.</div>
      </div>
      <div className="mt-4 grid gap-3">
        {checklist.map((entry) => (
          <article key={entry.requirementId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{entry.requirementId}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{entry.title}</h3>
              </div>
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">{entry.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{entry.detail}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold">Command</p>
                <p className="mt-1">Review the reporting shell and capture direct attribution or cockpit evidence.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold">Evidence captured</p>
                <p className="mt-1">Screenshots, endpoint payloads, checklist notes, and operator verdict.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="font-semibold">Closeout promotion</p>
                <p className="mt-1">Promote ATT-01 and REP-01 in the closure matrix once live verification is complete.</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}