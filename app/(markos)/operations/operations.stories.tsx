import type { Meta, StoryObj } from "@storybook/react";
import MarkOSOperationsPage from "./page";

const meta = {
  title: "Operations/Dashboard",
  component: MarkOSOperationsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MarkOSOperationsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccessDenied: Story = {
  args: {
    authOverride: {
      iamRole: "readonly",
      isAuthorized: false,
    },
  },
};

export const ManagerAccess: Story = {
  args: {
    authOverride: {
      iamRole: "manager",
      isAuthorized: true,
    },
  },
};

export const Authorized: Story = {
  args: {
    authOverride: { iamRole: "owner", isAuthorized: true, canAccess: true },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Authorized operator view per UI-SPEC AC O-4. .c-card hero + .c-badge--success + .c-status-dot--live + [ok] Authorized + .c-button--primary CTA.",
      },
    },
  },
};

export const Denied: Story = {
  args: {
    authOverride: { iamRole: "readonly", isAuthorized: false, canAccess: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Denied operator view per UI-SPEC AC O-5. .c-notice c-notice--error + [err] glyph + remediation copy. .c-badge--error + .c-status-dot--error.",
      },
    },
  },
};
