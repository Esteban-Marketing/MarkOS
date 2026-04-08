"use client";

import React from 'react';

export function CopilotRecommendationCard({ recommendation }: Readonly<{ recommendation: any }>) {
  return (
    <article className="rounded-lg border border-gray-200 bg-[#f8fafc] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#0f172a]">{recommendation.label}</h3>
        <span className="rounded-full bg-[#dbeafe] px-2 py-1 text-[11px] font-medium text-[#1d4ed8]">
          {recommendation.approval_required ? 'Approval required' : 'Advisory'}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#334155]">{recommendation.rationale?.summary}</p>
      <ul className="mt-3 space-y-2 text-xs text-[#475569]">
        {(recommendation.evidence || []).map((entry: any) => (
          <li key={`${recommendation.recommendation_id}:${entry.key}`}>
            <span className="font-medium text-[#0f172a]">{entry.key}</span>: {String(entry.value)}
          </li>
        ))}
      </ul>
    </article>
  );
}