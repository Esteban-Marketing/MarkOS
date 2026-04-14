'use strict';

const MODE_CONFIG = Object.freeze({
  market: { mode: 'market', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'company', 'audience'] },
  audience: { mode: 'audience', previewOnly: true, allowWrite: false, applicableFilters: ['audience', 'offer_product'] },
  company: { mode: 'company', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'company', 'audience', 'offer_product'] },
  competitor: { mode: 'competitor', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'company'] },
  niche: { mode: 'niche', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'audience'] },
  regulation: { mode: 'regulation', previewOnly: true, allowWrite: false, applicableFilters: ['industry'] },
  offer: { mode: 'offer', previewOnly: true, allowWrite: false, applicableFilters: ['offer_product', 'audience'] },
  messaging: { mode: 'messaging', previewOnly: true, allowWrite: false, applicableFilters: ['audience', 'offer_product'] },
  channel: { mode: 'channel', previewOnly: true, allowWrite: false, applicableFilters: ['audience', 'industry'] },
  seo: { mode: 'seo', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'offer_product'] },
  content_gap: { mode: 'content_gap', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'audience', 'offer_product'] },
  localization: { mode: 'localization', previewOnly: true, allowWrite: false, applicableFilters: ['audience', 'industry'] },
  trend: { mode: 'trend', previewOnly: true, allowWrite: false, applicableFilters: ['industry', 'company'] },
  account_based: { mode: 'account_based', previewOnly: true, allowWrite: false, applicableFilters: ['company', 'audience', 'offer_product'] },
});

function createError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getResearchModeConfig(mode) {
  const key = String(mode || '').trim().toLowerCase();
  const config = MODE_CONFIG[key];
  if (!config) {
    throw createError('E_DEEP_RESEARCH_INVALID_TYPE', `Unsupported research_type: ${mode}`);
  }
  return { ...config };
}

module.exports = {
  MODE_CONFIG,
  getResearchModeConfig,
};
