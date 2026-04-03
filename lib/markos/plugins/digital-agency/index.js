'use strict';

/**
 * lib/markos/plugins/digital-agency/index.js
 *
 * Digital Agency plugin manifest — Phase 52 PLG-DA-02.
 * First-party plugin that wraps MarkOS draft, approval, and campaign
 * orchestration as a scoped "agency workflow" UX.
 *
 * All routes require:
 *  1. Plugin enabled for tenant (checked by handler guard before any logic)
 *  2. Required capability granted for route
 *  3. IAM role sufficient for action
 */

const { handleDashboard } = require('./routes/dashboard.js');
const { handleDrafts } = require('./routes/drafts.js');
const { handleAssembleCampaign, handlePublishCampaign } = require('./routes/campaigns.js');

const digitalAgencyPlugin = Object.freeze({
  id: 'digital-agency-v1',
  version: '1.0.0',
  name: 'Digital Agency',
  description: 'Agency workflows: draft review, campaign assembly, approval routing, and publish coordination.',
  requiredCapabilities: Object.freeze([
    'read_drafts',
    'read_campaigns',
    'write_campaigns',
    'publish_campaigns',
    'read_approvals',
    'write_approvals',
  ]),
  requiredIamRoles: Object.freeze(['manager', 'owner', 'tenant-admin']),
  routes: Object.freeze([
    Object.freeze({
      path: '/plugins/digital-agency/dashboard',
      method: 'GET',
      handler: handleDashboard,
      requiredCapability: 'read_campaigns',
    }),
    Object.freeze({
      path: '/plugins/digital-agency/drafts',
      method: 'GET',
      handler: handleDrafts,
      requiredCapability: 'read_drafts',
    }),
    Object.freeze({
      path: '/plugins/digital-agency/campaigns/assemble',
      method: 'POST',
      handler: handleAssembleCampaign,
      requiredCapability: 'write_campaigns',
    }),
    Object.freeze({
      path: '/plugins/digital-agency/campaigns/:id/publish',
      method: 'POST',
      handler: handlePublishCampaign,
      requiredCapability: 'publish_campaigns',
    }),
  ]),
});

module.exports = { digitalAgencyPlugin };
