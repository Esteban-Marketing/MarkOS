import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../lib/markos/auth/session';
import { WorkspaceShell } from '../../../components/markos/crm/workspace-shell';
const { buildCrmWorkspaceSnapshot } = require('../../../lib/markos/crm/workspace-data');

export default async function MarkOSCrmWorkspacePage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildCrmWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    record_kind: 'deal',
    view_type: 'kanban',
    pipeline_key: null,
  });

  return <WorkspaceShell tenantId={tenantContext.tenantId} objectKind="deal" state={snapshot.state} pipeline={snapshot.pipeline} detail={snapshot.detail} objectDefinition={snapshot.objectDefinition} />;
}