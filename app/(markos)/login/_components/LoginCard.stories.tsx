import type { Meta, StoryObj } from '@storybook/react';
import LoginCard from './LoginCard';

const meta = {
  title: 'Auth/LoginCard',
  component: LoginCard,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof LoginCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null,
  },
};

export const Filled: Story = {
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Email field pre-filled state via Storybook controls.',
      },
    },
  },
};

export const Branded: Story = {
  args: {
    useTenantChrome: true,
    displayName: 'Acme Corp',
    logo: 'https://placehold.co/240x64/0A0E14/00D9A3?text=ACME',
  },
};

export const ErrorState: Story = {
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with `aria-invalid="true"` on the email input — drives `.c-input` primitive error styling. Toggle aria-invalid via DevTools or use Storybook controls to verify the [err] glyph rendering on the c-field__error primitive.',
      },
    },
  },
};
