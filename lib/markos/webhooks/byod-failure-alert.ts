// Phase 201.1 D-107 (closes M2): TypeScript dual-export. SOURCE OF TRUTH is byod-failure-alert.cjs.

const alertCjs = require('./byod-failure-alert.cjs') as {
  fireByodFailureAlert: (client: unknown, input: ByodFailureAlertInput) => Promise<ByodFailureAlertResult>;
  EVENT_TYPE: string;
};

export interface ByodFailureAlertInput {
  domain: string;
  tenant_id: string;
  org_id?: string;
  last_verified_at?: string | null;
  reason?: string;
}

export interface ByodFailureAlertResult {
  delivered: number;
  audited: boolean;
  total_subscriptions?: number;
}

export const fireByodFailureAlert = alertCjs.fireByodFailureAlert;
export const EVENT_TYPE = alertCjs.EVENT_TYPE;
