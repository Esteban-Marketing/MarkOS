import React from "react";

import styles from "./page.module.css";

const TENANT_BILLING_ENDPOINT = "/api/billing/tenant-summary";

const usageRows = [
  { category: "Seats", included: "10", used: "4", projectedOverage: "0", chargeImpact: "$0" },
  { category: "Projects", included: "5", used: "3", projectedOverage: "0", chargeImpact: "$0" },
  { category: "Agent Runs", included: "1,000", used: "312", projectedOverage: "0", chargeImpact: "$0" },
  { category: "AI Usage", included: "100,000 tokens", used: "41,500", projectedOverage: "0", chargeImpact: "$0" },
  { category: "Storage", included: "50 GB-days", used: "8 GB-days", projectedOverage: "0", chargeImpact: "$0" },
];

const invoices = [
  { id: "INV-2026-04", status: "healthy", total: "$150.00", dueDate: "2026-05-01" },
];

export type BillingSettingsPageVariant = "healthy" | "hold";

export type BillingSettingsAction = (formData: FormData) => void | Promise<void>;

export type BillingSettingsPageProps = Readonly<{
  variant?: BillingSettingsPageVariant;
  reviewCurrentInvoiceAction?: BillingSettingsAction;
  reviewBillingDetailsAction?: BillingSettingsAction;
}>;

export function BillingSettingsPageShell({
  variant = "healthy",
  reviewCurrentInvoiceAction,
  reviewBillingDetailsAction,
}: BillingSettingsPageProps) {
  const isHold = variant === "hold";
  const summaryText = isHold
    ? "Billing period: April 2026. Current status: on hold. Restricted write, execute, and premium actions are paused while billing health is restored. Hold history, release evidence, impacted workflows, communication cadence, and the restored active snapshot remain visible to the tenant."
    : "Billing period: April 2026. Current status: healthy. Next invoice: 2026-05-01. No hold is active. Release evidence shows the first same-period provider sync restored an active snapshot without hiding the failed attempt, and the impacted workflows plus recovery criteria remain visible to the tenant.";

  const entitlementText = isHold
    ? "Premium features are temporarily paused. Billing history, settings, invoices, and recovery evidence remain available while the hold is active."
    : "Premium features remain available. If a workspace is on hold, restricted write, execute, and premium actions pause while usage records and invoices remain visible.";

  const holdText = isHold
    ? "Restricted write, execute, and premium actions are paused while payment or reconciliation issues are resolved. Usage records, invoices, settings, and release evidence remain available throughout the hold interval."
    : "No active hold is blocking the workspace. If a future provider sync fails, the hold interval and recovery evidence will appear here without hiding the failed attempt.";

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className="c-card">
          <div>
            <span className="t-label-caps">Billing status summary</span>
            <h1>Growth Monthly</h1>
            <p>{summaryText}</p>
          </div>
          <div className={styles.actionRow}>
            <form action={reviewCurrentInvoiceAction}>
              <button type="submit" className="c-button c-button--primary">Review current invoice</button>
            </form>
            <form action={reviewBillingDetailsAction}>
              <button type="submit" className="c-button c-button--secondary">Review billing details</button>
            </form>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <article className="c-card">
              <h2>Current plan and included usage</h2>
              <p>Included usage and current invoice data are sourced from {TENANT_BILLING_ENDPOINT} and translated into plain billing language.</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Included</th>
                    <th scope="col">Used</th>
                    <th scope="col">Projected overage</th>
                    <th scope="col">Charge impact</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{row.included}</td>
                      <td>{row.used}</td>
                      <td>{row.projectedOverage}</td>
                      <td>{row.chargeImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="c-card">
              <h2>Invoice list</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Status</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyState}>
                        No invoices yet. Invoices appear here after your first billing cycle.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.status}</td>
                        <td>{invoice.total}</td>
                        <td>{invoice.dueDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className="c-card">
              <h2>Entitlement and premium-feature availability</h2>
              <p>{entitlementText}</p>
            </section>

            <section className="c-card">
              <h2>Billing evidence drawer trigger</h2>
              <p>Billing evidence uses translated labels first and keeps raw lineage references behind a secondary drawer, including hold history, release evidence, impacted workflows, communication cadence, and the restored active snapshot.</p>
              <button type="button" className="c-button c-button--secondary">Review billing details</button>
            </section>

            {isHold && (
              <div className="c-notice c-notice--warning" role="status">
                <strong>[warn]</strong>{" "}Payment issue. Resolve to continue using MarkOS.{" "}
                {holdText}
              </div>
            )}
            {!isHold && (
              <div className="c-notice c-notice--warning" role="status">
                <strong>[warn]</strong>{" "}No active billing hold. {holdText}
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}
