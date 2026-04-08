'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth } = require('../../../onboarding/backend/runtime-context.cjs');
const {
  writeJson,
  requireCrmTenantContext,
  getCrmStore,
} = require('../../../lib/markos/crm/api.cjs');
const { buildReadinessReport } = require('../../../lib/markos/crm/reporting.ts');

async function handleReportingVerification(req, res) {
  const context = requireCrmTenantContext(req);
  if (!context.ok) {
    return writeJson(res, context.status, { success: false, error: context.error, message: context.message });
  }
  if (req.method !== 'GET') {
    return writeJson(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const store = getCrmStore(req);
  const readiness = buildReadinessReport({ crmStore: store, tenant_id: context.tenant_id, now: req.query?.now });

  return writeJson(res, 200, {
    success: true,
    readiness_review: readiness,
    checklist: [
      {
        check_id: 'phase64-att-01-live-check',
        requirement_id: 'ATT-01',
        title: 'Attribution evidence review',
        status: 'ready_for_live_verification',
      },
      {
        check_id: 'phase64-rep-01-live-check',
        requirement_id: 'REP-01',
        title: 'Reporting cockpit review',
        status: 'ready_for_live_verification',
      },
    ],
    evidence_capture_fields: ['executor', 'environment_url', 'commands_run', 'evidence_paths', 'verdict'],
    promotion: {
      closure_matrix_target: '.planning/projects/markos-v3/CLOSURE-MATRIX.md',
      requirements: [
        { id: 'ATT-01', current_status: 'Partial', target_status: 'Satisfied' },
        { id: 'REP-01', current_status: 'Partial', target_status: 'Satisfied' },
      ],
      live_check_artifacts: [
        '.planning/milestones/v3.3.0-LIVE-CHECKLIST.md',
        '.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md',
      ],
    },
  });
}

module.exports = async function handler(req, res) {
  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({ req, runtimeContext: runtime, operation: 'status_read' });
  if (!auth.ok) {
    return writeJson(res, auth.status, { success: false, error: auth.error, message: auth.message });
  }
  req.markosAuth = auth;
  return handleReportingVerification(req, res);
};

module.exports.handleReportingVerification = handleReportingVerification;