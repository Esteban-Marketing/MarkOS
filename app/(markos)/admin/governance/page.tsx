import React from "react";

import styles from "./page.module.css";

const GOVERNANCE_EVIDENCE_ENDPOINT = "/api/governance/evidence";
const GOVERNANCE_VENDOR_ENDPOINT = "/api/governance/vendor-inventory";

const sections = ["Identity Federation", "Access Reviews", "Retention and Export", "Vendor Inventory"];

export type GovernanceAdminPageVariant = "default" | "deniedMapping" | "exportReady";

type GovernanceAdminPageProps = Readonly<{
  variant?: GovernanceAdminPageVariant;
}>;

export default function GovernanceAdminPage({
  variant = "default",
}: GovernanceAdminPageProps) {
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

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>Governance administration</p>
          <h1 className={styles.title}>{heroTitle}</h1>
          <p className={styles.heroText}>{heroText}</p>
        </section>

        <section className={styles.layoutGrid}>
          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Sections</h2>
            <div className={styles.sectionList}>
              {sections.map((section, index) => (
                <div key={section} className={index === activeSectionIndex ? styles.activeSection : styles.sectionItem}>{section}</div>
              ))}
            </div>
          </aside>

          <main className={styles.mainColumn}>
            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Identity Federation</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Tenant</th>
                    <th className={styles.tableHead}>Provider</th>
                    <th className={styles.tableHead}>Source claim or group</th>
                    <th className={styles.tableHead}>Mapped canonical role</th>
                    <th className={styles.tableHead}>Decision</th>
                    <th className={styles.tableHead}>Actor or subject</th>
                    <th className={styles.tableHead}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>tenant-alpha-001</td>
                    <td className={styles.tableCell}>sso-provider-acme</td>
                    <td className={styles.tableCell}>markos-super-admin</td>
                    <td className={styles.tableCell}>null</td>
                    <td className={styles.tableCell}>denied</td>
                    <td className={styles.tableCell}>user-identity-001</td>
                    <td className={styles.tableCell}>2026-04-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Access Reviews</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Tenant</th>
                    <th className={styles.tableHead}>Review scope</th>
                    <th className={styles.tableHead}>Last completed</th>
                    <th className={styles.tableHead}>Owner</th>
                    <th className={styles.tableHead}>Findings status</th>
                    <th className={styles.tableHead}>Next review due</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>tenant-alpha-001</td>
                    <td className={styles.tableCell}>billing_and_identity_admins</td>
                    <td className={styles.tableCell}>2026-04-03T00:00:00.000Z</td>
                    <td className={styles.tableCell}>owner-1</td>
                    <td className={styles.tableCell}>ready</td>
                    <td className={styles.tableCell}>2026-05-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Retention and Export</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Evidence type</th>
                    <th className={styles.tableHead}>Requested at</th>
                    <th className={styles.tableHead}>Status</th>
                    <th className={styles.tableHead}>Retention window</th>
                    <th className={styles.tableHead}>Export availability</th>
                    <th className={styles.tableHead}>Last actor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>billing_and_identity_controls</td>
                    <td className={styles.tableCell}>2026-04-03T00:00:00.000Z</td>
                    <td className={styles.tableCell}>ready</td>
                    <td className={styles.tableCell}>P12M</td>
                    <td className={styles.tableCell}>ready</td>
                    <td className={styles.tableCell}>owner-1</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className={styles.panel}>
              <h2 className={styles.sectionTitle}>Vendor Inventory</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.tableHead}>Vendor</th>
                    <th className={styles.tableHead}>Function</th>
                    <th className={styles.tableHead}>Data classes touched</th>
                    <th className={styles.tableHead}>Region or residency note</th>
                    <th className={styles.tableHead}>Status</th>
                    <th className={styles.tableHead}>Last review</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.tableCell}>OpenAI</td>
                    <td className={styles.tableCell}>AI provider</td>
                    <td className={styles.tableCell}>Prompt, completion, telemetry</td>
                    <td className={styles.tableCell}>US service boundary</td>
                    <td className={styles.tableCell}>ready</td>
                    <td className={styles.tableCell}>2026-04-03T00:00:00.000Z</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </main>

          <aside className={styles.panel}>
            <h2 className={styles.sectionTitle}>Detail rail</h2>
            <div className={styles.detailCard}>
              <h3 className={styles.detailTitle}>{detailTitle}</h3>
              {detailLines.map((line) => (
                <p key={line} className={styles.detailText}>{line}</p>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}