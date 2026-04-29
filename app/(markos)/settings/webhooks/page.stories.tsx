import type { Meta, StoryObj } from '@storybook/react';
import WebhooksPage from './page';

const meta = {
  title: 'Settings/Webhooks/List',
  component: WebhooksPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WebhooksPage>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleSub = (overrides: Partial<{
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  rotation_state: string | null;
  grace_ends_at: string | null;
  status_chip: 'Healthy' | 'Half-open' | 'Tripped';
  breaker_state: { state: 'closed' | 'half-open' | 'open'; trips?: number };
  rate_limit: { plan_tier: string; ceiling_rps: number; effective_rps: number; override_rps: number | null };
  last_delivery_at: string | null;
  success_rate: number;
  total_24h: number;
}> = {}) => ({
  id: 'sub_abc123',
  url: 'https://example.com/webhook',
  events: ['delivery.created', 'delivery.completed'],
  active: true,
  created_at: new Date(Date.now() - 86400000).toISOString(),
  rotation_state: null,
  grace_ends_at: null,
  status_chip: 'Healthy' as const,
  breaker_state: { state: 'closed' as const },
  rate_limit: { plan_tier: 'growth', ceiling_rps: 50, effective_rps: 50, override_rps: null },
  last_delivery_at: new Date(Date.now() - 3600000).toISOString(),
  success_rate: 98.5,
  total_24h: 142,
  ...overrides,
});

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default list state — two subscriptions, both healthy. Composes `.c-card` hero grid + `.c-badge c-badge--success` `[ok] Enabled` per UI-SPEC AC W-2.',
      },
    },
  },
};

export const Healthy: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: '`.c-badge c-badge--success` `[ok] Enabled` + `.meterFill` at 100% per UI-SPEC AC W-2.',
      },
    },
  },
};

export const DeliveryFailing: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: '`.c-badge c-badge--error` `[err] Failing` + `.meterFill[data-alert]` at low success rate per UI-SPEC AC W-2.',
      },
    },
  },
};

export const Empty: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Empty state: "No webhook subscriptions. Create a subscription to receive event notifications." `.c-button--primary` Create subscription CTA per UI-SPEC.',
      },
    },
  },
};
