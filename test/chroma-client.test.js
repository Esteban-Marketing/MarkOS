const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { withMockedModule } = require('./setup.js');

const chromaClientPath = path.resolve(__dirname, '../onboarding/backend/chroma-client.cjs');
const chromadbModulePath = require.resolve('chromadb');

function loadFreshChromaClient() {
  delete require.cache[require.resolve(chromaClientPath)];
  return require(chromaClientPath);
}

test('Chroma namespace read prefixes include canonical and compatibility entries', async () => {
  const previousPrefix = process.env.MARKOS_CHROMA_PREFIX;

  try {
    process.env.MARKOS_CHROMA_PREFIX = 'markos';
    let chroma = loadFreshChromaClient();
    assert.deepEqual(chroma.getCollectionReadPrefixes(), ['markos', 'mgsd']);

    delete process.env.MARKOS_CHROMA_PREFIX;
    chroma = loadFreshChromaClient();
    assert.deepEqual(chroma.getCollectionReadPrefixes(), ['mgsd', 'markos']);
  } finally {
    if (previousPrefix === undefined) {
      delete process.env.MARKOS_CHROMA_PREFIX;
    } else {
      process.env.MARKOS_CHROMA_PREFIX = previousPrefix;
    }
  }
});

test('Chroma context lookup falls back from canonical to compatibility namespace', async () => {
  const previousPrefix = process.env.MARKOS_CHROMA_PREFIX;

  await withMockedModule(chromadbModulePath, {
    ChromaClient: class {
      async heartbeat() {
        return true;
      }

      async getCollection({ name }) {
        if (name === 'mgsd-acme-company') {
          return {
            query: async () => ({ documents: [['legacy-company-context']] }),
          };
        }

        throw new Error('Collection not found');
      }
    }
  }, async () => {
    try {
      process.env.MARKOS_CHROMA_PREFIX = 'markos';

      const chroma = loadFreshChromaClient();
      chroma.configure('http://localhost:8000');

      const docs = await chroma.getContext('acme', 'company', 'summary', 1);
      assert.deepEqual(docs, ['legacy-company-context']);
      assert.deepEqual(chroma.getSectionCollectionReadCandidates('acme', 'company'), [
        'markos-acme-company',
        'mgsd-acme-company',
      ]);
    } finally {
      if (previousPrefix === undefined) {
        delete process.env.MARKOS_CHROMA_PREFIX;
      } else {
        process.env.MARKOS_CHROMA_PREFIX = previousPrefix;
      }
    }
  });
});

test('Chroma project clear operation isolates slug and deletes across supported prefixes', async () => {
  const deleted = [];

  await withMockedModule(chromadbModulePath, {
    ChromaClient: class {
      async listCollections() {
        return [
          { name: 'mgsd-alpha-company' },
          { name: 'markos-alpha-drafts' },
          { name: 'mgsd-beta-company' },
          { name: 'markos-beta-meta' },
        ];
      }

      async deleteCollection({ name }) {
        deleted.push(name);
      }
    }
  }, async () => {
    const chroma = loadFreshChromaClient();
    chroma.configure('http://localhost:8000');

    const result = await chroma.clearProject('alpha');
    assert.deepEqual(result.deleted.sort(), ['markos-alpha-drafts', 'mgsd-alpha-company']);
    assert.deepEqual(deleted.sort(), ['markos-alpha-drafts', 'mgsd-alpha-company']);
  });
});

test('Chroma health reports cloud and local failure states with actionable statuses', async () => {
  await withMockedModule(chromadbModulePath, {
    ChromaClient: class {
      async heartbeat() {
        throw new Error('ECONNREFUSED');
      }
    }
  }, async () => {
    const chroma = loadFreshChromaClient();

    chroma.configure('https://cloud.example.com');
    chroma.setBootReport(null);
    const cloudHealth = await chroma.healthCheck();
    assert.equal(cloudHealth.mode, 'cloud');
    assert.equal(cloudHealth.status, 'cloud_unavailable');
    assert.equal(cloudHealth.ok, false);

    chroma.configure('http://localhost:8000');
    chroma.setBootReport({ status: 'local_boot_failed', error: 'python runtime not found' });
    const localHealth = await chroma.healthCheck();
    assert.equal(localHealth.mode, 'local');
    assert.equal(localHealth.status, 'local_boot_failed');
    assert.match(localHealth.error, /python runtime not found/);
    assert.equal(localHealth.ok, false);
  });
});
