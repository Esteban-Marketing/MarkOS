// Phase 201.1 D-101 (closes H1): TypeScript dual-export. SOURCE OF TRUTH is inline-emit.cjs.
// Inline audit emit helper for approve/submit flows — fail-CLOSED by design.

const inlineEmitCjs = require('./inline-emit.cjs') as {
  runWithDeferredEnd: (
    req: object,
    res: object,
    businessHandler: (req: object, res: object) => void | Promise<void>,
  ) => Promise<{ status: number; headers: Array<[string, unknown]>; body: string }>;
  emitInlineApprovalAudit: (
    req: object,
    captured: { status: number; headers: Array<[string, unknown]>; body: string },
    opts: { action: 'approve' | 'submit'; client?: object },
  ) => Promise<void>;
};

export const runWithDeferredEnd: typeof inlineEmitCjs.runWithDeferredEnd =
  inlineEmitCjs.runWithDeferredEnd;

export const emitInlineApprovalAudit: typeof inlineEmitCjs.emitInlineApprovalAudit =
  inlineEmitCjs.emitInlineApprovalAudit;
