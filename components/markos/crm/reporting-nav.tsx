"use client";

import React from 'react';

import { useReportingStore } from '../../../app/(markos)/crm/reporting/reporting-store';

const labels = {
  pipeline: 'Pipeline health',
  attribution: 'Attribution',
  risk: 'Risk',
  productivity: 'Productivity',
  readiness: 'Readiness',
  verification: 'Verification',
} as const;

export function ReportingNav() {
  const { availableViews, currentView, setCurrentView, roleLayer, timeRange, setTimeRange } = useReportingStore();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">Navigation</h2>
        <p className="mt-1 text-sm text-slate-600">Switch between pipeline, attribution, risk, productivity, readiness, and verification views without leaving the CRM shell.</p>
      </div>
      <div className="grid gap-2">
        {availableViews.map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setCurrentView(view)}
            className={currentView === view
              ? 'rounded-xl border border-teal-600 bg-teal-50 px-3 py-3 text-left text-sm font-semibold text-teal-900'
              : 'rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-700'}
          >
            {labels[view as keyof typeof labels] || view}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p><span className="font-semibold">Role layer:</span> {roleLayer}</p>
        <label className="mt-3 grid gap-2">
          <span className="font-semibold">Time range</span>
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          >
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="quarter_to_date">Quarter to date</option>
          </select>
        </label>
      </div>
    </div>
  );
}