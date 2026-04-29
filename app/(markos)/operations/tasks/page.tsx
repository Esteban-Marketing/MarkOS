"use client";

/**
 * Operations Task Execution Page (Phase 46)
 *
 * Route: /markos/operations/tasks
 * Purpose: Mount TaskStoreProvider and compose the three-region MVP surface
 *
 * Layout regions (desktop-first, responsive):
 * - Left (30%): Task list + graph
 * - Center (45%): Step runner controls
 * - Right (25%): Evidence drawer
 *
 * Locked decisions: D-01, D-05, D-09
 * - TaskStoreProvider seeded with fixtures enables immediate operator interaction
 * - Three-region layout maintains audit path: task list → runner → evidence
 * - Mobile responsive behavior: drawer becomes overlay, list/runner stack vertically
 *
 * Task 51-02-02: Tenant Context Propagation Contract
 * ===================================================
 * Protected MarkOS surfaces require deterministic tenant context for all API interactions:
 * - TaskStoreProvider sources tenant from authenticated context only
 * - Protected API requests to update tasks include x-tenant-id header from JWT claims
 * - Fail-closed: Request dispatch is blocked if tenant context is null/ambiguous
 * - Denial state is visible to user when tenant context mismatch occurs
 */

import React, { Suspense } from "react";
import { TaskStoreProvider } from "./task-store";
import { TaskGraph } from "./task-graph";
import { StepRunner } from "./step-runner";
import { EvidencePanel } from "./evidence-panel";
import styles from "./task-ui.module.css";

/**
 * Main route component for /markos/operations/tasks
 * Wraps entire task execution experience with provider and three-region layout
 */
export default function OperationsTasksPage() {
  return (
    <TaskStoreProvider>
      <div className={styles.page}>
        <div className={styles.layout}>
          {/* Left Region: Task List + Graph (0.9fr desktop, full width mobile) */}
          <aside className={`c-card ${styles.panelSticky}`}>
            <h2 className="t-label-caps">Operator Tasks</h2>
            <Suspense fallback={<p className={styles.emptyState}>Loading tasks...</p>}>
              <TaskGraph />
            </Suspense>
          </aside>

          {/* Center Region: Step Runner + Controls (1.2fr desktop, full width mobile) */}
          <main className="c-card">
            <h2 className="t-label-caps">Active Step</h2>
            <Suspense
              fallback={
                <p className={styles.emptyState}>Loading step runner...</p>
              }
            >
              <StepRunner />
            </Suspense>
          </main>

          {/* Right Region: Evidence Drawer (0.95fr desktop, full width mobile) */}
          <aside className={`c-card ${styles.panelSticky}`}>
            <h2 className="t-label-caps">Evidence Panel</h2>
            <Suspense
              fallback={
                <p className={styles.emptyState}>Loading evidence...</p>
              }
            >
              <EvidencePanel />
            </Suspense>
          </aside>
        </div>
      </div>
    </TaskStoreProvider>
  );
}
