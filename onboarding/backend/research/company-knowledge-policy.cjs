'use strict';

const { buildTenantBoundPageIndexScope } = require('../vault/pageindex-scope.cjs');

const ALLOWED_SCOPES = Object.freeze(['literacy', 'mir', 'msp', 'evidence']);
const ALLOWED_KINDS = new Set(ALLOWED_SCOPES);
const WRITE_HINTS = Object.freeze(['write', 'approve', 'patch', 'publish', 'delete', 'mutate', 'rollback']);

function createKnowledgeError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  if (details && typeof details === 'object') {
    error.details = details;
  }
  return error;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function normalizeClaims(claims = {}) {
  const tenantId = normalizeToken(claims.tenantId || claims.tenant_id || claims.active_tenant_id);
  if (!tenantId) {
    throw createKnowledgeError('E_SCOPE_CLAIMS_MISSING', 'tenant claims are required for company knowledge access.');
  }

  return {
    tenantId,
    principalId: normalizeToken(claims.principalId || claims.principal_id || claims.user_id) || null,
    role: normalizeToken(claims.role || claims.iamRole) || null,
  };
}

function assertReadOnlyOperation(operation = 'search_markos_knowledge') {
  const normalizedOperation = normalizeToken(operation).toLowerCase() || 'search_markos_knowledge';
  if (WRITE_HINTS.some((hint) => normalizedOperation.includes(hint))) {
    throw createKnowledgeError('E_KNOWLEDGE_WRITE_BLOCKED', 'MarkOS company knowledge is read-only in v1.');
  }
  return normalizedOperation;
}

function assertTenantAccess({ claims, tenantId, mode = 'reason' }) {
  const normalizedClaims = normalizeClaims(claims);
  const normalizedTenantId = normalizeToken(tenantId) || normalizedClaims.tenantId;

  return buildTenantBoundPageIndexScope({
    claims: { tenantId: normalizedClaims.tenantId },
    resourceContext: { tenantId: normalizedTenantId },
    mode,
  });
}

function normalizeScopes(scopes) {
  const requested = Array.isArray(scopes) && scopes.length > 0 ? scopes : ALLOWED_SCOPES;
  const normalized = Array.from(new Set(requested.map((scope) => normalizeToken(scope).toLowerCase()).filter(Boolean)));
  const invalid = normalized.filter((scope) => !ALLOWED_KINDS.has(scope));

  if (invalid.length > 0) {
    throw createKnowledgeError('E_KNOWLEDGE_SCOPE_INVALID', `Unsupported knowledge scope(s): ${invalid.join(', ')}`);
  }

  return normalized.sort((a, b) => a.localeCompare(b));
}

function normalizeArtifactKind(kind) {
  const normalized = normalizeToken(kind).toLowerCase();
  if (!ALLOWED_KINDS.has(normalized)) {
    throw createKnowledgeError('E_KNOWLEDGE_KIND_INVALID', `Unsupported artifact kind '${kind}'.`);
  }
  return normalized;
}

function isApprovedRecord(record = {}) {
  const status = normalizeToken(record.approval_status || record.status || 'approved').toLowerCase();
  return status === 'approved' || status === 'canonical' || status === 'ready';
}

function assertApprovedRecord(record = {}) {
  if (!isApprovedRecord(record)) {
    throw createKnowledgeError('E_KNOWLEDGE_APPROVAL_REQUIRED', 'Only approved or canonical knowledge can be returned by this surface.');
  }
  return true;
}

module.exports = {
  ALLOWED_SCOPES,
  ALLOWED_KINDS,
  WRITE_HINTS,
  createKnowledgeError,
  normalizeToken,
  normalizeClaims,
  assertReadOnlyOperation,
  assertTenantAccess,
  normalizeScopes,
  normalizeArtifactKind,
  isApprovedRecord,
  assertApprovedRecord,
};
