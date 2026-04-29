"use client";

/**
 * StepRunner: Sequential action controls for task step execution
 *
 * Locked decisions (Phase 46):
 * - D-02: Sequential execution - only current step can transition
 * - D-03: State enum transitions (queued→approved→executing→completed or failed)
 * - D-04: Action controls dispatch START_STEP, COMPLETE_STEP, FAIL_STEP
 * - D-08: Approval modal separation (not implemented here, deferred to Wave 3)
 *
 * UI Contract:
 * - Render execute task step (START_STEP) on queued steps
 * - Mark complete (COMPLETE_STEP) on executing steps
 * - Fail/retry controls on executing or failed steps
 * - Disable controls when step is not actionable sequentially
 * - Read-only state display with explanation for non-actionable steps
 */

import React, { useState, useCallback } from "react";
import {
  useSelectedTask,
  useCurrentStep,
  useTaskActions,
  useModalState,
} from "./task-store";
import { TaskStepState } from "./task-types";
import { ApprovalGate } from "./approval-gate";
import styles from "./task-ui.module.css";

/**
 * StepRunner: Main component for sequential action controls
 * Displays contextual controls based on current step state
 */
export function StepRunner() {
  const selectedTask = useSelectedTask();
  const currentStep = useCurrentStep();
  const {
    startStep,
    executeStep,
    completeStep,
    failStep,
    retryStep,
    openApprovalModal,
  } = useTaskActions();
  const modalState = useModalState();

  // Mock actor ID for demo (would come from auth context in real app)
  const currentActorId = "operator-id-123";

  // Local UI state for input fields
  const [mockInputs, setMockInputs] = useState<Record<string, unknown>>({});
  const [mockOutputs, setMockOutputs] = useState<Record<string, unknown>>({});
  const [mockLogs, setMockLogs] = useState<string[]>([]);
  const [mockError, setMockError] = useState<string>("");
  const [retryReason, setRetryReason] = useState<string>("");

  // Step state indicator
  const stateDescriptions: Record<TaskStepState, string> = {
    [TaskStepState.Queued]: "Ready to execute",
    [TaskStepState.Approved]:
      "Approved and ready to run execution action",
    [TaskStepState.Executing]: "Currently executing",
    [TaskStepState.Completed]: "Successfully completed",
    [TaskStepState.Failed]: "Execution failed",
  };

  const handleStartStep = useCallback(() => {
    if (!selectedTask?.id || !currentStep?.id) return;

    // If requires approval, open approval modal
    if (currentStep.requires_approval) {
      openApprovalModal(currentStep.id);
    } else {
      // Otherwise transition to approved and automatically execute
      startStep(selectedTask.id, currentStep.id);
      setTimeout(() => {
        executeStep(selectedTask.id, currentStep.id, currentActorId, {
          ...mockInputs,
          auto_triggered: true,
        });
      }, 100);
    }
  }, [
    selectedTask,
    currentStep,
    startStep,
    executeStep,
    openApprovalModal,
    mockInputs,
    currentActorId,
  ]);

  const handleCompleteStep = useCallback(() => {
    if (!selectedTask?.id || !currentStep?.id) return;

    completeStep(
      selectedTask.id,
      currentStep.id,
      {
        ...mockOutputs,
        completed_at: new Date().toISOString(),
        actor_id: currentActorId,
      },
      [
        `${new Date().toISOString()} - Step execution completed`,
        ...mockLogs,
      ]
    );
  }, [selectedTask, currentStep, completeStep, mockOutputs, mockLogs, currentActorId]);

  const handleFailStep = useCallback(() => {
    if (!selectedTask?.id || !currentStep?.id) return;

    failStep(
      selectedTask.id,
      currentStep.id,
      mockError || "Execution encountered an error",
      [
        `${new Date().toISOString()} - Step execution failed`,
        ...mockLogs,
      ]
    );
  }, [selectedTask, currentStep, failStep, mockError, mockLogs]);

  const handleRetryStep = useCallback(() => {
    if (!selectedTask?.id || !currentStep?.id) return;

    retryStep(
      selectedTask.id,
      currentStep.id,
      currentActorId,
      {
        ...currentStep.evidence.inputs,
        retry_requested_at: new Date().toISOString(),
        retry_reason: retryReason,
      },
      currentStep.latest_error || null
    );
  }, [selectedTask, currentStep, retryStep, retryReason, currentActorId]);

  if (!selectedTask || !currentStep) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No operator task selected</p>
        <p>
          Select a queued task from the list to begin step execution.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.runnerStack}>
      <div>
        <h3>{currentStep.title}</h3>
        <p>{currentStep.description}</p>

        {/* Status card — .c-card sub-section (OT-7) */}
        <div className="c-card">
          <div className={styles.stepHeader}>
            <div>
              <span className="t-label-caps">Current Status</span>
              <p>{currentStep.state} — {stateDescriptions[currentStep.state]}</p>
            </div>
            {currentStep.retry_count > 0 && (
              <span className="c-chip c-chip--warning">
                Retried {currentStep.retry_count}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approval requirement banner — .c-notice c-notice--warning (OT-6) */}
      {currentStep.requires_approval &&
        currentStep.approval.status === "pending" && (
          <div className="c-notice c-notice--warning" role="status">
            <strong>[warn]</strong>{" "}Approval Required — This step requires operator approval before execution can proceed. Review the evidence and click Execute to approve and run.
          </div>
        )}

      {/* Executing banner — .c-notice c-notice--info (OT-6) */}
      {currentStep.state === TaskStepState.Executing && (
        <div className="c-notice c-notice--info" role="status">
          <strong>[•]</strong>{" "}Step is executing. Wait for completion or use Abort run to stop.
        </div>
      )}

      {/* Failed banner — .c-notice c-notice--error (OT-6) */}
      {currentStep.state === TaskStepState.Failed && (
        <div className="c-notice c-notice--error" role="status">
          <strong>[err]</strong>{" "}Step failed. Review the error output and retry or abort the run.
        </div>
      )}

      <div className={styles.fieldGrid}>
        <div className="c-field">
          <label className="c-field__label" htmlFor="mock-input-json">
            Mock Input (JSON)
          </label>
          <textarea
            id="mock-input-json"
            className="c-input"
            rows={3}
            placeholder='{"key": "value"}'
            onChange={(e) => {
              try {
                setMockInputs(JSON.parse(e.target.value));
              } catch {
                // ignore parse errors
              }
            }}
          />
        </div>

        {currentStep.state === TaskStepState.Executing && (
          <>
            <div className="c-field">
              <label className="c-field__label" htmlFor="mock-output-json">
                Mock Output (JSON)
              </label>
              <textarea
                id="mock-output-json"
                className="c-input"
                rows={3}
                placeholder='{"result": "success"}'
                onChange={(e) => {
                  try {
                    setMockOutputs(JSON.parse(e.target.value));
                  } catch {
                    // ignore parse errors
                  }
                }}
              />
            </div>
            <div className="c-field">
              <label className="c-field__label" htmlFor="execution-logs">
                Execution Logs (newline-separated)
              </label>
              <textarea
                id="execution-logs"
                className="c-input"
                rows={2}
                placeholder="Log line 1&#10;Log line 2"
                onChange={(e) => {
                  setMockLogs(e.target.value.split("\n").filter(Boolean));
                }}
              />
            </div>
          </>
        )}

        {(currentStep.state === TaskStepState.Executing ||
          currentStep.state === TaskStepState.Failed) && (
          <div className="c-field">
            <label className="c-field__label" htmlFor="step-error-message">
              Error Message
            </label>
            <input
              id="step-error-message"
              type="text"
              className="c-input"
              placeholder="Error details (if step fails)"
              value={mockError}
              onChange={(e) => setMockError(e.target.value)}
            />
          </div>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <div className="c-field">
            <label className="c-field__label" htmlFor="retry-reason">
              Retry Reason (optional)
            </label>
            <input
              id="retry-reason"
              type="text"
              className="c-input"
              placeholder="Reason for retry"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Step action buttons — .c-button primitives (OT-8) */}
      <div className={styles.buttonRow}>
        {currentStep.state === TaskStepState.Queued && (
          <button
            type="button"
            onClick={handleStartStep}
            className="c-button c-button--primary"
          >
            Execute Task Step {currentStep.requires_approval ? "(+ Approve)" : ""}
          </button>
        )}

        {currentStep.state === TaskStepState.Executing && (
          <>
            <button
              type="button"
              onClick={handleCompleteStep}
              className="c-button c-button--primary"
            >
              Mark Complete
            </button>
            <button
              type="button"
              onClick={handleFailStep}
              className="c-button c-button--destructive"
            >
              Fail Step
            </button>
          </>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <button
            type="button"
            onClick={handleRetryStep}
            className="c-button c-button--secondary"
          >
            Retry Step
          </button>
        )}

        {currentStep.state === TaskStepState.Approved && (
          <button
            type="button"
            onClick={() =>
              executeStep(selectedTask.id, currentStep.id, currentActorId, {
                ...mockInputs,
              })
            }
            className="c-button c-button--primary"
          >
            Execute Approved Step
          </button>
        )}

        {currentStep.state === TaskStepState.Completed && (
          <div className={styles.completedNote}>
            [ok] This step is completed. No further actions available.
          </div>
        )}
      </div>

      {/* Sequential execution info banner — .c-notice c-notice--info (OT-6) */}
      <div className="c-notice c-notice--info" role="status">
        <strong>Sequential Execution</strong>{" "}— Only the current actionable step displays controls. Future steps become available after all prior steps complete.
      </div>

      {modalState.type === "approval" && modalState.stepId && (
        <ApprovalGate stepId={modalState.stepId} />
      )}
    </div>
  );
}
