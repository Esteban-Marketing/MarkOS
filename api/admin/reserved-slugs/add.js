'use strict';

// Phase 201.1 D-109 (closes M6): admin add endpoint for reserved-slug overrides.
// Auth: requires actor on Tenant 0 with org_role='owner'. F-106 contract.

const { requireSystemAdmin } = require('./list.js');
const { enqueueAuditStaging } = require('../../../lib/markos/audit/writer.cjs');
const { clearReservedSlugCache } = require('../../../lib/markos/tenant/reserved-slugs.cjs');

const VALID_CATEGORIES = ['system', 'protected', 'vendor', 'single_char', 'profanity'];
const SLUG_RE = /^[a-z0-9-]{1,63}$/;

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
  if (!rawSlug || !SLUG_RE.test(rawSlug)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_slug', detail: 'slug must match /^[a-z0-9-]{1,63}$/' }));
  }

  const category = body.category;
  if (!VALID_CATEGORIES.includes(category)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'invalid_category', valid: VALID_CATEGORIES }));
  }

  const notes = typeof body.notes === 'string' ? body.notes.trim() : null;
  const source_version = 'admin-' + new Date().toISOString().slice(0, 10);

  const { error: insertError } = await auth.client
    .from('markos_reserved_slugs')
    .insert({
      slug: rawSlug,
      category,
      source_version,
      added_by: auth.userId,
      notes: notes || null,
    });

  if (insertError) {
    // 23505 = unique_violation (slug already exists).
    const status = insertError.code === '23505' ? 409 : 500;
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: insertError.message }));
  }

  clearReservedSlugCache();

  try {
    await enqueueAuditStaging(auth.client, {
      tenant_id: 'tenant-0',
      org_id: auth.tenant0Id,
      source_domain: 'governance',
      action: 'reserved_slug.added',
      actor_id: auth.userId,
      actor_role: 'owner',
      payload: { slug: rawSlug, category, notes },
    });
  } catch {
    // Audit failure is non-fatal — the mutation succeeded.
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ ok: true, slug: rawSlug }));
};
