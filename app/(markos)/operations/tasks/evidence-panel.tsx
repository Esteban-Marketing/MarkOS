"use client";

/**
 * EvidencePanel: Read-only evidence drawer for task step audit trail
 *
 * Locked decisions (Phase 46):
 * - D-09: Right-sidebar drawer opens on step selection without route navigation
 * - D-10: Evidence content is read-only in MVP (no editable controls)
 * - D-11: Evidence shows inputs, outputs, logs, timestamps, actor_id in fixed order
 * - Evidence is marked immutable for audit clarity
 *
 * UI Contract:
 * - Evidence sections in fixed order: Inputs, Outputs, Logs, Timestamps, Actor ID
 * - step_started_at and step_completed_at explicitly labeled under Timestamps
 * - All fields rendered as read-only text (copy-to-clipboard, no text selection prevention)
 * - Empty state message when no step is selected
 */

import React from "react";
import { useSelectedEvidenceStep } from "./task-store";
import { TaskStepEvidence } from "./task-types";

/**
 * Evidence section header component
 */
function EvidenceSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="bg-gray-50 rounded p-3">{children}</div>
    </div>
  );
}

/**
 * Evidence field renderer for key-value pairs
 */
function EvidenceField({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  const isLong = stringValue.length > 80;

  return (
    <div className="mb-2">
      <p className="text-xs font-medium text-[#475569] mb-1">{label}</p>
      <code className={`text-xs text-[#0f172a] font-mono p-2 bg-white rounded block ${
        isLong ? "max-h-32 overflow-y-auto" : ""
      }`}>
        {stringValue}
      </code>
    </div>
  );
}

/**
 * EvidencePanel: Main component for evidence drawer
 */
export function EvidencePanel() {
  const selectedEvidenceStep = useSelectedEvidenceStep();

  if (!selectedEvidenceStep) {
    return (
      <div className="text-sm text-[#475569] py-6 text-center">
        <p className="font-medium text-[#0f172a]">No evidence selected</p>
        <p className="mt-2 text-xs">
          Click on a step in the task list to view its evidence and audit details.
        </p>
      </div>
    );
  }

  const evidence = selectedEvidenceStep.evidence;

  return (
    <div className="space-y-1">
      {/* Header with step context */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-[#0f172a]">
          {selectedEvidenceStep.title}
        </h3>
        <p className="text-xs text-[#475569] mt-1">
          Step {selectedEvidenceStep.order_index + 1} • State: {selectedEvidenceStep.state}
        </p>
      </div>

      {/* Immutability marker */}
      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        <p className="font-medium">🔒 Evidence is immutable (audit trail)</p>
        <p className="mt-1">
          This evidence was recorded during step execution and cannot be edited.
        </p>
      </div>

      {/* Evidence sections in locked order */}

      {/* 1. Inputs */}
      <EvidenceSection title="Inputs">
        {Object.keys(evidence.inputs).length === 0 ? (
          <p className="text-xs text-[#7c8192] italic">No inputs recorded</p>
        ) : (
          Object.entries(evidence.inputs).map(([key, value]) => (
            <EvidenceField key={key} label={key} value={value} />
          ))
        )}
      </EvidenceSection>

      {/* 2. Outputs */}
      <EvidenceSection title="Outputs">
        {evidence.outputs === null ? (
          <p className="text-xs text-[#7c8192] italic">
            Outputs not yet available (step not completed)
          </p>
        ) : Object.keys(evidence.outputs).length === 0 ? (
          <p className="text-xs text-[#7c8192] italic">Empty output set</p>
        ) : (
          Object.entries(evidence.outputs).map(([key, value]) => (
            <EvidenceField key={key} label={key} value={value} />
          ))
        )}
      </EvidenceSection>

      {/* 3. Logs */}
      <EvidenceSection title="Execution Logs">
        {evidence.logs.length === 0 ? (
          <p className="text-xs text-[#7c8192] italic">No logs recorded</p>
        ) : (
          <code className="text-xs text-[#0f172a] font-mono p-2 bg-white rounded block max-h-40 overflow-y-auto space-y-1">
            {evidence.logs.map((log, idx) => (
              <div key={idx} className="text-[#475569]">
                {log}
              </div>
            ))}
          </code>
        )}
      </EvidenceSection>

      {/* 4. Timestamps */}
      <EvidenceSection title="Timestamps">
        <div className="space-y-2">
          <EvidenceField
            label="Step Started At"
            value={evidence.step_started_at || "–"}
          />
          <EvidenceField
            label="Step Completed At"
            value={evidence.step_completed_at || "–"}
          />
        </div>
      </EvidenceSection>

      {/* 5. Actor ID */}
      <EvidenceSection title="Actor ID">
        {evidence.actor_id === null ? (
          <p className="text-xs text-[#7c8192] italic">No actor recorded</p>
        ) : (
          <EvidenceField label="Executed By" value={evidence.actor_id} />
        )}
      </EvidenceSection>

      {/* Retry information (if available) */}
      {selectedEvidenceStep.retry_count > 0 && (
        <EvidenceSection title="Retry History">
          <div className="text-xs space-y-2">
            <p className="text-[#0f172a] font-medium">
              Total retry attempts: {selectedEvidenceStep.retry_count}
            </p>
            {selectedEvidenceStep.retry_attempts.map((attempt, idx) => (
              <div
                key={idx}
                className="p-2 bg-white border-l-2 border-amber-400 rounded ml-1"
              >
                <p className="font-medium text-[#0f172a]">
                  Attempt {attempt.attempt}
                </p>
                <p className="text-[#475569] mt-0.5">
                  Requested by {attempt.requested_by} at {new Date(attempt.requested_at).toLocaleString()}
                </p>
                {attempt.previous_error && (
                  <p className="text-red-600 mt-1 max-h-16 overflow-y-auto font-mono text-[10px]">
                    Error: {attempt.previous_error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </EvidenceSection>
      )}

      {/* Error information (if present) */}
      {selectedEvidenceStep.latest_error && (
        <EvidenceSection title="Latest Error">
          <div className="p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-xs text-red-700 font-mono max-h-24 overflow-y-auto">
              {selectedEvidenceStep.latest_error}
            </p>
          </div>
        </EvidenceSection>
      )}
    </div>
  );
}
