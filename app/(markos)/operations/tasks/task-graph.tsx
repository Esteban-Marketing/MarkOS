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
 * State badge config — composes .c-badge--{*} primitives with bracketed glyphs (OT-4)
 */
const STATE_BADGE_CONFIG: Record<
  TaskStepState,
  { cls: string; glyph: string; label: string }
> = {
  [TaskStepState.Queued]: {
    cls: "c-badge c-badge--info",
    glyph: "[–]",
    label: "Queued",
  },
  [TaskStepState.Approved]: {
    cls: "c-badge c-badge--info",
    glyph: "[ok]",
    label: "Approved",
  },
  [TaskStepState.Executing]: {
    cls: "c-badge c-badge--warning",
    glyph: "[•]",
    label: "Executing",
  },
  [TaskStepState.Completed]: {
    cls: "c-badge c-badge--success",
    glyph: "[ok]",
    label: "Completed",
  },
  [TaskStepState.Failed]: {
    cls: "c-badge c-badge--error",
    glyph: "[err]",
    label: "Failed",
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
        "c-card",
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
          <h3>{step.title}</h3>
        </div>
        <span className={badgeConfig.cls}>
          {badgeConfig.glyph} {badgeConfig.label}
        </span>
      </div>

      <p>{step.description}</p>

      <div className={styles.metaRow}>
        {step.requires_approval && (
          <span className="c-chip c-chip--warning">
            Requires Approval
          </span>
        )}
        {step.latest_error && (
          <span className="c-chip c-chip--error">
            [err] {step.latest_error.substring(0, 30)}...
          </span>
        )}
      </div>

      <div className={styles.auditRow}>
        <span>by {lastActor}</span>
        {lastTimestamp !== "—" && (
          <>
            <span>•</span>
            <span>{new Date(lastTimestamp).toLocaleTimeString()}</span>
          </>
        )}
      </div>

      {/* Sequential gating message for future steps */}
      {!isCurrentStep && step.state === TaskStepState.Queued && (
        <div className="c-notice c-notice--info" role="status">
          Complete all prior steps to unlock this step for execution.
        </div>
      )}

      {/* Approval requirement message */}
      {isCurrentStep &&
        step.requires_approval &&
        step.approval.status === "pending" && (
          <div className="c-notice c-notice--warning" role="status">
            This step requires approval before execution.
          </div>
        )}

      {step.approval.status === "rejected" && (
        <div className="c-notice c-notice--error" role="status">
          <strong>Rejected</strong>
          {step.approval.rejection_reason && (
            <p>{step.approval.rejection_reason}</p>
          )}
          <p>
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
        <p>
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
