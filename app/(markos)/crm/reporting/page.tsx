import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../lib/markos/auth/session';
import { ReportingStoreProvider } from './reporting-store';
import { ReportingNav } from '../../../../components/markos/crm/reporting-nav';
import { ReportingDashboard } from '../../../../components/markos/crm/reporting-dashboard';
import { ReportingEvidenceRail } from '../../../../components/markos/crm/reporting-evidence-rail';
import { ReportingExecutiveSummary } from '../../../../components/markos/crm/reporting-executive-summary';
import { ReportingCentralRollup } from '../../../../components/markos/crm/reporting-central-rollup';

const {
  buildReadinessReport,
  buildReportingCockpitData,
  buildExecutiveSummary,
  buildCentralReportingRollup,
} = require('../../../../lib/markos/crm/reporting.ts');

const CENTRAL_ROLES = new Set(['owner', 'billing-admin']);

export default async function MarkOSCrmReportingPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const readiness = buildReadinessReport({ tenant_id: tenantContext.tenantId });
  const cockpit = buildReportingCockpitData({ tenant_id: tenantContext.tenantId });
  const executiveSummary = buildExecutiveSummary({ readiness, cockpit, tenant_id: tenantContext.tenantId });
  const centralRollup = CENTRAL_ROLES.has(tenantContext.role)
    ? buildCentralReportingRollup({ tenant_id: tenantContext.tenantId })
    : null;

  const initialState = {
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
    current_view: 'pipeline',
    role_layer: CENTRAL_ROLES.has(tenantContext.role) ? 'central-operator' : tenantContext.role,
    time_range: 'last_30_days',
    selected_pipeline_key: null,
    selected_attribution_record_id: cockpit.pipeline_health[0]?.record_id || null,
    selected_evidence_key: readiness.reasons[0] || 'pipeline_health',
    available_views: ['pipeline', 'attribution', 'risk', 'productivity', 'readiness', 'verification'],
    readiness,
    cockpit,
    executive_summary: executiveSummary,
    central_rollup: centralRollup,
    evidence_entries: [
      {
        evidence_key: 'readiness',
        title: 'Readiness review',
        detail: readiness.summary,
      },
      {
        evidence_key: 'attribution_lineage',
        title: 'Attribution lineage',
        detail: 'Attribution drill-downs stay attached to CRM touches, identity links, and outbound evidence.',
      },
      {
        evidence_key: 'verification',
        title: 'Verification',
        detail: 'Verification surfaces keep live checks and closeout evidence in the CRM reporting shell.',
      },
    ],
  };

  return (
    <ReportingStoreProvider initialState={initialState}>
      <div className="min-h-screen bg-[#f5f7fa] p-6 text-[#0f172a]">
        <div className="mx-auto grid max-w-7xl gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">CRM Reporting Cockpit</p>
            <h1 className="mt-2 text-3xl font-semibold">Pipeline health, attribution, risk, productivity, readiness, and verification in one shell</h1>
            <p className="mt-3 max-w-4xl text-sm text-slate-600">
              This cockpit keeps operators, executives, tenant admins, and central operators on one reporting truth layer. Pipeline health, attribution,
              risk, productivity, readiness, and verification all stay inside the MarkOS CRM shell.
            </p>
          </section>

          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ReportingNav />
            </aside>
            <main className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <ReportingDashboard />
                <ReportingExecutiveSummary />
              </div>
              <ReportingCentralRollup />
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