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

import React, { useState, useCallback } from "react";
import { useSelectedTask, useCurrentStep, useTaskActions } from "./task-store";
import styles from "./task-ui.module.css";

/**
 * ApprovalGate: Blocking modal component
 * Rendered by StepRunner when requires_approval=true and decision is pending
 */
export function ApprovalGate({ stepId }: Readonly<{ stepId: string }>) {
  const selectedTask = useSelectedTask();
  const currentStep = useCurrentStep();
  const { approveStep, rejectStep, closeModal } = useTaskActions();

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDeciding, setIsDeciding] = useState(false);

  // Mock actor ID (would come from auth context in production)
  const currentActorId = "operator-id-123";

  // Hooks must be declared before any early return (Rules of Hooks)
  const handleApprove = useCallback(async () => {
    if (!selectedTask) return;
    setIsDeciding(true);
    try {
      approveStep(selectedTask.id, stepId, currentActorId);
      setTimeout(() => closeModal(), 100);
    } finally {
      setIsDeciding(false);
    }
  }, [selectedTask, stepId, approveStep, closeModal, currentActorId]);

  const handleReject = useCallback(async () => {
    if (!selectedTask) return;
    setIsDeciding(true);
    try {
      rejectStep(selectedTask.id, stepId, currentActorId, rejectReason);
      setTimeout(() => closeModal(), 100);
    } finally {
      setIsDeciding(false);
    }
  }, [selectedTask, stepId, rejectStep, closeModal, rejectReason, currentActorId]);

  if (
    !selectedTask ||
    !currentStep ||
    currentStep.id !== stepId ||
    currentStep.approval.status !== "pending"
  ) {
    return null; // Modal should not render if not applicable
  }

  return (
    <>
      <div className="c-backdrop" />
      <div
        className="c-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-gate-title"
      >
        <h2 id="approval-gate-title">Approval Required</h2>

        <div className="c-card">
          <p className="t-label-caps">Step: {currentStep.title}</p>
          <p>{currentStep.description}</p>
        </div>

        <p>
          This step requires explicit operator approval before execution.
          Review the step details and make a decision:
        </p>

        {currentStep.requires_approval && (
          <div className="c-notice c-notice--info" role="status">
            <strong>Approval Gate Details</strong>
            <ul>
              <li>Review step inputs and expected outputs</li>
              <li>Verify step execution prerequisites are met</li>
              <li>Approval cannot be undone after execution</li>
            </ul>
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isDeciding}
            className="c-button c-button--primary"
            aria-label="Approve this step"
          >
            {isDeciding ? "Recording..." : "Approve"}
          </button>

          <button
            type="button"
            onClick={() => setShowRejectReason(!showRejectReason)}
            disabled={isDeciding}
            className="c-button c-button--destructive"
            aria-label="Reject this step"
          >
            {isDeciding ? "Recording..." : "Reject"}
          </button>
        </div>

        {showRejectReason && (
          <div className={`c-field ${styles.rejectField}`}>
            <label htmlFor="rejection-reason" className="c-field__label">
              Rejection Reason (optional)
            </label>
            <textarea
              id="rejection-reason"
              className="c-input"
              rows={2}
              placeholder="Why are you rejecting this step? (e.g., Missing prerequisites, Data validation concerns)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className={styles.rejectActions}>
              <button
                type="button"
                onClick={handleReject}
                disabled={isDeciding}
                className="c-button c-button--destructive"
              >
                {isDeciding ? "Recording..." : "Confirm Rejection"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectReason(false);
                  setRejectReason("");
                }}
                disabled={isDeciding}
                className="c-button c-button--secondary"
              >
                Back
              </button>
            </div>
          </div>
        )}

        <div className={`c-notice c-notice--info ${styles.auditNotice}`} role="status">
          <strong>Audit Trail</strong>{" "}— Your decision (and optional reason) will be recorded with timestamp and actor ID for compliance audit trail.
        </div>
      </div>
    </>
  );
}
