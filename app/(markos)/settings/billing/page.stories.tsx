import type { Meta, StoryObj } from "@storybook/react";
import { BillingSettingsPageShell } from "./page-shell";

async function noopAction(_formData: FormData) {
  return;
}

const meta = {
  title: "Routes/Settings - Billing",
  component: BillingSettingsPageShell,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof BillingSettingsPageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: {
    variant: "healthy",
    reviewCurrentInvoiceAction: noopAction,
    reviewBillingDetailsAction: noopAction,
  },
};

export const Hold: Story = {
  args: {
    variant: "hold",
    reviewCurrentInvoiceAction: noopAction,
    reviewBillingDetailsAction: noopAction,
  },
};