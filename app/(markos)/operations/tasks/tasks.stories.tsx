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
 * Used for all required state stories
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
        <div className={styles.layout}>
          <aside className={`c-card ${styles.panelSticky}`}>
            <p className="t-label-caps">Task list</p>
            <h3>Operator Tasks</h3>
            <p>
              Current task state is seeded from a deterministic story fixture.
            </p>
            <TaskGraph />
          </aside>

          <main className="c-card">
            <p className="t-label-caps">Active step</p>
            <h2>Execution Controls</h2>
            <p>
              Only the current actionable step exposes transitions. Future steps stay locked until prior work is resolved.
            </p>
            <StepRunner />
          </main>

          <aside className={`c-card ${styles.panelSticky}`}>
            <p className="t-label-caps">Audit evidence</p>
            <h3>Evidence Panel</h3>
            <p>
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
  title: "Operations/Tasks",
  component: TaskUIStoryWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TaskUIStoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * QueuedTask: Initial task state — operator sees queued step ready for execution
 * Exercises: .c-badge--info [–] Queued, .c-button--primary Execute Task Step
 */
export const QueuedTask: Story = {
  args: {
    task: queuedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Initial task state where the first step is queued and waiting for operator action. Shows .c-badge--info [–] Queued badge and .c-button--primary Execute Task Step.",
      },
    },
  },
};

/**
 * ExecutingTask: Step actively running — operator sees executing banner and controls
 * Exercises: .c-badge--warning [•] Executing, .c-notice c-notice--info helper banner, .c-button--destructive Fail Step
 */
export const ExecutingTask: Story = {
  args: {
    task: executingStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Step actively executing. Shows .c-badge--warning [•] Executing badge, .c-notice c-notice--info helper banner ('[•] Step is executing...'), Mark Complete and Fail Step buttons.",
      },
    },
  },
};

/**
 * CompletedTask: Successfully finished task — full evidence trail visible
 * Exercises: .c-badge--success [ok] Completed, evidence-panel .c-card entries, .c-chip-protocol IDs
 */
export const CompletedTask: Story = {
  args: {
    task: completedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Successfully completed task with full evidence trail including inputs, outputs, logs, timestamps, and actor audit. Shows .c-badge--success [ok] Completed badge and .c-chip-protocol IDs in evidence panel.",
      },
    },
  },
};

/**
 * FailedTask: Execution error with retry available
 * Exercises: .c-badge--error [err] Failed, .c-notice c-notice--error helper banner, .c-button--secondary Retry Step
 */
export const FailedTask: Story = {
  args: {
    task: failedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Failed step with error message and retry history visible. Shows .c-badge--error [err] Failed badge, .c-notice c-notice--error ('[err] Step failed...'), and .c-button--secondary Retry Step.",
      },
    },
  },
};

/**
 * ApprovalRequired: Approval gate rendered — operator must approve or reject
 * Exercises: .c-modal, .c-backdrop, .c-input + .c-field comment textarea, .c-button--primary Approve + .c-button--destructive Reject
 */
export const ApprovalRequired: Story = {
  args: {
    task: approvedStoryTask,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Approval gate surface — step requires explicit operator decision. Shows .c-input + .c-field comment textarea, .c-button--primary Approve + .c-button--destructive Reject with .c-modal reject confirm.",
      },
    },
  },
};

/**
 * Queued (legacy alias — preserved for existing snapshot baseline)
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
 * Approved (legacy alias — preserved for existing snapshot baseline)
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
 * Executing (legacy alias — preserved for existing snapshot baseline)
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
 * Completed (legacy alias — preserved for existing snapshot baseline)
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
 * Failed (legacy alias — preserved for existing snapshot baseline)
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
