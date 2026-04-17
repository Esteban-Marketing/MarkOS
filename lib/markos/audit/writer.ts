// Phase 201 D-16/D-17: TypeScript dual-export. SOURCE OF TRUTH is writer.cjs.
import type { SupabaseClient } from '@supabase/supabase-js';

const writerCjs = require('./writer.cjs') as {
  AUDIT_SOURCE_DOMAINS: readonly string[];
  writeAuditRow: (client: SupabaseClient, entry: AuditEntry) => Promise<{ id: number; row_hash: string; prev_hash: string }>;
  enqueueAuditStaging: (client: SupabaseClient, entry: AuditEntry) => Promise<{ staging_id: number }>;
  canonicalPayloadForHash: (entry: AuditEntry) => string;
};

export const AUDIT_SOURCE_DOMAINS = writerCjs.AUDIT_SOURCE_DOMAINS as readonly [
  'auth', 'tenancy', 'orgs', 'billing', 'crm', 'outbound',
  'webhooks', 'approvals', 'consent', 'governance', 'system',
];

export type AuditSourceDomain = typeof AUDIT_SOURCE_DOMAINS[number];

export interface AuditEntry {
  tenant_id: string;
  org_id?: string | null;
  source_domain: AuditSourceDomain;
  action: string;
  actor_id: string;
  actor_role: string;
  payload?: Record<string, unknown>;
  occurred_at?: string;
}

export const writeAuditRow = writerCjs.writeAuditRow;
export const enqueueAuditStaging = writerCjs.enqueueAuditStaging;
export const canonicalPayloadForHash = writerCjs.canonicalPayloadForHash;
