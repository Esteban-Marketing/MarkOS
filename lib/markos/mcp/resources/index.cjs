'use strict';

// Phase 202 Plan 08 — Resource registry + read dispatcher (D-25).
// Exports:
//   RESOURCE_TEMPLATES    frozen array of 3 MCP 2025-06-18 resource templates
//   listResourceTemplates returns a fresh copy (clients mutate without affecting registry)
//   listResources         returns per-session concrete URIs with tenant substituted
//   readResource          URI dispatcher — tenant scope enforced in each resolver

const canon = require('./canon.cjs');
const literacy = require('./literacy.cjs');
const tenantStatus = require('./tenant-status.cjs');

const RESOURCE_TEMPLATES = Object.freeze([
  Object.freeze({
    uriTemplate: canon.uriTemplate,
    name: 'canon',
    title: 'Brand canon for tenant',
    mimeType: 'application/json',
  }),
  Object.freeze({
    uriTemplate: literacy.uriTemplate,
    name: 'literacy',
    title: 'Literacy library for tenant',
    mimeType: 'application/json',
  }),
  Object.freeze({
    uriTemplate: tenantStatus.uriTemplate,
    name: 'tenant-status',
    title: 'Current tenant health',
    mimeType: 'application/json',
  }),
]);

function listResourceTemplates() {
  // Return a fresh shallow copy so callers cannot mutate the frozen registry reference.
  return RESOURCE_TEMPLATES.slice();
}

function listResources(session) {
  if (!session || !session.tenant_id) return [];
  return [
    {
      uri: `mcp://markos/canon/${session.tenant_id}`,
      name: 'canon',
      mimeType: 'application/json',
    },
    {
      uri: `mcp://markos/literacy/${session.tenant_id}`,
      name: 'literacy',
      mimeType: 'application/json',
    },
    {
      uri: 'mcp://markos/tenant/status',
      name: 'tenant-status',
      mimeType: 'application/json',
    },
  ];
}

async function readResource(uri, session, supabase, deps) {
  if (canon.parseUri(uri)) return canon.resolve({ uri, session, supabase, deps });
  if (literacy.parseUri(uri)) return literacy.resolve({ uri, session, supabase, deps });
  if (tenantStatus.parseUri(uri)) return tenantStatus.resolve({ uri, session, supabase, deps });
  return { error: 'resource_not_found' };
}

module.exports = {
  RESOURCE_TEMPLATES,
  listResourceTemplates,
  listResources,
  readResource,
};
