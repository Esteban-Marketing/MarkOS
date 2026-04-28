import React from "react";

import type { Meta, StoryObj } from "@storybook/react";
import { MarkOSAccessDeniedState, MarkOSLayoutShell } from "./layout-shell";
import styles from "./layout-shell.module.css";

function LayoutStory({
  tenantId,
  denied,
}: Readonly<{
  tenantId: string;
  denied?: boolean;
}>) {
  if (denied) {
    return <MarkOSAccessDeniedState />;
  }

  return (
    <MarkOSLayoutShell tenantId={tenantId}>
      <section className={`${styles.heroCardLocal} c-card c-card--feature`}>
        <p className="t-label-caps">Milestone workspace shell</p>
        <h2>Milestone UI Shell Preview</h2>
        <p className={styles.previewTextLocal}>
          Protected MarkOS shell with resolved tenant context and milestone navigation.
        </p>
      </section>
    </MarkOSLayoutShell>
  );
}

const meta = {
  title: "Routes/MarkOS Layout",
  component: LayoutStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LayoutStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TenantResolved: Story = {
  args: {
    tenantId: "tenant-alpha-001",
    denied: false,
  },
};

export const AccessDenied: Story = {
  args: {
    tenantId: "tenant-alpha-001",
    denied: true,
  },
};
