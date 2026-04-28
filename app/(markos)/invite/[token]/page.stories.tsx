import type { Meta, StoryObj } from '@storybook/react';
import InviteAcceptPage from './page';

const meta = {
  title: 'Auth/InviteAcceptPage',
  component: InviteAcceptPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    params: { token: 'storybook-fixture-token' },
  },
} satisfies Meta<typeof InviteAcceptPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: idle state — accept button enabled.
export const Default: Story = {};

// Accepting: visual coverage of `.c-button.is-loading::after` primitive spinner.
// Drive by clicking accept on a story-render-time interaction.
export const Accepting: Story = {
  parameters: {
    docs: {
      description: {
        story: '`.c-button.is-loading` state — primitive provides spinner via `::after`. Component-internal `useState` cannot be forced from args; story documents target visual.',
      },
    },
  },
};

// Success: `[ok] Accepted. Redirecting…` button text + 800ms redirect.
export const Success: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[ok] Accepted. Redirecting…` CTA text after a 200 response. Redirect to `/tenant/{tenant_id}` fires via setTimeout — Storybook environment will not actually redirect, but the visual state is captured.',
      },
    },
  },
};

// Error: server returned a reason code; reasonCopy() prepends [err] glyph and renders inside .errorMessage notice.
export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: '`.errorMessage` notice composes `.c-card` + 4px error-tinted border-inline-start + `rgb(248 81 73 / 0.12)` 12% alpha background. Renders one of the 7 reasonCopy strings (e.g. "[err] Invite expired. Ask the person who invited you to send a fresh one."). Drive via Storybook controls or interaction by simulating a 4xx fetch response.',
      },
    },
  },
};

// ErrorEmailMismatch: invite_email_mismatch reason code variant.
export const ErrorEmailMismatch: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Email mismatch. Sign in with the address this invite was sent to, then retry.` — variant of the Error story for the invite_email_mismatch reason code.',
      },
    },
  },
};

// ErrorWithdrawn: invite_withdrawn variant.
export const ErrorWithdrawn: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Invite withdrawn.` — terse system-state phrasing.',
      },
    },
  },
};

// ErrorAlreadyAccepted: invite_already_accepted variant.
export const ErrorAlreadyAccepted: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Invite already accepted.`',
      },
    },
  },
};

// ErrorNotFound: invite_not_found variant.
export const ErrorNotFound: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Invite not found.`',
      },
    },
  },
};

// ErrorSeatQuota: seat_quota_reached variant.
export const ErrorSeatQuota: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Seat limit reached. Ask the workspace owner to free a seat.`',
      },
    },
  },
};

// ErrorAcceptFailed: default fallback variant.
export const ErrorAcceptFailed: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[err] Accept failed. Retry later.` — default fallback when reason code is unknown.',
      },
    },
  },
};
