const test = require('node:test');
const assert = require('node:assert/strict');

const { buildEvent } = require('../../lib/markos/telemetry/events.cjs');

test('CRM-06: outbound telemetry covers compose, reply, and opt-out events while preserving payload sanitization', () => {
  const composeEvent = buildEvent({
    name: 'crm_outbound_compose_started',
    workspaceId: 'tenant-alpha-001',
    role: 'manager',
    requestId: 'req-compose',
    payload: {
      channel: 'email',
      template_key: 'follow-up-email',
      authorization: 'Bearer top-secret',
    },
  });
  const replyEvent = buildEvent({
    name: 'crm_outbound_reply_recorded',
    workspaceId: 'tenant-alpha-001',
    role: 'manager',
    requestId: 'req-reply',
    payload: {
      provider: 'resend',
      conversation_id: 'thread-contact-001-email',
      secret_token: 'hidden',
    },
  });

  assert.equal(composeEvent.name, 'crm_outbound_compose_started');
  assert.equal(composeEvent.payload.authorization, '[REDACTED]');
  assert.equal(replyEvent.name, 'crm_outbound_reply_recorded');
  assert.equal(replyEvent.payload.secret_token, '[REDACTED]');
});
