import type { Meta, StoryObj } from '@storybook/react';
import ConsentCard, { type Tenant } from './ConsentCard';

const meta = {
  title: 'Auth/ConsentCard',
  component: ConsentCard,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    clientName: 'mcp-cli-claude',
    redirectUri: 'https://claude.ai/oauth/callback',
    scopeList: ['read'],
    tenants: [
      { id: 't1', name: 'Acme Corp', slug: 'acme', org_id: 'o1' },
    ],
    selectedTenantId: 't1',
    submitState: 'idle',
    invalidReason: null,
    loading: false,
    onApprove: () => {},
    onDeny: () => {},
    onTenantSelect: () => {},
  },
} satisfies Meta<typeof ConsentCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseTenant: Tenant = { id: 't1', name: 'Acme Corp', slug: 'acme', org_id: 'o1' };
const tenant2: Tenant = { id: 't2', name: 'Globex Industries', slug: 'globex', org_id: 'o2' };

// Default — single tenant, single scope, idle state.
export const Default: Story = {};

// MultiScope — single tenant, 4 scopes (read/write/plan/audit).
export const MultiScope: Story = {
  args: {
    scopeList: ['read', 'write', 'plan', 'audit'],
  },
};

// MultiTenant — fieldset radio picker (>1 tenant).
export const MultiTenant: Story = {
  args: {
    tenants: [baseTenant, tenant2],
    selectedTenantId: '', // none picked yet — exercises approve-disabled + helper text
    scopeList: ['read', 'write'],
  },
};

// Loading — initial fetch state (params not yet parsed).
export const Loading: Story = {
  args: {
    loading: true,
  },
};

// Approving — primary CTA in .is-loading state.
export const Approving: Story = {
  args: {
    submitState: 'approving',
  },
};

// Declined — destructive CTA in .is-loading state.
export const Declined: Story = {
  args: {
    submitState: 'denying',
  },
};

// InvalidExpired — server-side challenge-method validation failed.
export const InvalidExpired: Story = {
  args: {
    invalidReason: '[err] Consent request expired. Start the OAuth flow again from your client.',
  },
};

// InvalidMissingFields — required URL params missing.
export const InvalidMissingFields: Story = {
  args: {
    invalidReason:
      '[err] Consent request missing required fields. Start the OAuth flow again from your client.',
  },
};

// InvalidRedirectUri — deny path failed to construct redirect URL.
export const InvalidRedirectUri: Story = {
  args: {
    invalidReason: '[err] Invalid redirect_uri. Cannot return to the MCP client.',
  },
};
