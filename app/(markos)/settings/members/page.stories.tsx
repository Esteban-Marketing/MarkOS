import type { Meta, StoryObj } from '@storybook/react';
import { MembersPageView } from '../../_components/MembersPageView';

const TENANT_ROLE_OPTIONS = [
  { value: 'tenant-admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'readonly', label: 'Read-only' },
];

const NOOP = () => {};
const NOOP_FORM = (e: React.FormEvent) => { e.preventDefault(); };

const sampleMembers = [
  {
    id: '1',
    user_id: 'usr_1',
    email: 'ada@example.com',
    iam_role: 'owner',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'usr_2',
    email: 'alan@example.com',
    iam_role: 'tenant-admin',
    created_at: '2026-02-14T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'usr_3',
    email: 'grace@example.com',
    iam_role: 'contributor',
    created_at: '2026-03-01T00:00:00Z',
  },
];

const baseArgs = {
  tenantRoleOptions: TENANT_ROLE_OPTIONS,
  toast: null,
  inviteBusy: false,
  inviteEmail: '',
  inviteRole: 'contributor',
  showRemoveConfirm: false,
  memberToRemove: null,
  onInviteEmailChange: NOOP,
  onInviteRoleChange: NOOP,
  onSendInvite: NOOP_FORM,
  onRequestRemove: NOOP,
  onConfirmRemove: NOOP,
  onCancelRemove: NOOP,
};

const meta = {
  title: 'Settings/Members',
  component: MembersPageView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof MembersPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default: 3 active members, 3 of 10 seats used — `.meterFill` at success (green) state (<70%). */
export const Default: Story = {
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [],
    seatUsage: { used: 3, quota: 10 },
  },
};

/** Filled: 8 of 10 seats used — `.meterFill--warning` state (70–90% per UI-SPEC AC M-2). */
export const Filled: Story = {
  args: {
    ...baseArgs,
    members: [
      ...sampleMembers,
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 4}`,
        user_id: `usr_${i + 4}`,
        email: `member${i + 4}@example.com`,
        iam_role: i === 0 ? 'tenant-admin' : 'contributor',
        created_at: '2026-03-15T00:00:00Z',
      })),
    ],
    pendingInvites: [],
    seatUsage: { used: 8, quota: 10 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Seat bar at 80% — `.meterFill--warning` state per UI-SPEC AC M-2. Table shows 8 members.',
      },
    },
  },
};

/** InvitePending: `.c-notice c-notice--info` banner + pending invite table row with `.c-badge--info` glyph (M-3, M-4). */
export const InvitePending: Story = {
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [
      {
        token: 'inv_abc123',
        email: 'pending@example.com',
        tenant_role: 'contributor',
        invited_by: 'ada@example.com',
        created_at: '2026-04-25T00:00:00Z',
        expires_at: '2026-05-02T00:00:00Z',
      },
    ],
    seatUsage: { used: 4, quota: 10 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Renders `.c-notice c-notice--info` with `[info]` glyph (M-3) and `.c-badge c-badge--info` `[info] Pending` in the pending invite row (M-4).',
      },
    },
  },
};

/** RoleEdit: shows how the role select `.c-input` renders in the invite form; seat bar at error state (>=90%). */
export const RoleEdit: Story = {
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [],
    seatUsage: { used: 9, quota: 10 },
    inviteRole: 'tenant-admin',
    inviteEmail: 'newmember@example.com',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Invite form pre-filled with role "tenant-admin" selected — `.c-input` (select variant) composition. Seat bar at 90% triggers `.meterFill--error` state.',
      },
    },
  },
};

/** Empty: no members loaded yet — empty state copy + loading-free initial render. */
export const Empty: Story = {
  args: {
    ...baseArgs,
    members: [],
    pendingInvites: [],
    seatUsage: { used: 0, quota: 10 },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state: "No members yet. Invite your first team member to get started." — per UI-SPEC Copywriting Contract.',
      },
    },
  },
};
