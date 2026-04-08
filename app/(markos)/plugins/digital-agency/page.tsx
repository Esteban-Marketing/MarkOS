import React from "react";

import { defaultBrandPack, getPluginBrandContext } from "../../../../lib/markos/theme/brand-pack";

/**
 * Digital Agency plugin dashboard — tenant-branded, role-gated shell.
 * Brand tokens are resolved via getPluginBrandContext so the UI adapts
 * to the tenant's white-label configuration automatically.
 *
 * Phase 52 — Plan 03 (Task 52-03-01)
 */
export default function DigitalAgencyDashboardPage() {
  // In production this derives from the authenticated session / request headers.
  // For Phase 52 shell the default brand-pack stands in for the resolved tenant pack.
  const brandCtx = getPluginBrandContext("current-tenant", defaultBrandPack);

  return (
    <div style={{ fontFamily: "inherit", padding: "2rem", background: "#f5f7fa", minHeight: "100vh" }}>
      {/* Branded header */}
      <div
        style={{
          background: brandCtx.primaryColor,
          borderRadius: "0.75rem",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {brandCtx.logoUrl ? (
          <img
            src={brandCtx.logoUrl}
            alt={`${brandCtx.label} logo`}
            style={{ height: 40, width: "auto", borderRadius: "0.5rem" }}
          />
        ) : null}
        <div>
          <h2 style={{ margin: 0, color: brandCtx.primaryTextColor, fontSize: "1.25rem", fontWeight: 700 }}>
            Digital Agency
          </h2>
          <p style={{ margin: 0, color: brandCtx.primaryTextColor, opacity: 0.85, fontSize: "0.875rem" }}>
            Campaign workflows for {brandCtx.label}
          </p>
        </div>
      </div>

      {/* Workflow sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <DashboardCard
          title="Campaigns"
          description="View and manage active campaigns."
          accentColor={brandCtx.primaryColor}
          href="/plugins/digital-agency/campaigns"
        />
        <DashboardCard
          title="Drafts"
          description="Review pending drafts awaiting approval."
          accentColor={brandCtx.primaryColor}
          href="/plugins/digital-agency/drafts"
        />
        <DashboardCard
          title="Approvals"
          description="Grant or reject pending approval requests."
          accentColor={brandCtx.primaryColor}
          href="/plugins/digital-agency/approvals"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  accentColor,
  href,
}: {
  title: string;
  description: string;
  accentColor: string;
  href: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        textDecoration: "none",
        color: "inherit",
        borderLeft: `4px solid ${accentColor}`,
        transition: "box-shadow 0.15s",
      }}
    >
      <h3 style={{ margin: "0 0 0.4rem", fontSize: "1rem", fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "0.875rem" }}>{description}</p>
    </a>
  );
}
