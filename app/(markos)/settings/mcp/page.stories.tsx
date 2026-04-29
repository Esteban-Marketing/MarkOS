import type { Meta, StoryObj } from '@storybook/react';
import { MCPPageView } from './page';

// Phase 213.3 Plan 06: Storybook CSF3 state coverage for /settings/mcp.
// 5 named state exports per UI-SPEC X-4 line 582.
// Uses MCPPageView (D-15 presentational extraction) — no live fetch calls.

const meta = {
  title: 'Settings/MCP',
  component: MCPPageView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MCPPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleServer = {
  id: 'mcp_1',
  name: 'claim-audit',
  status: 'connected' as const,
  costPct: 35,
  tools: [
    { id: 'read', cost: '$0.02/call' },
    { id: 'write', cost: '$0.05/call' },
  ],
  apiKey: 'mk_xxx_•1234',
};

/** Default: single connected server, 35% cost meter (.meterFill default success state) */
export const Default: Story = {
  args: {
    servers: [sampleServer],
    costBudget: { used: 35, limit: 100, resetIn: '7 days' },
  },
};

/** KeyRotation: .c-notice c-notice--info key-rotation banner per UI-SPEC AC MC-3 */
export const KeyRotation: Story = {
  args: {
    servers: [{ ...sampleServer }],
    costBudget: { used: 35, limit: 100, resetIn: '7 days' },
    keyRotationInProgress: true,
    rotationDeadline: '2026-04-29T10:00:00Z',
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-notice c-notice--info` key-rotation banner per UI-SPEC AC MC-3.',
      },
    },
  },
};

/** CostMeterWarning: .meterFill--warning (>=70%) + .c-notice c-notice--warning per UI-SPEC AC MC-2/MC-3 */
export const CostMeterWarning: Story = {
  args: {
    servers: [{ ...sampleServer, costPct: 75 }],
    costBudget: { used: 75, limit: 100, resetIn: '3 days' },
  },
  parameters: {
    docs: {
      description: {
        story: '`.meterFill--warning` state + `.c-notice c-notice--warning` cost-approaching notice per UI-SPEC AC MC-2/MC-3.',
      },
    },
  },
};

/** ToolList: multi-tool server — .c-chip-protocol per tool ID + per-tool cost row */
export const ToolList: Story = {
  args: {
    servers: [
      {
        ...sampleServer,
        tools: [
          { id: 'claim_audit', cost: '$0.02/call' },
          { id: 'evidence_lookup', cost: '$0.01/call' },
          { id: 'pricing_query', cost: '$0.05/call' },
          { id: 'webhook_replay', cost: '$0.03/call' },
          { id: 'session_revoke', cost: '$0.00/call' },
        ],
      },
    ],
    costBudget: { used: 35, limit: 100, resetIn: '7 days' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-tool server with `.c-chip-protocol` per tool ID + per-tool cost row.',
      },
    },
  },
};

/** Empty: no servers configured — empty state copy per UI-SPEC + .c-button--primary "Add server" CTA */
export const Empty: Story = {
  args: {
    servers: [],
    costBudget: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state: "No MCP servers configured. Add a server to connect AI agents to external tools."',
      },
    },
  },
};
