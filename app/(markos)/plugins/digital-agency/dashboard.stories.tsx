import type { Meta, StoryObj } from "@storybook/react";
import DigitalAgencyDashboardPage from "./page";

const meta = {
  title: "Routes/Plugins - Digital Agency Dashboard",
  component: DigitalAgencyDashboardPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DigitalAgencyDashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DesktopReview: Story = {
  parameters: {
    viewport: {
      defaultViewport: "responsive",
    },
  },
};