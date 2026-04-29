const g = require('./gdpr-export.cjs');
export const BUNDLE_DOMAINS = g.BUNDLE_DOMAINS as readonly string[];
export const SIGNED_URL_TTL_SECONDS = g.SIGNED_URL_TTL_SECONDS as number;
export const GDPR_EXPORT_MAX_BYTES = g.GDPR_EXPORT_MAX_BYTES as number;
export const generateExportBundle = g.generateExportBundle as (
  client: unknown,
  input: { tenant_id: string; bucket: string; [key: string]: unknown }
) => Promise<{ export_id: string; nonce: string; expires_at: string; object_key: string }>;
export const consumeExportNonce = g.consumeExportNonce as (
  client: unknown,
  input: { export_id: string; nonce: string; session_id?: string; user_id?: string; requesting_tenant_id: string }
) => Promise<
  | { ok: true; signed_url: string; object_key: string; bucket: string }
  | { ok: false; reason: 'invalid_input' | 'not_found' | 'audience_mismatch' | 'expired' | 'nonce_mismatch' | 'consumed' }
>;
export const reissueExport = g.reissueExport as (
  client: unknown,
  input: { export_id: string; actor_user_id: string; session_id?: string; requesting_tenant_id: string }
) => Promise<{ export_id: string; nonce: string; expires_at: string }>;
