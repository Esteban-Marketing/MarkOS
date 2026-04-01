import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Marketing Strategy & Planning (MSP)
 * 
 * Campaign planning, strategic goals, messaging framework, and roadmap management.
 * 
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator, strategist, viewer)
 */

interface MSPPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
}

function MSPPage({ state, role }: MSPPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading strategy data...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No strategy plans found. Create a new strategy to begin.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Marketing Strategy & Planning</h1>
            <div style={{ marginTop: "1rem" }}>
              <p>Active Strategy: Q2 2026 Growth Initiative</p>
              <p>Goals: 45% MQL increase, 3.2% conversion lift</p>
              {(role === "owner" || role === "operator" || role === "strategist") && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Edit Strategy
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load strategy</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Access denied to strategy planning</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<MSPPageProps> = {
  title: "Routes/Marketing Strategy & Planning",
  component: MSPPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { state: "success", role: "strategist" },
  parameters: { role: "strategist" },
};

export const Loading: Story = {
  args: { state: "loading", role: "strategist" },
};

export const Empty: Story = {
  args: { state: "empty", role: "owner" },
  parameters: { role: "owner" },
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

export const OperatorAccess: Story = {
  args: { state: "success", role: "operator" },
  parameters: { role: "operator" },
};

export const StrategistAccess: Story = {
  args: { state: "success", role: "strategist" },
  parameters: { role: "strategist" },
};
