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
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-gate-title"
    >
      <div className={styles.modalCard}>
        <h2
          id="approval-gate-title"
          className={styles.modalTitle}
        >
          Approval Required
        </h2>

        <div className={styles.modalInfo}>
          <p className={styles.modalInfoTitle}>
            Step: {currentStep.title}
          </p>
          <p className={styles.modalText}>
            {currentStep.description}
          </p>
        </div>

        <div>
          <p className={styles.modalText}>
            This step requires explicit operator approval before execution.
            Please review the step details and make a decision:
          </p>

          {currentStep.requires_approval && (
            <div className={styles.auditNote}>
              <p className={styles.auditNoteTitle}>Approval Gate Details</p>
              <ul className={styles.modalList}>
                <li>Review step inputs and expected outputs</li>
                <li>Verify step execution prerequisites are met</li>
                <li>Approval cannot be undone after execution</li>
              </ul>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            onClick={handleApprove}
            disabled={isDeciding}
            className={styles.buttonPrimary}
            aria-label="Approve this step"
          >
            {isDeciding ? "Recording..." : "Approve"}
          </button>

          <button
            onClick={() => setShowRejectReason(!showRejectReason)}
            disabled={isDeciding}
            className={styles.buttonDanger}
            aria-label="Reject this step"
          >
            {isDeciding ? "Recording..." : "Reject"}
          </button>
        </div>

        {showRejectReason && (
          <div className={styles.errorCard}>
            <label className={styles.fieldLabel}>
              Rejection Reason (optional)
            </label>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="Why are you rejecting this step? (e.g., Missing prerequisites, Data validation concerns)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button
                onClick={handleReject}
                disabled={isDeciding}
                className={styles.buttonDanger}
              >
                {isDeciding ? "Recording..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => {
                  setShowRejectReason(false);
                  setRejectReason("");
                }}
                disabled={isDeciding}
                className={styles.buttonSecondary}
              >
                Back
              </button>
            </div>
          </div>
        )}

        <div className={styles.auditNote}>
          <p className={styles.auditNoteTitle}>Audit Trail</p>
          <p className={styles.modalText}>
            Your decision (and optional reason) will be recorded with timestamp
            and actor ID for compliance audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
