// Phase 203 Plan 02 Task 1: TS dual-export mirror of ssrf-guard.cjs.
// Runtime lives in ssrf-guard.cjs; this file exists to expose types to TS
// callers per the MarkOS dual-export convention.

export type BlockedCidr = { cidr: string; name: string };

export declare const BLOCKED_V4: ReadonlyArray<BlockedCidr>;

export declare function cidrContains(cidr: string, ip: string): boolean;

export type AssertUrlDeps = {
  lookup?: (host: string, opts: { family: number }) => Promise<{ address: string; family: number }>;
};

export declare function assertUrlIsPublic(
  urlString: string,
  deps?: AssertUrlDeps,
): Promise<{ ip: string; family: number }>;
