/**
 * Storybook fixtures for Phase 46 Operator Task UI
 *
 * Deterministic task states for five required stories:
 * - Queued: Initial task state awaiting operator action
 * - Approved: Step approved and ready to execute
 * - Executing: Step currently running
 * - Completed: Successfully finished task
 * - Failed: Execution error with retry opportunity
 *
 * Locked decision (D-16): Five state stories cover all task lifecycle paths
 */

export { initialTaskStoreState } from "./task-fixtures";
import {
  TaskExecutionRecord,
  TaskStepState,
  TaskStepRecord,
} from "./task-types";

const now = new Date();
const minutesAgo = (n: number) =>
  new Date(now.getTime() - n * 60000).toISOString();

/**
 * Story 1: Queued Task
 * Initial state: operator ready to execute first step
 */
export const queuedStoryTask: TaskExecutionRecord = {
  id: "story-task-queued",
  flow_id: "F-01",
  flow_name: "client-intake-submit",
  actor_role: "operator",
  current_step_id: "queued-step-1",
  status: "queued",
  created_at: minutesAgo(10),
  updated_at: minutesAgo(10),
  steps: [
    {
      id: "queued-step-1",
      flow_id: "F-01",
      title: "Client Intake Submission",
      description: "Collect and validate client intake form",
      order_index: 0,
      state: TaskStepState.Queued,
      requires_approval: false,
      approval: {
        status: "pending",
        decided_at: null,
        decided_by: null,
        rejection_reason: null,
      },
      latest_error: null,
      retry_count: 0,
      retry_attempts: [],
      evidence: {
        inputs: {},
        outputs: null,
        logs: [],
        step_started_at: null,
        step_completed_at: null,
        actor_id: null,
      },
    },
  ],
};

/**
 * Story 2: Approved Task
 * Step approved and ready for execution
 */
export const approvedStoryTask: TaskExecutionRecord = {
  id: "story-task-approved",
  flow_id: "F-02",
  flow_name: "draft-approve",
  actor_role: "operator",
  current_step_id: "approved-step-1",
  status: "in_progress",
  created_at: minutesAgo(15),
  updated_at: minutesAgo(2),
  steps: [
    {
      id: "approved-step-1",
      flow_id: "F-02",
      title: "Draft Approval Gate",
      description: "Operator must approve draft before regeneration",
      order_index: 0,
      state: TaskStepState.Approved,
      requires_approval: true,
      approval: {
        status: "approved",
        decided_at: minutesAgo(2),
        decided_by: "operator-story",
        rejection_reason: null,
      },
      latest_error: null,
      retry_count: 0,
      retry_attempts: [],
      evidence: {
        inputs: {
          draft_id: "draft-2024-01",
          draft_section: "value_prop",
        },
        outputs: null,
        logs: ["Decision: Approved for regeneration"],
        step_started_at: minutesAgo(3),
        step_completed_at: null,
        actor_id: "operator-story",
      },
    },
  ],
};

/**
 * Story 3: Executing Task
 * Step currently running
 */
export const executingStoryTask: TaskExecutionRecord = {
  id: "story-task-executing",
  flow_id: "F-03",
  flow_name: "section-regenerate",
  actor_role: "operator",
  current_step_id: "executing-step-1",
  status: "in_progress",
  created_at: minutesAgo(20),
  updated_at: minutesAgo(0.5),
  steps: [
    {
      id: "executing-step-1",
      flow_id: "F-03",
      title: "Section Regeneration",
      description: "Generate marketing section copy",
      order_index: 0,
      state: TaskStepState.Executing,
      requires_approval: false,
      approval: {
        status: "pending",
        decided_at: null,
        decided_by: null,
        rejection_reason: null,
      },
      latest_error: null,
      retry_count: 0,
      retry_attempts: [],
      evidence: {
        inputs: {
          section_id: "section-123",
          template: "standard",
        },
        outputs: null,
        logs: [
          "2024-01-10T10:05:00Z - Execution started",
          "2024-01-10T10:05:03Z - Loading template...",
          "2024-01-10T10:05:05Z - Generating content...",
        ],
        step_started_at: minutesAgo(0.5),
        step_completed_at: null,
        actor_id: "system",
      },
    },
  ],
};

/**
 * Story 4: Completed Task
 * Successfully finished all steps
 */
export const completedStoryTask: TaskExecutionRecord = {
  id: "story-task-completed",
  flow_id: "F-01",
  flow_name: "client-intake-submit",
  actor_role: "operator",
  current_step_id: "completed-step-1",
  status: "completed",
  created_at: minutesAgo(45),
  updated_at: minutesAgo(5),
  steps: [
    {
      id: "completed-step-1",
      flow_id: "F-01",
      title: "Client Intake Submission",
      description: "Collect and validate client intake form",
      order_index: 0,
      state: TaskStepState.Completed,
      requires_approval: false,
      approval: {
        status: "pending",
        decided_at: null,
        decided_by: null,
        rejection_reason: null,
      },
      latest_error: null,
      retry_count: 0,
      retry_attempts: [],
      evidence: {
        inputs: {
          form_id: "intake-2024-01",
          email: "client@example.com",
          company: "Example Corp",
        },
        outputs: {
          submission_id: "sub-789",
          validated: true,
          slo_tier: "standard",
        },
        logs: [
          "2024-01-10T09:30:00Z - Form parsing started",
          "2024-01-10T09:30:02Z - Email validation passed",
          "2024-01-10T09:30:05Z - SLO tier assigned: standard",
          "2024-01-10T09:30:06Z - Submission stored",
        ],
        step_started_at: minutesAgo(45),
        step_completed_at: minutesAgo(5),
        actor_id: "operator-story",
      },
    },
  ],
};

/**
 * Story 5: Failed Task
 * Execution error with retry history
 */
export const failedStoryTask: TaskExecutionRecord = {
  id: "story-task-failed",
  flow_id: "F-05",
  flow_name: "system-status-health",
  actor_role: "operator",
  current_step_id: "failed-step-1",
  status: "failed",
  created_at: minutesAgo(30),
  updated_at: minutesAgo(8),
  steps: [
    {
      id: "failed-step-1",
      flow_id: "F-05",
      title: "System Health Check",
      description: "Verify API health and uptime metrics",
      order_index: 0,
      state: TaskStepState.Failed,
      requires_approval: false,
      approval: {
        status: "pending",
        decided_at: null,
        decided_by: null,
        rejection_reason: null,
      },
      latest_error: "Connection timeout after 5 retries (ECONNREFUSED)",
      retry_count: 2,
      retry_attempts: [
        {
          attempt: 1,
          requested_at: minutesAgo(18),
          requested_by: "operator-story",
          input_snapshot: {
            health_endpoint: "https://api.example.com/health",
            timeout_ms: 5000,
          },
          previous_error:
            "Connection refused (attempt 1 of 5)",
          outcome_state: TaskStepState.Failed,
        },
        {
          attempt: 2,
          requested_at: minutesAgo(8),
          requested_by: "operator-story",
          input_snapshot: {
            health_endpoint: "https://api.example.com/health",
            timeout_ms: 10000, // Increased timeout
          },
          previous_error:
            "Connection timeout after 10000ms",
          outcome_state: TaskStepState.Failed,
        },
      ],
      evidence: {
        inputs: {
          health_endpoint: "https://api.example.com/health",
          timeout_ms: 5000,
        },
        outputs: null,
        logs: [
          "2024-01-10T10:15:00Z - Starting health check",
          "2024-01-10T10:15:02Z - Connecting to endpoint...",
          "2024-01-10T10:15:07Z - Timeout: No response after 5000ms",
          "2024-01-10T10:15:07Z - Step failed",
          "2024-01-10T10:23:00Z - Retry attempt 1: increased timeout",
          "2024-01-10T10:23:12Z - Still connection refused",
          "2024-01-10T10:33:00Z - Retry attempt 2: max attempts exceeded",
        ],
        step_started_at: minutesAgo(30),
        step_completed_at: minutesAgo(8),
        actor_id: "system",
      },
    },
  ],
};
