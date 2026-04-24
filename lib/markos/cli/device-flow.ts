// Phase 204 Plan 02 Task 1 — TypeScript twin export for device-flow primitives.
//
// Runtime implementation lives in `device-flow.cjs`. This file is a type-only
// facade consumed by the future TS tooling (204 Wave 3 doctrine-compliance
// surfaces + 207 AgentRun references). The .cjs module is the source of truth.
//
// Signatures MUST remain identical across both files (per 203-04 twin-export
// convention).

/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore — re-export runtime from CJS twin
const runtime = require('./device-flow.cjs');

export interface SupabaseLike {
  from(table: string): any;
  rpc?: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface CreateDeviceSessionParams {
  client: SupabaseLike;
  client_id?: string;
  scope?: string;
}

export interface DeviceSessionEnvelope {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface PollTokenParams {
  client: SupabaseLike;
  device_code: string;
  client_id?: string;
}

export type PollTokenResult =
  | { error: 'invalid_grant' | 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | 'invalid_client'; }
  | {
      access_token: string;
      token_type: 'bearer';
      tenant_id: string;
      key_fingerprint: string;
      scope: 'cli';
    };

export interface ApproveDeviceSessionParams {
  client: SupabaseLike;
  user_code: string;
  tenant_id: string;
  user_id: string;
  user_role?: string;
}

export interface ApproveDeviceSessionResult {
  approved: true;
  device_code: string;
}

export declare function createDeviceSession(params: CreateDeviceSessionParams): Promise<DeviceSessionEnvelope>;
export declare function pollToken(params: PollTokenParams): Promise<PollTokenResult>;
export declare function approveDeviceSession(params: ApproveDeviceSessionParams): Promise<ApproveDeviceSessionResult>;
export declare function mintApiKey(
  client: SupabaseLike,
  tenant_id: string,
  user_id: string,
  name?: string,
): Promise<{ access_token: string; key_fingerprint: string; id: string }>;

export declare const DEVICE_CODE_TTL_SEC: 900;
export declare const DEFAULT_INTERVAL_SEC: 5;
export declare const MAX_POLL_COUNT_BEFORE_REVOKE: 180;
export declare const MAX_SLOW_DOWN_VIOLATIONS: 3;
export declare const VERIFICATION_URI: string;
export declare const USER_CODE_ALPHABET: string;
export declare const USER_CODE_REGEX: RegExp;

// Re-export runtime for CJS interop.
// @ts-ignore
module.exports = runtime;
