import type { ReactNode } from "react";

import { canAccess, type MarkOSRole } from "../../lib/markos/rbac/policies";

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

// Temporary role source for scaffold mode. Wire this to auth/session claims in execution hardening.
const ACTIVE_ROLE: MarkOSRole = "owner";

// Task 51-02-02: Tenant identity placeholder
// In execution hardening, this will pull from req.markosAuth.tenant_id (verified JWT claim)
const ACTIVE_TENANT_ID: string | null = null; // TODO: wire to auth context

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

  // Task 51-02-02: Fail-closed tenant context check
  // If tenant context cannot be resolved, show denial state rather than proceeding
  // This ensures protected operations never execute without explicit tenant scope
  if (!ACTIVE_TENANT_ID && process.env.NODE_ENV === 'production') {
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
        <p>UI Control Plane (Phase 37 scaffold)</p>
        {/* Task 51-02-02: Tenant context indicator for development verification */}
        {ACTIVE_TENANT_ID && (
          <p className="text-xs text-gray-500 mt-2">
            Tenant: {ACTIVE_TENANT_ID}
          </p>
        )}
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
