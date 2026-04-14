#!/usr/bin/env node
/**
 * example-resolver.cjs — Business-Model Example Injection Utility
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { TEMPLATES_DIR } = require('../path-constants.cjs');
const {
  resolveBusinessModelFamily,
  getOverlayDocForModel,
  getStageAwareDoc,
  toAbsoluteRepoPath,
} = require('../research/template-family-map.cjs');

const DEFAULT_BASE = TEMPLATES_DIR;

const MODEL_SLUG = {
  B2B: 'b2b',
  B2C: 'b2c',
  B2B2C: 'b2b2c',
  DTC: 'dtc',
  Marketplace: 'marketplace',
  SaaS: 'saas',
  'Agents-aaS': 'agents-aas',
  b2b: 'b2b',
  b2c: 'b2c',
  b2b2c: 'b2b2c',
  dtc: 'dtc',
  marketplace: 'marketplace',
  saas: 'saas',
  'agents-aas': 'agents-aas',
  agency: 'agency',
  agencies: 'agency',
  services: 'services',
  consulting: 'consulting',
  ecommerce: 'ecommerce',
  'e-commerce': 'ecommerce',
  'info-products': 'info-products',
  'info products': 'info-products',
};

function getModelSlug(businessModel) {
  const raw = String(businessModel || '').trim();
  if (!raw) return '';
  return MODEL_SLUG[raw] || MODEL_SLUG[raw.toLowerCase()] || '';
}

function inferDiscipline(templateSubdir = '') {
  const value = String(templateSubdir || '').toLowerCase();
  if (value.includes('paid')) return 'Paid_Media';
  if (value.includes('email') || value.includes('lifecycle')) return 'Lifecycle_Email';
  if (value.includes('landing')) return 'Landing_Pages';
  if (value.includes('social')) return 'Social';
  return '';
}

function readFileSafe(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }

  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return '';
  }
}

function buildInjectionBlock(label, content) {
  return [
    `## 📌 Reference Example (${label})`,
    '_This is a completed real-world example of the section below. Use it as a quality benchmark — match the length, depth, and specificity. Do NOT copy it; generate equivalent quality for the client data above._',
    '',
    content,
    '',
    '---',
    'Now fill the same template for THIS client using the data provided above.',
    '',
  ].join('\n');
}

function resolveTemplateSelection(discipline, businessModel) {
  const family = resolveBusinessModelFamily(businessModel);
  if (!family) {
    return null;
  }

  const stageAwareDoc = getStageAwareDoc(discipline);
  const overlayDoc = getOverlayDocForModel(family, businessModel);
  const absolutePaths = [
    toAbsoluteRepoPath(stageAwareDoc || family.baseDoc),
    toAbsoluteRepoPath(family.proofDoc || ''),
    toAbsoluteRepoPath(overlayDoc || ''),
  ].filter(Boolean);

  return {
    businessModel,
    familySlug: family.slug,
    modelSlug: getModelSlug(businessModel) || family.slug,
    baseDoc: stageAwareDoc || family.baseDoc,
    overlayDoc,
    proofDoc: family.proofDoc || null,
    absolutePaths,
  };
}

function readFallbackContent(discipline, businessModel) {
  const selection = resolveTemplateSelection(discipline, businessModel);
  if (!selection) {
    return { selection: null, content: '' };
  }

  const sections = selection.absolutePaths
    .map((filePath) => readFileSafe(filePath))
    .filter(Boolean);

  return {
    selection,
    content: sections.join('\n\n'),
  };
}

function resolveExample(templateName, businessModel, templateSubdir = '', basePath = DEFAULT_BASE) {
  if (!templateName) {
    return '';
  }

  const slug = getModelSlug(businessModel);
  if (!slug) {
    return '';
  }

  const fileName = `_${templateName}-${slug}.example.md`;
  const filePath = templateSubdir
    ? path.join(basePath, templateSubdir, fileName)
    : path.join(basePath, fileName);

  const directContent = readFileSafe(filePath);
  if (directContent) {
    return buildInjectionBlock(businessModel, directContent);
  }

  if (basePath !== DEFAULT_BASE) {
    return '';
  }

  const { content } = readFallbackContent(inferDiscipline(templateSubdir), businessModel);
  return content ? buildInjectionBlock(businessModel, content) : '';
}

function resolveSkeleton(discipline, businessModel, basePath = DEFAULT_BASE) {
  const slug = getModelSlug(businessModel);
  if (!slug) {
    return '';
  }

  const filePath = path.join(basePath, 'SKELETONS', discipline, `_SKELETON-${slug}.md`);
  const directContent = readFileSafe(filePath);
  if (directContent) {
    return directContent;
  }

  if (basePath !== DEFAULT_BASE) {
    return '';
  }

  const { content } = readFallbackContent(discipline, businessModel);
  return content || '';
}

module.exports = {
  resolveExample,
  resolveSkeleton,
  resolveTemplateSelection,
  getModelSlug,
  MODEL_SLUG,
  DEFAULT_BASE,
};
