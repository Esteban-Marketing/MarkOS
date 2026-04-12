const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Test fixtures
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadFixture(filename) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8'));
}

/**
 * Brand Input Schema Validator
 * Enforces D-01 (segment bounds 2-5), D-02 (required rationale), D-03 (structured fields)
 */
function validateBrandInput(payload) {
  const errors = [];

  // Check audience_segments bounds: 2-5 segments (D-01)
  if (!payload.audience_segments) {
    errors.push('audience_segments is required');
  } else if (!Array.isArray(payload.audience_segments)) {
    errors.push('audience_segments must be an array');
  } else if (payload.audience_segments.length < 2) {
    errors.push(`audience_segments must have at least 2 segments, got ${payload.audience_segments.length}`);
  } else if (payload.audience_segments.length > 5) {
    errors.push(`audience_segments must have at most 5 segments, got ${payload.audience_segments.length}`);
  }

  // Validate each segment structure (D-03)
  if (Array.isArray(payload.audience_segments)) {
    payload.audience_segments.forEach((segment, idx) => {
      const prefix = `audience_segments[${idx}]`;

      // Required fields
      if (!segment.segment_name) {
        errors.push(`${prefix}.segment_name is required`);
      }
      if (!segment.segment_id) {
        errors.push(`${prefix}.segment_id is required`);
      }

      // Structured array fields with rationale validation (D-02, D-03)
      ['pains', 'needs', 'expectations'].forEach(field => {
        if (segment[field]) {
          if (!Array.isArray(segment[field])) {
            errors.push(`${prefix}.${field} must be an array`);
          } else {
            segment[field].forEach((item, itemIdx) => {
              const itemPrefix = `${prefix}.${field}[${itemIdx}]`;

              // Must have the typed field (e.g., "pain", "need", "expectation")
              const singularField = field.slice(0, -1); // Remove 's' for plural
              if (!item[singularField]) {
                errors.push(`${itemPrefix}.${singularField} is required (D-03)`);
              }

              // Must have rationale (D-02)
              if (!item.rationale) {
                errors.push(`${itemPrefix}.rationale is required (D-02 structured rationale)`);
              }
            });
          }
        }
      });

      // Desired outcomes should be array or string array
      if (segment.desired_outcomes && !Array.isArray(segment.desired_outcomes)) {
        errors.push(`${prefix}.desired_outcomes must be an array`);
      }
    });
  }

  // Validate brand_profile structure
  if (payload.brand_profile) {
    if (!payload.brand_profile.primary_name) {
      errors.push('brand_profile.primary_name is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

test('schema: valid brand input with 3 segments passes validation', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const result = validateBrandInput(payload);

  assert.equal(result.valid, true, `Expected valid but got errors: ${result.errors.join(', ')}`);
  assert.equal(payload.audience_segments.length, 3, 'Should have 3 segments');
  assert.equal(payload.audience_segments[0].segment_name, 'Enterprise Data Teams');
});

test('schema: D-01 rejects < 2 segments', async () => {
  const payload = loadFixture('brand-input-invalid-segments.json');
  const result = validateBrandInput(payload);

  assert.equal(result.valid, false, 'Should be invalid with 1 segment');
  assert.ok(
    result.errors.some(e => e.includes('at least 2 segments')),
    `Expected segment count error, got: ${result.errors.join(', ')}`
  );
});

test('schema: D-01 rejects > 5 segments', async () => {
  const segments = Array.from({ length: 6 }, (_, i) => ({
    segment_name: `Segment ${i}`,
    segment_id: `seg-${i}`,
    pains: [{ pain: 'test', rationale: 'test' }],
    needs: [{ need: 'test', rationale: 'test' }],
    expectations: [{ expectation: 'test', rationale: 'test' }],
    desired_outcomes: ['test']
  }));

  const payload = {
    brand_profile: { primary_name: 'Test' },
    audience_segments: segments,
    metadata: { tenant_id: 'test' }
  };

  const result = validateBrandInput(payload);
  assert.equal(result.valid, false, 'Should be invalid with 6 segments');
  assert.ok(
    result.errors.some(e => e.includes('at most 5 segments')),
    `Expected max segment error, got: ${result.errors.join(', ')}`
  );
});

test('schema: D-01 accepts 2 segments (boundary)', async () => {
  const segments = Array.from({ length: 2 }, (_, i) => ({
    segment_name: `Segment ${i}`,
    segment_id: `seg-${i}`,
    pains: [{ pain: 'test pain', rationale: 'test rationale' }],
    needs: [{ need: 'test need', rationale: 'test rationale' }],
    expectations: [{ expectation: 'test expectation', rationale: 'test rationale' }],
    desired_outcomes: ['test']
  }));

  const payload = {
    brand_profile: { primary_name: 'Test' },
    audience_segments: segments,
    metadata: { tenant_id: 'test' }
  };

  const result = validateBrandInput(payload);
  assert.equal(result.valid, true, `Expected valid with 2 segments but got errors: ${result.errors.join(', ')}`);
});

test('schema: D-01 accepts 5 segments (boundary)', async () => {
  const segments = Array.from({ length: 5 }, (_, i) => ({
    segment_name: `Segment ${i}`,
    segment_id: `seg-${i}`,
    pains: [{ pain: 'test', rationale: 'test' }],
    needs: [{ need: 'test', rationale: 'test' }],
    expectations: [{ expectation: 'test', rationale: 'test' }],
    desired_outcomes: ['test']
  }));

  const payload = {
    brand_profile: { primary_name: 'Test' },
    audience_segments: segments,
    metadata: { tenant_id: 'test' }
  };

  const result = validateBrandInput(payload);
  assert.equal(result.valid, true, `Expected valid with 5 segments but got errors: ${result.errors.join(', ')}`);
});

test('schema: D-02 requires rationale on all pain/need/expectation items', async () => {
  const payload = loadFixture('brand-input-missing-rationale.json');
  const result = validateBrandInput(payload);

  assert.equal(result.valid, false, 'Should be invalid with missing rationale');
  assert.ok(
    result.errors.some(e => e.includes('rationale')),
    `Expected rationale error, got: ${result.errors.join(', ')}`
  );
});

test('schema: D-03 enforces structured typed fields (pain/need/expectation)', async () => {
  const payload = {
    brand_profile: { primary_name: 'Test' },
    audience_segments: [
      {
        segment_name: 'Seg1',
        segment_id: 'seg-1',
        pains: [{ rationale: 'test' }], // Missing 'pain' field
        needs: [{ need: 'test', rationale: 'test' }],
        expectations: [{ expectation: 'test', rationale: 'test' }],
        desired_outcomes: ['test']
      },
      {
        segment_name: 'Seg2',
        segment_id: 'seg-2',
        pains: [{ pain: 'test', rationale: 'test' }],
        needs: [{ need: 'test', rationale: 'test' }],
        expectations: [{ expectation: 'test', rationale: 'test' }],
        desired_outcomes: ['test']
      }
    ],
    metadata: { tenant_id: 'test' }
  };

  const result = validateBrandInput(payload);
  assert.equal(result.valid, false, 'Should be invalid when pain field is missing');
  assert.ok(
    result.errors.some(e => e.includes('.pain is required')),
    `Expected pain field error, got: ${result.errors.join(', ')}`
  );
});

test('schema: all pains in valid fixture have rationale (D-02)', async () => {
  const payload = loadFixture('brand-input-valid.json');

  payload.audience_segments.forEach((segment, segIdx) => {
    if (segment.pains) {
      segment.pains.forEach((pain, painIdx) => {
        assert.ok(
          pain.rationale,
          `Segment ${segIdx} pain ${painIdx} missing rationale: ${pain.pain}`
        );
      });
    }
  });
});

test('schema: all needs in valid fixture have rationale (D-02)', async () => {
  const payload = loadFixture('brand-input-valid.json');

  payload.audience_segments.forEach((segment, segIdx) => {
    if (segment.needs) {
      segment.needs.forEach((need, needIdx) => {
        assert.ok(
          need.rationale,
          `Segment ${segIdx} need ${needIdx} missing rationale: ${need.need}`
        );
      });
    }
  });
});

test('schema: all expectations in valid fixture have rationale (D-02)', async () => {
  const payload = loadFixture('brand-input-valid.json');

  payload.audience_segments.forEach((segment, segIdx) => {
    if (segment.expectations) {
      segment.expectations.forEach((exp, expIdx) => {
        assert.ok(
          exp.rationale,
          `Segment ${segIdx} expectation ${expIdx} missing rationale: ${exp.expectation}`
        );
      });
    }
  });
});
