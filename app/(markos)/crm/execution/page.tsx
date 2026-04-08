import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../lib/markos/auth/session';
import { ExecutionStoreProvider } from './execution-store';
import { ExecutionQueue } from '../../../../components/markos/crm/execution-queue';
import { ExecutionDetail } from '../../../../components/markos/crm/execution-detail';
import { ExecutionEvidencePanel } from '../../../../components/markos/crm/execution-evidence-panel';

const { buildExecutionWorkspaceSnapshot } = require('../../../../lib/markos/crm/execution');

export default async function MarkOSCrmExecutionPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildExecutionWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
    scope: tenantContext.role === 'manager' || tenantContext.role === 'owner' || tenantContext.role === 'tenant-admin' ? 'team' : 'personal',
  });

  return (
    <ExecutionStoreProvider initialState={snapshot}>
      <div className="flex min-h-screen flex-col gap-4 bg-[#f5f7fa] p-6 lg:flex-row">
        <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[30%]">
          <h1 className="text-sm font-medium text-[#0f172a] mb-4">Execution Queue</h1>
          <ExecutionQueue />
        </aside>
        <main className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:w-[45%]">
          <h2 className="text-lg font-medium text-[#0f172a] mb-6">Recommendation Detail</h2>
          <ExecutionDetail />
        </main>
        <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[25%]">
          <h2 className="text-sm font-medium text-[#0f172a] mb-4">Evidence Panel</h2>
          <ExecutionEvidencePanel />
        </aside>
      </div>
    </ExecutionStoreProvider>
  );
}