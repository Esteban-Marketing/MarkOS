import type { Meta, StoryObj } from '@storybook/react';
import SessionsPageView from '../../_components/SessionsPageView';

const meta = {
  title: 'Settings/Sessions',
  component: SessionsPageView,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionsPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleSessions = [
  {
    session_id: 'sess_1',
    device_label: 'MacBook Pro · Chrome 120',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ip: '192.0.2.1',
    last_seen_at: '2026-04-28T10:00:00Z',
    location: 'San Francisco, US',
    is_current: true,
  },
  {
    session_id: 'sess_2',
    device_label: 'iPhone 15 · Safari 17',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    ip: '198.51.100.5',
    last_seen_at: '2026-04-27T18:30:00Z',
    location: 'New York, US',
    is_current: false,
  },
  {
    session_id: 'sess_3',
    device_label: 'Windows · Firefox 122',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    ip: '203.0.113.42',
    last_seen_at: '2026-04-26T09:15:00Z',
    location: 'London, UK',
    is_current: false,
  },
];

/**
 * Default: three sessions, current device marked with .c-status-dot--live +
 * [ok] Active now + .c-badge--success [ok] Current (AC S-2, S-3).
 */
export const Default: Story = {
  args: {
    sessions: sampleSessions,
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false,
  },
};

/**
 * RevokeConfirm: per-session revoke confirmation modal open for sess_2.
 * Shows .c-modal + .c-backdrop + .c-button--destructive "Revoke session" (AC S-3).
 */
export const RevokeConfirm: Story = {
  args: {
    sessions: sampleSessions,
    busy: null,
    toast: null,
    revokeTarget: 'sess_2',
    showRevokeAll: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Per-session revoke confirmation modal — `.c-modal` + `.c-backdrop` + `.c-button--destructive` per UI-SPEC AC S-3.',
      },
    },
  },
};

/**
 * SingleSession: only the current device present.
 * Hides revoke-all row; empty-state copy does not apply (1 session rendered).
 */
export const SingleSession: Story = {
  args: {
    sessions: [sampleSessions[0]],
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only the current session — revoke-all row hidden; no other sessions to revoke.',
      },
    },
  },
};

/**
 * Empty: sessions array is empty (edge-case defensive handling).
 * Shows "This is your only active session." empty-state copy.
 */
export const Empty: Story = {
  args: {
    sessions: [],
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case — empty sessions array renders empty-state copy "This is your only active session."',
      },
    },
  },
};
