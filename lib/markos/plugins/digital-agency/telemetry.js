'use strict';

/**
 * lib/markos/plugins/digital-agency/telemetry.js
 *
 * Digital Agency plugin — operation-specific telemetry mappers.
 * Each function wraps emitPluginOperation with a pre-set operation_name
 * and well-typed payload for consistent audit schema across DA workflows.
 *
 * Phase 52 — Plan 04 (Task 52-04-01)
 */

const { emitPluginOperation } = require('../telemetry.js');

const PLUGIN_ID = 'digital-agency-v1';

/**
 * @param {{ tenantId, actorId, correlationId, brandPackVersion?, rollbackFrom? }} opts
 */
function emitDashboardView({ tenantId, actorId, correlationId = 'unknown', brandPackVersion, rollbackFrom }) {
  return emitPluginOperation({
    tenantId,
    actorId,
    pluginId: PLUGIN_ID,
    correlationId,
    operationName: 'dashboard_view',
    payload: {},
    brandPackVersion,
    rollbackFrom,
  });
}

/**
 * @param {{ tenantId, actorId, correlationId, discipline, brandPackVersion?, rollbackFrom? }} opts
 */
function emitDraftRead({ tenantId, actorId, correlationId = 'unknown', discipline = 'unset', brandPackVersion, rollbackFrom }) {
  return emitPluginOperation({
    tenantId,
    actorId,
    pluginId: PLUGIN_ID,
    correlationId,
    operationName: 'draft_read',
    payload: { discipline },
    brandPackVersion,
    rollbackFrom,
  });
}

/**
 * @param {{ tenantId, actorId, correlationId, campaignId, brandPackVersion?, rollbackFrom? }} opts
 */
function emitApprovalGranted({ tenantId, actorId, correlationId = 'unknown', campaignId, brandPackVersion, rollbackFrom }) {
  return emitPluginOperation({
    tenantId,
    actorId,
    pluginId: PLUGIN_ID,
    correlationId,
    operationName: 'approval_granted',
    payload: { campaign_id: campaignId },
    brandPackVersion,
    rollbackFrom,
  });
}

/**
 * @param {{ tenantId, actorId, correlationId, campaignId, brandPackVersion?, rollbackFrom? }} opts
 */
function emitCampaignPublished({ tenantId, actorId, correlationId = 'unknown', campaignId, brandPackVersion, rollbackFrom }) {
  return emitPluginOperation({
    tenantId,
    actorId,
    pluginId: PLUGIN_ID,
    correlationId,
    operationName: 'campaign_published',
    payload: { campaign_id: campaignId },
    brandPackVersion,
    rollbackFrom,
  });
}

module.exports = {
  emitDashboardView,
  emitDraftRead,
  emitApprovalGranted,
  emitCampaignPublished,
};
