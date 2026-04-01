import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { canAccess, canPublish, type MarkOSRole } from "./policies";

/**
 * Role-Based Access Control (RBAC)
 * 
 * Role permission matrix and access control scenarios for governance validation.
 * 
 * **Coverage:** All 5 roles (owner, operator, strategist, viewer, agent) across 8 routes
 */

interface RBACMatrixProps {
  role?: MarkOSRole;
}

function RBACMatrix({ role = "viewer" }: RBACMatrixProps) {
  const roles: MarkOSRole[] = ["owner", "operator", "strategist", "viewer", "agent"];
  const routes = ["dashboard", "company", "mir", "msp", "icps", "segments", "campaigns", "settings"] as const;

  const getRoleLabel = (r: MarkOSRole) => {
    const labels: Record<MarkOSRole, string> = {
      owner: "Owner",
      operator: "Operator",
      strategist: "Strategist",
      viewer: "Viewer",
      agent: "Agent",
    };
    return labels[r];
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Role-Based Access Control Matrix</h1>
      <div style={{ marginTop: "2rem", overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #d1d5db", fontWeight: "bold" }}>Role</th>
              {routes.map((route) => (
                <th key={route} style={{ padding: "0.75rem", textAlign: "center", border: "1px solid #d1d5db", fontWeight: "bold" }}>
                  {route}
                </th>
              ))}
              <th style={{ padding: "0.75rem", textAlign: "center", border: "1px solid #d1d5db", fontWeight: "bold" }}>Publish</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r} style={{ backgroundColor: r === role ? "#eff6ff" : "white" }}>
                <td style={{ padding: "0.75rem", border: "1px solid #d1d5db", fontWeight: r === role ? "bold" : "normal" }}>
                  {getRoleLabel(r)}
                </td>
                {routes.map((route) => {
                  const hasAccess = canAccess(r, route);
                  return (
                    <td
                      key={`${r}-${route}`}
                      style={{
                        padding: "0.75rem",
                        textAlign: "center",
                        border: "1px solid #d1d5db",
                        backgroundColor: hasAccess ? "#d1fae5" : "#fee2e2",
                      }}
                    >
                      {hasAccess ? "✓" : "✗"}
                    </td>
                  );
                })}
                <td
                  style={{
                    padding: "0.75rem",
                    textAlign: "center",
                    border: "1px solid #d1d5db",
                    backgroundColor: canPublish(r) ? "#d1fae5" : "#fee2e2",
                  }}
                >
                  {canPublish(r) ? "✓" : "✗"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#666" }}>
        <p>
          <strong>Permission Rules:</strong>
        </p>
        <ul style={{ marginLeft: "1rem" }}>
          <li>All roles can access dashboard</li>
          <li>Settings restricted to owner and operator only</li>
          <li>Viewers are read-only across all accessible routes</li>
          <li>Publish permissions limited to owner, operator, and strategist</li>
        </ul>
      </div>
    </div>
  );
}

const meta: Meta<RBACMatrixProps> = {
  title: "Foundation/RBAC Policies",
  component: RBACMatrix,
  parameters: { layout: "fullscreen" },
  argTypes: {
    role: {
      control: "select",
      options: ["owner", "operator", "strategist", "viewer", "agent"],
      description: "Role to highlight access matrix for",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const FullMatrix: Story = {
  args: { role: "viewer" },
};

export const OwnerPerspective: Story = {
  args: { role: "owner" },
  parameters: { role: "owner" },
};

export const OperatorPerspective: Story = {
  args: { role: "operator" },
  parameters: { role: "operator" },
};

export const StrategistPerspective: Story = {
  args: { role: "strategist" },
  parameters: { role: "strategist" },
};

export const ViewerPerspective: Story = {
  args: { role: "viewer" },
  parameters: { role: "viewer" },
};

export const AgentPerspective: Story = {
  args: { role: "agent" },
};
