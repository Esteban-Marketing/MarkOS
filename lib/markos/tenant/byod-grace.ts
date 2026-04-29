// Phase 201.1 D-107 (closes M2): TypeScript dual-export. SOURCE OF TRUTH is byod-grace.cjs.

const graceCjs = require('./byod-grace.cjs') as {
  BYOD_GRACE_WINDOW_MS: number;
  gracePathEnabled: () => boolean;
  isWithinByodGraceWindow: (row: ByodDomainRow, now?: number) => boolean;
};

export interface ByodDomainRow {
  status: string;
  last_verified_at: string | Date | null | undefined;
}

export const BYOD_GRACE_WINDOW_MS = graceCjs.BYOD_GRACE_WINDOW_MS;
export const gracePathEnabled = graceCjs.gracePathEnabled;
export const isWithinByodGraceWindow = graceCjs.isWithinByodGraceWindow;
