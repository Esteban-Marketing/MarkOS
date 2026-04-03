'use strict';

/**
 * lib/markos/plugins/digital-agency/routes/dashboard.js
 *
 * GET /plugins/digital-agency/dashboard
 * Required capability: read_campaigns (+ read_drafts checked implicitly)
 *
 * Returns a summary view of: pending approvals, active campaigns, and
 * recent publish events for the tenant. In production this reads from
 * the plugin_tenant_config and digital_agency_campaigns tables via Supabase.
 * For Phase 52, returns a deterministic stub payload when not connected.
 */

const { pluginGuard } = require('../plugin-guard.js');

/**
 * handleDashboard(req, res)
 *
 * Tenant context is expected on req.tenantContext (set by auth middleware).
 * Checks plugin enabled + read_campaigns capability before executing.
 */
async function handleDashboard(req, res) {
  const guard = pluginGuard(req, res, 'read_campaigns');
  if (!guard.ok) return;

  const tenantId = req.tenantContext.tenantId;

  return res.status(200).json({
    success: true,
    dashboard: {
      tenant_id: tenantId,
      pendingApprovals: 0,
      activeCampaigns: 0,
      recentPublished: [],
      teamActivity: [],
      generatedAt: new Date().toISOString(),
    },
  });
}

module.exports = { handleDashboard };
