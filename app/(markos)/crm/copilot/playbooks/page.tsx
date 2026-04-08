import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../../lib/markos/auth/session';
import { CopilotPlaybookReview } from '../../../../../components/markos/crm/copilot-playbook-review';
import { CopilotOversightPanel } from '../../../../../components/markos/crm/copilot-oversight-panel';

const { buildCopilotWorkspaceSnapshot } = require('../../../../../lib/markos/crm/copilot.ts');

export default async function MarkOSCrmCopilotPlaybooksPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildCopilotWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
  });

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-[#f5f7fa] p-6 lg:flex-row">
      <div className="w-full lg:w-[65%]">
        <CopilotPlaybookReview playbooks={snapshot.approval_packages || []} />
      </div>
      <div className="w-full lg:w-[35%]">
        <CopilotOversightPanel playbooks={snapshot.approval_packages || []} targetTenantId={snapshot.tenant_id} />
      </div>
    </div>
  );
}