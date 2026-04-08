/**
 * Task execution contracts for Phase 46: Operator Task Graph UI
 *
 * Locked decisions:
 * - TaskStepState enum: queued | approved | executing | completed | failed (D-03)
 * - Evidence immutability at UI layer, append-only event log (D-05, D-06)
 * - Sequential execution enforced via order_index validation (D-02)
 * - Retry append-only with input snapshot preservation (D-11)
 *
 * This module defines the shared shape consumed by reducer, store, and all task graph components.
 * Evidence model is persistence-ready for Event Store pattern in Phase 47/48.
 */

/**
 * Task step execution state enum
 * Locked strict progression:
 * - queued: awaiting operator action or approval
 * - approved: passed approval gate, ready to execute
 * - executing: actively running
 * - completed: finished successfully
 * - failed: execution error (distinct from rejection)
 */
export const TaskStepState = {
  Queued: "queued",
  Approved: "approved",
  Executing: "executing",
  Completed: "completed",
  Failed: "failed",
} as const;

export type TaskStepState = (typeof TaskStepState)[keyof typeof TaskStepState];

/**
 * Approval gate outcome (rejection ≠ failure)
 * Rejection leaves step in queued state; failure transitions to failed state.
 */
export type TaskApprovalStatus = "pending" | "approved" | "rejected";

/**
 * Step-level evidence: read-only UI model, append-only storage model
 * Locked contract (D-11):
 * - inputs captured before execution
 * - logs appended during execution
 * - outputs and actor_id recorded on completion
 * - all timestamps are ISO 8601 strings (nullable until relevant event occurs)
 */
export type TaskStepEvidence = Readonly<{
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown> | null;
  logs: string[];
  step_started_at: string | null;
  step_completed_at: string | null;
  actor_id: string | null;
}>;

/**
 * Retry attempt record (append-only log entry per D-11)
 * Each retry is immutable once recorded; new attempts generate new records.
 */
export type TaskStepRetryAttempt = {
  attempt: number;
  requested_at: string;
  requested_by: string;
  input_snapshot: Record<string, unknown>;
  previous_error: string | null;
  outcome_state: TaskStepState | null;
};

/**
 * Single step within a task execution
 * Locked structure per D-05, D-06:
 * - state machine: TaskStepState enum
 * - approval gate: separate approval record
 * - evidence: read-only evidence model
 * - retry: append-only retry_attempts array
 */
export type TaskStepRecord = {
  id: string;
  flow_id: string;
  title: string;
  description: string;
  order_index: number;
  state: TaskStepState;
  requires_approval: boolean;
  approval: {
    status: TaskApprovalStatus;
    decided_at: string | null;
    decided_by: string | null;
    rejection_reason: string | null;
  };
  latest_error: string | null;
  retry_count: number;
  retry_attempts: TaskStepRetryAttempt[];
  evidence: TaskStepEvidence;
};

/**
 * Top-level task execution record
 * Locked per D-02, D-04:
 * - Single current_step_id to enforce sequential flow (no branching in MVP)
 * - Status derived from step states but kept explicit for clarity
 * - created_at and updated_at for audit trail
 */
export type TaskExecutionRecord = {
  id: string;
  flow_id: string;
  flow_name: string;
  actor_role: "owner" | "operator";
  current_step_id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  steps: TaskStepRecord[];
};

/**
 * Event record for append-only store (persistence-ready)
 * Used to generate TaskEventRecord entries in reducer
 * Locked pattern per D-06: all state mutations emit events
 */
export type TaskEventRecord = {
  event_id: string;
  task_id: string;
  step_id: string;
  event_name:
    | "step_started"
    | "step_executed"
    | "step_completed"
    | "step_failed"
    | "step_approved"
    | "step_rejected"
    | "step_retried"
    | "task_started"
    | "task_completed"
    | "task_failed";
  occurred_at: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
};

/**
 * In-memory store shape (will be replaced by server store in Phase 47/48)
 */
export type TaskStoreState = {
  tasksById: Record<string, TaskExecutionRecord>;
  taskOrder: string[];
  selectedTaskId: string | null;
  selectedEvidenceStepId: string | null;
  taskEvents: TaskEventRecord[];
  activeModal: {
    type: "approval" | "retry" | null;
    stepId?: string;
  };
};

/**
 * Action types for reducer pattern
 */
export const TaskActionType = {
  SelectTask: "SELECT_TASK",
  SelectEvidenceStep: "SELECT_EVIDENCE_STEP",
  StartStep: "START_STEP",
  ExecuteStep: "EXECUTE_STEP",
  CompleteStep: "COMPLETE_STEP",
  FailStep: "FAIL_STEP",
  ApproveStep: "APPROVE_STEP",
  RejectStep: "REJECT_STEP",
  RetryStep: "RETRY_STEP",
  OpenApprovalModal: "OPEN_APPROVAL_MODAL",
  OpenRetryModal: "OPEN_RETRY_MODAL",
  CloseModal: "CLOSE_MODAL",
} as const;

/**
 * Action union for type-safe reducer dispatch
 */
export type TaskAction =
  | { type: "SELECT_TASK"; taskId: string }
  | { type: "SELECT_EVIDENCE_STEP"; stepId: string | null }
  | { type: "START_STEP"; taskId: string; stepId: string }
  | {
      type: "EXECUTE_STEP";
      taskId: string;
      stepId: string;
      actorId: string;
      inputs: Record<string, unknown>;
    }
  | {
      type: "COMPLETE_STEP";
      taskId: string;
      stepId: string;
      outputs: Record<string, unknown>;
      logs: string[];
    }
  | {
      type: "FAIL_STEP";
      taskId: string;
      stepId: string;
      error: string;
      logs: string[];
    }
  | {
      type: "APPROVE_STEP";
      taskId: string;
      stepId: string;
      decisionMadeby: string;
    }
  | {
      type: "REJECT_STEP";
      taskId: string;
      stepId: string;
      decisionMadeby: string;
      reason: string;
    }
  | {
      type: "RETRY_STEP";
      taskId: string;
      stepId: string;
      requestedBy: string;
      newInputs: Record<string, unknown>;
      previousError: string | null;
    }
  | {
      type: "OPEN_APPROVAL_MODAL";
      stepId: string;
    }
  | {
      type: "OPEN_RETRY_MODAL";
      stepId: string;
    }
  | {
      type: "CLOSE_MODAL";
    };
