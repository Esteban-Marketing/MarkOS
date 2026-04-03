'use strict';

/**
 * lib/markos/plugins/digital-agency/handlers/events.js
 *
 * Immutable append-only event handlers for Digital Agency workflow events.
 * Phase 52 records events as frozen in-memory structs (Phase 53/54 wire to Supabase).
 *
 * Event types:
 *   approval:granted   — manager/owner granted campaign approval
 *   campaign:published — campaign published by authorized actor
 */

const crypto = require('crypto');

/**
 * handleApprovalGranted(event)
 *
 * Records an approval:granted event. Returns immutable record with tenant_id,
 * correlation_id, and recorded timestamp.
 *
 * @param {{ type: string, correlationId: string, actor: {userId, tenantId, role}, resourceId: string, payload: object }} event
 * @returns {{ recorded: true, tenant_id: string, correlation_id: string, recorded_at: string }}
 */
async function handleApprovalGranted(event) {
  if (!event || event.type !== 'approval:granted') {
    throw new Error(`INVALID_EVENT_TYPE: expected approval:granted, got ${event?.type}`);
  }

  const record = Object.freeze({
    recorded: true,
    event_type: event.type,
    tenant_id: String(event.actor?.tenantId || ''),
    actor_id: String(event.actor?.userId || 'unknown'),
    actor_role: String(event.actor?.role || 'unknown'),
    resource_id: String(event.resourceId || ''),
    correlation_id: String(event.correlationId || crypto.randomUUID?.() || `${Date.now()}`),
    payload: event.payload || {},
    recorded_at: new Date().toISOString(),
  });

  return record;
}

/**
 * handleCampaignPublished(event)
 *
 * Records a campaign:published event. Returns immutable record with tenant_id,
 * correlation_id, event_type, and recorded timestamp.
 *
 * @param {{ type: string, correlationId: string, actor: {userId, tenantId, role}, resourceId: string, payload: object }} event
 * @returns {{ recorded: true, tenant_id: string, event_type: string, correlation_id: string, recorded_at: string }}
 */
async function handleCampaignPublished(event) {
  if (!event || event.type !== 'campaign:published') {
    throw new Error(`INVALID_EVENT_TYPE: expected campaign:published, got ${event?.type}`);
  }

  const record = Object.freeze({
    recorded: true,
    event_type: event.type,
    tenant_id: String(event.actor?.tenantId || ''),
    actor_id: String(event.actor?.userId || 'unknown'),
    actor_role: String(event.actor?.role || 'unknown'),
    resource_id: String(event.resourceId || ''),
    correlation_id: String(event.correlationId || crypto.randomUUID?.() || `${Date.now()}`),
    payload: event.payload || {},
    recorded_at: new Date().toISOString(),
  });

  return record;
}

module.exports = { handleApprovalGranted, handleCampaignPublished };
