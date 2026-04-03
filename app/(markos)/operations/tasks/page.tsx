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
 */

import React, { Suspense } from "react";
import { TaskStoreProvider } from "./task-store";
import { TaskGraph } from "./task-graph";
import { StepRunner } from "./step-runner";

/**
 * Main route component for /markos/operations/tasks
 * Wraps entire task execution experience with provider and three-region layout
 */
export default function OperationsTasksPage() {
  return (
    <TaskStoreProvider>
      <div className="flex flex-col lg:flex-row gap-4 p-6 min-h-screen bg-[#f5f7fa]">
        {/* Left Region: Task List + Graph (30% desktop, full width mobile) */}
        <aside className="w-full lg:w-[30%] bg-white rounded-lg border border-gray-200 shadow-sm overflow-y-auto max-h-[800px] lg:max-h-screen order-last lg:order-first">
          <div className="p-4">
            <h2 className="text-sm font-medium text-[#0f172a] mb-4">
              Operator Tasks
            </h2>
            <Suspense fallback={<div className="text-sm text-[#475569]">Loading tasks...</div>}>
              <TaskGraph />
            </Suspense>
          </div>
        </aside>

        {/* Center Region: Step Runner + Controls (45% desktop, full width mobile on stack) */}
        <main className="w-full lg:w-[45%] bg-white rounded-lg border border-gray-200 shadow-sm p-6 order-2">
          <h2 className="text-lg font-medium text-[#0f172a] mb-6">
            Active Step
          </h2>
          <Suspense
            fallback={
              <div className="text-sm text-[#475569]">Loading step runner...</div>
            }
          >
            <StepRunner />
          </Suspense>
        </main>

        {/* Right Region: Evidence Drawer (25% desktop, hidden on mobile, overlay on tablet) */}
        <aside className="hidden lg:block w-full lg:w-[25%] bg-white rounded-lg border border-gray-200 shadow-sm p-4 max-h-[800px] lg:max-h-screen overflow-y-auto order-3">
          <div className="text-sm text-[#475569]">
            <p className="font-medium text-[#0f172a] mb-2">Evidence Panel</p>
            <p>Click on a step to view evidence details</p>
          </div>
        </aside>
      </div>
    </TaskStoreProvider>
  );
}
