import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Campaigns
 * 
 * Campaign execution, workflow orchestration, performance tracking, and asset management.
 * 
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator, strategist, viewer)
 */

interface CampaignPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
}

function CampaignPage({ state, role }: CampaignPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading campaign data...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No campaigns created. Start your first campaign.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Campaigns</h1>
            <div style={{ marginTop: "1rem" }}>
              <p>Active Campaigns: 3</p>
              <p>Q2 Growth Initiative • Spring Email Series • Product Launch 2026</p>
              <p>Performance: 2.8% CTR, 18,500 impressions</p>
              {(role === "owner" || role === "operator" || role === "strategist") && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Create Campaign
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load campaigns</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Access denied to campaign management</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<CampaignPageProps> = {
  title: "Routes/Campaigns",
  component: CampaignPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { state: "success", role: "operator" },
  parameters: { role: "operator" },
};

export const Loading: Story = {
  args: { state: "loading" },
};

export const Empty: Story = {
  args: { state: "empty", role: "strategist" },
  parameters: { role: "strategist" },
};

export const Error: Story = {
  args: { state: "error" },
};

export const Unauthorized: Story = {
  args: { state: "unauthorized" },
};

export const Forbidden: Story = {
  args: { state: "forbidden", role: "viewer" },
  parameters: { role: "viewer" },
};
