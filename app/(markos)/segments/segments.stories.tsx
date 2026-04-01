import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Segments
 * 
 * Audience segmentation, cohort filtering, and contact grouping for targeted campaigns.
 * 
 * **Coverage:** State (loading, empty, success, error, unauthorized, forbidden) | Role (owner, operator, strategist, viewer)
 */

interface SegmentPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
}

function SegmentPage({ state, role }: SegmentPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return <div style={{ padding: "2rem" }}>Loading segment data...</div>;
      case "empty":
        return <div style={{ padding: "2rem" }}>No segments created. Create a new segment to organize your audience.</div>;
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1>Audience Segments</h1>
            <div style={{ marginTop: "1rem" }}>
              <p>Total Segments: 8</p>
              <p>Active Contacts: 12,450</p>
              {(role === "owner" || role === "operator" || role === "strategist") && (
                <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Create Segment
                </button>
              )}
            </div>
          </div>
        );
      case "error":
        return <div style={{ padding: "2rem", color: "red" }}>Failed to load segments</div>;
      case "unauthorized":
        return <div style={{ padding: "2rem" }}>Authentication required</div>;
      case "forbidden":
        return <div style={{ padding: "2rem" }}>Access denied to segment management</div>;
      default:
        return null;
    }
  };

  return <div style={{ fontFamily: "sans-serif" }}>{renderContent()}</div>;
}

const meta: Meta<SegmentPageProps> = {
  title: "Routes/Segments",
  component: SegmentPage,
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
