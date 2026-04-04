'use strict';

const { canPerformAction } = require('../../lib/markos/rbac/iam-v32.js');
const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../onboarding/backend/runtime-context.cjs');
const { buildVendorInventoryReport } = require('../../lib/markos/governance/vendor-inventory.cjs');

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function isGovernanceAuthorized(role) {
  return canPerformAction(role, 'manage_billing') || canPerformAction(role, 'manage_users');
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }

  const iamRole = auth.iamRole || auth.role || auth.principal?.tenant_role || 'readonly';
  if (!isGovernanceAuthorized(iamRole)) {
    return writeJson(res, 403, { success: false, error: 'GOVERNANCE_ADMIN_REQUIRED', message: 'billing or user administration permission required' });
  }

  const report = buildVendorInventoryReport({
    evidence_entries: [
      {
        vendor_inventory_id: 'vendor-openai',
        tenant_id: auth.tenant_id || 'tenant-alpha-001',
        vendor_key: 'openai',
        vendor_name: 'OpenAI',
        service_category: 'ai',
        source_of_truth: 'immutable-ledger',
        evidence_ref: 'evidence-pack-001',
        reviewed_at: '2026-04-03T00:00:00.000Z',
      },
      {
        vendor_inventory_id: 'vendor-stripe',
        tenant_id: auth.tenant_id || 'tenant-alpha-001',
        vendor_key: 'stripe',
        vendor_name: 'Stripe',
        service_category: 'billing',
        source_of_truth: 'immutable-ledger',
        evidence_ref: 'evidence-pack-001',
        reviewed_at: '2026-04-03T00:00:00.000Z',
      },
      {
        vendor_inventory_id: 'vendor-supabase',
        tenant_id: auth.tenant_id || 'tenant-alpha-001',
        vendor_key: 'supabase',
        vendor_name: 'Supabase',
        service_category: 'identity',
        source_of_truth: 'immutable-ledger',
        evidence_ref: 'evidence-pack-001',
        reviewed_at: '2026-04-03T00:00:00.000Z',
      },
    ],
  });

  return writeJson(res, 200, {
    success: true,
    report,
  });
};