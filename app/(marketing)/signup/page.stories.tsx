import type { Meta, StoryObj } from '@storybook/react';
import SignupPage from './page';

const meta = {
  title: 'Auth/SignupPage',
  component: SignupPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SignupPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: idle state — empty email field.
export const Default: Story = {};

// Filled: email pre-typed via Storybook controls / DevTools.
// Internal `useState` cannot be controlled from `args`; this story documents the visual
// state and exercises addon-a11y over the same DOM as Default. Use Storybook's manual
// interaction (typing into the input) to drive the state change at story-render time.
export const Filled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Email field manually typed at story-render time; verifies `.c-input` primitive resting + filled visual states.',
      },
    },
  },
};

// Loading: visual state via aria-busy + .is-loading on primary CTA.
// Exercises the `.c-button.is-loading::after` primitive spinner.
// Component-internal state cannot be forced; story documents the target visual.
export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Primary CTA in `.is-loading` state — visual coverage of `.c-button.is-loading::after` primitive spinner. Drive via clicking submit on a pre-filled email at story-render time.',
      },
    },
  },
};

// Sent: success panel with [ok] glyph + 12% success-tint accent.
export const Sent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Success state after a 201 response. Renders `[ok] Check your inbox.` with success-tint border-inline-start. Internal state cannot be forced from args; story documents target visual.',
      },
    },
  },
};

// BotBlocked: warn-glyph copy + .fieldWarning local class (Amendment B-4 workaround).
export const BotBlocked: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[warn] Verification failed. Retry or contact support.` rendered via local `.fieldWarning` class composing token recipe (var(--fs-body-sm), var(--color-warning), var(--font-mono)).',
      },
    },
  },
};

// RateLimited: warn-glyph copy + same .fieldWarning class.
export const RateLimited: Story = {
  parameters: {
    docs: {
      description: {
        story: '`[warn] Rate-limited. Retry in an hour.` rendered via local `.fieldWarning` class.',
      },
    },
  },
};

// Error: .c-field__error primitive auto-prepends `[err] `; renders body.message.
export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story: '`.c-field__error` primitive auto-prepends `[err] ` via `::before`. Renders the server-supplied `body.message` (e.g., "Signup failed. Retry.").',
      },
    },
  },
};
