const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Import the handlers validation rules
const handlersPath = path.join(__dirname, '..', '..', 'onboarding', 'backend', 'handlers.cjs');
const handlersContent = fs.readFileSync(handlersPath, 'utf8');

// Extract INTAKE_VALIDATION_RULES from handlers
// This is a bit hacky but tests that the rules are present
test('handlers: INTAKE_VALIDATION_RULES includes brand input rules (R_BRAND_01, R_BRAND_02, R_BRAND_03)', async () => {
  assert.ok(handlersContent.includes('R_BRAND_01'), 'Should define R_BRAND_01 rule');
  assert.ok(handlersContent.includes('R_BRAND_02'), 'Should define R_BRAND_02 rule');
  assert.ok(handlersContent.includes('R_BRAND_03'), 'Should define R_BRAND_03 rule');
  
  // Verify these rules check brand_input constraints
  assert.ok(handlersContent.includes('brand_input'), 'Rules should reference brand_input');
  assert.ok(handlersContent.includes('audience_segments'), 'Rules should check audience_segments');
  assert.ok(handlersContent.includes('2-5 segments'), 'Should enforce 2-5 segment bounds (D-01)');
});

test('schema: onboarding-seed.schema.json includes brand_input extension', async () => {
  const schemaPath = path.join(__dirname, '..', '..', 'onboarding', 'onboarding-seed.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  
  assert.ok(schema.properties.brand_input, 'Schema should have brand_input property');
  
  const brandInputProp = schema.properties.brand_input;
  assert.equal(brandInputProp.type, 'object', 'brand_input should be object type');
  assert.ok(brandInputProp.properties.brand_profile, 'Should have brand_profile');
  assert.ok(brandInputProp.properties.audience_segments, 'Should have audience_segments');
  
  const segmentsProp = brandInputProp.properties.audience_segments;
  assert.equal(segmentsProp.minItems, 2, 'Should enforce minItems: 2 (D-01)');
  assert.equal(segmentsProp.maxItems, 5, 'Should enforce maxItems: 5 (D-01)');
  
  // Verify rationale is required in segment items
  const segmentItem = segmentsProp.items;
  assert.ok(segmentItem.properties.pains, 'Should define pains');
  assert.ok(segmentItem.properties.needs, 'Should define needs');
  assert.ok(segmentItem.properties.expectations, 'Should define expectations');
  
  // Check that each item requires rationale
  const painItem = segmentItem.properties.pains.items;
  assert.ok(painItem.required && painItem.required.includes('rationale'), 'Pain items should require rationale (D-02)');
});
