import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../lib/markos/auth/session';
import { OutboundWorkspace } from '../../../../components/crm/outbound/outbound-workspace';

const { buildOutboundWorkspaceSnapshot } = require('../../../../lib/markos/outbound/workspace.ts');

export default async function MarkOSCrmOutboundPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildOutboundWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    actor_id: session.userId,
    role: tenantContext.role,
  });

  return <OutboundWorkspace snapshot={snapshot} />;
}