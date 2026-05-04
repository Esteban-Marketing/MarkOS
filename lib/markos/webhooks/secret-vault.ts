export const VAULT_NAME_PREFIX = 'markos:webhook:secret:';

export type VaultReadableClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
  from: (table: string) => unknown;
};

type InMemorySecretRecord = {
  id: string;
  decrypted_secret: string;
  description?: string;
};

export function vaultName(subscriptionId: string): string {
  return `${VAULT_NAME_PREFIX}${subscriptionId}`;
}

function assertClient(client: VaultReadableClient | undefined, methodName: string): asserts client is VaultReadableClient {
  if (!client || typeof client !== 'object') {
    throw new Error(`${methodName}: client required`);
  }
}

export function createInMemoryVaultClient(
  seed: Map<string, InMemorySecretRecord> = new Map(),
): VaultReadableClient {
  const secrets = seed instanceof Map ? seed : new Map<string, InMemorySecretRecord>();
  let counter = 0;

  return {
    async rpc(name, args = {}) {
      if (name !== 'vault_create_or_update_secret') {
        return { data: null, error: { message: `unsupported_rpc:${name}` } };
      }
      const pName = String(args.p_name || '');
      const record = secrets.get(pName) || { id: `vault_${++counter}`, decrypted_secret: '' };
      record.decrypted_secret = String(args.p_value || '');
      record.description = String(args.p_description || '');
      secrets.set(pName, record);
      return { data: record.id, error: null };
    },
    from(table) {
      if (table === 'vault.decrypted_secrets') {
        let name: string | null = null;
        return {
          select() {
            return this;
          },
          eq(column: string, value: string) {
            if (column === 'name') name = value;
            return this;
          },
          async maybeSingle() {
            const record = name ? secrets.get(name) : null;
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
              async eq(column: string, value: string) {
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

export async function storeSecret(
  client: VaultReadableClient,
  subscriptionId: string,
  secretValue: string,
): Promise<string> {
  assertClient(client, 'storeSecret');
  if (!subscriptionId) throw new Error('storeSecret: subscriptionId required');
  if (!secretValue) throw new Error('storeSecret: secretValue required');

  const name = vaultName(subscriptionId);
  const { error } = await client.rpc('vault_create_or_update_secret', {
    p_value: secretValue,
    p_name: name,
    p_description: 'markos webhook signing secret',
  });
  if (error) throw new Error(`vault_unavailable:store:${error.message}`);
  return name;
}

export async function readSecret(
  client: VaultReadableClient,
  vaultRef: string,
): Promise<string> {
  assertClient(client, 'readSecret');
  if (!vaultRef) throw new Error('vault_secret_not_found:invalid_ref');

  const { data, error } = await (client as any)
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

export async function deleteSecret(
  client: VaultReadableClient,
  vaultRef: string | null | undefined,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  assertClient(client, 'deleteSecret');
  if (!vaultRef) return { ok: true };

  const { error } = await (client as any)
    .from('vault.secrets')
    .delete()
    .eq('name', vaultRef);

  if (error) return { ok: false, reason: error.message || String(error) };
  return { ok: true };
}

export async function rotateSecret(
  client: VaultReadableClient,
  subscriptionId: string,
  newSecretValue: string,
): Promise<string> {
  return storeSecret(client, subscriptionId, newSecretValue);
}
