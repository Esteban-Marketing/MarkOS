const test = require('node:test');
const assert = require('node:assert/strict');

const {
  REQUIRED_CORE_FILTERS,
  normalizeDeepResearchFilters,
} = require('../../onboarding/backend/research/filter-taxonomy-v1.cjs');
const { getResearchModeConfig } = require('../../onboarding/backend/research/research-mode-taxonomy.cjs');

test('91-01 filter taxonomy normalizes required core filters deterministically', () => {
  const normalized = normalizeDeepResearchFilters({
    industry: ['b2b_saas', 'b2b_saas'],
    company: { name: '  Acme  ', domain: ' ACME.com ' },
    audience: ['revops_leader', 'revops_leader'],
    offer_product: ['pipeline_analytics_platform', 'pipeline_analytics_platform'],
    extensions: {
      geography: ['north_america', 'north_america'],
      compliance: ['soc2'],
    },
  });

  assert.deepEqual(REQUIRED_CORE_FILTERS, ['industry', 'company', 'audience', 'offer_product']);
  assert.deepEqual(normalized, {
    industry: ['b2b_saas'],
    company: { name: 'Acme', domain: 'acme.com' },
    audience: ['revops_leader'],
    offer_product: ['pipeline_analytics_platform'],
    extensions: {
      compliance: ['soc2'],
      geography: ['north_america'],
    },
  });

  assert.equal(getResearchModeConfig('company').previewOnly, true);
});

test('91-01 filter taxonomy rejects missing required filters and invalid company payloads', () => {
  assert.throws(() => {
    normalizeDeepResearchFilters({
      industry: ['b2b_saas'],
      audience: ['revops_leader'],
      offer_product: ['pipeline_analytics_platform'],
    });
  }, (error) => error?.code === 'E_DEEP_RESEARCH_FILTER_REQUIRED');

  assert.throws(() => {
    normalizeDeepResearchFilters({
      industry: ['b2b_saas'],
      company: { name: 'Acme' },
      audience: ['revops_leader'],
      offer_product: ['pipeline_analytics_platform'],
    });
  }, (error) => error?.code === 'E_DEEP_RESEARCH_COMPANY_REQUIRED');
});


test('91-01 research mode taxonomy defines the canonical phase-91 modes', () => {
  const expectedModes = [
    'market',
    'audience',
    'company',
    'competitor',
    'niche',
    'regulation',
    'offer',
    'messaging',
    'channel',
    'seo',
    'content_gap',
    'localization',
    'trend',
    'account_based',
  ];

  for (const mode of expectedModes) {
    const config = getResearchModeConfig(mode);
    assert.equal(config.mode, mode);
    assert.equal(config.allowWrite, false);
    assert.equal(config.previewOnly, true);
    assert.ok(Array.isArray(config.applicableFilters));
    assert.ok(config.applicableFilters.length >= 1);
  }
});
