import type { Meta, StoryObj } from "@storybook/react";
import AdminBillingPage from "./page";

const meta = {
  title: 'Admin/Billing',
  component: AdminBillingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminBillingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: {
    variant: "healthy",
  },
  parameters: {
    docs: {
      description: {
        story: "Renders .c-notice c-notice--success per UI-SPEC AC AB-7. [ok] glyph + reconciled-state copy. .c-badge--success on row state.",
      },
    },
  },
};

export const HoldState: Story = {
  args: {
    variant: "hold",
  },
  parameters: {
    docs: {
      description: {
        story: "Renders .c-notice c-notice--warning per UI-SPEC AC AB-7. [warn] glyph + billing-hold copy. .c-badge--warning row states.",
      },
    },
  },
};

export const SyncFailure: Story = {
  args: {
    variant: "syncFailure",
  },
  parameters: {
    docs: {
      description: {
        story: "Renders .c-notice c-notice--error per UI-SPEC AC AB-7. [err] glyph + provider-sync-failure copy. .c-badge--warning row states + .c-button--destructive Write-off CTA.",
      },
    },
  },
};
