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
        <p className={styles.sectionBody}>
          Select a queued task from the list to begin step execution.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.runnerStack}>
      <div>
        <h3 className={styles.heroTitle}>{currentStep.title}</h3>
        <p className={styles.heroText}>{currentStep.description}</p>

        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <div>
              <p className={styles.statusLabel}>
                Current Status: {currentStep.state}
              </p>
              <p className={styles.statusText}>{stateDescriptions[currentStep.state]}</p>
            </div>
            {currentStep.retry_count > 0 && (
              <span className={`${styles.metaChip} ${styles.metaChipWarning}`}>
                Retried {currentStep.retry_count}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approval requirement message */}
      {currentStep.requires_approval &&
        currentStep.approval.status === "pending" && (
          <div className={`${styles.helperCard} ${styles.helperWarning}`}>
            <p className={styles.sectionHeading}>Approval Required</p>
            <p className={styles.sectionBody}>
              This step requires operator approval before execution can proceed.
              Review the evidence and click the execute button to approve and run.
            </p>
          </div>
        )}

      <div className={styles.fieldGrid}>
        <div>
          <label className={styles.fieldLabel} htmlFor="mock-input-json">
            Mock Input (JSON)
          </label>
          <textarea
            id="mock-input-json"
            className={styles.textarea}
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
            <div>
              <label className={styles.fieldLabel} htmlFor="mock-output-json">
                Mock Output (JSON)
              </label>
              <textarea
                id="mock-output-json"
                className={styles.textarea}
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
            <div>
              <label className={styles.fieldLabel} htmlFor="execution-logs">
                Execution Logs (newline-separated)
              </label>
              <textarea
                id="execution-logs"
                className={styles.textarea}
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
          <div>
            <label className={styles.fieldLabel} htmlFor="step-error-message">
              Error Message
            </label>
            <input
              id="step-error-message"
              type="text"
              className={styles.input}
              placeholder="Error details (if step fails)"
              value={mockError}
              onChange={(e) => setMockError(e.target.value)}
            />
          </div>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <div>
            <label className={styles.fieldLabel} htmlFor="retry-reason">
              Retry Reason (optional)
            </label>
            <input
              id="retry-reason"
              type="text"
              className={styles.input}
              placeholder="Reason for retry"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={styles.buttonRow}>
        {currentStep.state === TaskStepState.Queued && (
          <button
            onClick={handleStartStep}
            className={styles.buttonPrimary}
          >
            Execute Task Step {currentStep.requires_approval ? "(+ Approve)" : ""}
          </button>
        )}

        {currentStep.state === TaskStepState.Executing && (
          <>
            <button
              onClick={handleCompleteStep}
              className={styles.buttonPrimary}
            >
              Mark Complete
            </button>
            <button onClick={handleFailStep} className={styles.buttonDanger}>
              Fail Step
            </button>
          </>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <button
            onClick={handleRetryStep}
            className={styles.buttonSecondary}
          >
            Retry Step
          </button>
        )}

        {currentStep.state === TaskStepState.Approved && (
          <button
            onClick={() =>
              executeStep(selectedTask.id, currentStep.id, currentActorId, {
                ...mockInputs,
              })
            }
            className={styles.buttonPrimary}
          >
            Execute Approved Step
          </button>
        )}

        {currentStep.state === TaskStepState.Completed && (
          <div className={styles.completedNote}>
            ✓ This step is completed. No further actions available.
          </div>
        )}
      </div>

      <div className={styles.helperCard}>
        <p className={styles.sectionHeading}>Sequential Execution</p>
        <p className={styles.sectionBody}>
          Only the current actionable step displays controls. Future steps become available after all prior steps complete.
        </p>
      </div>

      {modalState.type === "approval" && modalState.stepId && (
        <ApprovalGate stepId={modalState.stepId} />
      )}
    </div>
  );
}
