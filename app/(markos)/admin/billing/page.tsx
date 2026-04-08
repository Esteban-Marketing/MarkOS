import React from "react";

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

export default function AdminBillingPage({
  variant = "healthy",
}: Readonly<{
  variant?: AdminBillingPageVariant;
}>) {
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
  let reviewTitle = "Provider sync failed";
  let reviewText = "A provider sync failure is still unresolved. The queue keeps the tenant-period visible until billing evidence is reconciled or the hold is explicitly placed and later released.";

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
    reviewTitle = "Billing status healthy";
    reviewText = "The latest provider sync restored an active snapshot. Release evidence, impacted workflows, and recovery criteria remain visible for audit, but no operator intervention is required.";
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
    reviewTitle = "Billing status needs review";
    reviewText = "We could not confirm the latest billing sync. Restricted actions stay paused until billing health is restored, and any release remains visible as append-only recovery evidence with communication owner, impacted workflows, and recovery criteria.";
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>Operator billing reconciliation</p>
          <h1 className={styles.title}>Reconciliation queue</h1>
          <p className={styles.heroText}>Review Billing Evidence is the primary action when a mismatch or sync failure exists. Data is sourced from {OPERATOR_RECONCILIATION_ENDPOINT} and {HOLDS_ENDPOINT}, including incident severity, impacted workflows, same-period release evidence, and a restored active snapshot.</p>
        </section>

        <section className={styles.layoutGrid}>
          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Reconciliation queue tabs</h2>
            <div className={styles.tabList}>
              {queueTabs.map((tab, index) => (
                <div key={tab} className={index === tabIndex ? styles.activeTab : styles.tab}>{tab}</div>
              ))}
            </div>
          </aside>

          <main className={styles.mainColumn}>
            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Tenant-period reconciliation table</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Tenant</th>
                    <th className={styles.tableHead}>Billing period</th>
                    <th className={styles.tableHead}>Plan</th>
                    <th className={styles.tableHead}>Usage status</th>
                    <th className={styles.tableHead}>Invoice status</th>
                    <th className={styles.tableHead}>Provider sync state</th>
                    <th className={styles.tableHead}>Hold state</th>
                    <th className={styles.tableHead}>Last reconciled at</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>{row.tenant}</td>
                    <td className={styles.tableCell}>{row.period}</td>
                    <td className={styles.tableCell}>{row.plan}</td>
                    <td className={styles.tableCell}>{row.usage}</td>
                    <td className={styles.tableCell}>{row.invoice}</td>
                    <td className={styles.tableCell}>{row.sync}</td>
                    <td className={styles.tableCell}>{row.hold}</td>
                    <td className={styles.tableCell}>{row.reconciledAt}</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Invoice line-item preview panel</h2>
              <p className={styles.bodyText}>Row selection updates the center detail panel and right evidence rail without route change. Reconciliation mismatches remain visible until explicitly resolved.</p>
              <div className={styles.buttonRow}>
                <button type="button" className={styles.primaryButton}>Review Billing Evidence</button>
                <button type="button" className={styles.secondaryButton}>Place Hold</button>
                <button type="button" className={styles.secondaryButton}>Release Hold</button>
                <button type="button" className={styles.secondaryButton}>Retry Provider Sync</button>
              </div>
            </article>
          </main>

          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Evidence rail</h2>
            <div className={styles.evidenceList}>
              {evidenceSections.map((section, index) => (
                <div key={section} className={index === 0 ? styles.activeEvidenceItem : styles.evidenceItem}>{section}</div>
              ))}
            </div>
          </aside>
        </section>

        <section className={styles.reviewCard}>
          <h2 className={styles.reviewTitle}>{reviewTitle}</h2>
          <p className={styles.reviewText}>{reviewText}</p>
        </section>
      </div>
    </div>
  );
}