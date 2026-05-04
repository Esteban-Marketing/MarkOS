const impl = require('./signing.cjs');

export const SIGNATURE_HEADER: string = impl.SIGNATURE_HEADER;
export const TIMESTAMP_HEADER: string = impl.TIMESTAMP_HEADER;
export const SIGNATURE_PREFIX: string = impl.SIGNATURE_PREFIX;
export const MAX_SKEW_SECONDS: number = impl.MAX_SKEW_SECONDS;
export const NONCE_BYTES: number = impl.NONCE_BYTES;

export type SignedPayload = {
  signature: string;
  timestamp: string;
};

export type DualSignHeaders = {
  'X-Markos-Signature-V1': string;
  'X-Markos-Signature-V2'?: string;
  'X-Markos-Timestamp': string;
};

export type SignOptions = {
  timestamp?: number | string;
  now?: number | (() => number);
  nonce?: string;
};

export type ParsedSignatureHeader =
  | { ok: true; t: number; n: string; sha256: string }
  | { ok: false; reason: string };

export type RecordNonceResult =
  | { ok: true }
  | { ok: false; reason: string; detail?: string };

export type VerifyOptions = {
  maxSkewSeconds?: number;
  now?: number | (() => number);
  recordNonce?: (nonce: string, timestamp?: number) => Promise<RecordNonceResult> | RecordNonceResult;
  client?: { from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error?: { code?: string; message?: string } | null }> } };
  subscriptionId?: string;
};

export type VerifyResult =
  | { ok: true; timestamp: string; nonce: string }
  | { ok: false; reason: string; detail?: string };

export const signPayload: (secret: string, body: string, now?: () => number) => SignedPayload = impl.signPayload;
export const signPayloadDualSign: (
  v1Secret: string,
  v2Secret: string | null | undefined,
  body: string,
  now?: () => number,
) => { headers: DualSignHeaders } = impl.signPayloadDualSign;
export const verifySignature: (
  secret: string,
  body: string,
  signature: string,
  timestamp: string,
  options?: { maxSkewSeconds?: number; now?: () => number },
) => boolean = impl.verifySignature;
export const sign: (secret: string, body: string, options?: SignOptions) => string = impl.sign;
export const parseSignatureHeader: (header: string) => ParsedSignatureHeader = impl.parseSignatureHeader;
export const verify: (
  secret: string,
  body: string,
  signatureHeader: string,
  options?: VerifyOptions,
) => Promise<VerifyResult> = impl.verify;

export default impl;
