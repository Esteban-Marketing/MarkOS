import type { Meta, StoryObj } from '@storybook/react';
import WebhookDetailPage from './page';

const meta = {
  title: 'Settings/Webhooks/Detail',
  component: WebhookDetailPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WebhookDetailPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    params: { sub_id: 'sub_abc123' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Default detail state — healthy subscription, idle rotation, no DLQ entries. Breadcrumb + `.c-chip-protocol` subId heading + `.c-badge c-badge--success` `[ok] Enabled`.',
      },
    },
  },
};

export const SigningRotation: Story = {
  args: {
    params: { sub_id: 'sub_abc123' },
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-notice c-notice--info` T-7 rotation banner per UI-SPEC AC W-3. Secret rotation in progress — previous secret valid for 30 days.',
      },
    },
  },
};

export const DLQReplay: Story = {
  args: {
    params: { sub_id: 'sub_abc123' },
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-notice c-notice--error` DLQ banner + delivery rows with `.c-badge--error` `[err] Failed` and `.c-badge--warning` `[warn] Retry` per UI-SPEC AC W-3. `.c-button--secondary` Replay actions per row.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    params: { sub_id: 'sub_abc123' },
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-badge c-badge--warning` `[warn] Disabled` subscription status. Disable-confirm `.c-modal` + `.c-backdrop` per UI-SPEC AC W-4.',
      },
    },
  },
};

export const Failing: Story = {
  args: {
    params: { sub_id: 'sub_abc123' },
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-badge c-badge--error` `[err] Failing` subscription status + repeated delivery failure rows. `.c-button--destructive` Disable subscription per UI-SPEC AC W-4.',
      },
    },
  },
};
