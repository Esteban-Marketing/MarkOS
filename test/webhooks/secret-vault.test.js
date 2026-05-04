'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  VAULT_NAME_PREFIX,
  createInMemoryVaultClient,
  deleteSecret,
  readSecret,
  rotateSecret,
  storeSecret,
  vaultName,
} = require('../../lib/markos/webhooks/secret-vault.cjs');

test('storeSecret returns deterministic vault ref and readSecret returns the stored value', async () => {
  const client = createInMemoryVaultClient();
  const ref = await storeSecret(client, 'whsub_1', 'secret-1');
  assert.equal(ref, `${VAULT_NAME_PREFIX}whsub_1`);
  assert.equal(await readSecret(client, ref), 'secret-1');
});

test('readSecret on missing entry throws vault_secret_not_found', async () => {
  const client = createInMemoryVaultClient();
  await assert.rejects(
    readSecret(client, vaultName('missing')),
    /vault_secret_not_found:markos:webhook:secret:missing/,
  );
});

test('readSecret on vault lookup error throws vault_unavailable', async () => {
  const client = {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          return { data: null, error: { message: 'boom' } };
        },
      };
    },
  };
  await assert.rejects(readSecret(client, vaultName('whsub_2')), /vault_unavailable:read:boom/);
});

test('deleteSecret is idempotent on missing refs', async () => {
  const client = createInMemoryVaultClient();
  assert.deepEqual(await deleteSecret(client, vaultName('missing')), { ok: true });
  assert.deepEqual(await deleteSecret(client, null), { ok: true });
});

test('rotateSecret upserts the secret in place and keeps the same vault ref name', async () => {
  const client = createInMemoryVaultClient();
  const originalRef = await storeSecret(client, 'whsub_3', 'old');
  const rotatedRef = await rotateSecret(client, 'whsub_3', 'new');
  assert.equal(rotatedRef, originalRef);
  assert.equal(await readSecret(client, rotatedRef), 'new');
});
