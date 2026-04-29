import type { Meta, StoryObj } from '@storybook/react';
import { DomainPageView } from './page';

const meta = {
  title: 'Settings/Domain',
  component: DomainPageView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DomainPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseDomain = [
  { domain: 'acme.markos.run', status: 'verified', verified_at: '2026-04-01T00:00:00Z', vanity_login_enabled: false },
];

const noop = () => undefined;
const noopAsync = async (_e: React.FormEvent) => undefined;

const baseArgs = {
  domains: [],
  loading: false,
  addInput: '',
  toast: null,
  branding: null,
  brandBusy: false,
  rotationDeadline: null,
  onAddInputChange: (_val: string) => undefined,
  onAddDomain: noopAsync,
  onRemoveDomain: (_domain: string) => undefined,
  onSaveBranding: noop,
  onBrandingChange: noop,
};

/** Default: no domain added yet — shows add-domain form (c-field + c-input + c-button--primary) */
export const Default: Story = {
  args: {
    ...baseArgs,
    dnsState: 'idle',
  },
};

/** Pending: domain added, DNS verification in progress — c-notice c-notice--info + c-status-dot (default) + [info] + [warn] glyphs (AC D-3) */
export const Pending: Story = {
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'pending',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders `.c-notice c-notice--info` + `.c-status-dot` (default) + `[info] DNS verification pending` per UI-SPEC AC D-3.',
      },
    },
  },
};

/** Verified: DNS confirmed — c-notice c-notice--success + c-status-dot--live + [ok] glyphs (AC D-3) */
export const Verified: Story = {
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'verified',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders `.c-notice c-notice--success` + `.c-status-dot--live` + `[ok] Verified` per UI-SPEC AC D-3.',
      },
    },
  },
};

/** RotationGrace: both old and new domains active — c-notice c-notice--warning + c-button--tertiary Resolve now (AC D-4) */
export const RotationGrace: Story = {
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'rotating',
    rotationDeadline: '2026-05-15',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders `.c-notice c-notice--warning` + `.c-button c-button--tertiary` "Resolve now" per UI-SPEC AC D-4.',
      },
    },
  },
};

/** Failed: CNAME not found — c-notice c-notice--error + c-status-dot--error + [err] glyphs (AC D-3) */
export const Failed: Story = {
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'failed',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders `.c-notice c-notice--error` + `.c-status-dot--error` + `[err] Failed` per UI-SPEC AC D-3.',
      },
    },
  },
};
