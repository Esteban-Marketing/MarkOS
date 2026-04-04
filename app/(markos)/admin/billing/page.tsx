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
];

export default function AdminBillingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>Operator billing reconciliation</p>
          <h1 className={styles.title}>Reconciliation queue</h1>
          <p className={styles.heroText}>Review Billing Evidence is the primary action when a mismatch or sync failure exists. Data is sourced from {OPERATOR_RECONCILIATION_ENDPOINT} and {HOLDS_ENDPOINT}.</p>
        </section>

        <section className={styles.layoutGrid}>
          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Reconciliation queue tabs</h2>
            <div className={styles.tabList}>
              {queueTabs.map((tab, index) => (
                <div key={tab} className={index === 0 ? styles.activeTab : styles.tab}>{tab}</div>
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
                    <td className={styles.tableCell}>tenant-alpha-001</td>
                    <td className={styles.tableCell}>April 2026</td>
                    <td className={styles.tableCell}>growth-monthly</td>
                    <td className={styles.tableCell}>review</td>
                    <td className={styles.tableCell}>pending</td>
                    <td className={styles.tableCell}>failed</td>
                    <td className={styles.tableCell}>hold</td>
                    <td className={styles.tableCell}>2026-04-03T00:00:00.000Z</td>
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
          <h2 className={styles.reviewTitle}>Billing status needs review</h2>
          <p className={styles.reviewText}>We could not confirm the latest billing sync. Restricted actions stay paused until billing health is restored.</p>
        </section>
      </div>
    </div>
  );
}