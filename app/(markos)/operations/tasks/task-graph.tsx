"use client";

/**
 * TaskGraph: Linear vertical step list renderer
 *
 * Locked decisions (Phase 46):
 * - D-01: Linear vertical step list, no graph library
 * - D-02: Sequential gating - only current step is interactive
 * - D-03: State badges display exact enum strings (queued|approved|executing|completed|failed)
 * - D-05: Strict read-only after completion, no edit controls
 *
 * UI Contract:
 * - Each step card shows: order index, step name, state badge, domain/type tags, last actor, last timestamp
 * - Future steps visibly disabled with explanatory text
 * - Completed steps stay viewable and openable for evidence inspection
 * - No branching connectors, no graph library imports
 */

import React from "react";
import { useTaskSteps, useCurrentStep, useTaskActions } from "./task-store";
import { TaskStepState, TaskStepRecord } from "./task-types";
import styles from "./task-ui.module.css";

/**
 * State badge styling (locked enum values)
 */
const STATE_BADGE_CONFIG: Record<
  TaskStepState,
  { className: string; label: string }
> = {
  [TaskStepState.Queued]: {
    className: styles.badgeQueued,
    label: "queued",
  },
  [TaskStepState.Approved]: {
    className: styles.badgeApproved,
    label: "approved",
  },
  [TaskStepState.Executing]: {
    className: styles.badgeExecuting,
    label: "executing",
  },
  [TaskStepState.Completed]: {
    className: styles.badgeCompleted,
    label: "completed",
  },
  [TaskStepState.Failed]: {
    className: styles.badgeFailed,
    label: "failed",
  },
};

/**
 * Step card component: renders single step with state, metadata, and interactivity
 */
function StepCard({
  step,
  stepIndex,
  isCurrentStep,
}: Readonly<{
  step: TaskStepRecord;
  stepIndex: number;
  isCurrentStep: boolean;
}>) {
  const { selectEvidenceStep } = useTaskActions();

  const badgeConfig = STATE_BADGE_CONFIG[step.state];

  const lastActor = step.evidence.actor_id || "system";
  const lastTimestamp = step.evidence.step_completed_at || step.evidence.step_started_at || "—";

  return (
    <button
      type="button"
      onClick={() => selectEvidenceStep(step.id)}
      className={[
        styles.stepCard,
        isCurrentStep ? styles.stepCardCurrent : styles.stepCardDimmed,
      ].join(" ")}
      aria-label={`Select evidence for ${step.title}`}
    >
      <div className={styles.stepHeader}>
        <div className={styles.stepTitleRow}>
          <span className={styles.stepIndex}>
            #{stepIndex + 1}
          </span>
          <h3 className={styles.stepTitle}>{step.title}</h3>
        </div>
        <span className={`${styles.badge} ${badgeConfig.className}`}>
          {badgeConfig.label}
        </span>
      </div>

      <p className={styles.panelText}>{step.description}</p>

      <div className={styles.metaRow}>
        {step.requires_approval && (
          <span className={`${styles.metaChip} ${styles.metaChipWarning}`}>
            Requires Approval
          </span>
        )}
        {step.latest_error && (
          <span className={`${styles.metaChip} ${styles.metaChipError}`}>
            Error: {step.latest_error.substring(0, 30)}...
          </span>
        )}
      </div>

      <div className={styles.auditRow}>
        <span>by {lastActor}</span>
        {lastTimestamp !== "—" && (
          <>
            <span className="mx-1">•</span>
            <span>{new Date(lastTimestamp).toLocaleTimeString()}</span>
          </>
        )}
      </div>

      {/* Sequential gating message for future steps */}
      {!isCurrentStep && step.state === TaskStepState.Queued && (
        <div className={styles.helperCard}>
          Complete all prior steps to unlock this step for execution.
        </div>
      )}

      {/* Approval requirement message */}
      {isCurrentStep &&
        step.requires_approval &&
        step.approval.status === "pending" && (
          <div className={`${styles.helperCard} ${styles.helperWarning}`}>
            This step requires approval before execution.
          </div>
        )}

      {step.approval.status === "rejected" && (
        <div className={`${styles.helperCard} ${styles.helperError}`}>
          <p className={styles.sectionHeading}>Rejected</p>
          {step.approval.rejection_reason && (
            <p className={styles.sectionBody}>{step.approval.rejection_reason}</p>
          )}
          <p className={styles.sectionBody}>
            by {step.approval.decided_by} at{" "}
            {new Date(step.approval.decided_at).toLocaleString()}
          </p>
        </div>
      )}
    </button>
  );
}

/**
 * TaskGraph: Main linear step list renderer
 * Iterates through all steps in order, marks current as interactive
 */
export function TaskGraph() {
  const steps = useTaskSteps();
  const currentStep = useCurrentStep();

  if (!steps || steps.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No operator task selected</p>
        <p className={styles.sectionBody}>
          Select a queued task from the list to review steps, approvals, and
          evidence before execution.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stepList}>
      {steps.map((step, index) => (
        <StepCard
          key={step.id}
          step={step}
          stepIndex={index}
          isCurrentStep={currentStep?.id === step.id}
        />
      ))}
    </div>
  );
}
