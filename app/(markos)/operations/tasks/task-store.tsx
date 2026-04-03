"use client";

/**
 * Task store context and hooks for Phase 46: Operator Task Graph UI
 *
 * Locked decision (D-02, D-04, D-05):
 * - In-memory React Context store seeded with fixtures
 * - useReducer for pure state machine transitions
 * - Typed selectors for UI components to prevent whole-store subscriptions
 * - Event log append-only for future persistence bridge (Phase 47/48)
 *
 * This provider replaces the in-memory store with a server persistence adapter in Phase 47.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import {
  TaskStoreState,
  TaskAction,
  TaskExecutionRecord,
  TaskStepRecord,
  TaskEventRecord,
} from "./task-types";
import { taskReducer, taskActionCreators } from "./task-machine";
import { initialTaskStoreState } from "./task-fixtures";
import { buildEvent } from "../../../lib/markos/telemetry/events";

/**
 * Context definition (internal, exported for module structure only)
 */
interface TaskStoreContextType {
  state: TaskStoreState;
  dispatch: React.Dispatch<TaskAction>;
}

const TaskStoreContext = createContext<TaskStoreContextType | undefined>(
  undefined
);

/**
 * Provider component: wraps task graph UI, initializes store with fixtures
 */
function TaskStoreContent({ children }: { children: ReactNode }) {
  // Subscribe to telemetry events automatically
  useTaskEventTelemetry();

  return <>{children}</>;
}

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    taskReducer,
    initialTaskStoreState(),
    (initial) => initial // initializer function to compute initial state
  );

  return (
    <TaskStoreContext.Provider value={{ state, dispatch }}>
      <TaskStoreContent>{children}</TaskStoreContent>
    </TaskStoreContext.Provider>
  );
}

/**
 * Main hook: full store access (use selectors for performance-critical components)
 */
export function useTaskStore(): {
  state: TaskStoreState;
  dispatch: React.Dispatch<TaskAction>;
} {
  const context = useContext(TaskStoreContext);
  if (!context) {
    throw new Error("useTaskStore must be used within TaskStoreProvider");
  }
  return context;
}

/**
 * Selector hooks: typed narrowed views of store for components
 * Prevent whole-store updates triggering unnecessary re-renders
 */

/**
 * All tasks by ID and order
 */
export function useTaskList(): {
  tasksById: Record<string, TaskExecutionRecord>;
  taskOrder: string[];
} {
  const { state } = useTaskStore();
  return useMemo(
    () => ({
      tasksById: state.tasksById,
      taskOrder: state.taskOrder,
    }),
    [state.tasksById, state.taskOrder]
  );
}

/**
 * Currently selected task (or undefined if none selected)
 */
export function useSelectedTask(): TaskExecutionRecord | undefined {
  const { state } = useTaskStore();
  return useMemo(
    () =>
      state.selectedTaskId ? state.tasksById[state.selectedTaskId] : undefined,
    [state.selectedTaskId, state.tasksById]
  );
}

/**
 * Currently selected task ID
 */
export function useSelectedTaskId(): string | null {
  const { state } = useTaskStore();
  return state.selectedTaskId;
}

/**
 * Current step of selected task (based on current_step_id)
 */
export function useCurrentStep(): TaskStepRecord | undefined {
  const { state } = useTaskStore();
  const selectedTask = useSelectedTask();

  return useMemo(() => {
    if (!selectedTask) return undefined;
    return selectedTask.steps.find(
      (step) => step.id === selectedTask.current_step_id
    );
  }, [selectedTask]);
}

/**
 * All steps of selected task
 */
export function useTaskSteps(): TaskStepRecord[] {
  const selectedTask = useSelectedTask();
  return useMemo(() => selectedTask?.steps || [], [selectedTask]);
}

/**
 * Selected evidence step (for drawer display)
 */
export function useSelectedEvidenceStep(): TaskStepRecord | undefined {
  const { state } = useTaskStore();
  const selectedTask = useSelectedTask();

  return useMemo(() => {
    if (!selectedTask || !state.selectedEvidenceStepId) return undefined;
    return selectedTask.steps.find(
      (step) => step.id === state.selectedEvidenceStepId
    );
  }, [selectedTask, state.selectedEvidenceStepId]);
}

/**
 * Modal state (approval | retry | null)
 */
export function useModalState(): {
  type: "approval" | "retry" | null;
  stepId?: string;
} {
  const { state } = useTaskStore();
  return useMemo(() => state.activeModal, [state.activeModal]);
}

/**
 * Task events (append-only log for persistence)
 */
export function useTaskEvents(): TaskEventRecord[] {
  const { state } = useTaskStore();
  return state.taskEvents;
}

/**
 * Dispatch helper hooks (optional convenience layer)
 */

export function useTaskActions() {
  const { dispatch } = useTaskStore();

  return useMemo(
    () => ({
      selectTask: useCallback(
        (taskId: string) =>
          dispatch(taskActionCreators.selectTask(taskId)),
        [dispatch]
      ),
      selectEvidenceStep: useCallback(
        (stepId: string | null) =>
          dispatch(taskActionCreators.selectEvidenceStep(stepId)),
        [dispatch]
      ),
      startStep: useCallback(
        (taskId: string, stepId: string) =>
          dispatch(taskActionCreators.startStep(taskId, stepId)),
        [dispatch]
      ),
      executeStep: useCallback(
        (
          taskId: string,
          stepId: string,
          actorId: string,
          inputs: Record<string, unknown>
        ) =>
          dispatch(
            taskActionCreators.executeStep(
              taskId,
              stepId,
              actorId,
              inputs
            )
          ),
        [dispatch]
      ),
      completeStep: useCallback(
        (
          taskId: string,
          stepId: string,
          outputs: Record<string, unknown>,
          logs: string[]
        ) =>
          dispatch(
            taskActionCreators.completeStep(
              taskId,
              stepId,
              outputs,
              logs
            )
          ),
        [dispatch]
      ),
      failStep: useCallback(
        (taskId: string, stepId: string, error: string, logs: string[]) =>
          dispatch(
            taskActionCreators.failStep(taskId, stepId, error, logs)
          ),
        [dispatch]
      ),
      approveStep: useCallback(
        (taskId: string, stepId: string, decidedBy: string) =>
          dispatch(
            taskActionCreators.approveStep(taskId, stepId, decidedBy)
          ),
        [dispatch]
      ),
      rejectStep: useCallback(
        (
          taskId: string,
          stepId: string,
          decidedBy: string,
          reason: string
        ) =>
          dispatch(
            taskActionCreators.rejectStep(taskId, stepId, decidedBy, reason)
          ),
        [dispatch]
      ),
      retryStep: useCallback(
        (
          taskId: string,
          stepId: string,
          requestedBy: string,
          newInputs: Record<string, unknown>,
          previousError: string | null
        ) =>
          dispatch(
            taskActionCreators.retryStep(
              taskId,
              stepId,
              requestedBy,
              newInputs,
              previousError
            )
          ),
        [dispatch]
      ),
      openApprovalModal: useCallback(
        (stepId: string) =>
          dispatch(taskActionCreators.openApprovalModal(stepId)),
        [dispatch]
      ),
      openRetryModal: useCallback(
        (stepId: string) =>
          dispatch(taskActionCreators.openRetryModal(stepId)),
        [dispatch]
      ),
      closeModal: useCallback(
        () => dispatch(taskActionCreators.closeModal()),
        [dispatch]
      ),
    }),
    [dispatch]
  );
}

/**
 * Combined read + action hook for convenience in components
 */
export function useTaskContext() {
  const store = useTaskStore();
  const selectedTask = useSelectedTask();
  const currentStep = useCurrentStep();
  const taskSteps = useTaskSteps();
  const selectedEvidenceStep = useSelectedEvidenceStep();
  const modalState = useModalState();
  const taskList = useTaskList();
  const actions = useTaskActions();

  return useMemo(
    () => ({
      // Read
      store,
      selectedTask,
      currentStep,
      taskSteps,
      selectedEvidenceStep,
      modalState,
      taskList,
      // Actions
      ...actions,
    }),
    [
      store,
      selectedTask,
      currentStep,
      taskSteps,
      selectedEvidenceStep,
      modalState,
      taskList,
      actions,
    ]
  );
}

/**
 * Telemetry emission hook
 * Watches task events and emits sanitized telemetry via buildEvent
 * Locked decision (D-14, D-15): all transition events are sanitized
 */
export function useTaskEventTelemetry() {
  const taskEvents = useTaskEvents();

  useEffect(() => {
    if (taskEvents.length === 0) return;

    const lastEvent = taskEvents[taskEvents.length - 1];

    // Map internal event_name to telemetry event name
    const telemetryEventNameMap: Record<string, string> = {
      step_executed: "markos_task_step_executed",
      step_approved: "markos_task_step_approved",
      step_rejected: "markos_task_step_rejected",
      step_retried: "markos_task_step_retried",
    };

    const telemetryEventName = telemetryEventNameMap[lastEvent.event_name];

    if (!telemetryEventName) {
      return; // Not a telemetry-relevant event (e.g., step_started, task_completed)
    }

    // Emit sanitized telemetry event
    try {
      const telemetryEvent = buildEvent({
        name: telemetryEventName as any, // Cast to match telemetry event union
        workspaceId: "workspace-default", // Mock; would come from app context
        role: "operator", // Mock; would come from auth context
        requestId: lastEvent.event_id,
        payload: lastEvent.payload,
      });

      // Log to console in development; in production, would send to telemetry service
      if (process.env.NODE_ENV === "development") {
        console.debug("[Telemetry]", telemetryEvent.name, telemetryEvent.payload);
      }
    } catch (error) {
      console.error("[Telemetry Error]", error);
    }
  }, [taskEvents]);
}
