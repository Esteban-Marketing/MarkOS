"use client";

import React from 'react';

import { useExecutionStore } from '../../../app/(markos)/crm/execution/execution-store';

const TAB_LABELS: Record<string, string> = {
  due_overdue: 'Due / Overdue',
  inbound: 'Inbound',
  stalled: 'Stalled',
  success_risk: 'Success Risk',
  approval_needed: 'Approval Needed',
  ownership_data: 'Ownership / Data',
  priority: 'Priority',
};

export function ExecutionQueue() {
  const {
    scope,
    tab,
    tabs,
    visibleRecommendations,
    selectedRecommendation,
    setScope,
    setTab,
    selectRecommendation,
  } = useExecutionStore();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setScope('personal')} className={scope === 'personal' ? 'font-semibold' : ''}>Personal Queue</button>
        <button type="button" onClick={() => setScope('team')} className={scope === 'team' ? 'font-semibold' : ''}>Manager / Team Queue</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab('all')} className={tab === 'all' ? 'font-semibold' : ''}>All</button>
        {tabs.map((item) => (
          <button key={item.tab_key} type="button" onClick={() => setTab(item.tab_key)} className={tab === item.tab_key ? 'font-semibold' : ''}>
            {TAB_LABELS[item.tab_key] || item.tab_key} ({item.count})
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {visibleRecommendations.map((recommendation) => {
          const active = selectedRecommendation?.recommendation_id === recommendation.recommendation_id;
          return (
            <li key={recommendation.recommendation_id}>
              <button type="button" onClick={() => selectRecommendation(recommendation.recommendation_id)} className={`w-full rounded border p-3 text-left ${active ? 'border-[#0f172a]' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between gap-3">
                  <strong>{recommendation.display_name}</strong>
                  <span>{recommendation.risk_level}</span>
                </div>
                <p className="text-sm mt-2">{recommendation.rationale_summary}</p>
                <p className="text-xs mt-2">Queue: {TAB_LABELS[recommendation.queue_tab] || recommendation.queue_tab} • Urgency {recommendation.urgency_score}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}