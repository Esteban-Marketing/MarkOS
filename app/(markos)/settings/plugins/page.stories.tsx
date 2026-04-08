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

export const Default: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
  },
};

export const ReviewMode: Story = {
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
};