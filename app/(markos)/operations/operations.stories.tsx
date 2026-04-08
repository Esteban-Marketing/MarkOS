import type { Meta, StoryObj } from "@storybook/react";
import MarkOSOperationsPage from "./page";

const meta = {
  title: "Routes/Operations",
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