"use client";

import React from 'react';

import { useCopilotStore } from '../../../app/(markos)/crm/copilot/copilot-store';
import { CopilotRecommendationCard } from './copilot-recommendation-card';

export function CopilotRecordPanel() {
  const { selectedRecord, summary, recommendations } = useCopilotStore();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Selected record</p>
        <h2 className="mt-2 text-lg font-semibold text-[#0f172a]">{selectedRecord?.display_name || 'No record selected'}</h2>
        <p className="mt-2 text-sm text-[#334155]">{summary.summary_text}</p>
      </section>

      <section className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#64748b]">Risk flags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(summary.risk_flags || []).map((flag: string) => (
            <span key={flag} className="rounded-full bg-[#fee2e2] px-2 py-1 text-xs font-medium text-[#b91c1c]">
              {flag}
            </span>
          ))}
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