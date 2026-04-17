// Phase 201 D-01: TypeScript dual-export. SOURCE OF TRUTH is passkey.cjs.
const pkCjs = require('./passkey.cjs') as {
  PASSKEY_CHALLENGE_TTL_MS: number;
  PASSKEY_PROMPT_DISMISSED_COOKIE: string;
  createRegistrationOptions: (client: unknown, input: { user_id: string; rpID: string; rpName?: string; userName?: string }) => Promise<{ options: unknown; challenge_id: string }>;
  verifyRegistrationResponse: (client: unknown, input: { user_id: string; challenge_id: string; attResponse: unknown; expectedOrigin: string; expectedRPID: string }) => Promise<{ verified: boolean; credential_id?: string }>;
  createAuthenticationOptions: (client: unknown, input: { user_id: string; rpID: string }) => Promise<{ options: unknown; challenge_id: string }>;
  verifyAuthenticationResponse: (client: unknown, input: { user_id: string; challenge_id: string; authResponse: unknown; expectedOrigin: string; expectedRPID: string }) => Promise<{ verified: boolean; credential_id?: string }>;
  listUserPasskeys: (client: unknown, user_id: string) => Promise<Array<{ id: string; nickname: string | null; last_used_at: string | null; created_at: string }>>;
  recordLoginEvent: (client: unknown, input: { user_id: string; event: 'magic_link' | 'passkey' }) => Promise<void>;
  shouldPromptPasskey: (client: unknown, user_id: string, dismissedCookie?: string) => Promise<boolean>;
};

export const PASSKEY_CHALLENGE_TTL_MS = pkCjs.PASSKEY_CHALLENGE_TTL_MS;
export const PASSKEY_PROMPT_DISMISSED_COOKIE = pkCjs.PASSKEY_PROMPT_DISMISSED_COOKIE;
export const createRegistrationOptions = pkCjs.createRegistrationOptions;
export const verifyRegistrationResponse = pkCjs.verifyRegistrationResponse;
export const createAuthenticationOptions = pkCjs.createAuthenticationOptions;
export const verifyAuthenticationResponse = pkCjs.verifyAuthenticationResponse;
export const listUserPasskeys = pkCjs.listUserPasskeys;
export const recordLoginEvent = pkCjs.recordLoginEvent;
export const shouldPromptPasskey = pkCjs.shouldPromptPasskey;
