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
  }), [authOverride?.iamRole, authOverride?.isAuthorized]);

  // Fail-closed: deny access if role is missing or not authorized
  const canAccess = authContext.isAuthorized && authContext.iamRole && 
    ['owner', 'tenant-admin', 'manager'].includes(authContext.iamRole);

  if (!canAccess) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <section className={`${styles.callout} ${styles.deniedCard}`}>
            <p className={styles.eyebrow}>Operator execution surface</p>
            <div className={styles.headerRow}>
              <h2 className={styles.title}>Access Denied</h2>
              <span className={`${styles.statusPill} ${styles.statusDenied}`}>Blocked</span>
            </div>
            <p className={styles.heroText}>
              Your role ({authContext.iamRole || 'unknown'}) does not have permission to access Operations.
            </p>
            <ul className={styles.metaList}>
              <li className={styles.metaItem}>
                <span className={styles.metaLabel}>Required role</span>{" "}
                <span>owner, tenant-admin, or manager</span>
              </li>
              <li className={styles.metaItem}>
                <span className={styles.metaLabel}>Boundary</span>{" "}
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
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Operator execution surface</p>
          <div className={styles.headerRow}>
            <h2 className={styles.title}>Operations</h2>
            <span className={`${styles.statusPill} ${styles.statusAllowed}`}>Authorized</span>
          </div>
          <p className={styles.heroText}>
            Run operator tasks step-by-step with explicit approvals, retries, and evidence capture. This route is the entrypoint for the Phase 46 execution surface.
          </p>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <article className={styles.panel}>
              <h3 className={styles.sectionTitle}>Execution workflow</h3>
              <p className={styles.sectionText}>
                Operators move tasks through approval-safe transitions, preserve audit evidence for every step, and only unlock later steps once the current step is resolved.
              </p>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>Sequential step execution with explicit state transitions</li>
                <li className={styles.featureItem}>Approval gates for higher-risk actions before execution</li>
                <li className={styles.featureItem}>Read-only evidence capture for logs, timestamps, inputs, and outputs</li>
              </ul>
            </article>

            <article className={styles.panel}>
              <h3 className={styles.sectionTitle}>Next action</h3>
              <p className={styles.sectionText}>
                Open the task execution surface to review queued work, inspect evidence, and move the current step forward without leaving the operator context.
              </p>
              <a className={styles.actionButton} href="/markos/operations/tasks">Go to task execution surface</a>
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.callout}>
              <h3 className={styles.sectionTitle}>Access context</h3>
              <ul className={styles.metaList}>
                <li className={styles.metaItem}>
                  <span className={styles.metaLabel}>IAM role</span>{" "}
                  <span>{authContext.iamRole}</span>
                </li>
                <li className={styles.metaItem}>
                  <span className={styles.metaLabel}>Authorization</span>{" "}
                  <span>execute_task boundary satisfied</span>
                </li>
                <li className={styles.metaItem}>
                  <span className={styles.metaLabel}>Scope</span>{" "}
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
