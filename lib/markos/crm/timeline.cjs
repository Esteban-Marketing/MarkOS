'use strict';

const ACTIVITY_FAMILY_ALIASES = Object.freeze({
  pageview: 'web_activity',
  web_activity: 'web_activity',
  campaign_touch: 'campaign_touch',
  crm_mutation: 'crm_mutation',
  note: 'note',
  crm_note: 'note',
  task: 'task',
  crm_task: 'task',
  agent_event: 'agent_event',
  outbound_event: 'outbound_event',
  attribution_update: 'attribution_update',
});

function normalizeActivityFamily(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const family = ACTIVITY_FAMILY_ALIASES[normalized];
  if (!family) {
    throw new Error(`CRM_ACTIVITY_FAMILY_INVALID:${value}`);
  }
  return family;
}

function buildCrmTimeline(input) {
  const options = input && typeof input === 'object' && !Array.isArray(input)
    ? input
    : { activities: Array.isArray(input) ? input : [] };
  const tenantId = String(options.tenant_id || '').trim();
  const recordKind = options.record_kind ? String(options.record_kind).trim() : null;
  const recordId = options.record_id ? String(options.record_id).trim() : null;
  const acceptedLinks = (options.identity_links || [])
    .filter((link) => link?.link_status === 'accepted')
    .filter((link) => !tenantId || link?.tenant_id === tenantId)
    .filter((link) => {
      if (!recordKind || !recordId) {
        return true;
      }
      return link.known_record_kind === recordKind && link.known_record_id === recordId;
    });
  const acceptedAnonymousIds = new Set(acceptedLinks
    .map((link) => String(link.anonymous_identity_id || '').trim())
    .filter(Boolean));
  const acceptedLinkByAnonymousId = new Map(acceptedLinks
    .map((link) => [String(link.anonymous_identity_id || '').trim(), link])
    .filter(([anonymousIdentityId]) => anonymousIdentityId));

  return (options.activities || [])
    .filter((row) => row && typeof row === 'object')
    .filter((row) => !tenantId || row.tenant_id === tenantId)
    .filter((row) => {
      if (!recordKind || !recordId) {
        return true;
      }
      return (
        (row.related_record_kind === recordKind && row.related_record_id === recordId)
        || acceptedAnonymousIds.has(String(row.anonymous_identity_id || '').trim())
      );
    })
    .map((row) => {
      const anonymousIdentityId = String(row.anonymous_identity_id || '').trim();
      const stitched_identity = acceptedAnonymousIds.has(anonymousIdentityId);
      const stitchLink = stitched_identity ? acceptedLinkByAnonymousId.get(anonymousIdentityId) : null;
      return Object.freeze({
        ...row,
        activity_family: normalizeActivityFamily(row.activity_family),
        stitched_identity,
        stitch_label: stitched_identity ? 'stitched_pre_conversion_history' : null,
        stitch_evidence_ref: stitchLink?.source_event_ref || null,
        stitch_confidence: stitchLink?.confidence ?? null,
        stitch_status: stitchLink?.link_status || null,
      });
    })
    .sort((left, right) => {
      const leftTs = Date.parse(left.occurred_at || left.created_at || 0);
      const rightTs = Date.parse(right.occurred_at || right.created_at || 0);
      if (leftTs !== rightTs) {
        return rightTs - leftTs;
      }
      return String(left.activity_id || '').localeCompare(String(right.activity_id || ''));
    });
}

module.exports = {
  buildCrmTimeline,
  normalizeActivityFamily,
};