// Phase 201 D-03: TypeScript dual-export. SOURCE OF TRUTH is botid.cjs.
const botidCjs = require('./botid.cjs') as {
  verifyBotIdToken: (token: string, options?: { skipInTest?: boolean; fetchImpl?: typeof fetch; endpoint?: string }) => Promise<{ ok: boolean; reason: string }>;
  BOTID_VERIFY_ENDPOINT: string;
};

export type BotIdReason = 'missing_token' | 'invalid' | 'verified' | 'test_skip' | 'network_error';
export const verifyBotIdToken = botidCjs.verifyBotIdToken as (token: string, options?: { skipInTest?: boolean; fetchImpl?: typeof fetch; endpoint?: string }) => Promise<{ ok: boolean; reason: BotIdReason }>;
export const BOTID_VERIFY_ENDPOINT = botidCjs.BOTID_VERIFY_ENDPOINT;
