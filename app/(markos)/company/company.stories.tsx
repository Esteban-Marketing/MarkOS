import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

/**
 * Company Profile Management
 * 
 * This module handles company metadata, branding configuration, and organizational settings.
 * 
 * **Coverage Matrix:**
 * - State: loading, empty, success, error, unauthorized, forbidden
 * - Role: owner, operator, strategist, viewer
 * - Viewport: mobile, tablet, desktop
 * - Theme: default, white-label
 * - Interaction: create, edit, delete, publish
 */

interface CompanyProfile {
  id: string;
  name: string;
  domain: string;
  description: string;
  logo?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedBy?: {
    name: string;
    email: string;
  };
}

interface CompanyPageProps {
  state: "loading" | "empty" | "success" | "error" | "unauthorized" | "forbidden";
  role?: "owner" | "operator" | "strategist" | "viewer";
  theme?: "default" | "white-label";
  viewport?: "mobile" | "tablet" | "desktop";
  data?: CompanyProfile | null;
  error?: string;
}

/**
 * Placeholder Company Page Implementation
 * Stories validate UI contract adherence, not functional implementation.
 */
function CompanyPage({ state, role, data, error }: CompanyPageProps) {
  const renderContent = () => {
    switch (state) {
      case "loading":
        return (
          <div style={{ padding: "2rem" }}>
            <div style={{ animation: "pulse 2s infinite", background: "#ddd", height: "2rem", borderRadius: "4px", marginBottom: "1rem" }} />
            <div style={{ animation: "pulse 2s infinite", background: "#ddd", height: "1rem", borderRadius: "4px", width: "80%" }} />
          </div>
        );
      case "empty":
        return (
          <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
            <p>No company profile found. Create one to get started.</p>
            <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Create Company Profile
            </button>
          </div>
        );
      case "success":
        return (
          <div style={{ padding: "2rem" }}>
            <h1 style={{ marginBottom: "1rem" }}>{data?.name}</h1>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Domain:</strong> {data?.domain}</p>
              <p><strong>Status:</strong> {data?.status}</p>
              <p><strong>Last Updated:</strong> {data?.updatedBy?.name} ({data?.updatedBy?.email})</p>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {(role === "owner" || role === "operator" || role === "strategist") && (
                <>
                  <button style={{ marginRight: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "#0d9488", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Edit
                  </button>
                  {role === "owner" && (
                    <button style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      case "error":
        return (
          <div style={{ padding: "2rem", backgroundColor: "#fee2e2", borderRadius: "4px", color: "#991b1b" }}>
            <p><strong>Error:</strong> {error || "Failed to load company profile"}</p>
            <button style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        );
      case "unauthorized":
        return (
          <div style={{ padding: "2rem", backgroundColor: "#fef3c7", borderRadius: "4px", color: "#92400e" }}>
            <p><strong>Authentication Required</strong></p>
            <p>You must log in to view this page.</p>
          </div>
        );
      case "forbidden":
        return (
          <div style={{ padding: "2rem", backgroundColor: "#f3e8ff", borderRadius: "4px", color: "#6b21a8" }}>
            <p><strong>Access Denied</strong></p>
            <p>You don't have permission to view this page.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h2>Company Profile</h2>
      {renderContent()}
    </div>
  );
}

const meta: Meta<CompanyPageProps> = {
  title: "Routes/Company Profile",
  component: CompanyPage,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "desktop",
    },
  },
  argTypes: {
    state: {
      control: "select",
      options: ["loading", "empty", "success", "error", "unauthorized", "forbidden"],
      description: "Page state indicating data loading or error conditions",
    },
    role: {
      control: "select",
      options: ["owner", "operator", "strategist", "viewer"],
      description: "User role determines feature access and button visibility",
    },
    theme: {
      control: "select",
      options: ["default", "white-label"],
      description: "Theme variant for visual consistency validation",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// State Scenarios
// ============================================================================

export const Success: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com",
      },
    },
  },
  parameters: {
    role: "owner",
    theme: "default",
  },
};

export const Loading: Story = {
  args: {
    state: "loading",
    role: "owner",
  },
  parameters: {
    role: "owner",
  },
};

export const Empty: Story = {
  args: {
    state: "empty",
    role: "owner",
  },
  parameters: {
    role: "owner",
  },
};

export const Error: Story = {
  args: {
    state: "error",
    role: "owner",
    error: "Failed to load company profile. Please try again later.",
  },
  parameters: {
    role: "owner",
  },
};

export const Unauthorized: Story = {
  args: {
    state: "unauthorized",
  },
};

export const Forbidden: Story = {
  args: {
    state: "forbidden",
    role: "viewer",
  },
  parameters: {
    role: "viewer",
  },
};

// ============================================================================
// Role Scenarios
// ============================================================================

export const OwnerAccess: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
  },
};

export const OperatorAccess: Story = {
  args: {
    state: "success",
    role: "operator",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "operator",
  },
};

export const StrategistAccess: Story = {
  args: {
    state: "success",
    role: "strategist",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "strategist",
  },
};

export const ViewerAccess: Story = {
  args: {
    state: "success",
    role: "viewer",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "viewer",
  },
};

// ============================================================================
// Theme Scenarios
// ============================================================================

export const DefaultTheme: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
    theme: "default",
  },
};

export const WhiteLabelTheme: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
    theme: "white-label",
  },
};

// ============================================================================
// Viewport Scenarios
// ============================================================================

export const MobileViewport: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
    viewport: "mobile",
  },
};

export const TabletViewport: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
    viewport: "tablet",
  },
};

export const DesktopViewport: Story = {
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: { name: "Sarah Chen", email: "sarah@acme.com" },
    },
  },
  parameters: {
    role: "owner",
    viewport: "desktop",
  },
};
