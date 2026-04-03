/**
 * In-memory task fixtures for Phase 46: Operator Task Graph UI
 *
 * Locked decision (D-07, D-09):
 * - Fixtures sourced from Phase 45 flow registry (F-01, F-02, F-03, F-05, F-09)
 * - Realistic operator task scenarios covering all 5 step states
 * - Carry Phase 45 metadata: flow_id, flow_name, domain, SLO tier
 * - Evidence model includes representative logs, timestamps, actor_id for audit trails
 *
 * This module seeds the in-memory store for development, Storybook, and testing.
 */

import {
  TaskStepState,
  TaskApprovalStatus,
  TaskStepEvidence,
  TaskStepRecord,
  TaskExecutionRecord,
  TaskEventRecord,
} from "./task-types";

/**
 * Fixtures seeded at component mount time via TaskStoreProvider
 */

// ============================================================================
// FIXTURE SET 1: Multi-step intake + approval flow (F-01, F-02, F-03)
// Demonstrates full state progression, approval gating, evidence collection
// ============================================================================

const now = new Date();
const minutesAgo = (n: number) =>
  new Date(now.getTime() - n * 60000).toISOString();
const minutesFromNow = (n: number) =>
  new Date(now.getTime() + n * 60000).toISOString();

const intakeApprovalTaskId = "task-intake-001";

const intakeApprovalSteps: TaskStepRecord[] = [
  {
    id: "step-intake-submit",
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
        form_id: "intake-2026-04-02-001",
        email: "acme@company.com",
        company_name: "ACME Corp",
        industry: "technology",
      },
      outputs: {
        parsed_email: "acme@company.com",
        verified_domain: "company.com",
        initial_slo_tier: "standard",
      },
      logs: [
        "2026-04-02T21:55:12Z - Parsing intake form",
        "2026-04-02T21:55:13Z - Validating email domain",
        "2026-04-02T21:55:14Z - Assignment to standard SLO tier",
        "2026-04-02T21:55:15Z - Intake submission completed",
      ],
      step_started_at: "2026-04-02T21:55:12Z",
      step_completed_at: "2026-04-02T21:55:15Z",
      actor_id: "operator-id-123",
    },
  },
  {
    id: "step-draft-approve",
    flow_id: "F-02",
    title: "Draft Approval Gate",
    description: "Operator must approve draft messaging before regeneration",
    order_index: 1,
    state: TaskStepState.Approved,
    requires_approval: true,
    approval: {
      status: "approved",
      decided_at: "2026-04-02T21:56:00Z",
      decided_by: "operator-id-123",
      rejection_reason: null,
    },
    latest_error: null,
    retry_count: 0,
    retry_attempts: [],
    evidence: {
      inputs: {
        draft_id: "draft-2026-04-02-001",
        draft_section: "value_prop",
      },
      outputs: null,
      logs: [
        "2026-04-02T21:55:30Z - Fetching draft for review",
        "2026-04-02T21:55:35Z - Draft presented to operator",
        "2026-04-02T21:56:00Z - Operator approved draft",
      ],
      step_started_at: "2026-04-02T21:55:30Z",
      step_completed_at: null,
      actor_id: "operator-id-123",
    },
  },
  {
    id: "step-section-regenerate",
    flow_id: "F-03",
    title: "Section Regeneration",
    description: "Generate marketing section copy using approved draft",
    order_index: 2,
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
        draft_id: "draft-2026-04-02-001",
        section_name: "value_prop",
        template_id: "tmpl-standard-vp",
      },
      outputs: null,
      logs: [
        "2026-04-02T21:56:05Z - Starting regeneration",
        "2026-04-02T21:56:10Z - Loading approved draft",
        "2026-04-02T21:56:15Z - Generating copy section...",
      ],
      step_started_at: "2026-04-02T21:56:05Z",
      step_completed_at: null,
      actor_id: "system-id-001",
    },
  },
];

export const intakeApprovalTask: TaskExecutionRecord = {
  id: intakeApprovalTaskId,
  flow_id: "F-01",
  flow_name: "client-intake-submit",
  actor_role: "operator",
  current_step_id: "step-section-regenerate",
  status: "in_progress",
  created_at: "2026-04-02T21:55:00Z",
  updated_at: "2026-04-02T21:56:15Z",
  steps: intakeApprovalSteps,
};

// ============================================================================
// FIXTURE SET 2: Status health check flow (F-05)
// Demonstrates a queued task with one failed step and retry scenario
// ============================================================================

const healthCheckTaskId = "task-health-001";

const healthCheckSteps: TaskStepRecord[] = [
  {
    id: "step-health-check-1",
    flow_id: "F-05",
    title: "System Status Check",
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
    latest_error:
      "Connection timeout to health endpoint after 5 retries (last error: ECONNREFUSED)",
    retry_count: 1,
    retry_attempts: [
      {
        attempt: 1,
        requested_at: "2026-04-02T21:54:30Z",
        requested_by: "operator-id-456",
        input_snapshot: {
          health_endpoint: "https://api.example.com/health",
          timeout_ms: 5000,
        },
        previous_error:
          "Connection refused, endpoint unreachable (attempt 1 of 5)",
        outcome_state: TaskStepState.Failed,
      },
    ],
    evidence: {
      inputs: {
        health_endpoint: "https://api.example.com/health",
        timeout_ms: 5000,
        retry_strategy: "exponential_backoff",
      },
      outputs: null,
      logs: [
        "2026-04-02T21:54:05Z - Starting health check",
        "2026-04-02T21:54:10Z - Connecting to health endpoint...",
        "2026-04-02T21:54:15Z - Attempt 1: Connection refused",
        "2026-04-02T21:54:20Z - Attempt 2: Timeout after 5000ms",
        "2026-04-02T21:54:25Z - Maximum retries exceeded",
        "2026-04-02T21:54:30Z - Step failed, marked for manual retry",
      ],
      step_started_at: "2026-04-02T21:54:05Z",
      step_completed_at: "2026-04-02T21:54:30Z",
      actor_id: "system-id-001",
    },
  },
];

export const healthCheckTask: TaskExecutionRecord = {
  id: healthCheckTaskId,
  flow_id: "F-05",
  flow_name: "system-status-health",
  actor_role: "operator",
  current_step_id: "step-health-check-1",
  status: "failed",
  created_at: "2026-04-02T21:54:00Z",
  updated_at: "2026-04-02T21:54:30Z",
  steps: healthCheckSteps,
};

// ============================================================================
// FIXTURE SET 3: Queued reporting task (passive fixture, not yet started)
// Demonstrates initial state with no evidence yet
// ============================================================================

const reportingTaskId = "task-reporting-001";

const reportingSteps: TaskStepRecord[] = [
  {
    id: "step-report-generate",
    flow_id: "F-09",
    title: "Generate Operational Report",
    description: "Compile metrics and audit log into weekly operations report",
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
];

export const reportingTask: TaskExecutionRecord = {
  id: reportingTaskId,
  flow_id: "F-09",
  flow_name: "operations-report-weekly",
  actor_role: "operator",
  current_step_id: "step-report-generate",
  status: "queued",
  created_at: "2026-04-02T21:50:00Z",
  updated_at: "2026-04-02T21:50:00Z",
  steps: reportingSteps,
};

// ============================================================================
// Fixture map and initial state
// ============================================================================

/**
 * All fixture tasks keyed by task ID
 * Used to initialize TaskStoreState.tasksById
 */
export const fixtureTasksById: Record<string, TaskExecutionRecord> = {
  [intakeApprovalTaskId]: intakeApprovalTask,
  [healthCheckTaskId]: healthCheckTask,
  [reportingTaskId]: reportingTask,
};

/**
 * Ordered list of fixture task IDs for TaskStoreState.taskOrder
 */
export const fixtureTaskOrder = [
  intakeApprovalTaskId,
  healthCheckTaskId,
  reportingTaskId,
];

/**
 * Initial store state with all fixtures loaded and seeded
 */
export const initialTaskStoreState = () => ({
  tasksById: { ...fixtureTasksById },
  taskOrder: [...fixtureTaskOrder],
  selectedTaskId: intakeApprovalTaskId,
  selectedEvidenceStepId: "step-draft-approve",
  taskEvents: [] as TaskEventRecord[],
  activeModal: {
    type: null as "approval" | "retry" | null,
    stepId: undefined as string | undefined,
  },
});
