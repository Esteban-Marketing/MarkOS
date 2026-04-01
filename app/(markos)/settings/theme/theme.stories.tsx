import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Theme Settings
 * 
 * Brand customization, color palette configuration, and white-label tenant styling.
 * 
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator only)
 */

interface ThemeSettingPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator";
}

function ThemeSettingPage({ state, role }: ThemeSettingPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading theme settings...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No custom theme configured. Using default theme.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Theme Settings</h1>
            <div style={{ marginTop: "1rem" }}>
              <h2>Current Theme</h2>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ width: "50px", height: "50px", backgroundColor: "#0d9488", borderRadius: "4px", border: "2px solid #ccc" }} />
                <div style={{ width: "50px", height: "50px", backgroundColor: "#06b6d4", borderRadius: "4px", border: "2px solid #ccc" }} />
                <div style={{ width: "50px", height: "50px", backgroundColor: "#f5f7fa", borderRadius: "4px", border: "2px solid #ccc" }} />
              </div>
              <p style={{ marginTop: "1rem" }}>Primary: #0d9488 • Secondary: #06b6d4 • Canvas: #f5f7fa</p>
              {role === "owner" && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Customize Theme
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load theme settings</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Only workspace owners and operators can modify theme settings</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<ThemeSettingPageProps> = {
  title: "Routes/Settings - Theme",
  component: ThemeSettingPage,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const OwnerAccess: Story = {
  args: { state: "success", role: "owner" },
  parameters: { role: "owner" },
};

export const OperatorAccess: Story = {
  args: { state: "success", role: "operator" },
  parameters: { role: "operator" },
};

export const Loading: Story = {
  args: { state: "loading", role: "owner" },
  parameters: { role: "owner" },
};

export const Empty: Story = {
  args: { state: "empty", role: "owner" },
  parameters: { role: "owner" },
};

export const Error: Story = {
  args: { state: "error", role: "owner" },
  parameters: { role: "owner" },
};

export const Unauthorized: Story = {
  args: { state: "unauthorized" },
};

export const ViewerForbidden: Story = {
  args: { state: "forbidden" },
};
