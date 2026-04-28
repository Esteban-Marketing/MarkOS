'use client';

import { usePathname } from 'next/navigation';

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
  { href: "/settings/mcp", label: "MCP", route: "settings-mcp" },
  { href: "/settings/webhooks", label: "Webhooks", route: "settings-webhooks" },
] as const;

export default function NavList() {
  const pathname = usePathname();
  return (
    <nav aria-label="MarkOS primary navigation">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <a
              className="c-nav-link"
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
