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

/**
 * State badge styling (locked enum values)
 */
const STATE_BADGE_CONFIG: Record<
  TaskStepState,
  { bgClass: string; textClass: string; label: string }
> = {
  [TaskStepState.Queued]: {
    bgClass: "bg-gray-100",
    textClass: "text-gray-700",
    label: "queued",
  },
  [TaskStepState.Approved]: {
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
    label: "approved",
  },
  [TaskStepState.Executing]: {
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
    label: "executing",
  },
  [TaskStepState.Completed]: {
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    label: "completed",
  },
  [TaskStepState.Failed]: {
    bgClass: "bg-red-100",
    textClass: "text-red-700",
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
}: {
  step: TaskStepRecord;
  stepIndex: number;
  isCurrentStep: boolean;
}) {
  const { selectEvidenceStep } = useTaskActions();

  const badgeConfig = STATE_BADGE_CONFIG[step.state];

  const isActionable =
    isCurrentStep && [TaskStepState.Queued, TaskStepState.Failed].includes(step.state);

  const lastActor = step.evidence.actor_id || "system";
  const lastTimestamp = step.evidence.step_completed_at || step.evidence.step_started_at || "—";

  return (
    <div
      onClick={() => selectEvidenceStep(step.id)}
      className={`
        mt-3 p-4 rounded-lg border-2 transition-all cursor-pointer
        ${
          isCurrentStep ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
        }
        ${isActionable ? "hover:shadow-md" : "opacity-70"}
      `}
    >
      {/* Step header: order index + title */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-[#475569] bg-gray-200 px-2 py-1 rounded">
            #{stepIndex + 1}
          </span>
          <h3 className="text-sm font-medium text-[#0f172a]">
            {step.title}
          </h3>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${badgeConfig.bgClass} ${badgeConfig.textClass}`}
        >
          {badgeConfig.label}
        </span>
      </div>

      {/* Step description */}
      <p className="text-xs text-[#475569] mb-3">{step.description}</p>

      {/* Metadata: domain, approval requirement, actor, timestamp */}
      <div className="flex items-center justify-between gap-2 text-xs text-[#7c8192]">
        {step.requires_approval && (
          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-sm font-medium">
            Requires Approval
          </span>
        )}
        {step.latest_error && (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm">
            Error: {step.latest_error.substring(0, 30)}...
          </span>
        )}
      </div>

      {/* Audit trail: last actor + timestamp */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-[#7c8192]">
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
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-[#475569] italic">
          Complete all prior steps to unlock this step for execution.
        </div>
      )}

      {/* Approval requirement message */}
      {isCurrentStep &&
        step.requires_approval &&
        step.approval.status === "pending" && (
          <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-700 font-medium">
            ⚠️ This step requires approval before execution.
          </div>
        )}

      {/* Rejection reason (if applicable) */}
      {step.approval.status === "rejected" && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs">
          <p className="text-red-700 font-medium">Rejected</p>
          {step.approval.rejection_reason && (
            <p className="text-red-600 mt-1">{step.approval.rejection_reason}</p>
          )}
          <p className="text-red-500 mt-1">
            by {step.approval.decided_by} at{" "}
            {new Date(step.approval.decided_at!).toLocaleString()}
          </p>
        </div>
      )}
    </div>
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
      <div className="text-sm text-[#475569] py-8 text-center">
        <p className="font-medium text-[#0f172a]">No operator task selected</p>
        <p className="mt-1">
          Select a queued task from the list to review steps, approvals, and
          evidence before execution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Step progression timeline */}
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
