import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskStoreProvider } from "./task-store";
import { TaskGraph } from "./task-graph";
import { StepRunner } from "./step-runner";
import { EvidencePanel } from "./evidence-panel";
import styles from "./task-ui.module.css";
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
function TaskUIStoryWrapper({ task }: Readonly<{ task: TaskExecutionRecord }>) {
  const seededState = {
    ...initialTaskStoreState(),
    tasksById: { [task.id]: task },
    taskOrder: [task.id],
    selectedTaskId: task.id,
    selectedEvidenceStepId: task.current_step_id,
  };

  return (
    <TaskStoreProvider initialState={seededState}>
      <div className={styles.page}>
        <section className={styles.storyHero}>
          <p className={styles.eyebrow}>Phase 46 operator execution surface</p>
          <h2 className={styles.heroTitle}>Operator Task UI</h2>
          <p className={styles.heroText}>
            Review the linear task graph, act on the current step, and inspect immutable evidence without leaving the same operator workspace.
          </p>
        </section>

        <div className={styles.layout}>
          <aside className={`${styles.panel} ${styles.panelSticky}`}>
            <p className={styles.panelEyebrow}>Task list</p>
            <h3 className={styles.panelTitle}>Operator Tasks</h3>
            <p className={styles.panelText}>
              Current task state is seeded from a deterministic story fixture.
            </p>
          <TaskGraph />
        </aside>

          <main className={styles.panel}>
            <p className={styles.panelEyebrow}>Active step</p>
            <h2 className={styles.panelTitle}>Execution Controls</h2>
            <p className={styles.panelText}>
              Only the current actionable step exposes transitions. Future steps stay locked until prior work is resolved.
            </p>
          <StepRunner />
        </main>

          <aside className={`${styles.panel} ${styles.panelSticky}`}>
            <p className={styles.panelEyebrow}>Audit evidence</p>
            <h3 className={styles.panelTitle}>Evidence Panel</h3>
            <p className={styles.panelText}>
              Inputs, outputs, logs, timestamps, and retry history remain read-only for audit clarity.
            </p>
          <EvidencePanel />
        </aside>
        </div>
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
