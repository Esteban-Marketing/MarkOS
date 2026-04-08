import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../../lib/markos/auth/session';
import { ReportingStoreProvider } from '../reporting-store';
import { ReportingNav } from '../../../../../components/markos/crm/reporting-nav';
import { ReportingEvidenceRail } from '../../../../../components/markos/crm/reporting-evidence-rail';
import { ReportingVerificationChecklist } from '../../../../../components/markos/crm/reporting-verification-checklist';
import { ReportingReadinessPanel } from '../../../../../components/markos/crm/reporting-readiness-panel';

const { buildReadinessReport } = require('../../../../../lib/markos/crm/reporting.ts');

export default async function MarkOSCrmReportingVerificationPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const readiness = buildReadinessReport({ tenant_id: tenantContext.tenantId });

  const initialState = {
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
    current_view: 'verification',
    role_layer: tenantContext.role,
    time_range: 'last_30_days',
    selected_pipeline_key: null,
    selected_attribution_record_id: null,
    selected_evidence_key: 'verification',
    available_views: ['pipeline', 'attribution', 'risk', 'productivity', 'readiness', 'verification'],
    readiness,
    cockpit: { pipeline_health: [], productivity: { open_task_count: 0 }, sla_risk: { at_risk_records: 0 } },
    executive_summary: {
      readiness_status: readiness.status,
      readiness_summary: readiness.summary,
      deal_count: 0,
      at_risk_records: 0,
      open_task_count: 0,
    },
    central_rollup: null,
    evidence_entries: [
      { evidence_key: 'verification', title: 'Verification workflow', detail: 'CRM Reporting Verification keeps live checks and closeout promotion inside the product.' },
      { evidence_key: 'checklist', title: 'Checklist evidence', detail: 'ATT-01 and REP-01 checks capture commands, outcomes, and required artifacts.' },
    ],
  };

  return (
    <ReportingStoreProvider initialState={initialState}>
      <div className="min-h-screen bg-[#f5f7fa] p-6 text-[#0f172a]">
        <div className="mx-auto grid max-w-7xl gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">CRM Reporting Verification</p>
            <h1 className="mt-2 text-3xl font-semibold">Live verification and closeout promotion for ATT-01 and REP-01</h1>
            <p className="mt-3 max-w-4xl text-sm text-slate-600">Use this route to review readiness, capture evidence, and package repeatable live verification without leaving the CRM reporting shell.</p>
          </section>
          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ReportingNav />
            </aside>
            <main className="grid gap-4">
              <ReportingReadinessPanel />
              <ReportingVerificationChecklist />
            </main>
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ReportingEvidenceRail />
            </aside>
          </div>
        </div>
      </div>
    </ReportingStoreProvider>
  );
}