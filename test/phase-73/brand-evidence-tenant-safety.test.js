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
 * Tenant-scoped identity key generator (D-06)
 * Ensures cross-tenant collisions are impossible
 */
function generateTenantScopedKey(tenantId, segmentId, fingerprint) {
  if (!tenantId || !segmentId || !fingerprint) {
    throw new Error('tenantId, segmentId, and fingerprint are required for identity key');
  }
  // tenant:segment:fingerprint format for tenant-scoped uniqueness
  return `${tenantId}:${segmentId}:${fingerprint}`;
}

/**
 * In-memory evidence graph store (simulating idempotent upsert behavior)
 * Tracks: tenant_id, segment_id, fingerprint, created_count
 */
class TenantSafeEvidenceGraphStore {
  constructor() {
    this.nodes = new Map(); // key -> { segment_id, fingerprint, tenant_id, created_at, updated_at, upsert_count }
  }

  upsertNode(tenantId, segmentId, fingerprint, payload) {
    const key = generateTenantScopedKey(tenantId, segmentId, fingerprint);
    const now = new Date().toISOString();

    if (this.nodes.has(key)) {
      const existing = this.nodes.get(key);
      existing.updated_at = now;
      existing.upsert_count = (existing.upsert_count || 1) + 1;
      return { created: false, key, node: existing };
    }

    const node = {
      tenant_id: tenantId,
      segment_id: segmentId,
      fingerprint,
      payload,
      created_at: now,
      updated_at: now,
      upsert_count: 1
    };
    this.nodes.set(key, node);
    return { created: true, key, node };
  }

  getNodesByTenant(tenantId) {
    return Array.from(this.nodes.values()).filter(n => n.tenant_id === tenantId);
  }

  getNodesBySegment(tenantId, segmentId) {
    return this.getNodesByTenant(tenantId).filter(n => n.segment_id === segmentId);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }
}

test('tenant-safety: identical keys for same tenant+segment+fingerprint (idempotent)', async () => {
  const tenantId = 'tenant-123';
  const segmentId = 'seg-001';
  const fingerprint = 'abc123def456';

  const key1 = generateTenantScopedKey(tenantId, segmentId, fingerprint);
  const key2 = generateTenantScopedKey(tenantId, segmentId, fingerprint);

  assert.equal(key1, key2, 'Same inputs should generate identical keys');
  assert.match(key1, /tenant-123:seg-001:abc123def456/, 'Key should contain all components');
});

test('tenant-safety: different tenants generate different keys (cross-tenant collision prevention)', async () => {
  const segmentId = 'seg-001';
  const fingerprint = 'abc123';

  const key1 = generateTenantScopedKey('tenant-123', segmentId, fingerprint);
  const key2 = generateTenantScopedKey('tenant-456', segmentId, fingerprint);

  assert.notEqual(key1, key2, 'Different tenants should generate different keys');
  assert.ok(key1.startsWith('tenant-123:'), 'Tenant ID should be in key');
  assert.ok(key2.startsWith('tenant-456:'), 'Different tenant ID should be in key');
});

test('tenant-safety: different segments generate different keys', async () => {
  const tenantId = 'tenant-123';
  const fingerprint = 'abc123';

  const key1 = generateTenantScopedKey(tenantId, 'seg-001', fingerprint);
  const key2 = generateTenantScopedKey(tenantId, 'seg-002', fingerprint);

  assert.notEqual(key1, key2, 'Different segments should generate different keys');
});

test('tenant-safety: different fingerprints generate different keys', async () => {
  const tenantId = 'tenant-123';
  const segmentId = 'seg-001';

  const key1 = generateTenantScopedKey(tenantId, segmentId, 'fingerprint1');
  const key2 = generateTenantScopedKey(tenantId, segmentId, 'fingerprint2');

  assert.notEqual(key1, key2, 'Different fingerprints should generate different keys');
});

test('tenant-safety: idempotent upsert with same key returns created=false on second call', async () => {
  const store = new TenantSafeEvidenceGraphStore();
  const tenantId = 'tenant-123';
  const segmentId = 'seg-001';
  const fingerprint = 'abc123';
  const payload = { segment_name: 'Test' };

  // First upsert
  const result1 = store.upsertNode(tenantId, segmentId, fingerprint, payload);
  assert.equal(result1.created, true, 'First upsert should create node');

  // Second upsert with same key
  const result2 = store.upsertNode(tenantId, segmentId, fingerprint, payload);
  assert.equal(result2.created, false, 'Second upsert should not create new node');
  assert.equal(result2.key, result1.key, 'Keys should match');
  assert.equal(result2.node.upsert_count, 2, 'Upsert count should increment');
});

test('tenant-safety: upsert count increments on each replay (deterministic idempotence)', async () => {
  const store = new TenantSafeEvidenceGraphStore();
  const tenantId = 'tenant-123';
  const segmentId = 'seg-001';
  const fingerprint = 'abc123';

  // Track upsert_count after each call immediately
  const upsertCounts = [];

  // Call 1
  let result1 = store.upsertNode(tenantId, segmentId, fingerprint, {});
  assert.equal(result1.created, true, 'First call should create');
  upsertCounts.push(result1.node.upsert_count);

  // Call 2
  let result2 = store.upsertNode(tenantId, segmentId, fingerprint, {});
  assert.equal(result2.created, false, 'Second call should not create');
  upsertCounts.push(result2.node.upsert_count);

  // Call 3
  let result3 = store.upsertNode(tenantId, segmentId, fingerprint, {});
  assert.equal(result3.created, false, 'Third call should not create');
  upsertCounts.push(result3.node.upsert_count);

  // Verify counts incremented
  assert.deepEqual(upsertCounts, [1, 2, 3], 'Upsert counts should increment: 1, 2, 3');
  assert.equal(store.nodes.size, 1, 'Should have exactly 1 node despite 3 upserts');
});

test('tenant-safety: different tenants can have same segment without collision', async () => {
  const store = new TenantSafeEvidenceGraphStore();
  const segmentId = 'seg-001';
  const fingerprint = 'abc123';

  // Tenant 1 upserts
  const result1 = store.upsertNode('tenant-1', segmentId, fingerprint, { data: 'tenant1' });

  // Tenant 2 upserts same segment
  const result2 = store.upsertNode('tenant-2', segmentId, fingerprint, { data: 'tenant2' });

  assert.equal(result1.created, true, 'Tenant 1 creates first');
  assert.equal(result2.created, true, 'Tenant 2 should also create (different tenant)');
  assert.notEqual(result1.key, result2.key, 'Keys should be different');
  assert.equal(store.nodes.size, 2, 'Should have 2 separate nodes for 2 tenants');
});

test('tenant-safety: tenant isolation via getNodesByTenant filter', async () => {
  const store = new TenantSafeEvidenceGraphStore();

  // Add nodes for multiple tenants
  store.upsertNode('tenant-1', 'seg-1', 'fp1', {});
  store.upsertNode('tenant-1', 'seg-2', 'fp2', {});
  store.upsertNode('tenant-2', 'seg-1', 'fp1', {});
  store.upsertNode('tenant-2', 'seg-3', 'fp3', {});

  const tenant1Nodes = store.getNodesByTenant('tenant-1');
  const tenant2Nodes = store.getNodesByTenant('tenant-2');

  assert.equal(tenant1Nodes.length, 2, 'Tenant 1 should have 2 nodes');
  assert.equal(tenant2Nodes.length, 2, 'Tenant 2 should have 2 nodes');

  tenant1Nodes.forEach(node => {
    assert.equal(node.tenant_id, 'tenant-1', 'All tenant-1 nodes should have tenant-1 ID');
  });

  tenant2Nodes.forEach(node => {
    assert.equal(node.tenant_id, 'tenant-2', 'All tenant-2 nodes should have tenant-2 ID');
  });
});

test('tenant-safety: segment-level query respects tenant boundary', async () => {
  const store = new TenantSafeEvidenceGraphStore();

  store.upsertNode('tenant-1', 'seg-001', 'fp1', {});
  store.upsertNode('tenant-1', 'seg-001', 'fp2', {});
  store.upsertNode('tenant-2', 'seg-001', 'fp1', {});

  const tenant1Seg001 = store.getNodesBySegment('tenant-1', 'seg-001');
  const tenant2Seg001 = store.getNodesBySegment('tenant-2', 'seg-001');

  assert.equal(tenant1Seg001.length, 2, 'Tenant 1 seg-001 should have 2 nodes');
  assert.equal(tenant2Seg001.length, 1, 'Tenant 2 seg-001 should have 1 node');

  // Verify no cross-contamination
  tenant1Seg001.forEach(node => {
    assert.equal(node.tenant_id, 'tenant-1', 'Should only see tenant-1 nodes');
  });
});

test('tenant-safety: real fixture can be isolated per tenant', async () => {
  const payload = loadFixture('brand-input-valid.json');
  const store = new TenantSafeEvidenceGraphStore();

  // Simulate multi-tenant ingestion of same payload
  const tenants = ['tenant-alpha', 'tenant-beta', 'tenant-gamma'];
  const fingerprintBySegment = new Map();

  // First pass: all tenants ingest
  tenants.forEach(tenantId => {
    payload.audience_segments.forEach(segment => {
      const fingerprint = `fp-${segment.segment_id}`;
      const result = store.upsertNode(tenantId, segment.segment_id, fingerprint, segment);

      // First tenant creates, others should also create (because different tenant keys)
      assert.equal(result.created, true, `First ingestion should create for ${tenantId}`);

      // Track fingerprint consistency
      if (!fingerprintBySegment.has(segment.segment_id)) {
        fingerprintBySegment.set(segment.segment_id, fingerprint);
      }
    });
  });

  // Second pass: verify replayed submission doesn't create again for same tenant
  tenants.forEach(tenantId => {
    payload.audience_segments.forEach(segment => {
      const fingerprint = `fp-${segment.segment_id}`;
      const result = store.upsertNode(tenantId, segment.segment_id, fingerprint, segment);

      assert.equal(result.created, false, `Replay should not create new node for ${tenantId}`);
      assert.equal(result.node.upsert_count, 2, `Replay should increment upsert_count to 2`);
    });
  });

  // Verify each tenant sees only their own nodes
  tenants.forEach(tenantId => {
    const nodes = store.getNodesByTenant(tenantId);
    assert.equal(nodes.length, payload.audience_segments.length, `Tenant ${tenantId} should see ${payload.audience_segments.length} nodes`);
  });

  // Verify total nodes = tenants × segments
  const expectedTotal = tenants.length * payload.audience_segments.length;
  assert.equal(store.getAllNodes().length, expectedTotal, `Total nodes should be ${expectedTotal}`);
});
