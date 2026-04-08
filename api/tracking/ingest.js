'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth, resolveRequestedProjectSlugFromRequest } = require('../../onboarding/backend/runtime-context.cjs');
const { captureTrackingEvent } = require('../../onboarding/backend/agents/telemetry.cjs');
const { readBody, json } = require('../../onboarding/backend/utils.cjs');
const { appendCrmActivity, getCrmStore } = require('../../lib/markos/crm/api.cjs');
const { normalizeTrackedActivity } = require('../../lib/markos/crm/tracking.ts');
const { buildEvent, sanitizePayload } = require('../../lib/markos/telemetry/events.cjs');

const EVENT_FAMILY_BY_NAME = Object.freeze({
  onboarding_started: 'web_activity',
  onboarding_page_view: 'web_activity',
  onboarding_form_started: 'web_activity',
  onboarding_step_completed: 'web_activity',
  business_model_selected: 'web_activity',
  onboarding_completed: 'web_activity',
  approval_completed: 'agent_event',
  execution_readiness_ready: 'agent_event',
  execution_readiness_blocked: 'agent_event',
  execution_loop_completed: 'agent_event',
  execution_loop_abandoned: 'agent_event',
});

function writeError(res, statusCode, error, message, extra = {}) {
  return json(res, statusCode, {
    success: false,
    error,
    message,
    ...extra,
  });
}

function getTrackingEvents(body) {
  if (Array.isArray(body.events)) {
    return body.events;
  }
  if (body.event_name) {
    return [body];
  }
  return [];
}

function resolveIngestContext({ req, body, runtimeContext }) {
  const protectedSurface = body.protected_surface === true || body.surface === 'protected';
  const requestedProjectSlug = body.project_slug || resolveRequestedProjectSlugFromRequest(req) || 'markos-client';

  if (protectedSurface) {
    const auth = requireHostedSupabaseAuth({
      req,
      runtimeContext,
      operation: 'tracking_write',
      requiredProjectSlug: requestedProjectSlug,
    });

    if (!auth.ok) {
      captureTrackingEvent('markos_tracking_ingest_denied', {
        project_slug: requestedProjectSlug,
        outcome_state: 'denied',
        error: auth.error,
        protected_surface: true,
      });
      return auth;
    }

    return {
      ok: true,
      status: 200,
      project_slug: requestedProjectSlug,
      tenant_id: auth.tenant_id,
      protected_surface: true,
      principal: auth.principal,
      iamRole: auth.iamRole,
    };
  }

  const tenantId = String(body.tenant_id || process.env.MARKOS_ACTIVE_TENANT_ID || (runtimeContext.mode !== 'hosted' ? 'tenant-alpha-001' : '')).trim();
  if (!tenantId) {
    return {
      ok: false,
      status: 401,
      error: 'TENANT_CONTEXT_REQUIRED',
      message: 'Public tracking ingest requires tenant_id outside local runtime.',
    };
  }

  return {
    ok: true,
    status: 200,
    project_slug: requestedProjectSlug,
    tenant_id: tenantId,
    protected_surface: false,
    principal: {
      type: runtimeContext.mode === 'hosted' ? 'tracking_public' : 'runtime_local',
      id: body.anonymous_identity_id || 'tracking-public',
      tenant_id: tenantId,
    },
    iamRole: runtimeContext.mode === 'hosted' ? 'public' : 'owner',
  };
}

function normalizeActivityFamily(eventName, requestedFamily) {
  if (requestedFamily) {
    return String(requestedFamily).trim();
  }
  return EVENT_FAMILY_BY_NAME[eventName] || 'web_activity';
}

function normalizeTrackedEvent(rawEvent, index, context) {
  const eventName = String(rawEvent.event_name || rawEvent.name || '').trim();
  if (!eventName) {
    throw new Error('TRACKING_EVENT_NAME_REQUIRED');
  }

  const basePayload = rawEvent.payload && typeof rawEvent.payload === 'object' ? rawEvent.payload : {};
  const payload = sanitizePayload({
    ...basePayload,
    event_name: eventName,
    page_url: rawEvent.page_url || basePayload.page_url || null,
    protected_surface: context.protected_surface,
    anonymous_identity_id: rawEvent.anonymous_identity_id || basePayload.anonymous_identity_id || null,
  });

  const sourceEventRef = String(rawEvent.source_event_ref || `tracking:${eventName}:${rawEvent.event_id || index + 1}`).trim();
  const normalized = normalizeTrackedActivity({
    tenant_id: context.tenant_id,
    authenticated: context.protected_surface,
    actor_id: context.protected_surface ? context.principal.id : null,
    event_name: eventName,
    activity_family: normalizeActivityFamily(eventName, rawEvent.activity_family),
    related_record_kind: rawEvent.related_record_kind || 'contact',
    related_record_id: rawEvent.related_record_id || rawEvent.anonymous_identity_id || payload.anonymous_identity_id || 'anonymous',
    anonymous_identity_id: rawEvent.anonymous_identity_id || payload.anonymous_identity_id || null,
    source_event_ref: sourceEventRef,
    payload,
    occurred_at: rawEvent.occurred_at,
  });

  return {
    event_name: eventName,
    normalized_activity_family: normalized.activity_family,
    source_event_ref: sourceEventRef,
    activity: normalized,
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 200, { success: true });
  }

  if (req.method !== 'POST') {
    return writeError(res, 405, 'METHOD_NOT_ALLOWED', 'Tracking ingest only accepts POST requests.');
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return writeError(res, 400, 'INVALID_JSON_BODY', error.message);
  }

  const events = getTrackingEvents(body || {});
  if (events.length === 0) {
    return writeError(res, 400, 'TRACKING_EVENTS_REQUIRED', 'Provide at least one tracking event for ingestion.');
  }

  const runtimeContext = createRuntimeContext();
  const context = resolveIngestContext({ req, body: body || {}, runtimeContext });
  if (!context.ok) {
    return writeError(res, context.status, context.error, context.message, { tenant_id: context.tenant_id || null });
  }

  const store = getCrmStore(req);

  let normalizedEvents;
  try {
    normalizedEvents = events.map((event, index) => normalizeTrackedEvent(event || {}, index, context));
  } catch (error) {
    return writeError(res, 400, error.message, 'Tracking payload failed validation.');
  }

  const persisted = normalizedEvents.map((entry) => appendCrmActivity(store, entry.activity));
  const telemetryEvent = buildEvent({
    name: 'markos_tracking_ingest_received',
    workspaceId: context.project_slug,
    role: context.iamRole,
    requestId: persisted[0].source_event_ref,
    payload: {
      project_slug: context.project_slug,
      tenant_id: context.tenant_id,
      protected_surface: context.protected_surface,
      event_count: normalizedEvents.length,
      event_names: normalizedEvents.map((entry) => entry.event_name),
    },
  });

  captureTrackingEvent(telemetryEvent.name, telemetryEvent.payload);

  return json(res, 202, {
    success: true,
    tenant_id: context.tenant_id,
    project_slug: context.project_slug,
    events: normalizedEvents.map((entry) => ({
      event_name: entry.event_name,
      normalized_activity_family: entry.normalized_activity_family,
      source_event_ref: entry.source_event_ref,
    })),
  });
};