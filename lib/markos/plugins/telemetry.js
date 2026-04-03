'use strict';

/**
 * lib/markos/plugins/telemetry.js
 *
 * Shared plugin telemetry emission helpers.
 * Produces append-only, immutable event records with sanitized payloads
 * suitable for metering (Phase 54 handoff) and audit logging.
 *
 * Events are RETURNED, not pushed to a sink here — Phase 52 stub semantics.
 * Actual sink wiring occurs in Phase 54 metering work.
 *
 * Phase 52 — Plan 04 (Task 52-04-01)
 */

'use strict';

// Keys whose values are unconditionally redacted in any plugin event payload.
const BLOCKED_KEYS = ['token', 'password', 'secret', 'service_role_key', 'service_role'];

/**
 * Redact known-sensitive keys from a payload object.
 * @param {Record<string,unknown>} payload
 * @returns {Record<string,unknown>}
 */
function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(payload)) {
    const lower = key.toLowerCase();
    if (BLOCKED_KEYS.some((needle) => lower.includes(needle))) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Emit a plugin operation event.
 *
 * @param {{
 *   tenantId: string,
 *   actorId: string,
 *   pluginId: string,
 *   correlationId: string,
 *   operationName: string,
 *   payload?: Record<string,unknown>,
 *   brandPackVersion?: string,
 *   rollbackFrom?: string|null,
 * }} opts
 * @returns {Readonly<object>}
 */
function emitPluginOperation({ tenantId, actorId, pluginId, correlationId, operationName, payload = {}, brandPackVersion, rollbackFrom = null }) {
  const event = {
    event_name: 'plugin_operation',
    tenant_id: String(tenantId || 'unknown'),
    actor_id: String(actorId || 'unknown'),
    plugin_id: String(pluginId || 'unknown'),
    correlation_id: String(correlationId || 'unknown'),
    operation_name: String(operationName || 'unknown'),
    brand_pack_version: String(brandPackVersion || 'unversioned'),
    payload: sanitizePayload(payload),
    timestamp: new Date().toISOString(),
  };

  if (rollbackFrom != null) {
    event.rollback_from = String(rollbackFrom);
  }

  return Object.freeze(event);
}

/**
 * Emit a plugin access-denied event.
 *
 * @param {{
 *   tenantId: string,
 *   actorId: string,
 *   pluginId: string,
 *   correlationId: string,
 *   reason: string,
 *   action: string,
 * }} opts
 * @returns {Readonly<object>}
 */
function emitPluginDeny({ tenantId, actorId, pluginId, correlationId, reason, action }) {
  return Object.freeze({
    event_name: 'plugin_access_denied',
    tenant_id: String(tenantId || 'unknown'),
    actor_id: String(actorId || 'unknown'),
    plugin_id: String(pluginId || 'unknown'),
    correlation_id: String(correlationId || 'unknown'),
    reason: String(reason || 'UNKNOWN_REASON'),
    action: String(action || 'unknown'),
    timestamp: new Date().toISOString(),
  });
}

module.exports = { emitPluginOperation, emitPluginDeny, sanitizePayload };
