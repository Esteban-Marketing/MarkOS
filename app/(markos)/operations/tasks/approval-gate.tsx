"use client";

/**
 * ApprovalGate: Blocking modal for step approval decisions
 *
 * Locked decisions (Phase 46):
 * - D-07: Blocking modal that prevents passive close (no backdrop click escape)
 * - D-08: Dismiss paths are only Approve or Reject (no cancel button)
 * - D-05: Rejection reason is optional but rejection action is always explicit
 * - D-11: Decision writes actor_id and decided_at timestamp
 *
 * UI Contract:
 * - Modal is focus-trapped (children only receive focus when modal is open)
 * - Buttons are primary CTA (Approve) and danger (Reject)
 * - Optional rejection reason field appears when "Reject" path is selected
 * - Modal remains visible until a decision is made
 */

import React, { useState, useCallback, useEffect } from "react";
import { useSelectedTask, useCurrentStep, useTaskActions } from "./task-store";

/**
 * ApprovalGate: Blocking modal component
 * Rendered by StepRunner when requires_approval=true and decision is pending
 */
export function ApprovalGate({ stepId }: { stepId: string }) {
  const selectedTask = useSelectedTask();
  const currentStep = useCurrentStep();
  const { approveStep, rejectStep, closeModal } = useTaskActions();

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDeciding, setIsDeciding] = useState(false);

  // Mock actor ID (would come from auth context in production)
  const currentActorId = "operator-id-123";

  if (
    !selectedTask ||
    !currentStep ||
    currentStep.id !== stepId ||
    currentStep.approval.status !== "pending"
  ) {
    return null; // Modal should not render if not applicable
  }

  const handleApprove = useCallback(async () => {
    setIsDeciding(true);
    try {
      approveStep(selectedTask.id, stepId, currentActorId);
      // Close modal after approval
      setTimeout(() => closeModal(), 100);
    } finally {
      setIsDeciding(false);
    }
  }, [selectedTask, stepId, approveStep, closeModal, currentActorId]);

  const handleReject = useCallback(async () => {
    setIsDeciding(true);
    try {
      rejectStep(selectedTask.id, stepId, currentActorId, rejectReason);
      // Close modal after rejection
      setTimeout(() => closeModal(), 100);
    } finally {
      setIsDeciding(false);
    }
  }, [selectedTask, stepId, rejectStep, closeModal, rejectReason, currentActorId]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-gate-title"
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <h2
          id="approval-gate-title"
          className="text-lg font-semibold text-[#0f172a] mb-2"
        >
          Approval Required
        </h2>

        {/* Step context */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            Step: {currentStep.title}
          </p>
          <p className="text-xs text-blue-800 mt-1">
            {currentStep.description}
          </p>
        </div>

        {/* Decision prompt */}
        <div className="mb-6">
          <p className="text-sm text-[#475569] mb-4">
            This step requires explicit operator approval before execution.
            Please review the step details and make a decision:
          </p>

          {/* Approval requirements */}
          {currentStep.requires_approval && (
            <div className="text-xs text-[#475569] bg-gray-50 p-3 rounded mb-4 space-y-1">
              <p className="font-medium text-[#0f172a]">Approval Gate Details:</p>
              <p>• Review step inputs and expected outputs</p>
              <p>• Verify step execution prerequisites are met</p>
              <p className="font-semibold text-amber-700">
                • Approval cannot be undone after execution
              </p>
            </div>
          )}
        </div>

        {/* Decision buttons - two standalone paths */}
        <div className="flex gap-3 mb-4">
          {/* Approve button (primary) */}
          <button
            onClick={handleApprove}
            disabled={isDeciding}
            className="flex-1 px-4 py-2.5 bg-[#0d9488] text-white font-medium text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Approve this step"
          >
            {isDeciding ? "Recording..." : "✓ Approve"}
          </button>

          {/* Reject button (danger) */}
          <button
            onClick={() => setShowRejectReason(!showRejectReason)}
            disabled={isDeciding}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reject this step"
          >
            {isDeciding ? "Recording..." : "✗ Reject"}
          </button>
        </div>

        {/* Rejection reason field (appears only if rejection path is being taken) */}
        {showRejectReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <label className="block text-sm font-medium text-[#0f172a] mb-2">
              Rejection Reason (optional)
            </label>
            <textarea
              className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={2}
              placeholder="Why are you rejecting this step? (e.g., Missing prerequisites, Data validation concerns)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleReject}
                disabled={isDeciding}
                className="flex-1 px-3 py-2 bg-red-600 text-white font-medium text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeciding ? "Recording..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => {
                  setShowRejectReason(false);
                  setRejectReason("");
                }}
                disabled={isDeciding}
                className="px-3 py-2 bg-gray-200 text-[#0f172a] font-medium text-sm rounded hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Immutability notice */}
        <div className="text-xs text-[#7c8192] border-t pt-4 mt-4">
          <p className="font-medium text-[#0f172a] mb-1">Audit Trail</p>
          <p>
            Your decision (and optional reason) will be recorded with timestamp
            and actor ID for compliance audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
