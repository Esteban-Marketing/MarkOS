'use strict';

const { buildStandardsNamespaceName } = require('../vector-store-client.cjs');

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isStandardsNamespace(name) {
  return /^markos-standards-[a-z0-9_]+$/.test(String(name || ''));
}

function isClientNamespaceForSlug(namespaceName, slug) {
  const text = String(namespaceName || '');
  return text.startsWith(`${slug}-`) || text.startsWith(`markos-${slug}-`);
}

async function auditNamespaces(options = {}) {
  const projectSlug = normalizeSlug(options.projectSlug);
  if (!projectSlug) {
    throw new Error('auditNamespaces requires projectSlug.');
  }

  const disciplines = Array.isArray(options.disciplines) && options.disciplines.length > 0
    ? options.disciplines
    : ['paid_media', 'seo', 'email_lifecycle'];

  const listNamespaces = typeof options.listNamespaces === 'function'
    ? options.listNamespaces
    : async () => [];

  const namespaces = await listNamespaces();
  const namespaceList = Array.isArray(namespaces) ? namespaces : [];
  const clientNamespaces = namespaceList.filter((name) => !String(name).startsWith('markos-standards-'));
  const standardsNamespaces = disciplines.map((discipline) => buildStandardsNamespaceName(discipline));

  const clientErrors = clientNamespaces
    .filter((name) => !isClientNamespaceForSlug(name, projectSlug))
    .map((name) => `Namespace ${name} is outside slug scope ${projectSlug}.`);

  const standardsErrors = standardsNamespaces
    .filter((name) => !isStandardsNamespace(name))
    .map((name) => `Invalid standards namespace format: ${name}.`);

  return {
    ok: clientErrors.length === 0 && standardsErrors.length === 0,
    project_slug: projectSlug,
    client_namespaces_checked: clientNamespaces,
    standards_namespaces_checked: standardsNamespaces,
    errors: [...clientErrors, ...standardsErrors],
  };
}

module.exports = {
  auditNamespaces,
  isClientNamespaceForSlug,
  isStandardsNamespace,
  normalizeSlug,
};
