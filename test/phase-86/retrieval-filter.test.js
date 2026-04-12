'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyFilter } = require('../../onboarding/backend/vault/retrieval-filter.cjs');

test('applyFilter — discipline filter', async (t) => {
  const entries = [
    { discipline: 'Paid_Media', doc_id: '1' },
    { discipline: 'Email', doc_id: '2' },
    { discipline: 'Paid_Media', doc_id: '3' },
  ];
  
  const result = applyFilter(entries, { discipline: 'Paid_Media' });
  assert.equal(result.length, 2);
  assert.ok(result.every(e => e.discipline === 'Paid_Media'));
});

test('applyFilter — audience_tags AND semantics', async (t) => {
  const entries = [
    { audience_tags: ['ICP:smb', 'SEGMENT:mid-market'], doc_id: '1' },
    { audience_tags: ['ICP:smb'], doc_id: '2' },
    { audience_tags: ['ICP:smb', 'SEGMENT:mid-market', 'ROLE:buyer'], doc_id: '3' },
  ];
  
  // Filter for entries with BOTH ICP:smb AND SEGMENT:mid-market
  const result = applyFilter(entries, { audience_tags: ['ICP:smb', 'SEGMENT:mid-market'] });
  assert.equal(result.length, 2);
  assert.deepEqual(result.map(e => e.doc_id).sort(), ['1', '3']);
});

test('applyFilter — no filter returns all', async (t) => {
  const entries = [
    { doc_id: '1', discipline: 'Paid_Media' },
    { doc_id: '2', discipline: 'Email' },
  ];
  
  const result = applyFilter(entries, {});
  assert.equal(result.length, 2);
});

test('applyFilter — empty audience_tags array returns all', async (t) => {
  const entries = [
    { doc_id: '1', audience_tags: ['ICP:smb'] },
    { doc_id: '2', audience_tags: [] },
  ];
  
  const result = applyFilter(entries, { audience_tags: [] });
  assert.equal(result.length, 2);
});

test('applyFilter — combined discipline + audience_tags', async (t) => {
  const entries = [
    { discipline: 'Paid_Media', audience_tags: ['ICP:smb'], doc_id: '1' },
    { discipline: 'Email', audience_tags: ['ICP:smb'], doc_id: '2' },
    { discipline: 'Paid_Media', audience_tags: ['ICP:enterprise'], doc_id: '3' },
  ];
  
  const result = applyFilter(entries, { discipline: 'Paid_Media', audience_tags: ['ICP:smb'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].doc_id, '1');
});

test('applyFilter — case-sensitive tag match', async (t) => {
  const entries = [
    { audience_tags: ['ICP:smb'], doc_id: '1' },
    { audience_tags: ['ICP:SMB'], doc_id: '2' },
  ];
  
  const result = applyFilter(entries, { audience_tags: ['ICP:smb'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].doc_id, '1');
});
