'use strict';

const { appendTrackedActivity } = require('../../lib/markos/crm/tracking.ts');
const { getCrmStore } = require('../../lib/markos/crm/api.cjs');

function writeError(res, statusCode, error, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error, message }));
}

function readQuery(req) {
  const parsed = new URL(`http://localhost${req.url || '/'}`);
  return parsed.searchParams;
}

function resolveDestination(query) {
  const primary = query.get('to');
  const fallback = query.get('fallback');
  if (primary) {
    return { url: primary, attribution_state: 'preserved' };
  }
  if (fallback) {
    return { url: fallback, attribution_state: 'degraded_fallback' };
  }
  return null;
}

function buildRedirectLocation(destination, query) {
  const target = new URL(destination);
  const passthroughKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'affiliate'];

  for (const key of passthroughKeys) {
    const value = query.get(key);
    if (value) {
      target.searchParams.set(key, value);
    }
  }

  return target.toString();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return writeError(res, 405, 'METHOD_NOT_ALLOWED', 'Tracked redirect only accepts GET requests.');
  }

  const query = readQuery(req);
  const destination = resolveDestination(query);
  if (!destination) {
    return writeError(res, 400, 'TRACKING_DESTINATION_REQUIRED', 'Provide a destination or explicit fallback URL.');
  }

  const store = getCrmStore(req);
  appendTrackedActivity(store, {
    tenant_id: query.get('tenant_id') || 'tenant-alpha-001',
    project_slug: query.get('project_slug') || 'markos-client',
    event_name: 'tracked_entry',
    entry_type: 'redirect',
    source_event_ref: `redirect:${query.get('anonymous_identity_id') || 'anonymous'}`,
    anonymous_identity_id: query.get('anonymous_identity_id') || null,
    destination: destination.url,
    utm_source: query.get('utm_source'),
    utm_medium: query.get('utm_medium'),
    utm_campaign: query.get('utm_campaign'),
    utm_term: query.get('utm_term'),
    utm_content: query.get('utm_content'),
    affiliate_id: query.get('affiliate'),
    attribution_state: destination.attribution_state,
  });

  res.writeHead(302, {
    Location: buildRedirectLocation(destination.url, query),
  });
  res.end('');
};