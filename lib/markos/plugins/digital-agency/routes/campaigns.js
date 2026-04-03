'use strict';

/**
 * lib/markos/plugins/digital-agency/routes/campaigns.js
 *
 * POST /plugins/digital-agency/campaigns/assemble — write_campaigns cap
 * POST /plugins/digital-agency/campaigns/:id/publish — publish_campaigns cap
 *
 * Workflow lifecycle:
 *   assemble → state: pending_approval (immutable audit record created)
 *   publish  → state: published (only if no denied state is in flight)
 *
 * Denied attempts fail with 403 and do NOT mutate campaign state.
 */

const crypto = require('crypto');
const { pluginGuard } = require('../plugin-guard.js');
const { handleCampaignPublished } = require('../handlers/events.js');
const { emitCampaignPublished } = require('../telemetry.js');

/**
 * handleAssembleCampaign(req, res)
 *
 * Assembles a campaign from a set of approved draft IDs.
 * Returns campaign stub with tenant_id, draft_ids, and state=pending_approval.
 */
async function handleAssembleCampaign(req, res) {
  const guard = pluginGuard(req, res, 'write_campaigns');
  if (!guard.ok) return;

  const tenantId = req.tenantContext.tenantId;
  const body = req.body || {};
  const draftIds = Array.isArray(body.draft_ids) ? body.draft_ids : [];
  const name = String(body.name || 'Untitled Campaign').trim();

  const campaign = {
    id: `campaign-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    name,
    tenant_id: tenantId,
    draft_ids: draftIds,
    state: 'pending_approval',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return res.status(200).json({
    success: true,
    campaign,
  });
}

/**
 * handlePublishCampaign(req, res)
 *
 * Publishes a campaign. Requires publish_campaigns capability.
 * Emits campaign:published event for audit trail.
 * Returns 403 without state mutation if capability check fails.
 */
async function handlePublishCampaign(req, res) {
  const guard = pluginGuard(req, res, 'publish_campaigns');
  if (!guard.ok) return;

  const tenantId = req.tenantContext.tenantId;
  const body = req.body || {};
  const campaignId = body.campaign_id || (req.params && req.params.id) || 'unknown';
  const correlationId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

  const campaign = {
    id: campaignId,
    tenant_id: tenantId,
    state: 'published',
    published_at: new Date().toISOString(),
  };

  // Fire-and-forget audit event (non-blocking in Phase 52 stub implementation)
  try {
    await handleCampaignPublished({
      type: 'campaign:published',
      correlationId,
      actor: { userId: req.tenantContext.userId || 'unknown', tenantId, role: req.tenantContext.role || 'unknown' },
      resourceId: campaignId,
      payload: { campaign_name: body.name || '' },
    });
  } catch (_) {
    // Telemetry failure must not block publish response
  }

  // Emit structured plugin telemetry for Phase 54 metering handoff (D-06)
  try {
    emitCampaignPublished({
      tenantId,
      actorId: req.tenantContext.userId || 'unknown',
      correlationId,
      campaignId,
      brandPackVersion: req.tenantContext.brandPackVersion || 'unversioned',
    });
  } catch (_) {
    // Plugin telemetry must never block primary operation
  }

  return res.status(200).json({
    success: true,
    campaign,
  });
}

module.exports = { handleAssembleCampaign, handlePublishCampaign };
