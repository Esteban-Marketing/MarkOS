// Phase 201.1 D-103: TypeScript dual-export for canonicalizer-rpc. SOURCE OF TRUTH is canonicalizer-rpc.cjs.
// See docs/canonical-audit-spec.md for the full locked specification.

type SupabaseClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };

const rpcCjs = require('./canonicalizer-rpc.cjs') as {
  callPostgresCanonicalizer: (client: SupabaseClient, payload: unknown) => Promise<string>;
};

export const callPostgresCanonicalizer: (client: SupabaseClient, payload: unknown) => Promise<string> =
  rpcCjs.callPostgresCanonicalizer;
