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
import styles from "./task-ui.module.css";

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
    <div className={styles.sectionBlock}>
      <h4 className="t-label-caps">{title}</h4>
      <div>{children}</div>
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
    <div className={styles.kvPair}>
      <p className={styles.kvLabel}>{label}</p>
      <code className={`${styles.codeBlock} ${isLong ? styles.scrollBlock : ""}`}>
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
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No evidence selected</p>
        <p>
          Click on a step in the task list to view its evidence and audit details.
        </p>
      </div>
    );
  }

  const evidence = selectedEvidenceStep.evidence;

  return (
    <div>
      <div className={styles.sectionBlock}>
        <h3>{selectedEvidenceStep.title}</h3>
        <p>
          Step {selectedEvidenceStep.order_index + 1} •{" "}
          <span className="c-chip-protocol">[step_{selectedEvidenceStep.id}]</span>
        </p>
        <p>State: {selectedEvidenceStep.state}</p>
      </div>

      <div className="c-notice c-notice--info" role="status">
        <strong>Evidence is immutable</strong>{" "}— This evidence was recorded during step execution and cannot be edited.
      </div>

      <EvidenceSection title="Inputs">
        {Object.keys(evidence.inputs).length === 0 ? (
          <p>No inputs recorded</p>
        ) : (
          Object.entries(evidence.inputs).map(([key, value]) => (
            <EvidenceField key={key} label={key} value={value} />
          ))
        )}
      </EvidenceSection>

      <EvidenceSection title="Outputs">
        {evidence.outputs === null ? (
          <p>
            Outputs not yet available (step not completed)
          </p>
        ) : Object.keys(evidence.outputs).length === 0 ? (
          <p>Empty output set</p>
        ) : (
          Object.entries(evidence.outputs).map(([key, value]) => (
            <EvidenceField key={key} label={key} value={value} />
          ))
        )}
      </EvidenceSection>

      <EvidenceSection title="Execution Logs">
        {evidence.logs.length === 0 ? (
          <p>No logs recorded</p>
        ) : (
          <code className={`${styles.codeBlock} ${styles.scrollBlock}`}>
            {evidence.logs.map((log, idx) => (
              <div key={idx}>
                {log}
              </div>
            ))}
          </code>
        )}
      </EvidenceSection>

      <EvidenceSection title="Timestamps">
        <div>
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

      <EvidenceSection title="Actor ID">
        {evidence.actor_id === null ? (
          <p>No actor recorded</p>
        ) : (
          <div className={styles.kvPair}>
            <p className={styles.kvLabel}>Executed By</p>
            <span className="c-chip-protocol">[actor_{evidence.actor_id}]</span>
          </div>
        )}
      </EvidenceSection>

      {selectedEvidenceStep.retry_count > 0 && (
        <EvidenceSection title="Retry History">
          <div>
            <p className={styles.kvLabel}>
              Total retry attempts: {selectedEvidenceStep.retry_count}
            </p>
            {selectedEvidenceStep.retry_attempts.map((attempt, idx) => (
              <article key={idx} className="c-card">
                <p className="t-label-caps">
                  Attempt {attempt.attempt}
                </p>
                <p>
                  Requested by {attempt.requested_by} at {new Date(attempt.requested_at).toLocaleString()}
                </p>
                {attempt.previous_error && (
                  <code className={`${styles.codeBlock} ${styles.scrollBlock}`}>
                    [err] {attempt.previous_error}
                  </code>
                )}
              </article>
            ))}
          </div>
        </EvidenceSection>
      )}

      {selectedEvidenceStep.latest_error && (
        <EvidenceSection title="Latest Error">
          <article className="c-card">
            <code className={`${styles.codeBlock} ${styles.scrollBlock}`}>
              {selectedEvidenceStep.latest_error}
            </code>
          </article>
        </EvidenceSection>
      )}
    </div>
  );
}
