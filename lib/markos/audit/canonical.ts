// Phase 201 D-17: TypeScript dual-export. SOURCE OF TRUTH is canonical.cjs.
const canonicalCjs = require('./canonical.cjs') as {
  canonicalJson: (value: unknown) => string;
};

export const canonicalJson: (value: unknown) => string = canonicalCjs.canonicalJson;
