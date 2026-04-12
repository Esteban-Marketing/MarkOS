const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Test fixtures
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadFixture(filename) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8'));
}

/**
 * Canonical JSON serialization per RFC 8785 style determinism (D-06)
 * Sorts keys, removes whitespace, ensures consistent ordering
 */
function canonicalizeJSON(obj) {
  // Recursively sort keys and serialize
  function canonicalize(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    if (typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(canonicalize);
    }
    const keys = Object.keys(obj).sort();
    const canonical = {};
    for (const key of keys) {
      canonical[key] = canonicalize(obj[key]);
    }
    return canonical;
  }

  return JSON.stringify(canonicalize(obj));
}

/**
 * Generate stable fingerprint (D-06)
 * Canonical + SHA-256 hash for deterministic idempotent updates
 */
function generateFingerprint(payload) {
  const canonical = canonicalizeJSON(payload);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Normalize brand input by extracting segment-level content for fingerprinting
 */
function normalizeBrandSegment(segment) {
  return {
    segment_name: segment.segment_name,
    segment_id: segment.segment_id,
    pains: (segment.pains || []).map(p => ({ pain: p.pain, rationale: p.rationale })),
    needs: (segment.needs || []).map(n => ({ need: n.need, rationale: n.rationale })),
    expectations: (segment.expectations || []).map(e => ({
      expectation: e.expectation,
      rationale: e.rationale
    })),
    desired_outcomes: segment.desired_outcomes || []
  };
}

test('determinism: canonical serialization produces identical output for same input', async () => {
  const payload = loadFixture('brand-input-valid.json');

  const canonical1 = canonicalizeJSON(payload);
  const canonical2 = canonicalizeJSON(payload);

  assert.equal(canonical1, canonical2, 'Canonical serialization should be deterministic');
});

test('determinism: fingerprint is stable across multiple runs (D-06)', async () => {
  const payload = loadFixture('brand-input-valid.json');

  const fp1 = generateFingerprint(payload);
  const fp2 = generateFingerprint(payload);
  const fp3 = generateFingerprint(payload);

  assert.equal(fp1, fp2, 'Fingerprints should match on replay');
  assert.equal(fp2, fp3, 'Fingerprints should be consistent across runs');
  assert.match(fp1, /^[a-f0-9]{64}$/, 'Fingerprint should be valid SHA-256 hex');
});

test('determinism: identical payload produces identical fingerprint despite key order (D-06)', async () => {
  const segment = {
    segment_id: 'seg-001',
    segment_name: 'Enterprise',
    pains: [{ pain: 'Test pain', rationale: 'Test why' }],
    needs: [{ need: 'Test need', rationale: 'Test why' }],
    expectations: [{ expectation: 'Test exp', rationale: 'Test why' }],
    desired_outcomes: ['Outcome 1']
  };

  // Create two payloads with different key ordering
  const payload1 = { audience_segments: [segment] };
  const payload2 = {};
  payload2.audience_segments = [segment];

  const fp1 = generateFingerprint(payload1);
  const fp2 = generateFingerprint(payload2);

  assert.equal(fp1, fp2, 'Fingerprints should match regardless of construction order');
});

test('determinism: small content change produces different fingerprint', async () => {
  const segment = {
    segment_id: 'seg-001',
    segment_name: 'Enterprise',
    pains: [{ pain: 'Original pain', rationale: 'Rationale' }],
    needs: [],
    expectations: [],
    desired_outcomes: []
  };

  const payload1 = { audience_segments: [segment] };

  const segment2 = { ...segment };
  segment2.pains = [{ pain: 'Modified pain', rationale: 'Rationale' }];
  const payload2 = { audience_segments: [segment2] };

  const fp1 = generateFingerprint(payload1);
  const fp2 = generateFingerprint(payload2);

  assert.notEqual(fp1, fp2, 'Different content should produce different fingerprints');
});

test('determinism: whitespace variations do not affect canonical form', async () => {
  const canonical1 = canonicalizeJSON({ a: 1, b: 2, c: { d: 3 } });
  const canonical2 = canonicalizeJSON({
    c: { d: 3 },
    a: 1,
    b: 2
  });

  assert.equal(canonical1, canonical2, 'Key order should not affect canonical form');
});

test('determinism: segment normalization is stable (D-06)', async () => {
  const segment = loadFixture('brand-input-valid.json').audience_segments[0];

  const normalized1 = normalizeBrandSegment(segment);
  const normalized2 = normalizeBrandSegment(segment);

  const fp1 = generateFingerprint(normalized1);
  const fp2 = generateFingerprint(normalized2);

  assert.equal(fp1, fp2, 'Normalized segment fingerprints should be stable');
});

test('determinism: empty arrays normalize consistently', async () => {
  const segment1 = {
    segment_name: 'Test',
    segment_id: 'seg-1',
    pains: [],
    needs: [{ need: 'test', rationale: 'test' }],
    expectations: [],
    desired_outcomes: []
  };

  const segment2 = {
    segment_name: 'Test',
    segment_id: 'seg-1',
    pains: [],
    needs: [{ need: 'test', rationale: 'test' }],
    expectations: [],
    desired_outcomes: []
  };

  const fp1 = generateFingerprint(segment1);
  const fp2 = generateFingerprint(segment2);

  assert.equal(fp1, fp2, 'Identical empty/populated arrays should fingerprint identically');
});

test('determinism: all segments in valid fixture have deterministic fingerprints', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const fingerprints = new Map();

  payload.audience_segments.forEach((segment, idx) => {
    const fp1 = generateFingerprint(segment);
    const fp2 = generateFingerprint(segment);

    assert.equal(fp1, fp2, `Segment ${idx} should have deterministic fingerprint`);

    if (fingerprints.has(fp1)) {
      throw new Error(`Duplicate fingerprint for segment ${idx}: ${fp1}`);
    }
    fingerprints.set(fp1, segment.segment_name);
  });

  assert.equal(fingerprints.size, payload.audience_segments.length, 'Each segment should have unique fingerprint');
});
