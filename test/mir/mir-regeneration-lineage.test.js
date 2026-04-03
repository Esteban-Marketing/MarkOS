const test = require('node:test');
const assert = require('node:assert/strict');

const writeMir = require('../../onboarding/backend/write-mir.cjs');
const {
  createInMemoryLineageStore,
  queryLineageByTenantAndDateRange,
} = require('../../onboarding/backend/mir-lineage.cjs');

test('critical MIR edits without rationale are rejected deterministically', () => {
  assert.throws(
    () => writeMir.applyCriticalEdit({
      tenantId: 'tenant-1',
      projectSlug: 'acme',
      entityKey: 'company_profile',
      contentSnapshot: { company_profile: 'updated' },
    }),
    /critical MIR edits require rationale/i
  );
});

test('historical MIR lineage cannot be updated or deleted through runtime helpers', () => {
  const store = createInMemoryLineageStore();

  const initialRecord = writeMir.applyCriticalEdit({
    tenantId: 'tenant-1',
    projectSlug: 'acme',
    entityKey: 'company_profile',
    rationale: 'Initial Gate 1 profile accepted.',
    contentSnapshot: { company_profile: 'v1' },
    persistence: store,
    effectiveAt: '2026-04-01T00:00:00.000Z',
  });

  assert.ok(initialRecord.versionRecord.version_id);
  assert.throws(
    () => store.update('markos_mir_versions', initialRecord.versionRecord.version_id, { rationale: 'rewrite' }),
    /append-only lineage records cannot be updated/i
  );
  assert.throws(
    () => store.delete('markos_mir_versions', initialRecord.versionRecord.version_id),
    /append-only lineage records cannot be deleted/i
  );
});

test('tenant and date range history queries return immutable lineage snapshots', () => {
  const store = createInMemoryLineageStore();
  const first = writeMir.applyCriticalEdit({
    tenantId: 'tenant-1',
    projectSlug: 'acme',
    entityKey: 'company_profile',
    rationale: 'Initial profile approved.',
    contentSnapshot: { company_profile: 'v1' },
    persistence: store,
    effectiveAt: '2026-04-01T00:00:00.000Z',
  });
  const second = writeMir.applyCriticalEdit({
    tenantId: 'tenant-1',
    projectSlug: 'acme',
    entityKey: 'company_profile',
    parentVersionId: first.versionRecord.version_id,
    rationale: 'Critical positioning update approved.',
    contentSnapshot: { company_profile: 'v2' },
    persistence: store,
    effectiveAt: '2026-04-03T00:00:00.000Z',
  });

  writeMir.applyCriticalEdit({
    tenantId: 'tenant-2',
    projectSlug: 'other',
    entityKey: 'company_profile',
    rationale: 'Other tenant update.',
    contentSnapshot: { company_profile: 'tenant-2-v1' },
    persistence: store,
    effectiveAt: '2026-04-03T00:00:00.000Z',
  });

  const lineage = queryLineageByTenantAndDateRange({
    tenantId: 'tenant-1',
    startDate: '2026-04-02T00:00:00.000Z',
    endDate: '2026-04-04T00:00:00.000Z',
    persistence: store,
  });

  assert.equal(lineage.length, 2);
  assert.ok(lineage.every((entry) => entry.tenant_id === 'tenant-1'));
  assert.ok(lineage.every((entry) => new Date(entry.recorded_at || entry.effective_at) >= new Date('2026-04-02T00:00:00.000Z')));
  assert.deepEqual(
    lineage.map((entry) => entry.regeneration_id || entry.version_id),
    [second.versionRecord.version_id, second.regenerationRecord.regeneration_id]
  );
  assert.equal(lineage[0].parent_version_id, first.versionRecord.version_id);
});