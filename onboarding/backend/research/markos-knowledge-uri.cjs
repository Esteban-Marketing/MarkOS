'use strict';

const {
  createKnowledgeError,
  normalizeToken,
  normalizeArtifactKind,
  assertTenantAccess,
} = require('./company-knowledge-policy.cjs');

function looksLikeRawPath(value) {
  const raw = String(value || '').trim();
  return /^[a-zA-Z]:[\\/]/.test(raw)
    || raw.startsWith('\\\\')
    || raw.startsWith('./')
    || raw.startsWith('../')
    || raw.startsWith('/');
}

function buildMarkosKnowledgeUri({ tenantId, kind, artifactId, section = null }) {
  const normalizedTenantId = normalizeToken(tenantId);
  const normalizedKind = normalizeArtifactKind(kind);
  const normalizedArtifactId = normalizeToken(artifactId);

  if (!normalizedTenantId || !normalizedArtifactId) {
    throw createKnowledgeError('E_MARKOS_URI_PARTS_REQUIRED', 'tenantId and artifactId are required to build a MarkOS knowledge URI.');
  }

  let uri = `markos://tenant/${encodeURIComponent(normalizedTenantId)}/${normalizedKind}/${encodeURIComponent(normalizedArtifactId)}`;
  const normalizedSection = normalizeToken(section);
  if (normalizedSection) {
    uri += `#section=${encodeURIComponent(normalizedSection)}`;
  }

  return uri;
}

function parseMarkosKnowledgeUri(uri, options = {}) {
  const raw = String(uri || '').trim();
  if (!raw) {
    throw createKnowledgeError('E_MARKOS_URI_REQUIRED', 'uri is required.');
  }

  if (looksLikeRawPath(raw)) {
    throw createKnowledgeError('E_MARKOS_URI_RAW_PATH_FORBIDDEN', 'Raw storage paths are not allowed in the company knowledge surface.');
  }

  const pattern = /^markos:\/\/tenant\/([^/]+)\/([^/]+)\/([^#?]+)(?:#section=([^#]+))?$/i;
  const match = pattern.exec(raw);
  if (!match) {
    throw createKnowledgeError('E_MARKOS_URI_INVALID', 'uri must match markos://tenant/{tenant_id}/{kind}/{artifact_id}[#section=SECTION].');
  }

  const tenant_id = decodeURIComponent(match[1]);
  const kind = normalizeArtifactKind(decodeURIComponent(match[2]));
  const artifact_id = decodeURIComponent(match[3]);
  const section = match[4] ? decodeURIComponent(match[4]) : null;

  if (options.claims) {
    assertTenantAccess({ claims: options.claims, tenantId: tenant_id, mode: 'reason' });
  }

  return {
    tenant_id,
    kind,
    artifact_id,
    section,
    uri: buildMarkosKnowledgeUri({ tenantId: tenant_id, kind, artifactId: artifact_id, section }),
  };
}

module.exports = {
  buildMarkosKnowledgeUri,
  parseMarkosKnowledgeUri,
};
