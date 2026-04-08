"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type EvidenceEntry = {
  evidence_key: string;
  title: string;
  detail: string;
};

type ReportingSnapshot = {
  tenant_id: string;
  actor_id: string | null;
  role: string | null;
  current_view: string;
  role_layer: string;
  time_range: string;
  selected_pipeline_key: string | null;
  selected_attribution_record_id: string | null;
  selected_evidence_key: string | null;
  available_views: string[];
  readiness: any;
  cockpit: any;
  executive_summary: any;
  central_rollup: any;
  evidence_entries: EvidenceEntry[];
};

type ReportingStoreContextValue = {
  tenantId: string;
  actorId: string | null;
  role: string | null;
  currentView: string;
  roleLayer: string;
  timeRange: string;
  selectedPipelineKey: string | null;
  selectedAttributionRecordId: string | null;
  selectedEvidenceKey: string | null;
  availableViews: string[];
  readiness: any;
  cockpit: any;
  executiveSummary: any;
  centralRollup: any;
  evidenceEntries: EvidenceEntry[];
  setCurrentView: (view: string) => void;
  setTimeRange: (range: string) => void;
  setSelectedPipelineKey: (pipelineKey: string | null) => void;
  setSelectedAttributionRecordId: (recordId: string | null) => void;
  setSelectedEvidenceKey: (evidenceKey: string | null) => void;
};

const ReportingStoreContext = createContext<ReportingStoreContextValue | undefined>(undefined);

export function ReportingStoreProvider({
  initialState,
  children,
}: Readonly<{
  initialState: ReportingSnapshot;
  children: React.ReactNode;
}>) {
  const [currentView, setCurrentView] = useState(initialState.current_view);
  const [timeRange, setTimeRange] = useState(initialState.time_range);
  const [selectedPipelineKey, setSelectedPipelineKey] = useState(initialState.selected_pipeline_key);
  const [selectedAttributionRecordId, setSelectedAttributionRecordId] = useState(initialState.selected_attribution_record_id);
  const [selectedEvidenceKey, setSelectedEvidenceKey] = useState(initialState.selected_evidence_key);

  const value = useMemo(() => ({
    tenantId: initialState.tenant_id,
    actorId: initialState.actor_id,
    role: initialState.role,
    currentView,
    roleLayer: initialState.role_layer,
    timeRange,
    selectedPipelineKey,
    selectedAttributionRecordId,
    selectedEvidenceKey,
    availableViews: initialState.available_views,
    readiness: initialState.readiness,
    cockpit: initialState.cockpit,
    executiveSummary: initialState.executive_summary,
    centralRollup: initialState.central_rollup,
    evidenceEntries: initialState.evidence_entries,
    setCurrentView,
    setTimeRange,
    setSelectedPipelineKey,
    setSelectedAttributionRecordId,
    setSelectedEvidenceKey,
  }), [currentView, initialState.actor_id, initialState.central_rollup, initialState.cockpit, initialState.evidence_entries, initialState.executive_summary, initialState.readiness, initialState.role, initialState.role_layer, initialState.tenant_id, initialState.available_views, selectedAttributionRecordId, selectedEvidenceKey, selectedPipelineKey, timeRange]);

  return <ReportingStoreContext.Provider value={value}>{children}</ReportingStoreContext.Provider>;
}

export function useReportingStore() {
  const context = useContext(ReportingStoreContext);
  if (!context) {
    throw new Error('useReportingStore must be used within ReportingStoreProvider');
  }
  return context;
}