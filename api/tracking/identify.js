'use strict';

const { createRuntimeContext, requireHostedSupabaseAuth, resolveRequestedProjectSlugFromRequest } = require('../../onboarding/backend/runtime-context.cjs');
const { readBody, json } = require('../../onboarding/backend/utils.cjs');
const { getCrmStore, appendCrmActivity } = require('../../lib/markos/crm/api.cjs');
const { scoreIdentityCandidate, createIdentityLink } = require('../../lib/markos/crm/identity.ts');

function validateInput(body) {
  const input = body && typeof body === 'object' ? body : {};
  const anonymousIdentityId = String(input.anonymous_identity_id || '').trim();
  const knownRecordKind = String(input.known_record_kind || '').trim();
  const knownRecordId = String(input.known_record_id || '').trim();
  const sourceEventRef = String(input.source_event_ref || '').trim();

  if (!anonymousIdentityId || !knownRecordKind || !knownRecordId || !sourceEventRef) {
    return null;
  }

  return {
    anonymous_identity_id: anonymousIdentityId,
    known_record_kind: knownRecordKind,
    known_record_id: knownRecordId,
    source_event_ref: sourceEventRef,
    signals: input.signals && typeof input.signals === 'object' ? input.signals : {},
    tenant_id: input.tenant_id ? String(input.tenant_id).trim() : null,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { success: false, error: 'METHOD_NOT_ALLOWED', message: 'Identity stitching only accepts POST requests.' });
  }

  const runtime = createRuntimeContext();
  const auth = requireHostedSupabaseAuth({
    req,
    runtimeContext: runtime,
    operation: 'tracking_write',
    requiredProjectSlug: resolveRequestedProjectSlugFromRequest(req),
  });
  if (!auth.ok) {
    return json(res, auth.status, {
      success: false,
      error: auth.error,
      message: auth.message,
      tenant_id: auth.tenant_id || null,
    });
  }

  const body = await readBody(req);
  const input = validateInput(body);
  if (!input) {
    return json(res, 400, {
      success: false,
      error: 'IDENTITY_STITCH_INVALID',
      message: 'anonymous_identity_id, known_record_kind, known_record_id, and source_event_ref are required.',
    });
  }

  if (input.tenant_id && input.tenant_id !== auth.tenant_id) {
    return json(res, 403, {
      success: false,
      error: 'TENANT_CONTEXT_AMBIGUOUS',
      message: 'Body tenant context conflicts with verified tenant scope.',
      tenant_id: auth.tenant_id,
    });
  }

  const score = scoreIdentityCandidate(input.signals);
  const store = getCrmStore(req);
  const decision = score.recommended_decision;
  const link = createIdentityLink(store, {
    tenant_id: auth.tenant_id,
    anonymous_identity_id: input.anonymous_identity_id,
    known_record_kind: input.known_record_kind,
    known_record_id: input.known_record_id,
    confidence: score.confidence,
    link_status: decision,
    source_event_ref: input.source_event_ref,
    reviewer_actor_id: decision === 'accepted' ? null : auth.principal.id,
  });

  appendCrmActivity(store, {
    tenant_id: auth.tenant_id,
    activity_family: 'attribution_update',
    related_record_kind: input.known_record_kind,
    related_record_id: input.known_record_id,
    anonymous_identity_id: input.anonymous_identity_id,
    source_event_ref: `${input.source_event_ref}:decision`,
    payload_json: {
      event_name: 'identity_stitch_decision',
      decision,
      confidence: score.confidence,
      anonymous_identity_id: input.anonymous_identity_id,
    },
    actor_id: auth.principal.id,
  });

  return json(res, 200, {
    success: true,
    decision,
    confidence: score.confidence,
    identity_link_id: link.identity_link_id,
    tenant_id: auth.tenant_id,
  });
};