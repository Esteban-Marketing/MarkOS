import type { Meta, StoryObj } from '@storybook/react';
import WorkspaceNotFoundPage from './page';

// Phase 213.4 Plan 07 — NEW file per UI-SPEC F-6.
// WorkspaceNotFoundPage is an async Server Component with searchParams: Promise<...>.
// Storybook 8 resolves async components; we pass a pre-resolved Promise via args.

// Thin synchronous wrapper to adapt the async component for Storybook story args.
function StoryWrapper({ slug, reserved }: { slug?: string; reserved?: string }) {
  // @ts-expect-error — Storybook renders async RSC; searchParams prop accepts resolved Promise
  return <WorkspaceNotFoundPage searchParams={Promise.resolve({ slug, reserved })} />;
}

const meta = {
  title: '404Workspace',
  component: StoryWrapper,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { slug: 'acme', reserved: undefined },
  parameters: {
    docs: {
      description: {
        story:
          'Workspace `acme.{apex}` not yet claimed. ' +
          '.c-card--feature hero (32px radius per D-13). ' +
          '.c-button--primary "Claim this workspace" + .c-button--tertiary "Back to dashboard". ' +
          'NO [err] glyph on heading; NO red splash (D-13 + DESIGN.md "Don\'t shout").',
      },
    },
  },
};

export const Reserved: Story = {
  args: { slug: '', reserved: '1' },
  parameters: {
    docs: {
      description: {
        story:
          'Reserved subdomain — platform use only. ' +
          '.c-card--feature hero. .c-button--primary "Create a workspace". ' +
          'No secondary CTA on reserved variant per UI-SPEC F Copywriting.',
      },
    },
  },
};
