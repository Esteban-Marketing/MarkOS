'use strict';

const path = require('path');
const { PROJECT_ROOT } = require('../path-constants.cjs');

const SHARED_BASE_DOC = '.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md';
const SHARED_PROOF_DOC = '.agent/markos/literacy/Shared/TPL-SHARED-proof-posture.md';

const STAGE_AWARE_DOCS = Object.freeze({
  Paid_Media: '.agent/markos/literacy/Paid_Media/TPL-PM-stage-aware-universal.md',
  Lifecycle_Email: '.agent/markos/literacy/Lifecycle_Email/TPL-LE-stage-aware-universal.md',
  Landing_Pages: '.agent/markos/literacy/Landing_Pages/TPL-LP-stage-aware-universal.md',
});

const OVERLAY_DOCS = Object.freeze({
  saas: '.agent/markos/literacy/Shared/TPL-SHARED-overlay-saas.md',
  consulting: '.agent/markos/literacy/Shared/TPL-SHARED-overlay-consulting.md',
  ecommerce: '.agent/markos/literacy/Shared/TPL-SHARED-overlay-ecommerce.md',
  'info-products': '.agent/markos/literacy/Shared/TPL-SHARED-overlay-info-products.md',
});

const FAMILY_REGISTRY = Object.freeze([
  {
    slug: 'b2b',
    aliases: ['b2b', 'business to business', 'enterprise'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {},
  },
  {
    slug: 'b2c',
    aliases: ['b2c', 'business to consumer', 'consumer'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {},
  },
  {
    slug: 'agency',
    aliases: ['agency', 'agencies', 'agents-aas', 'agents aas', 'agentic services'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {},
  },
  {
    slug: 'services',
    aliases: ['services', 'service', 'consulting', 'consultant', 'professional services'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {
      consulting: OVERLAY_DOCS.consulting,
    },
  },
  {
    slug: 'saas',
    aliases: ['saas', 'software as a service', 'software-service'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {
      saas: OVERLAY_DOCS.saas,
    },
  },
  {
    slug: 'ecommerce',
    aliases: ['ecommerce', 'e-commerce', 'dtc', 'marketplace', 'retail'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {
      ecommerce: OVERLAY_DOCS.ecommerce,
    },
  },
  {
    slug: 'info-products',
    aliases: ['info-products', 'info products', 'digital products', 'course', 'courses', 'education offer'],
    baseDoc: SHARED_BASE_DOC,
    proofDoc: SHARED_PROOF_DOC,
    overlayDocs: {
      'info-products': OVERLAY_DOCS['info-products'],
    },
  },
]);

function canonicalizeValue(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[._/]+/g, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9\s-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeBusinessModel(value) {
  const token = canonicalizeValue(value);
  if (!token) return '';

  for (const entry of FAMILY_REGISTRY) {
    if (token === canonicalizeValue(entry.slug)) {
      return entry.slug;
    }

    if (entry.aliases.some((alias) => canonicalizeValue(alias) === token)) {
      return entry.slug;
    }
  }

  return '';
}

function inferOverlayKey(value) {
  const token = canonicalizeValue(value);
  if (!token) return null;
  if (token === 'saas' || token === 'software as a service') return 'saas';
  if (token === 'consulting' || token === 'consultant') return 'consulting';
  if (token === 'ecommerce' || token === 'e-commerce' || token === 'dtc' || token === 'marketplace' || token === 'retail') return 'ecommerce';
  if (token === 'info-products' || token === 'info products' || token === 'digital products' || token === 'course' || token === 'courses' || token === 'education offer') return 'info-products';
  return null;
}

function getFamilyEntry(familySlug) {
  const slug = normalizeBusinessModel(familySlug) || canonicalizeValue(familySlug);
  return FAMILY_REGISTRY.find((entry) => entry.slug === slug) || null;
}

function resolveBusinessModelFamily(value) {
  const slug = normalizeBusinessModel(value);
  return slug ? getFamilyEntry(slug) : null;
}

function getOverlayDocForModel(entry, businessModel) {
  const overlayKey = inferOverlayKey(businessModel);
  if (!entry || !overlayKey) return null;
  return entry.overlayDocs && entry.overlayDocs[overlayKey] ? entry.overlayDocs[overlayKey] : null;
}

function getStageAwareDoc(discipline) {
  return STAGE_AWARE_DOCS[discipline] || SHARED_BASE_DOC;
}

function toAbsoluteRepoPath(relativePath) {
  if (!relativePath) return '';
  return path.join(PROJECT_ROOT, ...String(relativePath).split('/'));
}

module.exports = {
  FAMILY_REGISTRY,
  OVERLAY_DOCS,
  STAGE_AWARE_DOCS,
  SHARED_BASE_DOC,
  SHARED_PROOF_DOC,
  canonicalizeValue,
  normalizeBusinessModel,
  inferOverlayKey,
  getFamilyEntry,
  resolveBusinessModelFamily,
  getOverlayDocForModel,
  getStageAwareDoc,
  toAbsoluteRepoPath,
};
