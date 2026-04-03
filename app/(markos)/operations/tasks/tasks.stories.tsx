import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskStoreProvider } from "./task-store";
import { TaskGraph } from "./task-graph";
import { StepRunner } from "./step-runner";
import { EvidencePanel } from "./evidence-panel";
import { ApprovalGate } from "./approval-gate";
import {
  queuedStoryTask,
  approvedStoryTask,
  executingStoryTask,
  completedStoryTask,
  failedStoryTask,
  initialTaskStoreState,
} from "./story-fixtures";
import type { TaskExecutionRecord } from "./task-types";

/**
 * Story wrapper component: renders the full three-region layout seeded with a specific task fixture
 * Used for all five required state stories
 */
function TaskUIStoryWrapper({ task }: { task: TaskExecutionRecord }) {
  return (
    <TaskStoreProvider>
      <div className="flex flex-col lg:flex-row gap-4 p-6 min-h-screen bg-[#f5f7fa]">
        {/* Left: Task Graph */}
        <aside className="w-full lg:w-[30%] bg-white rounded-lg border border-gray-200 shadow-sm p-4 max-h-screen overflow-y-auto order-last lg:order-first">
          <h3 className="text-sm font-medium text-[#0f172a] mb-4">
            Operator Tasks
          </h3>
          <TaskGraph />
        </aside>

        {/* Center: Step Runner */}
        <main className="w-full lg:w-[45%] bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-[#0f172a] mb-6">
            Active Step
          </h2>
          <StepRunner />
        </main>

        {/* Right: Evidence Panel */}
        <aside className="hidden lg:block w-full lg:w-[25%] bg-white rounded-lg border border-gray-200 shadow-sm p-4 max-h-screen overflow-y-auto">
          <p className="text-sm font-medium text-[#0f172a] mb-4">
            Evidence Panel
          </p>
          <EvidencePanel />
        </aside>
      </div>
    </TaskStoreProvider>
  );
}

const meta = {
  title: "Phase 46 / Operator Task UI",
  component: TaskUIStoryWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TaskUIStoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story 1: Queued
 * Initial task state: operator sees queued step and can trigger execution
 */
export const Queued: Story = {
  args: {
    task: queuedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Initial task state where the first step is queued and waiting for operator action. Shows the Execute Task Step button ready to be clicked.",
      },
    },
  },
};

/**
 * Story 2: Approved
 * Step approved by operator: ready for execution
 */
export const Approved: Story = {
  args: {
    task: approvedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Step after operator approval decision is recorded. Approval modal has closed and the step is ready to execute. Shows the approval decision metadata (decided_at, decided_by).",
      },
    },
  },
};

/**
 * Story 3: Executing
 * Step actively running: operator sees progress logs
 */
export const Executing: Story = {
  args: {
    task: executingStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Step actively executing. Shows execution logs being captured in real-time, Mark Complete and Fail Step buttons available, evidence drawer shows inputs captured.",
      },
    },
  },
};

/**
 * Story 4: Completed
 * Successfully finished task: all evidence captured
 */
export const Completed: Story = {
  args: {
    task: completedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Successfully completed task with full evidence trail including inputs, outputs, logs, timestamps, and actor audit. Shows completed state badge and read-only controls.",
      },
    },
  },
};

/**
 * Story 5: Failed
 * Execution error with retry history: operator decides next action
 */
export const Failed: Story = {
  args: {
    task: failedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Failed step with error message and retry history visible. Operator can retry with potentially edited inputs. Evidence drawer shows all retry attempts with timestamps and reasons.",
      },
    },
  },
};
