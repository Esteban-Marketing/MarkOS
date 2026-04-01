import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Ideal Customer Profiles (ICPs)
 * 
 * ICP definition, properties, targeting preferences, and matching algorithms.
 * 
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator, strategist, viewer)
 */

interface ICPPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
}

function ICPPage({ state, role }: ICPPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading ICP data...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No ICPs defined. Create your first ICP profile.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Ideal Customer Profiles</h1>
            <div style={{ marginTop: "1rem" }}>
              <p>Active ICPs: 4</p>
              <p>Enterprise (Fortune 1000) • Mid-Market (50-1000 employees) • SMB (10-50 employees) • Startup (1-10 employees)</p>
              {(role === "owner" || role === "operator" || role === "strategist") && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Add ICP
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load ICPs</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Access denied to ICP definitions</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<ICPPageProps> = {
  title: "Routes/Ideal Customer Profiles",
  component: ICPPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { state: "success", role: "owner" },
  parameters: { role: "owner" },
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
