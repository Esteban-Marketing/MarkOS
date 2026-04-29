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

export const Default: Story = {
  args: {
    variant: "healthy",
    reviewCurrentInvoiceAction: noopAction,
    reviewBillingDetailsAction: noopAction,
  },
};

export const HoldState: Story = {
  args: {
    variant: "hold",
    reviewCurrentInvoiceAction: noopAction,
    reviewBillingDetailsAction: noopAction,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders the `.c-notice c-notice--warning` payment-issue banner per UI-SPEC AC B-3. Bracketed `[warn]` glyph + remediation copy.",
      },
    },
  },
};

export const InvoiceList: Story = {
  args: {
    variant: "healthy",
    reviewCurrentInvoiceAction: noopAction,
    reviewBillingDetailsAction: noopAction,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Multi-row invoice table per UI-SPEC AC B-4. Semantic `<table>` with token-cited `<th>`/`<td>` recipe (D-14).",
      },
    },
  },
};

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
