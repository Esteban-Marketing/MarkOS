import React, { type ReactNode } from "react";

import { getActiveTenantContext, requireMarkosSession } from "../../lib/markos/auth/session";
import styles from "./layout-shell.module.css";

type MarkOSLayoutProps = {
  children: ReactNode;
};

// Task 51-02-02: Tenant Context Propagation Contract
// ====================================================
// Protected MarkOS surfaces require deterministic tenant context resolution:
// - Tenant identity is resolved from authenticated session state only
// - Never inferred implicitly from URL, headers, or user preference
// - Tenant context is attached to all protected API requests
// - Missing or ambiguous tenant context causes visible denial state (fail-closed)

const NAV_ITEMS = [
  { href: "/markos", label: "Dashboard", route: "dashboard" },
  { href: "/markos/operations", label: "Operations", route: "operations" },
  { href: "/markos/crm", label: "CRM", route: "crm" },
  { href: "/markos/company", label: "Company", route: "company" },
  { href: "/markos/mir", label: "MIR", route: "mir" },
  { href: "/markos/msp", label: "MSP", route: "msp" },
  { href: "/markos/icps", label: "ICPs", route: "icps" },
  { href: "/markos/segments", label: "Segments", route: "segments" },
  { href: "/markos/campaigns", label: "Campaigns", route: "campaigns" },
  { href: "/markos/settings/theme", label: "Settings", route: "settings" },
] as const;

export function MarkOSAccessDeniedState() {
  return (
    <main className={styles.deniedPage}>
      <section className={styles.deniedCard}>
        <p className={styles.eyebrow}>Protected workspace route</p>
        <h1 className={styles.deniedTitle}>Access Denied</h1>
        <p className={styles.deniedText}>
          Unable to establish tenant context. Please sign in again.
        </p>
      </section>
    </main>
  );
}

export function MarkOSLayoutShell({
  tenantId,
  children,
}: Readonly<{
  tenantId: string;
  children: ReactNode;
}>) {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandLockup}>
            <h1 className={styles.brandTitle}>MarkOS</h1>
            <p className={styles.brandText}>UI Control Plane</p>
            <div className={styles.tenantPill}>
              <span className={styles.tenantLabel}>Tenant context</span>
              <span>{tenantId}</span>
            </div>
          </div>
          <nav className={styles.nav}>
            <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a className={styles.navLink} href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        </aside>
        <section className={styles.content}>{children}</section>
      </div>
    </main>
  );
}

export default async function MarkOSLayout({ children }: Readonly<MarkOSLayoutProps>) {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);

  if (!tenantContext?.tenantId) {
    return <MarkOSAccessDeniedState />;
  }

  return <MarkOSLayoutShell tenantId={tenantContext.tenantId}>{children}</MarkOSLayoutShell>;
}
