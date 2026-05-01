'use strict';

const VAULT_NAME_PREFIX = 'markos:webhook:secret:';

function vaultName(subscriptionId) {
  return `${VAULT_NAME_PREFIX}${subscriptionId}`;
}

function assertClient(client, methodName) {
  if (!client || typeof client !== 'object') {
    throw new Error(`${methodName}: client required`);
  }
}

function createInMemoryVaultClient(seed = new Map()) {
  const secrets = seed instanceof Map ? seed : new Map();
  let counter = 0;

  return {
    __vaultSecrets: secrets,
    async rpc(name, args = {}) {
      if (name !== 'vault_create_or_update_secret') {
        return { data: null, error: { message: `unsupported_rpc:${name}` } };
      }
      const record = secrets.get(args.p_name) || { id: `vault_${++counter}` };
      record.decrypted_secret = args.p_value;
      record.description = args.p_description || '';
      secrets.set(args.p_name, record);
      return { data: record.id, error: null };
    },
    from(table) {
      if (table === 'vault.decrypted_secrets') {
        let name = null;
        return {
          select() {
            return this;
          },
          eq(column, value) {
            if (column === 'name') name = value;
            return this;
          },
          async maybeSingle() {
            const record = secrets.get(name);
            if (!record) return { data: null, error: null };
            return {
              data: {
                name,
                decrypted_secret: record.decrypted_secret,
              },
              error: null,
            };
          },
        };
      }

      if (table === 'vault.secrets') {
        return {
          delete() {
            return {
              async eq(column, value) {
                if (column === 'name') secrets.delete(value);
                return { data: null, error: null };
              },
            };
          },
        };
      }

      throw new Error(`in_memory_vault_client: unsupported table ${table}`);
    },
  };
}

async function storeSecret(client, subscriptionId, secretValue) {
  assertClient(client, 'storeSecret');
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    throw new Error('storeSecret: subscriptionId required');
  }
  if (!secretValue || typeof secretValue !== 'string') {
    throw new Error('storeSecret: secretValue required');
  }

  const name = vaultName(subscriptionId);
  const { error } = await client.rpc('vault_create_or_update_secret', {
    p_value: secretValue,
    p_name: name,
    p_description: 'markos webhook signing secret',
  });
  if (error) throw new Error(`vault_unavailable:store:${error.message}`);
  return name;
}

async function readSecret(client, vaultRef) {
  assertClient(client, 'readSecret');
  if (!vaultRef || typeof vaultRef !== 'string') {
    throw new Error('vault_secret_not_found:invalid_ref');
  }

  const { data, error } = await client
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', vaultRef)
    .maybeSingle();

  if (error) throw new Error(`vault_unavailable:read:${error.message}`);
  if (!data || typeof data.decrypted_secret !== 'string' || data.decrypted_secret.length === 0) {
    throw new Error(`vault_secret_not_found:${vaultRef}`);
  }
  return data.decrypted_secret;
}

async function deleteSecret(client, vaultRef) {
  assertClient(client, 'deleteSecret');
  if (!vaultRef) return { ok: true };

  const { error } = await client
    .from('vault.secrets')
    .delete()
    .eq('name', vaultRef);

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

async function rotateSecret(client, subscriptionId, newSecretValue) {
  return storeSecret(client, subscriptionId, newSecretValue);
}

module.exports = {
  VAULT_NAME_PREFIX,
  vaultName,
  createInMemoryVaultClient,
  storeSecret,
  readSecret,
  deleteSecret,
  rotateSecret,
};
