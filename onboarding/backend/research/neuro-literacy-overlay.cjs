'use strict';

const { normalizeNeuroLiteracyMetadata } = require('./neuro-literacy-schema.cjs');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueList(value) {
  return Array.from(new Set((Array.isArray(value) ? value : []).filter((entry) => entry !== undefined && entry !== null && entry !== '')));
}

function mergeInto(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (Array.isArray(value)) {
      target[key] = uniqueList([...(Array.isArray(target[key]) ? target[key] : []), ...value]);
      continue;
    }

    if (isPlainObject(value)) {
      target[key] = mergeInto(isPlainObject(target[key]) ? { ...target[key] } : {}, value);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      target[key] = value;
    }
  }

  return target;
}

function mergeTailoringProfiles(input = {}) {
  const companySource = input.company || input.company_tailoring_profile || {};
  const icpSource = input.icp || input.icp_tailoring_profile || {};
  const stageSource = input.stage || input.stage_tailoring_profile || {};

  const company = { ...(isPlainObject(companySource) ? companySource : {}), ...normalizeNeuroLiteracyMetadata(companySource) };
  const icp = { ...(isPlainObject(icpSource) ? icpSource : {}), ...normalizeNeuroLiteracyMetadata(icpSource) };
  const stage = { ...(isPlainObject(stageSource) ? stageSource : {}), ...normalizeNeuroLiteracyMetadata(stageSource) };

  const merged = {};
  mergeInto(merged, company);
  mergeInto(merged, icp);
  mergeInto(merged, stage);

  merged.company_tailoring_profile = company.company_tailoring_profile || {};
  merged.icp_tailoring_profile = icp.icp_tailoring_profile || {};
  merged.stage_tailoring_profile = stage.stage_tailoring_profile || {};
  merged.layer_order = ['company', 'icp', 'stage'];

  return merged;
}

module.exports = {
  mergeTailoringProfiles,
};
