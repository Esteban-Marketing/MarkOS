import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Market Intelligence & Reporting (MIR)
 * 
 * Centralized dashboard for market trends, competitive intelligence, and performance metrics.
 * 
 * **Coverage Matrix:**
 * - State: loading, empty, success, error, unauthorized, forbidden
 * - Role: owner, operator, strategist, viewer
 * - Viewport: mobile, tablet, desktop
 * - Theme: default, white-label
 */

interface MIRPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
}

function MIRPage({ state, role }: MIRPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading market intelligence data...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No market data available. Start by adding competitive sources.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Market Intelligence & Reporting</h1>
            <div style={{ marginTop: "1rem" }}>
              <h2>Competitive Landscape</h2>
              <p>Market share: 23% ↑</p>
              {(role === "owner" || role === "operator") && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Update Intelligence
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load market data</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>You don't have access to market intelligence</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<MIRPageProps> = {
  title: "Routes/Market Intelligence & Reporting",
  component: MIRPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { state: "success", role: "owner" },
  parameters: { role: "owner" },
};

export const Loading: Story = {
  args: { state: "loading", role: "owner" },
  parameters: { role: "owner" },
};

export const Empty: Story = {
  args: { state: "empty", role: "strategist" },
  parameters: { role: "strategist" },
};

export const Error: Story = {
  args: { state: "error", role: "operator" },
};

export const Unauthorized: Story = {
  args: { state: "unauthorized" },
};

export const Forbidden: Story = {
  args: { state: "forbidden", role: "viewer" },
  parameters: { role: "viewer" },
};

export const OwnerAccess: Story = {
  args: { state: "success", role: "owner" },
  parameters: { role: "owner" },
};

export const ViewerAccess: Story = {
  args: { state: "success", role: "viewer" },
  parameters: { role: "viewer" },
};
