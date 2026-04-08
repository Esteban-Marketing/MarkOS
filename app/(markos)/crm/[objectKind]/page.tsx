import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../lib/markos/auth/session';
import { WorkspaceShell } from '../../../../components/markos/crm/workspace-shell';
const { buildCrmWorkspaceSnapshot } = require('../../../../lib/markos/crm/workspace-data');

type WorkspaceSearchParams = {
  view?: string;
  pipeline?: string;
  search?: string;
  stage?: string;
  record?: string;
};

export default async function MarkOSCrmObjectWorkspacePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ objectKind: string }>;
  searchParams?: Promise<WorkspaceSearchParams>;
}>) {
  const resolvedParams = await params;
  let resolvedSearch: WorkspaceSearchParams = {};
  if (searchParams !== undefined) {
    resolvedSearch = await searchParams;
  }
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const snapshot = buildCrmWorkspaceSnapshot({
    tenant_id: tenantContext.tenantId,
    record_kind: resolvedParams.objectKind,
    view_type: resolvedSearch.view || 'kanban',
    pipeline_key: resolvedSearch.pipeline || null,
    search: resolvedSearch.search || '',
    stage_key: resolvedSearch.stage || '',
    selected_record: resolvedSearch.record || null,
  });

  return <WorkspaceShell tenantId={tenantContext.tenantId} objectKind={resolvedParams.objectKind} state={snapshot.state} pipeline={snapshot.pipeline} detail={snapshot.detail} objectDefinition={snapshot.objectDefinition} />;
}