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
import styles from './page.module.css';

export interface AuthContext {
  iamRole?: string;
  isAuthorized?: boolean;
  canAccess?: boolean;
}

type MarkOSOperationsPageProps = Readonly<{
  authOverride?: AuthContext;
}>;

export default function MarkOSOperationsPage({
  authOverride,
}: MarkOSOperationsPageProps) {
  // Phase 51-03: Check authorization at component render
  // In a real implementation, this would come from auth context/session
  const authContext: AuthContext = useMemo(() => ({
    iamRole: authOverride?.iamRole ?? 'readonly', // Placeholder - would come from session/auth
    isAuthorized: authOverride?.isAuthorized ?? false, // Would be evaluated with canPerformAction
    canAccess: authOverride?.canAccess,
  }), [authOverride?.iamRole, authOverride?.isAuthorized, authOverride?.canAccess]);

  const iamRole = authContext.iamRole;
  const isAuthorized = authContext.isAuthorized;

  // Fail-closed: deny access if role is missing or not authorized
  const canAccess =
    authContext.canAccess ?? (isAuthorized && iamRole && ['owner', 'tenant-admin', 'manager'].includes(iamRole));

  if (!canAccess) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <section className="c-card">
            <span className="t-label-caps">Operator execution surface</span>
            <div className={styles.headerRow}>
              <h2>Access Denied</h2>
              <span className="c-badge c-badge--error">
                <span className="c-status-dot c-status-dot--error" aria-hidden="true" />
                [err] Blocked
              </span>
            </div>
            <output className="c-notice c-notice--error">
              <strong>[err]</strong>{" "}Role {"`"}
              {iamRole || 'unknown'}
              {"`"} lacks execute_task permission. Contact an owner or admin to request access.
            </div>
            <ul className={styles.metaList}>
              <li className={styles.metaItem}>
                <span className="t-label-caps">Required role</span>{" "}
                <span>owner, tenant-admin, or manager</span>
              </li>
              <li className={styles.metaItem}>
                <span className="t-label-caps">Boundary</span>{" "}
                <span>Phase 51-03 fail-closed authorization gate for execute_task access.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className="c-card">
          <span className="t-label-caps">Operator execution surface</span>
          <div className={styles.headerRow}>
            <h2>Operations</h2>
            {isAuthorized ? (
              <span className="c-badge c-badge--success">
                <span className="c-status-dot c-status-dot--live" aria-hidden="true" />
                [ok] Authorized
              </span>
            ) : (
              <span className="c-badge c-badge--error">
                <span className="c-status-dot c-status-dot--error" aria-hidden="true" />
                [err] Blocked
              </span>
            )}
          </div>
          <p className="t-lead">
            Run operator tasks step-by-step with explicit approvals, retries, and evidence capture. This route is the entrypoint for the Phase 46 execution surface.
          </p>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <article className="c-card">
              <h3>Execution workflow</h3>
              <p className="t-lead">
                Operators move tasks through approval-safe transitions, preserve audit evidence for every step, and only advance to later steps once the current step is resolved.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Sequential step execution with explicit state transitions</li>
                <li className={styles.featureItem}>Approval gates for higher-risk actions before execution</li>
                <li className={styles.featureItem}>Read-only evidence capture for logs, timestamps, inputs, and outputs</li>
              </ul>
            </article>

            <article className="c-card">
              <h3>Next action</h3>
              <p className="t-lead">
                Open the task execution surface to review queued work, inspect evidence, and move the current step forward without leaving the operator context.
              </p>
              <a className="c-button c-button--primary" href="/operations/tasks">Go to task execution</a>
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className="c-card">
              <h3>Access context</h3>
              <ul className={styles.metaList}>
                <li className={styles.metaItem}>
                  <span className="t-label-caps">IAM role</span>{" "}
                  <span>{iamRole}</span>
                </li>
                <li className={styles.metaItem}>
                  <span className="t-label-caps">Authorization</span>{" "}
                  <span>execute_task boundary satisfied</span>
                </li>
                <li className={styles.metaItem}>
                  <span className="t-label-caps">Scope</span>{" "}
                  <span>operator task execution, retry handling, and evidence review</span>
                </li>
              </ul>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}
