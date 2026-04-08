import React, { type ReactNode } from "react";

import {
  getActiveTenantContext,
  requireMarkosSession,
  SESSION_REQUIRED,
  TENANT_CONTEXT_MISSING,
} from "../../lib/markos/auth/session";
import { MarkOSAccessDeniedState, MarkOSLayoutShell } from "./layout-shell";

type MarkOSLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

// Task 51-02-02: Tenant Context Propagation Contract
// ====================================================
// Protected MarkOS surfaces require deterministic tenant context resolution:
// - Tenant identity is resolved from authenticated session state only
// - Never inferred implicitly from URL, headers, or user preference
// - Tenant context is attached to all protected API requests
// - Missing or ambiguous tenant context causes visible denial state (fail-closed)

function isTenantAccessError(error: unknown) {
  return error instanceof Error && (error.message === SESSION_REQUIRED || error.message === TENANT_CONTEXT_MISSING);
}

export default async function MarkOSLayout({ children }: Readonly<MarkOSLayoutProps>) {
  try {
    const session = await requireMarkosSession();
    const tenantContext = await getActiveTenantContext(session);

    if (!tenantContext?.tenantId) {
      return <MarkOSAccessDeniedState />;
    }

    return <MarkOSLayoutShell tenantId={tenantContext.tenantId}>{children}</MarkOSLayoutShell>;
  } catch (error) {
    if (isTenantAccessError(error)) {
      return <MarkOSAccessDeniedState />;
    }

    throw error;
  }
}
