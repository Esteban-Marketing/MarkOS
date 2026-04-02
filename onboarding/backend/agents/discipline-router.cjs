'use strict';

const fs = require('fs');
const path = require('path');

const DISCIPLINE_ORDER = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages'];
const DEFAULT_DISCIPLINE_FALLBACK = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email'];
const TAXONOMY_PATH = path.resolve(__dirname, '../../../.agent/markos/literacy/taxonomy.json');

const CHANNEL_ALIASES = {
  Lifecycle_Email: ['email', 'newsletter', 'drip', 'crm'],
  Content_SEO: ['seo', 'organic search', 'blog', 'content', 'search'],
  Paid_Media: ['google ads', 'meta ads', 'facebook ads', 'linkedin ads', 'tiktok ads', 'ppc', 'paid search', 'paid social'],
  Social: ['linkedin', 'instagram', 'tiktok', 'facebook', 'x', 'twitter', 'youtube', 'social'],
  Landing_Pages: ['landing page', 'cro', 'conversion', 'form', 'website', 'webinar page'],
};

const FALLBACK_PARENT_DISCIPLINES = {
  high_acquisition_cost: ['Paid_Media', 'Content_SEO'],
  low_conversions: ['Paid_Media', 'Landing_Pages'],
  poor_retention_churn: ['Lifecycle_Email'],
  low_organic_visibility: ['Content_SEO'],
  attribution_measurement: ['Paid_Media', 'Social'],
  audience_mismatch: ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages'],
  pipeline_velocity: ['Lifecycle_Email', 'Landing_Pages'],
  content_engagement: ['Social', 'Content_SEO'],
};

const PARENT_KEYWORDS = {
  high_acquisition_cost: ['cac', 'cpl', 'cpa', 'cpr', 'roas', 'expensive leads', 'ad costs', 'acquisition cost'],
  low_conversions: ['conversion', 'cvr', 'form completion', 'checkout', 'landing page', 'low conversions'],
  poor_retention_churn: ['churn', 'retention', 'unsubscribes', 'repeat purchase', 'retention drop', 'high churn'],
  low_organic_visibility: ['seo', 'rankings', 'organic traffic', 'search visibility', 'low organic'],
  attribution_measurement: ['attribution', 'tracking', 'measurement', 'analytics', 'utm'],
  audience_mismatch: ['wrong audience', 'bad fit', 'irrelevant traffic', 'unqualified'],
  pipeline_velocity: ['stalled leads', 'pipeline', 'follow-up', 'nurture', 'mid funnel', 'velocity'],
  content_engagement: ['engagement', 'shares', 'comments', 'reach', 'awareness'],
};

let cachedParentDisciplines = null;
let warnedMissingTaxonomy = false;

function getParentDisciplinesMap() {
  if (cachedParentDisciplines) {
    return cachedParentDisciplines;
  }

  try {
    if (!fs.existsSync(TAXONOMY_PATH)) {
      if (!warnedMissingTaxonomy) {
        console.warn('[discipline-router] taxonomy.json not found, using DEFAULT_DISCIPLINE_FALLBACK parent map');
        warnedMissingTaxonomy = true;
      }
      cachedParentDisciplines = { ...FALLBACK_PARENT_DISCIPLINES };
      return cachedParentDisciplines;
    }

    const parsed = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
    const parents = Array.isArray(parsed.parents) ? parsed.parents : [];
    const map = {};
    for (const parent of parents) {
      if (!parent || typeof parent.tag !== 'string') continue;
      map[parent.tag] = Array.isArray(parent.disciplines) ? parent.disciplines.filter((entry) => DISCIPLINE_ORDER.includes(entry)) : [];
    }

    cachedParentDisciplines = Object.keys(map).length > 0 ? map : { ...FALLBACK_PARENT_DISCIPLINES };
    return cachedParentDisciplines;
  } catch {
    if (!warnedMissingTaxonomy) {
      console.warn('[discipline-router] taxonomy.json load failed, using DEFAULT_DISCIPLINE_FALLBACK parent map');
      warnedMissingTaxonomy = true;
    }
    cachedParentDisciplines = { ...FALLBACK_PARENT_DISCIPLINES };
    return cachedParentDisciplines;
  }
}

function normalizeArray(input) {
  return Array.isArray(input)
    ? input.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
    : [];
}

function getMatchedParentTags(painPoints) {
  const matched = new Set();
  for (const phrase of painPoints) {
    for (const [parentTag, keywords] of Object.entries(PARENT_KEYWORDS)) {
      if (keywords.some((keyword) => phrase.includes(keyword))) {
        matched.add(parentTag);
      }
    }
  }
  return [...matched];
}

function rankDisciplines(seed) {
  const scores = Object.fromEntries(DISCIPLINE_ORDER.map((discipline) => [discipline, 0]));
  const channels = normalizeArray(seed && seed.content ? seed.content.active_channels : []);
  const painPoints = normalizeArray(seed && seed.audience ? seed.audience.pain_points : []);

  for (const [channelIndex, channel] of channels.entries()) {
    const positionBoost = (channels.length - channelIndex) / 100;
    for (const [discipline, aliases] of Object.entries(CHANNEL_ALIASES)) {
      if (aliases.some((alias) => channel.includes(alias))) {
        scores[discipline] += 4 + positionBoost;
      }
    }
  }

  const parentDisciplines = getParentDisciplinesMap();
  const matchedParents = getMatchedParentTags(painPoints);

  for (const parentTag of matchedParents) {
    const mapped = Array.isArray(parentDisciplines[parentTag]) ? parentDisciplines[parentTag] : [];
    for (const discipline of mapped) {
      if (discipline in scores) {
        scores[discipline] += 2;
      }
    }
  }

  const ranked = [...DISCIPLINE_ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) {
      return scores[b] - scores[a];
    }
    return DISCIPLINE_ORDER.indexOf(a) - DISCIPLINE_ORDER.indexOf(b);
  });

  const positive = ranked.filter((discipline) => scores[discipline] > 0);
  const result = [...positive];

  for (const discipline of DEFAULT_DISCIPLINE_FALLBACK) {
    if (result.length >= 3) break;
    if (!result.includes(discipline)) {
      result.push(discipline);
    }
  }

  return result.slice(0, 5);
}

module.exports = {
  rankDisciplines,
};