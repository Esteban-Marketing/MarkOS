"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type CopilotSnapshot = {
  tenant_id: string;
  actor_id: string | null;
  role: string | null;
  records: Array<any>;
  selected_record_id: string | null;
  selected_conversation_id: string | null;
  summary_mode: string;
  summary_modes: Array<string>;
  bundle: any;
  summary: any;
  recommendations: Array<any>;
  selected_recommendation_id: string | null;
  evidence_entries: Array<any>;
  approval_packages: Array<any>;
  selected_package_id: string | null;
};

type CopilotStoreContextValue = {
  tenantId: string;
  actorId: string | null;
  role: string | null;
  records: Array<any>;
  selectedRecord: any | null;
  selectedConversation: any | null;
  summaryMode: string;
  summaryModes: Array<string>;
  bundle: any;
  summary: any;
  recommendations: Array<any>;
  selectedRecommendation: any | null;
  approvalPackages: Array<any>;
  selectedPackage: any | null;
  evidenceEntries: Array<any>;
  setSummaryMode: (mode: string) => void;
  selectRecommendation: (recommendationId: string) => void;
  selectPackage: (packageId: string) => void;
  syncApprovalPackage: (nextPackage: any) => void;
};

const CopilotStoreContext = createContext<CopilotStoreContextValue | undefined>(undefined);

function replaceById(list: Array<any>, key: string, value: any) {
  const index = list.findIndex((entry) => entry[key] === value[key]);
  if (index < 0) {
    return [value, ...list];
  }
  const next = list.slice();
  next.splice(index, 1, { ...list[index], ...value });
  return next;
}

export function CopilotStoreProvider({
  initialState,
  children,
}: Readonly<{
  initialState: CopilotSnapshot;
  children: React.ReactNode;
}>) {
  const [summaryMode, setSummaryMode] = useState(initialState.summary_mode || 'record');
  const [recommendations] = useState(initialState.recommendations || []);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState(initialState.selected_recommendation_id);
  const [approvalPackages, setApprovalPackages] = useState(initialState.approval_packages || []);
  const [selectedPackageId, setSelectedPackageId] = useState(initialState.selected_package_id);

  const selectedRecord = useMemo(() => {
    return initialState.records.find((entry) => entry.entity_id === initialState.selected_record_id) || null;
  }, [initialState.records, initialState.selected_record_id]);

  const selectedConversation = useMemo(() => initialState.bundle?.conversation || null, [initialState.bundle]);

  const selectedRecommendation = useMemo(() => {
    return recommendations.find((entry) => entry.recommendation_id === selectedRecommendationId) || recommendations[0] || null;
  }, [recommendations, selectedRecommendationId]);

  const selectedPackage = useMemo(() => {
    return approvalPackages.find((entry) => entry.package_id === selectedPackageId) || approvalPackages[0] || null;
  }, [approvalPackages, selectedPackageId]);

  function selectRecommendation(recommendationId: string) {
    setSelectedRecommendationId(recommendationId);
  }

  function selectPackage(packageId: string) {
    setSelectedPackageId(packageId);
  }

  function syncApprovalPackage(nextPackage: any) {
    setApprovalPackages((current) => replaceById(current, 'package_id', nextPackage));
    setSelectedPackageId(nextPackage.package_id);
  }

  const value = useMemo(() => ({
    tenantId: initialState.tenant_id,
    actorId: initialState.actor_id,
    role: initialState.role,
    records: initialState.records,
    selectedRecord,
    selectedConversation,
    summaryMode,
    summaryModes: initialState.summary_modes,
    bundle: initialState.bundle,
    summary: initialState.summary,
    recommendations,
    selectedRecommendation,
    approvalPackages,
    selectedPackage,
    evidenceEntries: initialState.evidence_entries,
    setSummaryMode,
    selectRecommendation,
    selectPackage,
    syncApprovalPackage,
  }), [approvalPackages, initialState.actor_id, initialState.bundle, initialState.evidence_entries, initialState.records, initialState.role, initialState.summary, initialState.summary_modes, initialState.tenant_id, recommendations, selectedConversation, selectedPackage, selectedRecord, selectedRecommendation, summaryMode]);

  return <CopilotStoreContext.Provider value={value}>{children}</CopilotStoreContext.Provider>;
}

export function useCopilotStore() {
  const context = useContext(CopilotStoreContext);
  if (!context) {
    throw new Error('useCopilotStore must be used within CopilotStoreProvider');
  }
  return context;
}