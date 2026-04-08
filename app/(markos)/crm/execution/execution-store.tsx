"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

const execution = require('../../../../lib/markos/crm/execution');

type ExecutionSnapshot = {
  tenant_id: string;
  actor_id: string | null;
  role: string | null;
  initial_scope: 'personal' | 'team';
  initial_tab: string;
  tabs: Array<{ tab_key: string; count: number }>;
  recommendations: Array<any>;
  selected_recommendation_id: string | null;
  detail: {
    recommendation: any;
    record: any;
    timeline: Array<any>;
    tasks: Array<any>;
    notes: Array<any>;
    drafts: Array<any>;
  } | null;
};

type ExecutionStoreContextValue = {
  tenantId: string;
  actorId: string | null;
  role: string | null;
  scope: 'personal' | 'team';
  tab: string;
  tabs: Array<{ tab_key: string; count: number }>;
  recommendations: Array<any>;
  selectedRecommendation: any | null;
  visibleRecommendations: Array<any>;
  detail: ExecutionSnapshot['detail'];
  errorMessage: string | null;
  setScope: (scope: 'personal' | 'team') => void;
  setTab: (tab: string) => void;
  selectRecommendation: (recommendationId: string) => void;
  syncActionResult: (payload: { recommendation?: any; record?: any; task?: any; note?: any; drafts?: Array<any> }) => void;
  setErrorMessage: (message: string | null) => void;
};

const ExecutionStoreContext = createContext<ExecutionStoreContextValue | undefined>(undefined);

function replaceRecommendation(list: Array<any>, nextRecommendation: any) {
  if (!nextRecommendation) {
    return list;
  }
  const index = list.findIndex((item) => item.recommendation_id === nextRecommendation.recommendation_id);
  if (index < 0) {
    return [...list, nextRecommendation];
  }
  const next = list.slice();
  next.splice(index, 1, { ...list[index], ...nextRecommendation });
  return next;
}

export function ExecutionStoreProvider({
  initialState,
  children,
}: Readonly<{
  initialState: ExecutionSnapshot;
  children: React.ReactNode;
}>) {
  const [scope, setScope] = useState<'personal' | 'team'>(initialState.initial_scope);
  const [tab, setTab] = useState(initialState.initial_tab || 'all');
  const [recommendations, setRecommendations] = useState(initialState.recommendations || []);
  const [detail, setDetail] = useState(initialState.detail);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(initialState.selected_recommendation_id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const visibleRecommendations = useMemo(() => execution.rankExecutionQueue({
    recommendations,
    scope,
    actor_id: initialState.actor_id,
    queue_tab: tab,
  }), [initialState.actor_id, recommendations, scope, tab]);

  const selectedRecommendation = useMemo(() => {
    return recommendations.find((item: any) => item.recommendation_id === selectedRecommendationId) || visibleRecommendations[0] || null;
  }, [recommendations, selectedRecommendationId, visibleRecommendations]);

  function selectRecommendation(recommendationId: string) {
    setSelectedRecommendationId(recommendationId);
    if (detail?.recommendation?.recommendation_id !== recommendationId) {
      const nextRecommendation = recommendations.find((item: any) => item.recommendation_id === recommendationId) || null;
      if (nextRecommendation) {
        setDetail((current) => current ? { ...current, recommendation: nextRecommendation, drafts: nextRecommendation.suggestion_artifact ? [{ ...nextRecommendation.suggestion_artifact, recommendation_id: nextRecommendation.recommendation_id }] : [] } : current);
      }
    }
  }

  function syncActionResult(payload: { recommendation?: any; record?: any; task?: any; note?: any; drafts?: Array<any> }) {
    if (payload.recommendation) {
      setRecommendations((current) => replaceRecommendation(current, payload.recommendation));
      if (detail) {
        setDetail({ ...detail, recommendation: { ...(detail.recommendation || {}), ...payload.recommendation } });
      }
    }
    if (payload.record && detail) {
      setDetail({ ...detail, record: payload.record });
    }
    if (payload.task && detail) {
      setDetail({ ...detail, tasks: [payload.task, ...(detail.tasks || [])] });
    }
    if (payload.note && detail) {
      setDetail({ ...detail, notes: [payload.note, ...(detail.notes || [])] });
    }
    if (payload.drafts && detail) {
      setDetail({ ...detail, drafts: payload.drafts });
    }
  }

  const value = useMemo(() => ({
    tenantId: initialState.tenant_id,
    actorId: initialState.actor_id,
    role: initialState.role,
    scope,
    tab,
    tabs: initialState.tabs,
    recommendations,
    selectedRecommendation,
    visibleRecommendations,
    detail,
    errorMessage,
    setScope,
    setTab,
    selectRecommendation,
    syncActionResult,
    setErrorMessage,
  }), [detail, errorMessage, initialState.actor_id, initialState.role, initialState.tabs, initialState.tenant_id, recommendations, scope, selectedRecommendation, tab, visibleRecommendations]);

  return <ExecutionStoreContext.Provider value={value}>{children}</ExecutionStoreContext.Provider>;
}

export function useExecutionStore() {
  const context = useContext(ExecutionStoreContext);
  if (!context) {
    throw new Error('useExecutionStore must be used within ExecutionStoreProvider');
  }
  return context;
}