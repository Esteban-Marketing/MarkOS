import type { Meta, StoryObj } from '@storybook/react';
import ClaudeIntegrationLanding from './page';

const meta = {
  title: '213.5/ClaudeLanding',
  component: ClaudeIntegrationLanding,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Phase 213.5 Plan-01 — Claude Marketplace landing page redesigned to DESIGN.md v1.1.0 canonical contract. Composes .c-card--feature hero (32px radius hero exception per D-15), .c-card--interactive + .c-chip-protocol per tool, .c-button c-button--primary (x2: hero + final-cta) + .c-button c-button--tertiary (Read the quickstart), .c-code-inline (MCP URL), .t-lead (hero sub). DOM + aria-labels + TOOLS array (10 MCP allow-list slugs) + copy preserved verbatim from Phase 200 baseline (voice classifier >=100).',
      },
    },
  },
} satisfies Meta<typeof ClaudeIntegrationLanding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Full landing page at desktop viewport. Hero panel (.c-card--feature, 32px radius), value-props grid, tool grid (10 tools as .c-card--interactive cards with .c-chip-protocol slugs), install section, final-cta. Mint primary CTA appears twice (hero + final-cta) — scroll-separated per L-6.',
      },
    },
  },
};

export const ToolListExpanded: Story = {
  parameters: {
    viewport: { defaultViewport: 'responsive' },
    docs: {
      description: {
        story:
          'All 10 MCP tool cards visible (no collapse). Each card composes .c-card--interactive (hover-lift via primitive) + .c-chip-protocol (slug rendered with [brackets] via primitive ::before/::after). Confirms D-21 MCP allow-list slug preservation: draft_message, plan_campaign, research_audience, run_neuro_audit, generate_brief, audit_claim, list_pain_points, rank_execution_queue, schedule_post, explain_literacy.',
      },
    },
  },
};

export const CTAFocus: Story = {
  parameters: {
    pseudo: { focusVisible: '.c-button--primary' },
    docs: {
      description: {
        story:
          'Primary CTA "Try the demo" in :focus-visible state. Demonstrates global focus ring (2px solid Protocol Mint + 2px offset per DESIGN.md non-negotiable rule 6) inherited from globals.css :focus-visible. Mint signal is the single CTA + focus color — never suppressed.',
      },
    },
  },
};

export const MobileBreakpoint: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Viewport 320px (mobile1). Hero stacks vertical, CTA row wraps (flex-wrap: wrap), tool grid collapses to 1-column (grid auto-fill minmax(200px, 1fr)). Confirms responsive token-driven layout — no scope-local media query needed.',
      },
    },
  },
};
