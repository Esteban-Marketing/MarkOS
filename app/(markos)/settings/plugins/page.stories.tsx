import type { Meta, StoryObj } from "@storybook/react";
import { PluginSettingsPageShell } from "./page-shell";

async function noopAction(_formData: FormData) {
  return;
}

const meta = {
  title: "Routes/Settings - Plugins",
  component: PluginSettingsPageShell,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PluginSettingsPageShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default — plugin installed and active (no badges, no warnings). */
export const Default: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0",
  },
};

/** Installed — shows `.c-chip c-chip--mint` `[ok] Installed` badge per UI-SPEC AC P-2. */
export const Installed: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0",
  },
  parameters: {
    docs: {
      description: {
        story: "`.c-chip c-chip--mint` `[ok] Installed` badge per UI-SPEC AC P-2.",
      },
    },
  },
};

/** Disabled — shows `.c-badge c-badge--warning` `[warn] Disabled` badge per UI-SPEC AC P-2. */
export const Disabled: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: true,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0",
  },
  parameters: {
    docs: {
      description: {
        story: "`.c-badge c-badge--warning` `[warn] Disabled` badge per UI-SPEC AC P-2.",
      },
    },
  },
};

/** Updated — shows `.c-badge c-badge--info` `[info] Update available` badge per UI-SPEC AC P-2. */
export const Updated: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: true,
    compatible: true,
    minVersion: "1.0.0",
  },
  parameters: {
    docs: {
      description: {
        story: "`.c-badge c-badge--info` `[info] Update available` badge per UI-SPEC AC P-2.",
      },
    },
  },
};

/** Marketplace — incompatible plugin surfaces `.c-notice c-notice--warning` compatibility warning per UI-SPEC AC P-4. */
export const Marketplace: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v2",
    installed: false,
    disabled: false,
    updateAvailable: false,
    compatible: false,
    minVersion: "2.0.0",
  },
  parameters: {
    docs: {
      description: {
        story: "`.c-notice c-notice--warning` compatibility notice for plugins requiring a newer MarkOS version per UI-SPEC AC P-4.",
      },
    },
  },
};
