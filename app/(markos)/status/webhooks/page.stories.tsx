import type { Meta, StoryObj } from '@storybook/react';
import StatusWebhooksPage from './page';

// Phase 213.4 Plan 06 — NEW file per UI-SPEC SW-6.
// Stories supply mock snapshot prop directly — no live fetch triggered.
// Phase 203 status state register: operational / retrying / elevated (3 states, frozen).

const meta = {
  title: 'Status/Webhooks',
  component: StatusWebhooksPage,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatusWebhooksPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock snapshot shape matches /api/public/webhooks/status Phase 203 response:
// { total_24h, success_rate, avg_latency_ms, dlq_count, last_updated }

export const Operational: Story = {
  args: {
    snapshot: {
      total_24h: 12834,
      success_rate: 0.999,
      avg_latency_ms: 122,
      dlq_count: 0,
      last_updated: '2026-04-29T12:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'success_rate >= 0.999 AND dlq_count === 0 → classifyStatus = operational. ' +
          '.c-notice c-notice--success + .c-status-dot--live + [ok] All systems operational.',
      },
    },
  },
};

export const Retrying: Story = {
  args: {
    snapshot: {
      total_24h: 8421,
      success_rate: 0.97,
      avg_latency_ms: 450,
      dlq_count: 2,
      last_updated: '2026-04-29T12:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'success_rate >= 0.95 → classifyStatus = retrying. ' +
          '.c-notice c-notice--warning + .c-status-dot (default) + [warn] Some deliveries are being retried.',
      },
    },
  },
};

export const Elevated: Story = {
  args: {
    snapshot: {
      total_24h: 4203,
      success_rate: 0.88,
      avg_latency_ms: 980,
      dlq_count: 12,
      last_updated: '2026-04-29T12:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'success_rate < 0.95 → classifyStatus = elevated. ' +
          '.c-notice c-notice--error + .c-status-dot--error + [err] Elevated failure rate. ' +
          'heroCard[data-dlq=alert] DLQ tile shows --color-error border.',
      },
    },
  },
};
