const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { withMockedModule } = require('../setup.js');

const vectorStoreClientPath = path.resolve(__dirname, '../../onboarding/backend/vector-store-client.cjs');
const upstashModulePath = require.resolve('@upstash/vector');
const supabaseModulePath = require.resolve('@supabase/supabase-js');

function loadFreshVectorStoreClient() {
  delete require.cache[require.resolve(vectorStoreClientPath)];
  return require(vectorStoreClientPath);
}

test('96-02 additive literacy metadata round-trips through relational and vector payloads', async () => {
  let observedRow = null;
  let observedVector = null;

  await withMockedModule(supabaseModulePath, {
    createClient: () => ({
      from: () => ({
        upsert: async (row) => {
          observedRow = row;
          return { error: null };
        },
      }),
    }),
  }, async () => {
    await withMockedModule(upstashModulePath, {
      Index: class {
        namespace() {
          return {
            upsert: async (payload) => {
              observedVector = payload;
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
        chunk_id: 'ENRICHED::001',
        doc_id: 'ENRICHED',
        discipline: 'Paid Media',
        business_model: ['B2B'],
        content_type: 'tactic',
        chunk_text: 'Neuro-aware chunk body',
        desired_outcome_tags: ['more_pipeline'],
        neuro_trigger_tags: ['B01'],
        icp_segment_tags: ['revops_leader'],
        company_tailoring_profile: { proof_posture: 'evidence_first' },
      });

      assert.equal(result.ok, true);
      assert.deepEqual(observedRow.desired_outcome_tags, ['more_pipeline']);
      assert.deepEqual(observedRow.neuro_trigger_tags, ['B01']);
      assert.deepEqual(observedRow.icp_segment_tags, ['revops_leader']);
      assert.equal(observedRow.company_tailoring_profile.proof_posture, 'evidence_first');
      assert.deepEqual(observedVector.metadata.desired_outcome_tags, ['more_pipeline']);
      assert.deepEqual(observedVector.metadata.neuro_trigger_tags, ['B01']);
    });
  });
});
