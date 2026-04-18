// Phase 203 Plan 06 Task 1 — rotation-notify dual-export shim.
// Re-exports the CJS implementation so TS/ESM callers get the same surface.
// Pattern mirrors lib/markos/webhooks/{dlq,replay,signing,ssrf-guard,rotation}.ts.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const impl = require('./rotation-notify.cjs');

export const buildEmailTemplate = impl.buildEmailTemplate;
export const sendRotationNotification = impl.sendRotationNotification;
export const notifyRotations = impl.notifyRotations;
export const listAllActiveRotations = impl.listAllActiveRotations;
export const fetchTenantAdminEmails = impl.fetchTenantAdminEmails;
export const computeStage = impl.computeStage;
export const NOTIFIED_KEY_PREFIX: string = impl.NOTIFIED_KEY_PREFIX;
export const NOTIFIED_TTL_SEC: number = impl.NOTIFIED_TTL_SEC;

export default impl;
