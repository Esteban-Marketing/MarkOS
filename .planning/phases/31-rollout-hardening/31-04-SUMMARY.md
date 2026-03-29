# 31-04 Summary

## One-liner
Shipped operator-driven compatibility retirement policy with canonical decision ledger and protocol drift checks.

## Key Files
- .planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json
- .planning/ROADMAP.md
- .planning/PROJECT.md
- .planning/phases/31-rollout-hardening/31-UAT.md
- README.md
- TECH-MAP.md
- test/protocol.test.js
- .planning/phases/31-rollout-hardening/31-VERIFICATION.md

## Delivered
- Added compatibility decision ledger schema with seeded draft example and optional `evidence_refs`.
- Updated docs/planning/UAT language to manual operator discretion (no hard minimum evidence threshold).
- Added protocol tests that fail on policy drift and ledger removal.
- Refreshed verification guidance to reference cross-artifact parity checks.

## Verification
- `node --test test/protocol.test.js` (pass)
- `node --test test/protocol.test.js --test-name-pattern "Compatibility"` (pass)
