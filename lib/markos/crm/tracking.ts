import type { Stats } from 'node:fs';

'use strict';

const HIGH_SIGNAL_AUTHENTICATED_EVENTS = new Set([
  'approval_completed',
  'execution_readiness_ready',
  'execution_readiness_blocked',
  'execution_loop_completed',
  'execution_loop_abandoned',
]);

function toTrimmedString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function buildTrackedEntryPayload(input: Record<string, unknown> = {}) {
  return Object.freeze({
    destination: toTrimmedString(input.destination, toTrimmedString(input.to, toTrimmedString(input.fallback_destination))),
    utm_source: input.utm_source || null,
    utm_medium: input.utm_medium || null,
    utm_campaign: input.utm_campaign || null,
    utm_term: input.utm_term || null,
    utm_content: input.utm_content || null,
    referrer: input.referrer || null,
    affiliate_id: input.affiliate_id || input.affiliate || null,
    attribution_state: input.attribution_state || 'preserved',
    project_slug: input.project_slug || null,
  });
}

function normalizeTrackedActivity(input: Record<string, unknown> = {}) {
  const eventName = toTrimmedString(input.event_name);
  if (!eventName) {
    throw new Error('TRACKING_EVENT_NAME_REQUIRED');
  }

  if (input.authenticated && !HIGH_SIGNAL_AUTHENTICATED_EVENTS.has(eventName)) {
    return Object.freeze({
      crm_visible: false,
      excluded_reason: 'LOW_SIGNAL_EVENT',
      event_name: eventName,
      source_event_ref: toTrimmedString(input.source_event_ref, `tracking:${eventName}`),
    });
  }

  let activityFamily = 'web_activity';
  let payload: Readonly<Record<string, unknown>> = Object.freeze({
    ...(input.payload && typeof input.payload === 'object' ? input.payload : {}),
    event_name: eventName,
  });

  if (input.entry_type === 'redirect' || eventName === 'tracked_entry') {
    activityFamily = 'campaign_touch';
    payload = buildTrackedEntryPayload(input);
  } else if (input.authenticated) {
    activityFamily = 'agent_event';
    payload = Object.freeze({
      ...(input.payload && typeof input.payload === 'object' ? input.payload : {}),
      event_name: eventName,
      authenticated_surface: true,
    });
  }

  return Object.freeze({
    crm_visible: true,
    tenant_id: toTrimmedString(input.tenant_id),
    activity_family: activityFamily,
    related_record_kind: toTrimmedString(input.related_record_kind, 'contact'),
    related_record_id: toTrimmedString(input.related_record_id, toTrimmedString(input.anonymous_identity_id, 'anonymous')),
    anonymous_identity_id: typeof input.anonymous_identity_id === 'string' ? input.anonymous_identity_id.trim() : null,
    source_event_ref: toTrimmedString(input.source_event_ref, `tracking:${eventName}`),
    payload_json: payload,
    actor_id: typeof input.actor_id === 'string' ? input.actor_id.trim() : null,
    occurred_at: typeof input.occurred_at === 'string' || typeof input.occurred_at === 'number'
      ? new Date(input.occurred_at).toISOString()
      : new Date().toISOString(),
  });
}

function appendTrackedActivity(store, input) {
  const normalized = input && Object.hasOwn(input, 'crm_visible')
    ? input
    : normalizeTrackedActivity(input);
  if (!normalized.crm_visible) {
    return null;
  }

  if (!Array.isArray(store.activities)) {
    store.activities = [];
  }

  const row = Object.freeze({
    activity_id: String(normalized.activity_id || `activity-${store.activities.length + 1}`),
    tenant_id: String(normalized.tenant_id || '').trim(),
    activity_family: String(normalized.activity_family || 'crm_mutation').trim(),
    related_record_kind: String(normalized.related_record_kind || '').trim(),
    related_record_id: String(normalized.related_record_id || '').trim(),
    anonymous_identity_id: normalized.anonymous_identity_id ? String(normalized.anonymous_identity_id).trim() : null,
    source_event_ref: String(normalized.source_event_ref || '').trim(),
    payload_json: normalized.payload_json ? { ...normalized.payload_json } : {},
    actor_id: normalized.actor_id ? String(normalized.actor_id).trim() : null,
    occurred_at: new Date(normalized.occurred_at || Date.now()).toISOString(),
  });

  store.activities.push(row);
  return row;
}

module.exports = {
  appendTrackedActivity,
  buildTrackedEntryPayload,
  normalizeTrackedActivity,
};