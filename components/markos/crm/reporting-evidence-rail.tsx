"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

export function ReportingEvidenceRail() {
  const { evidenceEntries, selectedEvidenceKey, setSelectedEvidenceKey, readiness } = useReportingStore();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">Evidence rail</h2>
        <p className="mt-1 text-sm text-slate-600">Evidence rail keeps attribution lineage, readiness explanations, raw metric lineage, and verification detail beside the dashboard.</p>
      </div>
      <div className="grid gap-2">
        {evidenceEntries.map((entry) => (
          <button
            key={entry.evidence_key}
            type="button"
            onClick={() => setSelectedEvidenceKey(entry.evidence_key)}
            className={selectedEvidenceKey === entry.evidence_key
              ? 'rounded-xl border border-sky-600 bg-sky-50 px-3 py-3 text-left'
              : 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left'}
          >
            <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
            <p className="mt-1 text-sm text-slate-600">{entry.detail}</p>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">Readiness</p>
        <p className="mt-1">{readiness.summary}</p>
        {Array.isArray(readiness.reasons) && readiness.reasons.length > 0 ? (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {readiness.reasons.map((reason: string) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 text-sm">Attribution lineage and degraded-state explanations remain visible even when data quality drops.</p>
      </div>
    </div>
  );
}