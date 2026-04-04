import type { ReactNode } from "react";

import { getActiveTenantContext, requireMarkosSession } from "../../lib/markos/auth/session";

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
  { href: "/markos/company", label: "Company", route: "company" },
  { href: "/markos/mir", label: "MIR", route: "mir" },
  { href: "/markos/msp", label: "MSP", route: "msp" },
  { href: "/markos/icps", label: "ICPs", route: "icps" },
  { href: "/markos/segments", label: "Segments", route: "segments" },
  { href: "/markos/campaigns", label: "Campaigns", route: "campaigns" },
  { href: "/markos/settings/theme", label: "Settings", route: "settings" },
] as const;

export default async function MarkOSLayout({ children }: Readonly<MarkOSLayoutProps>) {
  const session = await requireMarkosSession();
  const tenantContext = await getActiveTenantContext(session);

  if (!tenantContext || !tenantContext.tenantId) {
    return (
      <main>
        <section className="p-8 text-center">
          <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            Unable to establish tenant context. Please sign in again.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <aside>
        <h1>MarkOS</h1>
        <p>UI Control Plane</p>
        <p className="text-xs text-gray-500 mt-2">Tenant context: {tenantContext.tenantId}</p>
        <nav>
          <ul>
            {NAV_ITEMS.map((item) => (
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
