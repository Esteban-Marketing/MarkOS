import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../../lib/markos/auth/session';
import { WorkspaceShell } from '../../../../../components/markos/crm/workspace-shell';
const { buildCrmWorkspaceSnapshot } = require('../../../../../lib/markos/crm/workspace-data');

export default async function MarkOSCrmRecordPage({
  params,
}: Readonly<{
  params: Promise<{ objectKind: string; recordId: string }>;
}>) {
  const resolvedParams = await params;
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildCrmWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    record_kind: resolvedParams.objectKind,
    view_type: 'detail',
    record_id: resolvedParams.recordId,
  });

  return <WorkspaceShell tenantId={tenantContext.tenantId} objectKind={resolvedParams.objectKind} state={snapshot.state} pipeline={snapshot.pipeline} detail={snapshot.detail} objectDefinition={snapshot.objectDefinition} />;
}