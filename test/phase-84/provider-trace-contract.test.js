const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { withMockedModule } = require('../setup.js');

const vectorStorePath = path.resolve(__dirname, '../../onboarding/backend/vector-store-client.cjs');
const supabaseModulePath = path.resolve(__dirname, '../../node_modules/@supabase/supabase-js');

function buildMockClient(rows) {
  class QueryBuilder {
    constructor(seedRows) {
      this.rows = [...seedRows];
      this.max = null;
    }

    select() {
      return this;
    }

    eq(column, expected) {
      this.rows = this.rows.filter((row) => row && row[column] === expected);
      return this;
    }

    in(column, allowed) {
      const allow = new Set(allowed || []);
      this.rows = this.rows.filter((row) => allow.has(row && row[column]));
      return this;
    }

    contains(column, expectedArray) {
      const expected = expectedArray && expectedArray[0];
      this.rows = this.rows.filter((row) => Array.isArray(row[column]) && row[column].includes(expected));
      return this;
    }

    overlaps(column, expectedArray) {
      const expected = new Set(expectedArray || []);
      this.rows = this.rows.filter((row) => {
        if (!Array.isArray(row[column])) return false;
        return row[column].some((value) => expected.has(value));
      });
      return this;
    }

    limit(count) {
      this.max = Number(count) || null;
      return this;
    }

    then(resolve, reject) {
      const data = this.max ? this.rows.slice(0, this.max) : this.rows;
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    }
  }

  return {
    from(table) {
      assert.equal(table, 'markos_literacy_chunks');
      return new QueryBuilder(rows);
    },
  };
}

function createMockRows() {
  return [
    {
      chunk_id: 'chunk-1',
      doc_id: 'doc-1',
      chunk_text: 'Tenant A paid media literacy evidence with provenance context.',
      discipline: 'Paid_Media',
      sub_discipline: 'Acquisition',
      business_model: ['B2B'],
      funnel_stage: 'awareness',
      content_type: 'playbook',
      pain_point_tags: ['high_cpr'],
      source_ref: 'vault://tenant-a/paid-media/doc-1',
      version: '1.0.0',
      updated_at: '2026-04-12T00:00:00.000Z',
      status: 'canonical',
    },
  ];
}

test('84-03 provider trace contract emits PageIndex provenance and tenant-scoped actor trace', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  delete require.cache[require.resolve(vectorStorePath)];

  await withMockedModule(supabaseModulePath, {
    createClient: () => buildMockClient(createMockRows()),
  }, async () => {
    const vectorStore = require(vectorStorePath);
    vectorStore.configure({});

    const items = await vectorStore.getLiteracyContext(
      'Paid Media',
      'paid media provenance evidence',
      {
        tenant_scope: 'tenant-a',
        business_model: 'B2B',
        funnel_stage: 'awareness',
        content_type: 'playbook',
        pain_point_tag: 'high_cpr',
      },
      3
    );

    assert.equal(items.length, 1);
    assert.equal(items[0].provenance.source.system, 'pageindex');
    assert.equal(items[0].provenance.actor.id, 'tenant-a');
    assert.equal(items[0].metadata.tenant_scope, 'tenant-a');
  });

  delete require.cache[require.resolve(vectorStorePath)];
});
