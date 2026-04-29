import type { Meta, StoryObj } from "@storybook/react";

import AdminGovernancePage from "./page";

const meta = {
  title: "Admin/Governance",
  component: AdminGovernancePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AdminGovernancePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default identity-federation table view per UI-SPEC AC AG-3. .c-card sections + .c-badge--{success,info} decision column.",
      },
    },
  },
};

export const DeniedMapping: Story = {
  args: {
    variant: "deniedMapping",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders .c-notice c-notice--error per UI-SPEC AC AG-5. [err] glyph + denial copy. .c-badge--error decision column.",
      },
    },
  },
};

export const ExportReady: Story = {
  args: {
    variant: "exportReady",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders .c-notice c-notice--success per UI-SPEC AC AG-5. [ok] glyph + export-ready copy. .c-badge--success status column.",
      },
    },
  },
};
