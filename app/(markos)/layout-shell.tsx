import React, { type ReactNode } from "react";

import styles from "./layout-shell.module.css";
import RotationBannerMount from "./_components/RotationBannerMount";
import NavList from "./_components/NavList";

export function MarkOSAccessDeniedState() {
  return (
    <main className={styles.deniedPage}>
      <section className={`${styles.deniedCardLocal} c-card`}>
        <p className={`${styles.deniedEyebrow} t-label-caps`}>[err] Protected workspace route</p>
        <h1 className={styles.deniedTitleLocal}>Access Denied</h1>
        <p className={styles.deniedTextLocal}>
          Unable to establish tenant context. Sign in again.
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
        <aside className="c-sidebar">
          <div className={styles.brandLockup}>
            <h1>MarkOS</h1>
            <p className="t-lead">UI Control Plane</p>
            <div className="c-chip c-chip--mint">
              <span className={styles.tenantLabel}>tenant</span>
              <span className="c-chip-protocol">{tenantId}</span>
            </div>
          </div>
          <NavList />
        </aside>
        <section className={styles.content}>
          <RotationBannerMount />
          {children}
        </section>
      </div>
    </main>
  );
}
