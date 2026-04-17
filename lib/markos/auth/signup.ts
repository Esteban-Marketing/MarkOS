// Phase 201 D-01 / D-02 / D-03: TypeScript dual-export.
const signupCjs = require('./signup.cjs') as {
  enqueueSignup: (client: unknown, input: { email: string; botIdToken: string; ip: string }, options?: unknown) => Promise<{ ok: boolean; code?: string; message?: string; buffer_expires_at?: string }>;
};
export const enqueueSignup = signupCjs.enqueueSignup;
