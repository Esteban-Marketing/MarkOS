import React from 'react';

import { requireMarkosSession, getActiveTenantContext } from '../../../../../lib/markos/auth/session';
import { ConversationViewer } from '../../../../../components/crm/outbound/conversation-viewer';

const { listOutboundConversations } = require('../../../../../lib/markos/outbound/conversations.ts');
const { sharedStore } = require('../../../../../lib/markos/crm/api.cjs');

export default async function MarkOSCrmOutboundConversationsPage() {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);
  const conversations = listOutboundConversations(sharedStore, {
    tenant_id: tenantContext.tenantId,
  });

  return <ConversationViewer conversations={conversations} />;
}