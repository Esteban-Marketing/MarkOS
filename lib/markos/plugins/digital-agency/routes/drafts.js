'use strict';

/**
 * lib/markos/plugins/digital-agency/routes/drafts.js
 *
 * GET /plugins/digital-agency/drafts?discipline={discipline}
 * Required capability: read_drafts
 *
 * Returns draft documents scoped to the tenant. In production queries
 * the MarkOS drafts store filtered by tenant_id. Phase 52 returns a
 * deterministic stub payload when Supabase is not connected.
 */

const { pluginGuard } = require('../plugin-guard.js');

/**
 * handleDrafts(req, res)
 *
 * Tenant context expected on req.tenantContext.
 */
async function handleDrafts(req, res) {
  const guard = pluginGuard(req, res, 'read_drafts');
  if (!guard.ok) return;

  const tenantId = req.tenantContext.tenantId;
  const discipline = req.query?.discipline || null;

  return res.status(200).json({
    success: true,
    drafts: [],
    meta: {
      tenant_id: tenantId,
      discipline: discipline || 'all',
      count: 0,
      generatedAt: new Date().toISOString(),
    },
  });
}

module.exports = { handleDrafts };
