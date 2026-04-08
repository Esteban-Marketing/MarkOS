import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../lib/markos/auth/session';
import { CopilotStoreProvider } from './copilot-store';
import { CopilotRecordPanel } from '../../../../components/markos/crm/copilot-record-panel';
import { CopilotConversationPanel } from '../../../../components/markos/crm/copilot-conversation-panel';
import { CopilotApprovalPackage } from '../../../../components/markos/crm/copilot-approval-package';

const { buildCopilotWorkspaceSnapshot } = require('../../../../lib/markos/crm/copilot.ts');

export default async function MarkOSCrmCopilotPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildCopilotWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
  });

  return (
    <CopilotStoreProvider initialState={snapshot}>
      <div className="flex min-h-screen flex-col gap-4 bg-[#f5f7fa] p-6 lg:flex-row">
        <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[30%]">
          <h1 className="mb-4 text-sm font-medium text-[#0f172a]">Record Copilot</h1>
          <CopilotRecordPanel />
        </aside>
        <main className="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:w-[45%]">
          <h2 className="mb-6 text-lg font-medium text-[#0f172a]">Conversation and Evidence</h2>
          <CopilotConversationPanel />
        </main>
        <aside className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:w-[25%]">
          <h2 className="mb-4 text-sm font-medium text-[#0f172a]">Approval Package</h2>
          <CopilotApprovalPackage />
        </aside>
      </div>
    </CopilotStoreProvider>
  );
}