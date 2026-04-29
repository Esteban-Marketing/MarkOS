// Phase 201 D-03: TypeScript dual-export.
const rlCjs = require('./rate-limit.cjs') as {
  RATE_LIMITS: { ip_hourly: { window_ms: number; max: number }; email_per_minute: { window_ms: number; max: number } };
  hashIp: (ip: string) => string;
  windowStart: (now: number, window_ms: number) => string;
  checkSignupRateLimit: (client: unknown, input: { ip: string; email: string }) => Promise<{ allowed: boolean; reason: string }>;
  recordSignupAttempt: (client: unknown, input: { ip: string; email: string }) => Promise<{ attempt_count: number }>;
};

export const RATE_LIMITS = rlCjs.RATE_LIMITS;
export const hashIp = rlCjs.hashIp;
export const windowStart = rlCjs.windowStart;
export const checkSignupRateLimit = rlCjs.checkSignupRateLimit;
export const recordSignupAttempt = rlCjs.recordSignupAttempt;
