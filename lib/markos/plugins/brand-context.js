'use strict';

/**
 * lib/markos/plugins/brand-context.js
 *
 * Pure-CJS plugin brand context helpers.
 * Resolves tenant brand tokens for plugin surfaces (notifications, dashboards)
 * without exposing raw brand-pack overrides.
 *
 * Phase 52 — Plan 03 (Task 52-03-02)
 */

const DEFAULT_PRIMARY_COLOR = '#0d9488';
const DEFAULT_PRIMARY_TEXT_COLOR = '#ffffff';
const PLUGIN_NAMESPACE = 'digital-agency-plugin';

/**
 * Derive the plugin brand context for a tenant from their brand-pack config.
 *
 * @param {string} tenantId
 * @param {{ label?: string, logoUrl?: string, overrides?: Record<string,string> }} brandPackConfig
 * @returns {{ tenantId: string, pluginNamespace: string, label: string, logoUrl: string|null, primaryColor: string, primaryTextColor: string }}
 */
function getPluginBrandContext(tenantId, brandPackConfig) {
  const cfg = brandPackConfig || {};
  const overrides = (cfg.overrides && typeof cfg.overrides === 'object') ? cfg.overrides : {};

  return Object.freeze({
    tenantId,
    pluginNamespace: PLUGIN_NAMESPACE,
    label: cfg.label || 'MarkOS',
    logoUrl: cfg.logoUrl || null,
    primaryColor: overrides['color.action.primary'] || DEFAULT_PRIMARY_COLOR,
    primaryTextColor: overrides['color.action.primaryText'] || DEFAULT_PRIMARY_TEXT_COLOR,
  });
}

/**
 * Merge brand context into an outbound notification payload.
 * Result is a plain object safe for JSON serialisation.
 *
 * @param {{ type: string, subject: string, body: string, recipientId: string }} notification
 * @param {ReturnType<typeof getPluginBrandContext>} brandContext
 */
function buildPluginNotificationPayload(notification, brandContext) {
  return {
    type: notification.type,
    subject: notification.subject,
    body: notification.body,
    recipientId: notification.recipientId,
    brand: {
      tenantId: brandContext.tenantId,
      primaryColor: brandContext.primaryColor,
      logoUrl: brandContext.logoUrl,
      label: brandContext.label,
    },
  };
}

module.exports = { getPluginBrandContext, buildPluginNotificationPayload };
