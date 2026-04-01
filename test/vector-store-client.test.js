const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { withMockedModule } = require('./setup.js');

const vectorStoreClientPath = path.resolve(__dirname, '../onboarding/backend/vector-store-client.cjs');
const upstashModulePath = require.resolve('@upstash/vector');
const supabaseModulePath = require.resolve('@supabase/supabase-js');

function loadFreshVectorStoreClient() {
  delete require.cache[require.resolve(vectorStoreClientPath)];
  return require(vectorStoreClientPath);
}

test('Vector namespace read prefixes include canonical and compatibility entries', async () => {
  const previousPrefix = process.env.MARKOS_VECTOR_PREFIX;

  try {
    process.env.MARKOS_VECTOR_PREFIX = 'markos';
    let vectorStore = loadFreshVectorStoreClient();
    assert.deepEqual(vectorStore.getCollectionReadPrefixes(), ['markos', 'markos']);

    delete process.env.MARKOS_VECTOR_PREFIX;
    vectorStore = loadFreshVectorStoreClient();
    assert.deepEqual(vectorStore.getCollectionReadPrefixes(), ['markos', 'markos']);
  } finally {
    if (previousPrefix === undefined) {
      delete process.env.MARKOS_VECTOR_PREFIX;
    } else {
      process.env.MARKOS_VECTOR_PREFIX = previousPrefix;
    }
  }
});

test('Vector context lookup falls back from canonical to compatibility namespace', async () => {
  const previousPrefix = process.env.MARKOS_VECTOR_PREFIX;

  await withMockedModule(upstashModulePath, {
    Index: class {
      namespace(name) {
        return {
          query: async () => {
            if (name === 'markos-acme-company') {
              return [{ id: 'legacy-company', data: 'legacy-company-context', metadata: {} }];
            }
            throw new Error('Namespace not found');
          },
          upsert: async () => 'Success',
        };
      }
    }
  }, async () => {
    try {
      process.env.MARKOS_VECTOR_PREFIX = 'markos';

      const vectorStore = loadFreshVectorStoreClient();
      vectorStore.configure({
        upstash_vector_rest_url: 'https://upstash.example.com',
        upstash_vector_rest_token: 'test-token',
      });

      const docs = await vectorStore.getContext('acme', 'company', 'summary', 1);
      assert.deepEqual(docs, ['legacy-company-context']);
      assert.deepEqual(vectorStore.getSectionCollectionReadCandidates('acme', 'company'), [
        'markos-acme-company',
        'markos-acme-company',
      ]);
    } finally {
      if (previousPrefix === undefined) {
        delete process.env.MARKOS_VECTOR_PREFIX;
      } else {
        process.env.MARKOS_VECTOR_PREFIX = previousPrefix;
      }
    }
  });
});

test('Vector health reports unconfigured and degraded provider states', async () => {
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousUpstashUrl = process.env.UPSTASH_VECTOR_REST_URL;
  const previousUpstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN;

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.UPSTASH_VECTOR_REST_URL;
  delete process.env.UPSTASH_VECTOR_REST_TOKEN;

  let vectorStore = loadFreshVectorStoreClient();
  vectorStore.configure({});

  const unconfigured = await vectorStore.healthCheck();
  assert.equal(unconfigured.ok, false);
  assert.equal(unconfigured.status, 'providers_unconfigured');

  await withMockedModule(supabaseModulePath, {
    createClient: () => ({
      from: () => ({
        select: () => ({
          limit: async () => ({ error: null }),
        }),
      }),
    }),
  }, async () => {
    await withMockedModule(upstashModulePath, {
      Index: class {
        namespace() {
          return {
            query: async () => {
              throw new Error('ECONNREFUSED');
            },
          };
        }
      },
    }, async () => {
      vectorStore = loadFreshVectorStoreClient();
      vectorStore.configure({
        supabase_url: 'https://supabase.example.com',
        supabase_service_role_key: 'supabase-test-key',
        upstash_vector_rest_url: 'https://upstash.example.com',
        upstash_vector_rest_token: 'upstash-test-token',
      });

      const degraded = await vectorStore.healthCheck();
      assert.equal(degraded.ok, false);
      assert.equal(degraded.status, 'providers_degraded');
      assert.equal(degraded.providers.supabase.ok, true);
      assert.equal(degraded.providers.upstash_vector.ok, false);
    });
  });

  if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousSupabaseUrl;
  if (previousSupabaseKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousSupabaseKey;
  if (previousUpstashUrl === undefined) delete process.env.UPSTASH_VECTOR_REST_URL; else process.env.UPSTASH_VECTOR_REST_URL = previousUpstashUrl;
  if (previousUpstashToken === undefined) delete process.env.UPSTASH_VECTOR_REST_TOKEN; else process.env.UPSTASH_VECTOR_REST_TOKEN = previousUpstashToken;
});

test('Literacy namespace naming and canonical filter composition are stable', async () => {
  const observed = [];

  await withMockedModule(upstashModulePath, {
    Index: class {
      namespace(name) {
        return {
          query: async (payload) => {
            observed.push({ name, payload });
            return [
              {
                data: 'chunk text',
                metadata: { status: 'canonical' },
                score: 0.99,
              },
            ];
          },
          upsert: async () => 'Success',
        };
      }
    }
  }, async () => {
    const vectorStore = loadFreshVectorStoreClient();
    vectorStore.configure({
      upstash_vector_rest_url: 'https://upstash.example.com',
      upstash_vector_rest_token: 'test-token',
    });

    const namespace = vectorStore.buildStandardsNamespaceName('Paid Media');
    assert.equal(namespace, 'markos-standards-paid_media');

    const matches = await vectorStore.getLiteracyContext('Paid Media', 'cta ideas', {
      business_model: 'B2B',
      funnel_stage: 'Awareness',
      content_type: 'tactic',
    }, 7);

    assert.equal(matches.length, 1);
    assert.equal(matches[0].text, 'chunk text');
    assert.equal(observed.length, 1);
    assert.equal(observed[0].name, 'markos-standards-paid_media');
    assert.equal(
      observed[0].payload.filter,
      "status = 'canonical' AND business_model CONTAINS 'B2B' AND funnel_stage = 'Awareness' AND content_type = 'tactic'"
    );
  });
});

test('Literacy chunk upsert returns partial success details', async () => {
  await withMockedModule(supabaseModulePath, {
    createClient: () => ({
      from: (table) => ({
        upsert: async (row) => {
          assert.equal(table, 'markos_literacy_chunks');
          assert.equal(row.chunk_id, 'DOC::section::001');
          return { error: null };
        },
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    }),
  }, async () => {
    await withMockedModule(upstashModulePath, {
      Index: class {
        namespace(name) {
          return {
            upsert: async (payload) => {
              assert.equal(name, 'markos-standards-paid_media');
              assert.equal(payload.id, 'DOC::section::001');
            },
          };
        }
      },
    }, async () => {
      const vectorStore = loadFreshVectorStoreClient();
      vectorStore.configure({
        supabase_url: 'https://supabase.example.com',
        supabase_service_role_key: 'supabase-test-key',
        upstash_vector_rest_url: 'https://upstash.example.com',
        upstash_vector_rest_token: 'upstash-test-token',
      });

      const result = await vectorStore.upsertLiteracyChunk({
        chunk_id: 'DOC::section::001',
        doc_id: 'DOC',
        discipline: 'Paid Media',
        business_model: ['B2B'],
        content_type: 'tactic',
        chunk_text: 'Chunk body',
      });

      assert.equal(result.ok, true);
      assert.equal(result.namespace, 'markos-standards-paid_media');
      assert.equal(result.relational.ok, true);
      assert.equal(result.vector.ok, true);
    });
  });
});
