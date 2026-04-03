'use client';

/**
 * Operations Page (Phase 51-03 Authorization Boundary)
 * 
 * Purpose: Gate access to operations based on IAM v3.2 role and required actions.
 * - Resolve actor role from auth context
 * - Check authorization for execute_task action
 * - Render blocked state for unauthorized users
 * - Provide clear messaging when access is denied
 */

import React, { useMemo } from 'react';

interface AuthContext {
  iamRole?: string;
  isAuthorized?: boolean;
}

export default function MarkOSOperationsPage() {
  // Phase 51-03: Check authorization at component render
  // In a real implementation, this would come from auth context/session
  const authContext: AuthContext = useMemo(() => ({
    iamRole: 'readonly', // Placeholder - would come from session/auth
    isAuthorized: false, // Would be evaluated with canPerformAction
  }), []);

  // Fail-closed: deny access if role is missing or not authorized
  const canAccess = authContext.isAuthorized && authContext.iamRole && 
    ['owner', 'tenant-admin', 'manager'].includes(authContext.iamRole);

  if (!canAccess) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold text-red-600">Access Denied</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your role ({authContext.iamRole || 'unknown'}) does not have permission to access Operations.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Required role: owner, tenant-admin, or manager
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Operations</h2>
      <p>
        Run operator tasks step-by-step with explicit approvals, retries, and evidence capture. This route is
        the entrypoint for the Phase 46 execution surface.
      </p>
      <a href="/markos/operations/tasks">Go to task execution surface</a>
    </div>
  );
}
