import type { ReactNode } from "react";

import { canAccess, type MarkOSRole } from "../../lib/markos/rbac/policies";

type MarkOSLayoutProps = {
  children: ReactNode;
};

// Temporary role source for scaffold mode. Wire this to auth/session claims in execution hardening.
const ACTIVE_ROLE: MarkOSRole = "owner";

const NAV_ITEMS = [
  { href: "/markos", label: "Dashboard", route: "dashboard" },
  { href: "/markos/operations", label: "Operations", route: "operations" },
  { href: "/markos/company", label: "Company", route: "company" },
  { href: "/markos/mir", label: "MIR", route: "mir" },
  { href: "/markos/msp", label: "MSP", route: "msp" },
  { href: "/markos/icps", label: "ICPs", route: "icps" },
  { href: "/markos/segments", label: "Segments", route: "segments" },
  { href: "/markos/campaigns", label: "Campaigns", route: "campaigns" },
  { href: "/markos/settings/theme", label: "Settings", route: "settings" },
] as const;

export default function MarkOSLayout({ children }: Readonly<MarkOSLayoutProps>) {
  const visibleNav = NAV_ITEMS.filter((item) => canAccess(ACTIVE_ROLE, item.route));

  return (
    <main>
      <aside>
        <h1>MarkOS</h1>
        <p>UI Control Plane (Phase 37 scaffold)</p>
        <nav>
          <ul>
            {visibleNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section>{children}</section>
    </main>
  );
}
