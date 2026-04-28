import type { Meta, StoryObj } from "@storybook/react";
import RotationGraceBanner, { type Rotation } from "./RotationGraceBanner";

const meta = {
  title: "Components/RotationGraceBanner",
  component: RotationGraceBanner,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof RotationGraceBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseRotation: Rotation = {
  id: "r1",
  subscription_id: "sub-001",
  url: "https://example.com/webhook",
  grace_ends_at: "2026-04-28T12:00:00Z",
  stage: "t-7",
};

export const Empty: Story = {
  args: { rotations: [] },
};

export const T7Warning: Story = {
  args: { rotations: [{ ...baseRotation, stage: "t-7" }] },
};

export const T1Warning: Story = {
  args: { rotations: [{ ...baseRotation, stage: "t-1" }] },
};

export const T0Error: Story = {
  args: { rotations: [{ ...baseRotation, stage: "t-0" }] },
};

export const MultiWarning: Story = {
  args: {
    rotations: [
      { ...baseRotation, id: "r1", stage: "t-7" },
      { ...baseRotation, id: "r2", subscription_id: "sub-002", stage: "t-1" },
    ],
  },
};
