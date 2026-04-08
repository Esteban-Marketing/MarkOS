"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

export function ReportingReadinessPanel() {
  const { readiness } = useReportingStore();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Readiness review</h2>
        <p className="mt-1 text-sm text-slate-600">Healthy and degraded states stay visible so operators can separate missing evidence from real performance signals.</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Attribution coverage</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{readiness.coverage.tracking.covered_records} / {readiness.coverage.tracking.total_records}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Identity quality</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{readiness.coverage.identity.accepted_links} accepted</p>
          <p className="mt-1 text-sm text-slate-600">{readiness.coverage.identity.review_links} review links pending</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Reporting freshness</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{readiness.coverage.freshness.status}</p>
          <p className="mt-1 text-sm text-slate-600">Latest activity at {readiness.coverage.freshness.latest_activity_at || 'not available'}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-500">Degraded-state explanations</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{readiness.status}</p>
          <p className="mt-1 text-sm text-slate-600">{readiness.summary}</p>
        </article>
      </div>
    </section>
  );
}