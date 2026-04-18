'use strict';

// Phase 203 Plan 06 Task 1 — Rotation notification library.
//
// Daily cron at 04:00 UTC sweeps active signing-secret rotations, identifies
// those at T-7 / T-1 / T-0 via computeStage(grace_ends_at), fetches tenant
// admins (role IN 'owner','admin' from markos_tenant_memberships), emails
// them via Resend (reuses Plan 202-10 RESEND_API_KEY + console-log dry-run
// fallback), dedups via Redis SET NX EX key so each rotation+stage emits
// exactly one email, emits one audit row per successful send.
//
// Purpose: D-11 locks "notifications at T-7 + T-1 + T-0 via email + dashboard
// banner during grace." Plan 203-05 ships the rotation state + API; this plan
// ships the cron that actually sends the notifications.
//
// Security:
//   T-203-06-01 (Information Disclosure): recipients filter role IN
//     ('owner','admin') + tenant_id match — prevents leaking rotation events
//     to cross-tenant or non-admin accounts.
//   T-203-06-02 (Tampering): Redis SET NX EX 90d keyed rotation_id:stage —
//     exactly-once per stage transition regardless of cron replays.
//   T-203-06-05 (Repudiation): enqueueAuditStaging emits
//     source_domain='webhooks' action='secret.rotation_notified' per send.
//
// Dependency on Plan 203-05 rotation.cjs:
//   We soft-require rotation.cjs computeStage — if absent (203-05 still in
//   flight), we fall back to an inline implementation matching the same
//   spec ('t-7' when 2 < days <= 7, 't-1' when 0 < days <= 1, 't-0' when
//   days <= 0, 'normal' otherwise).

const { enqueueAuditStaging } = require('../audit/writer.cjs');

// Redis dedupe key prefix + TTL. 90 days > 30-day grace so the SET NX key
// outlives the rotation window — a cron replay 60 days later still dedupes.
const NOTIFIED_KEY_PREFIX = 'rotation:notified';
const NOTIFIED_TTL_SEC = 90 * 86400;

// Locked copy strings from 203-UI-SPEC §Surface 4 email-alignable subjects.
// Plan 203-09 banner component mirrors the same stage vocabulary.
const STAGE_TEMPLATES = {
  't-7': {
    subject: 'Webhook signing-secret rotation: 7 days remain',
    intro: 'The signing secret for webhook subscription <strong>{URL}</strong> entered its 30-day rotation grace window. 7 days remain.',
    cta: 'Verify your subscribers accept <code>x-markos-signature-v2</code>.',
  },
  't-1': {
    subject: 'Webhook signing-secret rotation: 1 day remains',
    intro: 'The signing secret for webhook subscription <strong>{URL}</strong> has 1 day remaining in its rotation grace window.',
    cta: 'Verify subscribers have switched to the new signature before the grace window closes.',
  },
  't-0': {
    subject: 'Webhook signing-secret rotation: grace ends today',
    intro: 'The signing secret for webhook subscription <strong>{URL}</strong> is in its final day of rotation grace.',
    cta: 'The old secret will be purged at {GRACE_ENDS_AT_READABLE}. Subscribers not using <code>x-markos-signature-v2</code> will start receiving signature-verification failures.',
  },
};

// computeStage — mirror of Plan 203-05 spec. Inline here for autonomy
// (203-05 lands in parallel). If rotation.cjs eventually exports
// computeStage with the same shape, callers can rewire trivially.
function computeStage(grace_ends_at, now = Date.now()) {
  if (!grace_ends_at) return 'normal';
  const ends = new Date(grace_ends_at).getTime();
  if (Number.isNaN(ends)) return 'normal';
  const daysRemaining = (ends - now) / 86400000;
  if (daysRemaining <= 0) return 't-0';
  if (daysRemaining <= 1) return 't-1';
  if (daysRemaining <= 7) return 't-7';
  return 'normal';
}

// Try to resolve Plan 203-05's canonical computeStage — otherwise use inline.
// This keeps the library forward-compatible without taking a hard dep.
function resolveComputeStage() {
  try {
    // eslint-disable-next-line global-require
    const rot = require('./rotation.cjs');
    if (rot && typeof rot.computeStage === 'function') return rot.computeStage;
  } catch {
    // rotation.cjs not yet shipped — fall through to inline computeStage.
  }
  return computeStage;
}

// Build the subject + html body for one (stage, rotation) pair.
function buildEmailTemplate({ stage, subscription, rotation, grace_ends_at }) {
  const tpl = STAGE_TEMPLATES[stage];
  if (!tpl) throw new Error('unsupported_stage: ' + stage);

  const subUrl = (subscription && subscription.url) || '';
  const subId = (subscription && subscription.id) || '';
  const readableGrace = grace_ends_at
    ? new Date(grace_ends_at).toUTCString()
    : (rotation && rotation.grace_ends_at
        ? new Date(rotation.grace_ends_at).toUTCString()
        : '');

  const intro = tpl.intro.replace('{URL}', subUrl);
  const cta = tpl.cta.replace('{GRACE_ENDS_AT_READABLE}', readableGrace);

  const html = [
    '<h1>Rotation in progress</h1>',
    '<p>' + intro + '</p>',
    '<p>' + cta + '</p>',
    '<p><a href="https://markos.dev/settings/webhooks/' + subId + '?tab=settings">Review rotation</a></p>',
  ].join('');

  return { subject: tpl.subject, html };
}

// Send one notification. Falls back to console.log dry-run when RESEND_API_KEY
// is absent (CI-safe; mirrors Plan 202-10 emit-kpi-digest pattern).
async function sendRotationNotification({ resendClient } = {}, { subscription, rotation, stage, recipients } = {}) {
  const { subject, html } = buildEmailTemplate({
    stage,
    subscription,
    rotation,
    grace_ends_at: rotation && rotation.grace_ends_at,
  });

  if (!process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log('[webhook-rotation-notify-dryrun]', JSON.stringify({
      stage,
      subscription_id: (subscription && subscription.id) || null,
      recipients,
      subject,
    }));
    return { delivered: false, reason: 'dry-run' };
  }

  let client = resendClient;
  if (!client) {
    // Lazy-require Resend only when we actually need it (keeps CI dep-free when
    // RESEND_API_KEY is absent).
    // eslint-disable-next-line global-require
    const { Resend } = require('resend');
    client = new Resend(process.env.RESEND_API_KEY);
  }

  const resp = await client.emails.send({
    from: 'MarkOS <webhooks@markos.dev>',
    to: recipients,
    subject,
    html,
  });

  const id = (resp && resp.id) || (resp && resp.data && resp.data.id) || null;
  return { delivered: true, id };
}

// Tenant-agnostic listing of all active rotations for the cron sweep.
// Unlike Plan 203-05 listActiveRotations (which is tenant-scoped for UI reads),
// the cron needs every active rotation across the fleet. Uses service-role
// Supabase client via migration 72 markos_webhook_secret_rotations.
async function listAllActiveRotations(client) {
  const { data, error } = await client
    .from('markos_webhook_secret_rotations')
    .select('id, subscription_id, tenant_id, grace_ends_at, state')
    .eq('state', 'active');
  if (error) throw new Error('listAllActiveRotations: ' + error.message);
  return data || [];
}

// Fetch tenant admin email addresses. Uses Supabase foreign-table expand
// `users!inner(email)` via the markos_tenant_memberships relation.
async function fetchTenantAdminEmails(client, tenant_id) {
  const { data, error } = await client
    .from('markos_tenant_memberships')
    .select('user_id, users!inner(email)')
    .eq('tenant_id', tenant_id)
    .in('role', ['owner', 'admin']);
  if (error) throw new Error('fetchTenantAdminEmails: ' + error.message);
  return (data || [])
    .map((row) => (row && row.users && row.users.email) || null)
    .filter(Boolean);
}

// Main cron entry point: sweeps active rotations, filters to T-7/T-1/T-0,
// dedups via Redis, sends via Resend (or dry-run), emits audit rows.
async function notifyRotations(client, now = new Date(), deps = {}) {
  const stageFn = deps.computeStage || resolveComputeStage();
  const lister = deps.listActiveRotations || listAllActiveRotations;
  const fetcher = deps.fetchTenantAdminEmails || fetchTenantAdminEmails;
  const auditEmit = deps.enqueueAuditStaging || enqueueAuditStaging;
  const redis = deps.redis;

  const nowMs = now instanceof Date ? now.getTime() : Date.now();

  const all = await lister(client);
  const eligible = all
    .map((r) => ({ rotation: r, stage: stageFn(r.grace_ends_at, nowMs) }))
    .filter(({ stage }) => stage === 't-7' || stage === 't-1' || stage === 't-0');

  let sent = 0;
  let skipped = 0;

  for (const { rotation, stage } of eligible) {
    // Dedupe via Redis SET NX EX — exactly-once per rotation+stage (T-203-06-02).
    const key = NOTIFIED_KEY_PREFIX + ':' + rotation.id + ':' + stage;
    let isNew = true;
    if (redis && typeof redis.set === 'function') {
      const result = await redis.set(key, '1', { nx: true, ex: NOTIFIED_TTL_SEC });
      isNew = result === 'OK';
    }
    if (!isNew) { skipped += 1; continue; }

    // Fetch recipients (T-203-06-01 mitigation: role + tenant scoped).
    const recipients = await fetcher(client, rotation.tenant_id);
    if (!recipients.length) { skipped += 1; continue; }

    // Subscription object: prefer rotation.subscription if pre-joined; else synthesize.
    const subscription = rotation.subscription || {
      id: rotation.subscription_id,
      url: rotation.url || '',
      tenant_id: rotation.tenant_id,
    };

    const result = await sendRotationNotification(
      { resendClient: deps.resendClient },
      { subscription, rotation, stage, recipients }
    );

    if (result.delivered || result.reason === 'dry-run') {
      // Count dry-runs as sent for observability — D-11 SLO measures "was a
      // notification attempted for this rotation+stage". The Redis key prevents
      // a real-send later from re-firing even if dry-run was recorded first.
      sent += 1;

      // Audit emit (T-203-06-05 Repudiation mitigation).
      try {
        await auditEmit(client, {
          tenant_id: rotation.tenant_id,
          org_id: null,
          source_domain: 'webhooks',
          action: 'secret.rotation_notified',
          actor_id: 'system:cron',
          actor_role: 'system',
          payload: {
            rotation_id: rotation.id,
            subscription_id: rotation.subscription_id,
            stage,
            recipients_count: recipients.length,
            delivered: result.delivered === true,
            notified_at: new Date(nowMs).toISOString(),
          },
        });
      } catch {
        // Fire-and-forget: audit staging failure must never block the cron
        // (mirrors Plan 203-03 DLQ purge audit-swallow).
      }
    } else {
      skipped += 1;
    }
  }

  return { sent, skipped, total_active: all.length };
}

module.exports = {
  buildEmailTemplate,
  sendRotationNotification,
  notifyRotations,
  listAllActiveRotations,
  fetchTenantAdminEmails,
  computeStage,
  NOTIFIED_KEY_PREFIX,
  NOTIFIED_TTL_SEC,
};
