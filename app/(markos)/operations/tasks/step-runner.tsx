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
} from "./task-store";
import { TaskStepState } from "./task-types";

/**
 * Action button styling
 */
const BUTTON_CONFIG = {
  primary:
    "px-4 py-2 bg-[#0d9488] text-white font-medium text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "px-4 py-2 bg-gray-200 text-[#0f172a] font-medium text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
};

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

  // Mock actor ID for demo (would come from auth context in real app)
  const currentActorId = "operator-id-123";

  // Local UI state for input fields
  const [mockInputs, setMockInputs] = useState<Record<string, unknown>>({});
  const [mockOutputs, setMockOutputs] = useState<Record<string, unknown>>({});
  const [mockLogs, setMockLogs] = useState<string[]>([]);
  const [mockError, setMockError] = useState<string>("");
  const [retryReason, setRetryReason] = useState<string>("");

  // Guard: no task or step selected
  if (!selectedTask || !currentStep) {
    return (
      <div className="text-center py-8 text-[#475569]">
        <p className="font-medium text-[#0f172a]">No operator task selected</p>
        <p className="mt-2 text-sm">
          Select a queued task from the list to begin step execution.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Step header */}
      <div>
        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">
          {currentStep.title}
        </h3>
        <p className="text-sm text-[#475569] mb-4">{currentStep.description}</p>

        {/* State status bar */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700">
                Current Status: {currentStep.state}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {stateDescriptions[currentStep.state]}
              </p>
            </div>
            {currentStep.retry_count > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                Retried {currentStep.retry_count}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Approval requirement message */}
      {currentStep.requires_approval &&
        currentStep.approval.status === "pending" && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ Approval Required
            </p>
            <p className="text-xs text-amber-800 mt-1">
              This step requires operator approval before execution can proceed.
              Review the evidence and click the execute button to approve and run.
            </p>
          </div>
        )}

      {/* Mock input/output section (for demo purposes) */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-[#0f172a]">
            Mock Input (JSON)
          </label>
          <textarea
            className="w-full mt-1 p-2 text-xs border border-gray-300 rounded font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <label className="text-xs font-medium text-[#0f172a]">
                Mock Output (JSON)
              </label>
              <textarea
                className="w-full mt-1 p-2 text-xs border border-gray-300 rounded font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <label className="text-xs font-medium text-[#0f172a]">
                Execution Logs (newline-separated)
              </label>
              <textarea
                className="w-full mt-1 p-2 text-xs border border-gray-300 rounded font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            <label className="text-xs font-medium text-[#0f172a]">
              Error Message
            </label>
            <input
              type="text"
              className="w-full mt-1 p-2 text-xs border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Error details (if step fails)"
              value={mockError}
              onChange={(e) => setMockError(e.target.value)}
            />
          </div>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <div>
            <label className="text-xs font-medium text-[#0f172a]">
              Retry Reason (optional)
            </label>
            <input
              type="text"
              className="w-full mt-1 p-2 text-xs border border-gray-300 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Reason for retry"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Action buttons based on step state */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        {currentStep.state === TaskStepState.Queued && (
          <button
            onClick={handleStartStep}
            className={BUTTON_CONFIG.primary}
          >
            Execute Task Step {currentStep.requires_approval ? "(+ Approve)" : ""}
          </button>
        )}

        {currentStep.state === TaskStepState.Executing && (
          <>
            <button
              onClick={handleCompleteStep}
              className={BUTTON_CONFIG.primary}
            >
              Mark Complete
            </button>
            <button onClick={handleFailStep} className={BUTTON_CONFIG.danger}>
              Fail Step
            </button>
          </>
        )}

        {currentStep.state === TaskStepState.Failed && (
          <button
            onClick={handleRetryStep}
            className={BUTTON_CONFIG.secondary}
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
            className={BUTTON_CONFIG.primary}
          >
            Execute Approved Step
          </button>
        )}

        {currentStep.state === TaskStepState.Completed && (
          <div className="text-sm text-[#475569] italic">
            ✓ This step is completed. No further actions available.
          </div>
        )}
      </div>

      {/* Sequential gating message */}
      <div className="p-3 bg-gray-100 rounded text-xs text-[#475569]">
        <p className="font-medium text-[#0f172a] mb-1">Sequential Execution</p>
        <p>
          Only the current actionable step displays controls. Future steps become available after all prior steps complete.
        </p>
      </div>
    </div>
  );
}
