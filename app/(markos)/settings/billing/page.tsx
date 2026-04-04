import { reviewBillingDetails, reviewCurrentInvoice } from "./actions";
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

export default function BillingSettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.summaryCard}>
          <div>
            <p className={styles.eyebrow}>Billing status summary</p>
            <h1 className={styles.title}>Growth Monthly</h1>
            <p className={styles.summaryText}>Billing period: April 2026. Current status: healthy. Next invoice: 2026-05-01. No hold is active.</p>
          </div>
          <div className={styles.actionRow}>
            <form action={reviewCurrentInvoice}>
              <button type="submit" className={styles.primaryButton}>Review Current Invoice</button>
            </form>
            <form action={reviewBillingDetails}>
              <button type="submit" className={styles.secondaryButton}>Review Billing Details</button>
            </form>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Current plan and included usage</h2>
              <p className={styles.bodyText}>Included usage and current invoice data are sourced from {TENANT_BILLING_ENDPOINT} and translated into plain billing language.</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Category</th>
                    <th className={styles.tableHead}>Included</th>
                    <th className={styles.tableHead}>Used</th>
                    <th className={styles.tableHead}>Projected overage</th>
                    <th className={styles.tableHead}>Charge impact</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.map((row) => (
                    <tr key={row.category}>
                      <td className={styles.tableCell}>{row.category}</td>
                      <td className={styles.tableCell}>{row.included}</td>
                      <td className={styles.tableCell}>{row.used}</td>
                      <td className={styles.tableCell}>{row.projectedOverage}</td>
                      <td className={styles.tableCell}>{row.chargeImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Invoice list</h2>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={styles.invoiceRow}>
                  <span>{invoice.id}</span>
                  <span>{invoice.status}</span>
                  <span>{invoice.total}</span>
                  <span>{invoice.dueDate}</span>
                </div>
              ))}
            </article>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.panel}>
              <h2 className={styles.sectionTitle}>Entitlement and premium-feature availability</h2>
              <p className={styles.bodyText}>Premium features remain available. If a workspace is on hold, restricted write, execute, and premium actions pause while usage records and invoices remain visible.</p>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.sectionTitle}>Billing evidence drawer trigger</h2>
              <p className={styles.bodyText}>Billing evidence uses translated labels first and keeps raw lineage references behind a secondary drawer.</p>
              <button type="button" className={styles.secondaryButton}>Review Billing Details</button>
            </section>

            <section className={styles.holdCard}>
              <h2 className={styles.holdTitle}>Billing hold active</h2>
              <p className={styles.holdText}>Restricted write, execute, and premium actions are paused while payment or reconciliation issues are resolved. Usage records and invoices remain available.</p>
            </section>
          </aside>
        </section>
      </div>
    </div>
  );
}