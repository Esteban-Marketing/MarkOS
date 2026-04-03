const test = require('node:test');
const assert = require('node:assert/strict');

const {
  selectDisciplinesForActivation,
} = require('../../onboarding/backend/literacy/discipline-selection.cjs');

function createSeed() {
  return {
    company: { business_model: 'SaaS' },
    audience: { pain_points: ['high acquisition cost', 'low conversions'] },
    content: { active_channels: ['Google Ads', 'Email', 'SEO'] },
  };
}

test('activation evidence includes MIR inputs and purchased-service rationale for selected and unselected disciplines', () => {
  const result = selectDisciplinesForActivation(createSeed(), {
    gate1Readiness: { readiness: 'ready', missing_entities: [] },
    serviceContext: {
      purchased_disciplines: ['Paid_Media', 'Lifecycle_Email'],
      previous_disciplines: ['Content_SEO'],
      deactivation_rationale_by_discipline: {
        Content_SEO: 'SEO remains inactive because the current purchased service scope excludes it.',
      },
    },
  });

  assert.deepEqual(
    result.selected_disciplines.map((entry) => entry.discipline),
    ['Paid_Media', 'Lifecycle_Email']
  );
  assert.equal(result.selected_disciplines[0].selected, true);
  assert.equal(result.selected_disciplines[0].service_context.purchased, true);
  assert.equal(result.selected_disciplines[0].mir_inputs.business_model, 'SaaS');
  assert.match(result.selected_disciplines[0].rationale, /purchased service/i);

  const unselected = result.unselected_disciplines.find((entry) => entry.discipline === 'Content_SEO');
  assert.ok(unselected);
  assert.equal(unselected.selected, false);
  assert.match(unselected.rationale, /service context/i);
});

test('rejects discipline activation when service context is missing', () => {
  assert.throws(
    () => selectDisciplinesForActivation(createSeed(), {
      gate1Readiness: { readiness: 'ready', missing_entities: [] },
    }),
    /service context/i
  );
});

test('fails unexplained deactivation attempts for previously active disciplines', () => {
  assert.throws(
    () => selectDisciplinesForActivation(createSeed(), {
      gate1Readiness: { readiness: 'ready', missing_entities: [] },
      serviceContext: {
        purchased_disciplines: ['Paid_Media'],
        previous_disciplines: ['Content_SEO'],
      },
    }),
    /deactivation rationale/i
  );
});