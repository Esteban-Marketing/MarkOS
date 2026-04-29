// Phase 201 D-17 + D-103: TypeScript dual-export. SOURCE OF TRUTH is canonical.cjs.
// D-103: NFC + ECMA-262 §7.1.13 ToString(Number) + binary-lex key sort + lowercase \uXXXX.
// See docs/canonical-audit-spec.md for the full locked specification.
const canonicalCjs = require('./canonical.cjs') as {
  canonicalJson: (value: unknown) => string | undefined;
};

export const canonicalJson: (value: unknown) => string | undefined = canonicalCjs.canonicalJson;
