'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { descriptor, preview } = require('../../../lib/markos/mcp/tools/execution/schedule-post.cjs');
const { compileToolSchemas, getToolValidator } = require('../../../lib/markos/mcp/ajv.cjs');

test('Suite 202-06: schedule_post is MUTATING and exposes preview(args)', () => {
  assert.equal(descriptor.mutating, true);
  assert.equal(typeof descriptor.preview, 'function');
  assert.equal(typeof preview, 'function');
});

test('Suite 202-06: schedule_post preview returns { tool, channel, scheduled_at, content_preview }', () => {
  const p = preview({ channel: 'email', content: 'long content '.repeat(50), scheduled_at: '2026-04-18T12:00:00Z' });
  assert.equal(p.tool, 'schedule_post');
  assert.equal(p.channel, 'email');
  assert.equal(p.scheduled_at, '2026-04-18T12:00:00Z');
  assert.ok(p.content_preview.length <= 200);
});

test('Suite 202-06: schedule_post input schema enforces channel enum + date-time format', () => {
  compileToolSchemas({ schedule_post: { input: descriptor.inputSchema, output: descriptor.outputSchema } });
  const v = getToolValidator('schedule_post');
  assert.equal(v.validateInput({ channel: 'tiktok', content: 'x', scheduled_at: '2026-04-18T12:00:00Z' }), false);
  assert.equal(v.validateInput({ channel: 'email', content: 'x', scheduled_at: 'not-a-date' }), false);
  assert.equal(v.validateInput({ channel: 'email', content: 'x', scheduled_at: '2026-04-18T12:00:00Z' }), true);
});

test('Suite 202-06: schedule_post handler returns { post_id, channel, status:"queued", tenant_id }', async () => {
  const r = await descriptor.handler({
    args: { channel: 'email', content: 'hello', scheduled_at: '2026-04-18T12:00:00Z' },
    session: { tenant_id: 't1', user_id: 'u1' },
    supabase: null,
    deps: { enqueue: async () => ({ post_id: 'post-123', status: 'queued' }) },
  });
  const parsed = JSON.parse(r.content[0].text);
  assert.equal(parsed.post_id, 'post-123');
  assert.equal(parsed.channel, 'email');
  assert.equal(parsed.status, 'queued');
  assert.equal(parsed.tenant_id, 't1');
});
