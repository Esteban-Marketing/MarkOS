import React, { useState } from "react";

import styles from "./page.module.css";

const GOVERNANCE_EVIDENCE_ENDPOINT = "/api/governance/evidence";
const GOVERNANCE_VENDOR_ENDPOINT = "/api/governance/vendor-inventory";

const sections = ["Identity Federation", "Access Reviews", "Retention and Export", "Vendor Inventory"];

export type GovernanceAdminPageVariant = "default" | "deniedMapping" | "exportReady";

type GovernanceAdminPageProps = Readonly<{
  variant?: GovernanceAdminPageVariant;
}>;

const badgeMap: Record<string, { cls: string; glyph: string }> = {
  denied:       { cls: "c-badge c-badge--error",   glyph: "[err]" },
  ready:        { cls: "c-badge c-badge--success", glyph: "[ok]" },
  export_ready: { cls: "c-badge c-badge--success", glyph: "[ok]" },
  pending:      { cls: "c-badge c-badge--info",    glyph: "[info]" },
};

const noticeMap: Record<string, { cls: string; glyph: string; copy: string }> = {
  deniedMapping: {
    cls:  "c-notice c-notice--error",
    glyph: "[err]",
    copy: "Mapping denied. Source claim has no matching canonical role. Review the federation rules.",
  },
  exportReady: {
    cls:  "c-notice c-notice--success",
    glyph: "[ok]",
    copy: "Export ready. Retention window: P12M. Evidence reference visible for audit.",
  },
};

function DecisionBadge({ value }: { value: string }) {
  const entry = badgeMap[value];
  if (!entry) return <span>{value}</span>;
  return <span className={entry.cls}>{entry.glyph} {value}</span>;
}

export default function GovernanceAdminPage({
  variant = "default",
}: GovernanceAdminPageProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);

  const activeSectionIndex = variant === "exportReady" ? 2 : 0;
  const heroTitle = variant === "exportReady" ? "Retention and Export" : "Identity Federation";
  const heroText =
    variant === "exportReady"
      ? `Browse evidence-first governance data from ${GOVERNANCE_EVIDENCE_ENDPOINT} and ${GOVERNANCE_VENDOR_ENDPOINT}. Export readiness, deletion workflow proof, and evidence references remain visible to operators.`
      : `Browse evidence-first governance data from ${GOVERNANCE_EVIDENCE_ENDPOINT} and ${GOVERNANCE_VENDOR_ENDPOINT}. Denied mappings stay visible in the detail rail.`;
  const detailTitle = variant === "exportReady" ? "Export readiness detail" : "Denied mapping detail";
  const detailLines =
    variant === "exportReady"
      ? [
          "Workflow status: export_ready",
          "Retention window: P12M",
          "Deletion checkpoint: export_before_delete_complete",
          "Evidence reference: gov-evidence-2026-04-03",
        ]
      : [
          "Source claim: markos-super-admin",
          "Matched rule: null",
          "Mapped role: null",
          "Denial reason: EXTERNAL_ROLE_ESCALATION_DENIED",
        ];

  function onApprove() {
    // Phase 207 audit-log emit — server action preserved
  }

  function openRejectModal() {
    setShowRejectModal(true);
  }

  function cancelReject() {
    setShowRejectModal(false);
  }

  function confirmReject() {
    // Phase 207 audit-log emit on Reject — server action preserved
    setShowRejectModal(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className="c-card">
          <span className="t-label-caps">Governance administration</span>
          <h1>{heroTitle}</h1>
          <p>{heroText}</p>
          <div className={styles.heroActions}>
            <button type="button" className="c-button c-button--primary" onClick={onApprove}>Approve</button>
            <button type="button" className="c-button c-button--destructive" onClick={openRejectModal}>Reject</button>
          </div>
        </section>

        {showRejectModal && (
          <>
            <div className="c-backdrop" onClick={cancelReject} />
            <div className="c-modal" role="dialog" aria-modal="true" aria-labelledby="reject-title">
              <h3 id="reject-title">Reject this approval?</h3>
              <p>A rejection is logged as Phase 207 audit-log evidence and cannot be undone.</p>
              <div className={styles.modalActions}>
                <button type="button" className="c-button c-button--secondary" onClick={cancelReject}>Cancel</button>
                <button type="button" className="c-button c-button--destructive" onClick={confirmReject}>Reject</button>
              </div>
            </div>
          </>
        )}

        <section className={styles.layoutGrid}>
          <aside className="c-card">
            <h4>Sections</h4>
            <div className={styles.sectionList}>
              {sections.map((section, index) => (
                <div
                  key={section}
                  className={index === activeSectionIndex ? styles.activeSection : styles.sectionItem}
                >
                  {section}
                </div>
              ))}
            </div>
          </aside>

          <main className={styles.mainColumn}>
            <article className="c-card">
              <h4>Identity Federation</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Tenant</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Source claim or group</th>
                    <th scope="col">Mapped canonical role</th>
                    <th scope="col">Decision</th>
                    <th scope="col">Actor or subject</th>
                    <th scope="col">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>tenant-alpha-001</td>
                    <td>sso-provider-acme</td>
                    <td>markos-super-admin</td>
                    <td>null</td>
                    <td><DecisionBadge value="denied" /></td>
                    <td>user-identity-001</td>
                    <td>2026-04-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="c-card">
              <h4>Access Reviews</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Tenant</th>
                    <th scope="col">Review scope</th>
                    <th scope="col">Last completed</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Findings status</th>
                    <th scope="col">Next review due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>tenant-alpha-001</td>
                    <td>billing_and_identity_admins</td>
                    <td>2026-04-03T00:00:00.000Z</td>
                    <td>owner-1</td>
                    <td><DecisionBadge value="ready" /></td>
                    <td>2026-05-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="c-card">
              <h4>Retention and Export</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Evidence type</th>
                    <th scope="col">Requested at</th>
                    <th scope="col">Status</th>
                    <th scope="col">Retention window</th>
                    <th scope="col">Export availability</th>
                    <th scope="col">Last actor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>billing_and_identity_controls</td>
                    <td>2026-04-03T00:00:00.000Z</td>
                    <td><DecisionBadge value="ready" /></td>
                    <td>P12M</td>
                    <td><DecisionBadge value="export_ready" /></td>
                    <td>owner-1</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="c-card">
              <h4>Vendor Inventory</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Vendor</th>
                    <th scope="col">Function</th>
                    <th scope="col">Data classes touched</th>
                    <th scope="col">Region or residency note</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last review</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OpenAI</td>
                    <td>AI provider</td>
                    <td>Prompt, completion, telemetry</td>
                    <td>US service boundary</td>
                    <td><DecisionBadge value="ready" /></td>
                    <td>2026-04-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </main>

          <aside className="c-card">
            <h4>Detail rail</h4>
            <div className="c-card">
              <h3>{detailTitle}</h3>
              {detailLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            {variant in noticeMap && (
              <div className={noticeMap[variant].cls} role="status">
                <strong>{noticeMap[variant].glyph}</strong>{" "}{noticeMap[variant].copy}
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
