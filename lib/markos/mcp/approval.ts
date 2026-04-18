'use strict';
// Phase 202 Plan 04: Dual-export re-export stub.
const ap = require('./approval.cjs');

export const APPROVAL_TTL_SECONDS: number = ap.APPROVAL_TTL_SECONDS;
export const issueApprovalToken = ap.issueApprovalToken as (
  redis: unknown,
  session: { id: string },
  tool_name: string,
  args: unknown
) => Promise<string>;
export const checkApprovalToken = ap.checkApprovalToken as (
  redis: unknown,
  token: string,
  session: { id: string },
  tool_name: string
) => Promise<boolean>;
