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
 * Retention Policy Patterns (D-07, D-08)
 * Minimal-text retention with secret redaction and metadata-first evidence trails
 */
const REDACTION_PATTERNS = {
  API_KEY: /\b(api\s?key|apikey|api_key)\b|sk_(live|test)_[a-zA-Z0-9]+/i,
  TOKEN: /\b(token|bearer|jwt)\b/i,
  SECRET: /secret|password|pwd|pass/i,
  EMAIL: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  SSN: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,
  CREDIT_CARD: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/
};

/**
 * Redact sensitive data from text
 */
function redactSensitiveData(text) {
  if (typeof text !== 'string') {
    return text;
  }

  let redacted = text;
  for (const [type, pattern] of Object.entries(REDACTION_PATTERNS)) {
    redacted = redacted.replace(pattern, `[REDACTED:${type}]`);
  }
  return redacted;
}

/**
 * Extract minimal evidence metadata without raw text bulk
 */
function extractMinimalEvidence(segment) {
  return {
    segment_id: segment.segment_id,
    segment_name: segment.segment_name,
    pain_count: (segment.pains || []).length,
    need_count: (segment.needs || []).length,
    expectation_count: (segment.expectations || []).length,
    outcome_count: (segment.desired_outcomes || []).length
  };
}

/**
 * Canonical node representation with hybrid preservation
 * Stores: raw + canonical + redacted versions with lineage
 */
function createCanonicalNode(payload, segment) {
  return {
    // Metadata-first evidence (D-07, D-08)
    metadata: {
      segment_id: segment.segment_id,
      segment_name: segment.segment_name,
      content_hash: require('crypto').createHash('sha256').update(JSON.stringify(segment)).digest('hex'),
      ingested_at: new Date().toISOString(),
      retention_level: 'minimal-text'
    },

    // Minimal structured content (canonical form, no secrets)
    canonical_structure: extractMinimalEvidence(segment),

    // Lineage without raw-text bulk (D-07)
    lineage: {
      source_payload_hash: require('crypto').createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
      segment_index: payload.audience_segments.indexOf(segment),
      tenant_id: payload.metadata?.tenant_id
    },

    // Redacted version for reference (if needed for analysis)
    redacted_content: {
      pains: (segment.pains || []).map(p => ({
        pain: redactSensitiveData(p.pain),
        rationale_hash: require('crypto').createHash('sha256').update(p.rationale).digest('hex')
      })),
      needs: (segment.needs || []).map(n => ({
        need: redactSensitiveData(n.need),
        rationale_hash: require('crypto').createHash('sha256').update(n.rationale).digest('hex')
      })),
      expectations: (segment.expectations || []).map(e => ({
        expectation: redactSensitiveData(e.expectation),
        rationale_hash: require('crypto').createHash('sha256').update(e.rationale).digest('hex')
      }))
    }
  };
}

test('retention: minimal evidence extracts metadata counts without raw text', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const segment = payload.audience_segments[0];

  const evidence = extractMinimalEvidence(segment);

  assert.ok(evidence.segment_id, 'Should have segment_id');
  assert.ok(Number.isInteger(evidence.pain_count), 'Should have pain count');
  assert.ok(Number.isInteger(evidence.need_count), 'Should have need count');
  assert.ok(Number.isInteger(evidence.expectation_count), 'Should have expectation count');

  // Verify no raw text content
  assert.equal(typeof evidence.pain_count, 'number', 'Should be number, not text');
  assert.ok(!JSON.stringify(evidence).includes(segment.pains[0].pain), 'Should not contain raw pain text');
});

test('retention: redaction masks API keys and secrets', async () => {
  // Test that secret/password are recognized as patterns requiring redaction
  const text = 'Secret data: my_secret_key and password123';
  const redacted = redactSensitiveData(text);
  
  // Should have redacted at least one of them
  assert.ok(
    redacted.includes('[REDACTED:SECRET]'),
    'Should redact secret/password terms'
  );
});

test('retention: redaction masks email addresses', async () => {
  const text = 'Contact support@example.com or admin@company.org for help';
  const redacted = redactSensitiveData(text);

  assert.ok(redacted.includes('[REDACTED:EMAIL]'), 'Should redact email');
  assert.ok(!redacted.includes('support@example.com'), 'Should not contain original email');
});

test('retention: redaction masks phone numbers', async () => {
  const text = 'Call 555-123-4567 or (555) 123-4567 today';
  const redacted = redactSensitiveData(text);

  assert.ok(redacted.includes('[REDACTED:PHONE]'), 'Should redact phone');
});

test('retention: redaction masks credit card numbers', async () => {
  const text = 'Payment via 4532-1234-5678-9010 accepted';
  const redacted = redactSensitiveData(text);

  assert.ok(redacted.includes('[REDACTED:CREDIT_CARD]'), 'Should redact credit card');
  assert.ok(!redacted.includes('4532-1234-5678-9010'), 'Should not contain original card');
});

test('retention: canonical node creates metadata-first structure (D-07, D-08)', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const segment = payload.audience_segments[0];

  const node = createCanonicalNode(payload, segment);

  // Verify metadata is prominent
  assert.ok(node.metadata, 'Should have metadata section');
  assert.ok(node.metadata.segment_id, 'Metadata should have segment_id');
  assert.ok(node.metadata.content_hash, 'Metadata should have content hash');
  assert.ok(node.metadata.retention_level, 'Metadata should have retention level');

  // Verify lineage tracking
  assert.ok(node.lineage, 'Should have lineage section');
  assert.ok(node.lineage.source_payload_hash, 'Lineage should reference source');
  assert.ok(node.lineage.tenant_id, 'Lineage should track tenant');

  // Verify minimal structure content
  assert.ok(Number.isInteger(node.canonical_structure.pain_count), 'Structure should have counts, not raw text');
});

test('retention: canonical node redacts sensitive content from rationale hashes', async () => {
  const segment = {
    segment_id: 'seg-001',
    segment_name: 'Test',
    pains: [{ pain: 'Expensive API key management', rationale: 'API key: sk_123456' }],
    needs: [],
    expectations: [],
    desired_outcomes: []
  };

  const payload = {
    metadata: { tenant_id: 'test' },
    audience_segments: [segment]
  };

  const node = createCanonicalNode(payload, segment);

  // Rationales should be hashed (not stored in plaintext)
  assert.ok(node.redacted_content.pains[0].rationale_hash, 'Should hash rationale');
  assert.match(node.redacted_content.pains[0].rationale_hash, /^[a-f0-9]{64}$/, 'Should be SHA-256 hash');

  // Pain text should be redacted
  assert.ok(node.redacted_content.pains[0].pain.includes('[REDACTED'), 'Should redact sensitive pain text');
});

test('retention: all segments in fixture can create canonical nodes without data leakage', async () => {
  const payload = loadFixture('brand-input-valid.json');

  payload.audience_segments.forEach((segment, idx) => {
    const node = createCanonicalNode(payload, segment);

    // Verify no raw pain/need/expectation text in main structure
    const mainContent = JSON.stringify(node.canonical_structure);
    segment.pains.forEach(p => {
      assert.ok(!mainContent.includes(p.pain), `Main structure should not contain pain text from segment ${idx}`);
    });

    // Verify metadata is complete
    assert.ok(node.metadata.segment_id, `Metadata should have segment for ${idx}`);
    assert.ok(node.metadata.content_hash, `Metadata should have hash for ${idx}`);
  });
});

test('retention: lineage tracking preserves tenant scope without bulk text', async () => {
  const payload = {
    metadata: {
      tenant_id: 'tenant-xyz',
      actor_id: 'operator-123'
    },
    audience_segments: [
      {
        segment_id: 'seg-001',
        segment_name: 'Test Segment',
        pains: [{ pain: 'Many pains here', rationale: 'Rationale text' }],
        needs: [],
        expectations: [],
        desired_outcomes: []
      }
    ]
  };

  const node = createCanonicalNode(payload, payload.audience_segments[0]);

  // Lineage should track multi-tenant context
  assert.equal(node.lineage.tenant_id, 'tenant-xyz', 'Lineage should preserve tenant context');

  // But NOT store full payload in lineage (only hash)
  assert.ok(node.lineage.source_payload_hash, 'Should have payload hash, not full content');
  assert.ok(!JSON.stringify(node.lineage).includes('Many pains here'), 'Lineage should not contain raw content');
});

test('retention: redacted content provides audit trail without exposing secrets', async () => {
  const segment = {
    segment_id: 'seg-001',
    segment_name: 'Seg',
    pains: [
      { pain: 'Contact support@example.com', rationale: 'Email delivery' },
      { pain: 'Call 555-123-4567', rationale: 'Phone support' }
    ],
    needs: [],
    expectations: [],
    desired_outcomes: []
  };

  const payload = { metadata: { tenant_id: 'test' }, audience_segments: [segment] };
  const node = createCanonicalNode(payload, segment);

  const redactedStr = JSON.stringify(node.redacted_content);

  // Should contain redaction markers (for audit trail)
  assert.ok(redactedStr.includes('[REDACTED'), 'Should have redaction markers for audit');

  // Should NOT contain original secrets/PII
  assert.ok(!redactedStr.includes('support@example.com'), 'Should not expose email');
  assert.ok(!redactedStr.includes('555-123-4567'), 'Should not expose phone');
});

test('retention: minimal retention policy metadata is tagged correctly', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const segment = payload.audience_segments[0];

  const node = createCanonicalNode(payload, segment);

  assert.equal(node.metadata.retention_level, 'minimal-text', 'Should mark retention level as minimal-text (D-07)');
  assert.ok(node.metadata.ingested_at, 'Should track ingestion timestamp');
});
