// Phase 201 D-17: TypeScript dual-export. SOURCE OF TRUTH is chain-checker.cjs.
import type { SupabaseClient } from '@supabase/supabase-js';

const checkerCjs = require('./chain-checker.cjs') as {
  computeRowHash: (prev_hash: string, canonical_payload: string) => string;
  verifyTenantChain: (client: SupabaseClient, tenant_id: string) => Promise<{
    ok: boolean;
    row_count: number;
    breaks: Array<{ row_id: number; reason: string; [k: string]: unknown }>;
  }>;
};

export const computeRowHash = checkerCjs.computeRowHash;
export const verifyTenantChain = checkerCjs.verifyTenantChain;
