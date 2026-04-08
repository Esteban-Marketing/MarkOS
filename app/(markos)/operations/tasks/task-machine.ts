/**
 * Task execution reducer and state machine for Phase 46
 *
 * Locked decisions (D-02, D-03, D-04, D-05):
 * - Sequential-only progression: only current step can transition (order_index validation)
 * - Pure reducer: all mutations emit TaskEventRecord entries
 * - State enum: queued | approved | executing | completed | failed
 * - All state changes are immutable snapshots with append-only event log
 *
 * This reducer is persistence-ready: generated events can be streamed to Event Store.
 */

import {
  TaskStoreState,
  TaskAction,
  TaskStepState,
  TaskExecutionRecord,
  TaskStepRecord,
  TaskEventRecord,
} from "./task-types";
import { initialTaskStoreState } from "./task-fixtures";

/**
 * Helper: generate unique event ID (simplified UUID-like format)
 */
const generateEventId = (): string => {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper: append event to store and optionally mutate state
 * Returns new state with event appended
 */
const appendEvent = (
  state: TaskStoreState,
  event: TaskEventRecord
): TaskStoreState => ({
  ...state,
  taskEvents: [...state.taskEvents, event],
});

/**
 * Helper: validate sequential execution (only current step can transition)
 * Returns true if stepId is the current_step_id of selected task
 */
const isCurrentStep = (
  state: TaskStoreState,
  taskId: string,
  stepId: string
): boolean => {
  const task = state.tasksById[taskId];
  if (!task) return false;
  return task.current_step_id === stepId;
};

/**
 * Helper: find step index in task
 */
const findStepIndex = (
  task: TaskExecutionRecord,
  stepId: string
): number => {
  return task.steps.findIndex((s) => s.id === stepId);
};

/**
 * Main reducer: processes all TaskActions with pure transformations
 * Generates TaskEventRecord for persistence layer subscription
 */
export const taskReducer = (
  state: TaskStoreState,
  action: TaskAction
): TaskStoreState => {
  switch (action.type) {
    case "SELECT_TASK": {
      return {
        ...state,
        selectedTaskId: action.taskId,
        selectedEvidenceStepId: null, // reset evidence view on task switch
      };
    }

    case "SELECT_EVIDENCE_STEP": {
      return {
        ...state,
        selectedEvidenceStepId: action.stepId,
      };
    }

    case "START_STEP": {
      // Validate: task exists and step is current
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state; // ignore invalid transition
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];

      // If step requires approval, transition to queued (don't auto-execute)
      // If no approval needed, transition to approved to enable immediate execution
      const newStepState = step.requires_approval
        ? TaskStepState.Queued
        : TaskStepState.Approved;

      const updatedStep: TaskStepRecord = {
        ...step,
        state: newStepState,
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        status: "in_progress",
        updated_at: new Date().toISOString(),
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_started",
        occurred_at: new Date().toISOString(),
        actor_id: null,
        payload: {
          step_title: step.title,
          previous_state: step.state,
          new_state: newStepState,
        },
      };

      return appendEvent(newState, event);
    }

    case "EXECUTE_STEP": {
      // Validate: only current step can execute
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      const updatedStep: TaskStepRecord = {
        ...step,
        state: TaskStepState.Executing,
        evidence: {
          ...step.evidence,
          inputs: action.inputs,
          step_started_at: now,
          actor_id: action.actorId,
          logs: [
            ...(step.evidence.logs || []),
            `${now} - Execution started by ${action.actorId}`,
          ],
        },
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        status: "in_progress",
        updated_at: now,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_executed",
        occurred_at: now,
        actor_id: action.actorId,
        payload: {
          inputs: action.inputs,
        },
      };

      return appendEvent(newState, event);
    }

    case "COMPLETE_STEP": {
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      const updatedStep: TaskStepRecord = {
        ...step,
        state: TaskStepState.Completed,
        evidence: {
          ...step.evidence,
          outputs: action.outputs,
          step_completed_at: now,
          logs: [
            ...(step.evidence.logs || []),
            ...action.logs,
            `${now} - Step completed successfully`,
          ],
        },
      };

      // Check if this is the last step
      const isLastStep = stepIndex === task.steps.length - 1;
      const newTaskStatus: TaskExecutionRecord["status"] = isLastStep ? "completed" : "in_progress";

      const updatedTask: TaskExecutionRecord = {
        ...task,
        status: newTaskStatus,
        updated_at: now,
        current_step_id: isLastStep
          ? task.current_step_id
          : task.steps[stepIndex + 1]?.id || task.current_step_id,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: isLastStep ? "task_completed" : "step_completed",
        occurred_at: now,
        actor_id: task.actor_role === "owner" ? "owner" : "operator",
        payload: {
          outputs: action.outputs,
          task_status: newTaskStatus,
        },
      };

      return appendEvent(newState, event);
    }

    case "FAIL_STEP": {
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      const updatedStep: TaskStepRecord = {
        ...step,
        state: TaskStepState.Failed,
        latest_error: action.error,
        evidence: {
          ...step.evidence,
          step_completed_at: now,
          logs: [...(step.evidence.logs || []), ...action.logs, action.error],
        },
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        status: "failed",
        updated_at: now,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_failed",
        occurred_at: now,
        actor_id: task.actor_role === "owner" ? "owner" : "operator",
        payload: {
          error: action.error,
        },
      };

      return appendEvent(newState, event);
    }

    case "APPROVE_STEP": {
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      const updatedStep: TaskStepRecord = {
        ...step,
        state: TaskStepState.Approved,
        approval: {
          ...step.approval,
          status: "approved",
          decided_at: now,
          decided_by: action.decisionMadeby,
          rejection_reason: null,
        },
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        updated_at: now,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
        activeModal: { type: null }, // close modal
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_approved",
        occurred_at: now,
        actor_id: action.decisionMadeby,
        payload: {
          approval_status: "approved",
        },
      };

      return appendEvent(newState, event);
    }

    case "REJECT_STEP": {
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      // Rejection leaves step in queued state, not failed
      const updatedStep: TaskStepRecord = {
        ...step,
        state: TaskStepState.Queued,
        approval: {
          ...step.approval,
          status: "rejected",
          decided_at: now,
          decided_by: action.decisionMadeby,
          rejection_reason: action.reason,
        },
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        updated_at: now,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
        activeModal: { type: null },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_rejected",
        occurred_at: now,
        actor_id: action.decisionMadeby,
        payload: {
          approval_status: "rejected",
          reason: action.reason,
        },
      };

      return appendEvent(newState, event);
    }

    case "RETRY_STEP": {
      const task = state.tasksById[action.taskId];
      if (!task || !isCurrentStep(state, action.taskId, action.stepId)) {
        return state;
      }

      const stepIndex = findStepIndex(task, action.stepId);
      if (stepIndex === -1) return state;

      const step = task.steps[stepIndex];
      const now = new Date().toISOString();

      // Append retry attempt to log (append-only per D-11)
      const newRetryAttempt = {
        attempt: step.retry_count + 1,
        requested_at: now,
        requested_by: action.requestedBy,
        input_snapshot: action.newInputs,
        previous_error: action.previousError,
        outcome_state: null,
      };

      // If requires approval and inputs changed, reset approval to pending
      // Otherwise transition to queued/approved as appropriate
      const newApprovalStatus: TaskStepRecord["approval"]["status"] = step.requires_approval ? "pending" : "approved";
      const newStepState = step.requires_approval
        ? TaskStepState.Queued
        : TaskStepState.Approved;

      const updatedStep: TaskStepRecord = {
        ...step,
        state: newStepState,
        retry_count: step.retry_count + 1,
        retry_attempts: [...step.retry_attempts, newRetryAttempt],
        latest_error: null, // clear error on retry
        approval: {
          ...step.approval,
          status: newApprovalStatus,
          decided_at:
            newApprovalStatus === "pending"
              ? null
              : step.approval.decided_at,
          decided_by:
            newApprovalStatus === "pending"
              ? null
              : step.approval.decided_by,
        },
        evidence: {
          ...step.evidence,
          inputs: action.newInputs,
          logs: [
            ...(step.evidence.logs || []),
            `${now} - Retry attempt ${newRetryAttempt.attempt} initiated by ${action.requestedBy}`,
          ],
        },
      };

      const updatedTask: TaskExecutionRecord = {
        ...task,
        updated_at: now,
        steps: task.steps.map((s) => (s.id === action.stepId ? updatedStep : s)),
      };

      const newState = {
        ...state,
        tasksById: {
          ...state.tasksById,
          [action.taskId]: updatedTask,
        },
        activeModal: { type: null },
      };

      const event: TaskEventRecord = {
        event_id: generateEventId(),
        task_id: action.taskId,
        step_id: action.stepId,
        event_name: "step_retried",
        occurred_at: now,
        actor_id: action.requestedBy,
        payload: {
          retry_attempt: newRetryAttempt.attempt,
          previous_error: action.previousError,
          new_inputs: action.newInputs,
        },
      };

      return appendEvent(newState, event);
    }

    case "OPEN_APPROVAL_MODAL": {
      return {
        ...state,
        activeModal: {
          type: "approval",
          stepId: action.stepId,
        },
      };
    }

    case "OPEN_RETRY_MODAL": {
      return {
        ...state,
        activeModal: {
          type: "retry",
          stepId: action.stepId,
        },
      };
    }

    case "CLOSE_MODAL": {
      return {
        ...state,
        activeModal: { type: null },
      };
    }

    default: {
      return state;
    }
  }
};

/**
 * Export action creators for convenience (optional, can dispatch directly)
 */
export const taskActionCreators = {
  selectTask: (taskId: string): TaskAction => ({
    type: "SELECT_TASK",
    taskId,
  }),
  selectEvidenceStep: (stepId: string | null): TaskAction => ({
    type: "SELECT_EVIDENCE_STEP",
    stepId,
  }),
  startStep: (taskId: string, stepId: string): TaskAction => ({
    type: "START_STEP",
    taskId,
    stepId,
  }),
  executeStep: (
    taskId: string,
    stepId: string,
    actorId: string,
    inputs: Record<string, unknown>
  ): TaskAction => ({
    type: "EXECUTE_STEP",
    taskId,
    stepId,
    actorId,
    inputs,
  }),
  completeStep: (
    taskId: string,
    stepId: string,
    outputs: Record<string, unknown>,
    logs: string[]
  ): TaskAction => ({
    type: "COMPLETE_STEP",
    taskId,
    stepId,
    outputs,
    logs,
  }),
  failStep: (
    taskId: string,
    stepId: string,
    error: string,
    logs: string[]
  ): TaskAction => ({
    type: "FAIL_STEP",
    taskId,
    stepId,
    error,
    logs,
  }),
  approveStep: (taskId: string, stepId: string, decidedBy: string): TaskAction => ({
    type: "APPROVE_STEP",
    taskId,
    stepId,
    decisionMadeby: decidedBy,
  }),
  rejectStep: (
    taskId: string,
    stepId: string,
    decidedBy: string,
    reason: string
  ): TaskAction => ({
    type: "REJECT_STEP",
    taskId,
    stepId,
    decisionMadeby: decidedBy,
    reason,
  }),
  retryStep: (
    taskId: string,
    stepId: string,
    requestedBy: string,
    newInputs: Record<string, unknown>,
    previousError: string | null
  ): TaskAction => ({
    type: "RETRY_STEP",
    taskId,
    stepId,
    requestedBy,
    newInputs,
    previousError,
  }),
  openApprovalModal: (stepId: string): TaskAction => ({
    type: "OPEN_APPROVAL_MODAL",
    stepId,
  }),
  openRetryModal: (stepId: string): TaskAction => ({
    type: "OPEN_RETRY_MODAL",
    stepId,
  }),
  closeModal: (): TaskAction => ({
    type: "CLOSE_MODAL",
  }),
};
