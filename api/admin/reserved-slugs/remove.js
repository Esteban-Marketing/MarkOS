'use strict';

// Phase 201.1 D-109 (closes M6): admin remove endpoint for reserved-slug overrides.
// Auth: requires actor on Tenant 0 with org_role='owner'. F-106 contract.
// Threat T-201.1-03-02 mitigation: system/protected/single_char categories are locked (409).

const { requireSystemAdmin } = require('./list.js');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { clearReservedSlugCache } = require('../../../lib/markos/tenant/reserved-slugs.cjs');

const LOCKED_CATEGORIES = ['system', 'protected', 'single_char'];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end();
  }

  const auth = await requireSystemAdmin(req);
  if (!auth.ok) {
    res.statusCode = auth.status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: auth.error }));
  }

  // Parse JSON body.
  let body;
  try {
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else {
      const raw = await new Promise((resolve, reject) => {
        let s = '';
        req.on('data', (c) => { s += c; });
        req.on('end', () => resolve(s));
        req.on('error', reject);
      });
      body = JSON.parse(raw);
    }
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_json' }));
  }

  const rawSlug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  if (!rawSlug) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'slug_required' }));
  }

  // Fetch the row to check category before deletion.
  const { data: existing, error: fetchError } = await auth.client
    .from('markos_reserved_slugs')
    .select('slug, category, source_version')
    .eq('slug', rawSlug)
    .maybeSingle();

  if (fetchError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: fetchError.message }));
  }

  if (!existing) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'slug_not_found' }));
  }

  // Threat T-201.1-03-02: block removal of locked categories.
  const isLocked = LOCKED_CATEGORIES.includes(existing.category) &&
    !existing.source_version.startsWith('admin-');
  if (isLocked) {
    res.statusCode = 409;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'category_locked', category: existing.category }));
  }

  const { error: deleteError } = await auth.client
    .from('markos_reserved_slugs')
    .delete()
    .eq('slug', rawSlug);

  if (deleteError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: deleteError.message }));
  }

  clearReservedSlugCache();

  try {
    await enqueueAuditStaging(auth.client, {
      tenant_id: 'tenant-0',
      org_id: auth.tenant0Id,
      source_domain: 'governance',
      action: 'reserved_slug.removed',
      actor_id: auth.userId,
      actor_role: 'owner',
      payload: { slug: rawSlug, prior_category: existing.category },
    });
  } catch {
    // Audit failure is non-fatal — the mutation succeeded.
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true }));
};
