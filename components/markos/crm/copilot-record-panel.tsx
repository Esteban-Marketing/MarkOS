"use client";

import React from 'react';

import { useCopilotStore } from '../../../app/(markos)/crm/copilot/copilot-store';
import { CopilotRecommendationCard } from './copilot-recommendation-card';

export function CopilotRecordPanel() {
  const { selectedRecord, summary, recommendations } = useCopilotStore();
  const leadRecommendation = recommendations[0] || null;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Record brief</p>
        <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">{selectedRecord?.display_name || 'No record selected'}</h2>
        <p className="mt-1 text-xs text-[#64748b]">Evidence-backed operator brief grounded in canonical CRM context.</p>
        <p className="mt-2 text-sm text-[#334155]">{summary.summary_text}</p>
        {leadRecommendation ? (
          <div className="mt-3 rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#1d4ed8]">Next step</p>
            <p className="mt-1 text-sm font-semibold text-[#0f172a]">{leadRecommendation.label}</p>
            <p className="mt-1 text-xs text-[#334155]">{leadRecommendation.rationale?.summary}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Risk flags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(summary.risk_flags || []).length > 0 ? (summary.risk_flags || []).map((flag: string) => (
            <span key={flag} className="rounded-full bg-[#fee2e2] px-2 py-1 text-xs font-medium text-[#b91c1c]">
              {flag}
            </span>
          )) : <span className="rounded-full bg-[#e2e8f0] px-2 py-1 text-xs font-medium text-[#475569]">No active flags</span>}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Grounded recommendations</p>
        {recommendations.map((recommendation: any) => (
          <CopilotRecommendationCard key={recommendation.recommendation_id} recommendation={recommendation} />
        ))}
      </section>
    </div>
  );
}