import React, { useState } from "react";

import styles from "./page.module.css";

const OPERATOR_RECONCILIATION_ENDPOINT = "/api/billing/operator-reconciliation";
const HOLDS_ENDPOINT = "/api/billing/holds";

const queueTabs = ["Needs review", "On hold", "Sync failures", "Ready to close"];
const evidenceSections = [
  "Subscription snapshot",
  "Usage ledger rows",
  "Source telemetry lineage",
  "Invoice line items",
  "Provider sync attempts",
  "Hold and dunning history",
  "Release evidence, impacted workflows, and restored active snapshot",
];

export type AdminBillingPageVariant = "healthy" | "hold" | "syncFailure";

const noticeMap = {
  healthy:     { cls: "c-notice c-notice--success", glyph: "[ok]",   copy: "Billing evidence reconciled. No operator intervention required." },
  hold:        { cls: "c-notice c-notice--warning", glyph: "[warn]", copy: "Billing hold active. Restricted actions paused until billing health is restored." },
  syncFailure: { cls: "c-notice c-notice--error",   glyph: "[err]",  copy: "Provider sync failure unresolved. Review evidence to reconcile or place a hold." },
} as const;

const badgeMap: Record<string, { cls: string; glyph: string }> = {
  Mismatch:        { cls: "c-badge c-badge--warning", glyph: "[warn]" },
  "Sync failed":   { cls: "c-badge c-badge--warning", glyph: "[warn]" },
  "Pending review":{ cls: "c-badge c-badge--info",    glyph: "[info]" },
  Reconciled:      { cls: "c-badge c-badge--success", glyph: "[ok]" },
  Released:        { cls: "c-badge c-badge--success", glyph: "[ok]" },
  Restored:        { cls: "c-badge c-badge--success", glyph: "[ok]" },
  Hold:            { cls: "c-badge c-badge--warning", glyph: "[warn]" },
  failed:          { cls: "c-badge c-badge--warning", glyph: "[warn]" },
  pending:         { cls: "c-badge c-badge--info",    glyph: "[info]" },
  reconciled:      { cls: "c-badge c-badge--success", glyph: "[ok]" },
  released:        { cls: "c-badge c-badge--success", glyph: "[ok]" },
  restored:        { cls: "c-badge c-badge--success", glyph: "[ok]" },
  hold:            { cls: "c-badge c-badge--warning", glyph: "[warn]" },
  review:          { cls: "c-badge c-badge--info",    glyph: "[info]" },
  ready:           { cls: "c-badge c-badge--success", glyph: "[ok]" },
};

function RowBadge({ value }: Readonly<{ value: string }>) {
  const badge = badgeMap[value] ?? { cls: "c-badge", glyph: "[info]" };
  return <span className={badge.cls}>{badge.glyph} {value}</span>;
}

export default function AdminBillingPage({
  variant = "healthy",
}: Readonly<{
  variant?: AdminBillingPageVariant;
}>) {
  const [showWriteOff, setShowWriteOff] = useState(false);

  let tabIndex = 2;
  let row = {
    tenant: "tenant-beta-004",
    period: "April 2026",
    plan: "growth-monthly",
    usage: "review",
    invoice: "pending",
    sync: "failed",
    hold: "pending",
    reconciledAt: "2026-04-03T08:30:00.000Z",
  };

  if (variant === "healthy") {
    tabIndex = 3;
    row = {
      tenant: "tenant-alpha-001",
      period: "April 2026",
      plan: "growth-monthly",
      usage: "ready",
      invoice: "reconciled",
      sync: "restored",
      hold: "released",
      reconciledAt: "2026-04-04T00:00:00.000Z",
    };
  } else if (variant === "hold") {
    tabIndex = 1;
    row = {
      tenant: "tenant-alpha-001",
      period: "April 2026",
      plan: "growth-monthly",
      usage: "review",
      invoice: "pending",
      sync: "failed",
      hold: "hold",
      reconciledAt: "2026-04-03T00:00:00.000Z",
    };
  }

  const { cls, glyph, copy } = noticeMap[variant];

  function cancelWriteOff() {
    setShowWriteOff(false);
  }

  function confirmWriteOff() {
    setShowWriteOff(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className="c-card">
          <span className="t-label-caps">Operator billing reconciliation</span>
          <h1>Reconciliation queue</h1>
          <p className="t-lead">Review Billing Evidence is the primary action when a mismatch or sync failure exists. Data is sourced from {OPERATOR_RECONCILIATION_ENDPOINT} and {HOLDS_ENDPOINT}, including incident severity, impacted workflows, same-period release evidence, and a restored active snapshot.</p>
        </section>

        <section className={styles.layoutGrid}>
          <aside className="c-card">
            <h4>Reconciliation queue tabs</h4>
            <div className={styles.tabList}>
              {queueTabs.map((tab, index) => (
                <div key={tab} className={index === tabIndex ? styles.activeTab : styles.tab}>{tab}</div>
              ))}
            </div>
          </aside>

          <main className={styles.mainColumn}>
            <article className="c-card">
              <h4>Tenant-period reconciliation table</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Tenant</th>
                    <th scope="col">Billing period</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Usage status</th>
                    <th scope="col">Invoice status</th>
                    <th scope="col">Provider sync state</th>
                    <th scope="col">Hold state</th>
                    <th scope="col">Last reconciled at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{row.tenant}</td>
                    <td>{row.period}</td>
                    <td>{row.plan}</td>
                    <td><RowBadge value={row.usage} /></td>
                    <td><RowBadge value={row.invoice} /></td>
                    <td><RowBadge value={row.sync} /></td>
                    <td><RowBadge value={row.hold} /></td>
                    <td>{row.reconciledAt}</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="c-card">
              <h4>Invoice line-item preview panel</h4>
              <p>Row selection updates the center detail panel and right evidence rail without route change. Reconciliation mismatches remain visible until explicitly resolved.</p>
              <div className={styles.buttonRow}>
                <button type="button" className="c-button c-button--primary">Review Billing Evidence</button>
                <button type="button" className="c-button c-button--secondary">Place Hold</button>
                <button type="button" className="c-button c-button--secondary">Release Hold</button>
                <button type="button" className="c-button c-button--secondary">Retry Provider Sync</button>
                <button type="button" className="c-button c-button--destructive" onClick={() => setShowWriteOff(true)}>Write off</button>
              </div>
            </article>
          </main>

          <aside className="c-card">
            <h4>Evidence rail</h4>
            <div className={styles.evidenceList}>
              {evidenceSections.map((section, index) => (
                <div key={section} className={index === 0 ? styles.activeEvidenceItem : styles.evidenceItem}>{section}</div>
              ))}
            </div>
          </aside>
        </section>

        <div className={cls} role="status">
          <strong>{glyph}</strong>{" "}{copy}
        </div>

        {showWriteOff && (
          <>
            <div className="c-backdrop" onClick={cancelWriteOff} />
            <div className="c-modal" role="dialog" aria-modal="true" aria-labelledby="write-off-title">
              <h3 id="write-off-title">Write off this billing discrepancy?</h3>
              <p>This action is logged as operator evidence and cannot be undone.</p>
              <div className={styles.buttonRow}>
                <button type="button" className="c-button c-button--secondary" onClick={cancelWriteOff}>Cancel</button>
                <button type="button" className="c-button c-button--destructive" onClick={confirmWriteOff}>Write off</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
