---
phase: 228
phase_name: commercial-os-integration-future-readiness
reviewers: [codex]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - claude: current runtime — skipped per independence rule
  - gemini: not installed
  - opencode: not installed
reviewed_at: 2026-04-25
plans_reviewed:
  - 228-01-PLAN.md
  - 228-02-PLAN.md
  - 228-03-PLAN.md
  - 228-04-PLAN.md
  - 228-05-PLAN.md
  - 228-06-PLAN.md
codex_model: gpt-5.3-codex
codex_session_id: 019dc516-8f94-7590-9dfe-97bb0c9c1957
codex_tokens_used: 176549
overall_risk: HIGH
high_concerns: 4
medium_concerns: 6
low_concerns: 0
---

# Cross-AI Plan Review — Phase 228

> **Single-reviewer caveat:** Only Codex (`gpt-5.3-codex`) was available as an independent reviewer. Claude is the current runtime (skipped per independence rule). Gemini and OpenCode are not installed. There is no triangulated consensus — Codex's findings stand alone and should be weighed accordingly.

---

## Codex Review

# Codex Review — Phase 228

## Summary
The plan is well-structured and much stronger than a typical "integration phase," but it still has a serious realism problem: too much of the proof is synthetic. Several core gates are satisfied by generated registries, stub adapters, placeholder stories, regex scanners, and self-referential verifiers rather than by exercising real upstream engine implementations. I would not approve execution as-is for lane closeout; I would require tighter rules on when Phase 228 can begin, stronger proof standards for replaceability/migration/archival, and removal of the deferral escape hatch from sign-off.

## Strengths
- The phase boundary is disciplined: no new surface, no new orchestrator, no parallel registry/base doctrine. That is consistently stated in [228-CONTEXT.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-CONTEXT.md:12) and echoed through the plans.
- The route-back behavior for missing upstream engine surfaces is explicit and fail-closed in Plan 04/05, rather than silently converting absence into "coverage pending" ([228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:336), [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:321)).
- Reuse of existing doctrine is good: `plugins/registry.js` and `base-adapter.ts` are treated as extension points rather than excuses to invent new substrates ([228-01-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-01-PLAN.md:165), [228-02-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-02-PLAN.md:17)).
- Wave parallelism is mostly defensible. The specific concern about `package.json` collision in Wave 2 looks contained because 228-02 explicitly defers script wiring and 228-04 owns the test/tooling edits ([228-01-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-01-PLAN.md:212)).

## Concerns
- `HIGH` [228-02-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-02-PLAN.md:28), [228-02-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-02-PLAN.md:188), [228-02-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-02-PLAN.md:128): provider replaceability proof is too synthetic. `runSwapTest` only compares status enum and normalized event kind, and the CLI synthesizes stub adapters from fixture JSON. That does not prove real adapter interchangeability for actual upstream providers. The worst example is `launch_distribution`, which collapses a multi-provider workflow (`resend` + `slack`) into one pseudo-channel, then "proves" replaceability with a single send/normalize contract. That is not architecture-proof; it is fixture-proof.
- `HIGH` [228-03-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-03-PLAN.md:192), [228-03-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-03-PLAN.md:329): migration/archival proof is also synthetic. The builder generates 27 new stub exporter/importer files and 27 fixtures from CONTEXT docs, then allows the remaining 21+ archival paths to point at `_default-archive`/`_default-restore` identity stubs. That means Gate 8 can go green without touching real engine serializers, real retention storage, or real restore semantics. This is the biggest gap in the "no designed obsolescence" claim.
- `HIGH` [228-01-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-01-PLAN.md:206), [228-03-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-03-PLAN.md:192), [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:84): cross-engine integration realism is still delayed too far. Plans 01-03 can be completed almost entirely from sibling CONTEXT files, generated manifests, and stubs before any real 221-227 implementation lands. The hard precondition only appears in 04/05. That means "Phase 228 complete" can accumulate a large amount of synthetic infrastructure that is not actually bound to upstream code. For a parity/enforcement phase, that sequencing is backwards.
- `HIGH` [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:343), [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:425), [228-06-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-06-PLAN.md:370): sign-off still allows the lane to close with deferred cells as long as they are listed. `--strict` is explicitly informational/advisory at closeout. Nothing in the plan creates a mandatory follow-up artifact, blocking milestone, or automatic reopening rule for those deferrals. This is a permanent escape hatch unless you add hard follow-through enforcement.
- `MEDIUM` [228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:109), [228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:425): Plan 04 is internally inconsistent about the E2E proof. The objective says the evidence-chain suite "MUST run as part of slice 04 acceptance," but Task 2 later defers the full E2E to slice 05 readiness aggregation. That contradiction matters because the E2E suite is being used as the main proof of Gate 9 + Gate 10.
- `MEDIUM` [228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:343), [228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:423): Chromatic coverage is close to check-the-box. Five placeholder story files with trivial JSX states are not meaningful regression baselines for governed commercial surfaces. They only prove that Storybook can render five filenames, not that UI parity or mutation safety is preserved visually.
- `MEDIUM` [228-04-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-04-PLAN.md:350): the pricing-bypass detector is too weak for the stated policy. Checking whether `{{MARKOS_PRICING_ENGINE_PENDING}}` appears within 5 lines of a pricing string will miss values assembled across helpers, constants, templates, localization files, or server/client split modules. It will also produce false comfort around complex pricing copy paths.
- `MEDIUM` [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:332), [228-05-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-05-PLAN.md:346): test coverage is still partly circular. G10 is derived from `verify-test-coverage.cjs`, which mostly proves path existence and matrix parsing, not execution truth. QA-15 is explicitly self-referential, and its acceptance is reduced to "the verifier script path exists and says the row is pass." That is structurally better than a roll-up alias, but still not independent evidence.
- `MEDIUM` [228-03-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-03-PLAN.md:263), [228-03-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-03-PLAN.md:270): SOC2-I retention is oversimplified and potentially misaligned with erasure/tombstone doctrine. The plan hard-codes 2555-day retention for `cdp/identity_profile`, `audience_snapshot`, and `consent_state`, and even marks some of them `tenant_delete` archivable/recoverable. That needs an explicit reconciliation with GDPR/right-to-erasure and the P221 tombstone model. Right now the plan reads as "keep restorable identity/consent snapshots for 7 years," which is risky.
- `MEDIUM` [228-06-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-06-PLAN.md:196), [228-06-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-06-PLAN.md:235), [228-06-PLAN.md](/C:/Users/User%20PC/Documents/GitHub/MarkOS/.planning/phases/228-commercial-os-integration-future-readiness/228-06-PLAN.md:31): the "two-way semantic drift" check is still basically regex-driven. Six phrase patterns over two vault files is not semantic comparison; it is keyword scanning with manual interpretation bolted on. Worse, Plan 06 still contains stale `coverage_pending` routing language even though Plans 04/05 explicitly removed that concept. That is evidence of plan drift inside the supposed canon-sync slice.

## Suggestions
- Add a hard start gate for 228-01/02/03: they should only execute once the owned code surfaces for the relevant upstream engines exist, not just the CONTEXT docs.
- Tighten Gate 7 proof from stub parity to real adapter conformance. At minimum, require each upstream engine to expose a real adapter fixture pack and execute swap tests against real adapter modules, not synthesized test doubles.
- Tighten Gate 8 proof from generated stubs to real exporters/importers for every durable object. Generated placeholder files can scaffold, but they should not count toward readiness.
- Remove "sign-off mode allows deferred cells" for lane closeout, or convert every deferred cell into a mandatory gap artifact with owner, target phase, and blocking linkage in `ROADMAP.md`/`STATE.md`.
- Replace the pricing detector's `within 5 lines` heuristic with AST/token-aware checks or explicit allowlisted pricing accessors. The current rule is too local for the policy it claims to enforce.
- Require at least one real Storybook story per D-24 family sourced from the actual upstream component/view model, with placeholders allowed only as temporary supplementary coverage.
- Make QA-15 independent. It should validate the readiness matrix against raw gate outputs, not by asking the readiness-matrix verifier to confirm itself.
- Resolve the stale `coverage_pending` references in Plan 06 before approval; they contradict the blocker model introduced by B2.

## Risk Assessment
**Overall: HIGH**

The planning discipline is good, but the closure criteria are still too easy to satisfy with generated artifacts and too easy to waive via auditable deferrals. The main risks are false-green readiness, synthetic replaceability/archival proof, and a sign-off process that can close the lane without actually forcing unresolved items back into execution.

## Specific Questions for Plan Author
- What exact upstream implementation artifacts must exist before 228-01, 228-02, and 228-03 are allowed to start? Right now only 228-05 really enforces implementation presence.
- Is the intent that Gate 7 and Gate 8 are proven by real engine code, or are stubs/generic identity round-trips considered sufficient for lane closeout?
- How is `launch_distribution` supposed to be modeled as a single replaceable binding when the current design is a composite workflow (`resend` + `slack`) rather than one provider slot?
- What mechanism forces deferred cells to be resolved after sign-off? Where is the mandatory follow-up artifact, owner, and blocker linkage?
- How do you reconcile 7-year recoverability for `cdp/identity_profile` and `consent_state` with P221 tombstone/erasure obligations?
- Why does Plan 04 say the E2E evidence-chain suite must run in slice 04 acceptance, then immediately defer it to slice 05?
- Why does Plan 06 still reference `coverage_pending` after B2 explicitly removed that concept?

---

## Consensus Summary

> Single reviewer (Codex) — no triangulation. Treat findings as one strong external signal, not consensus.

### Top concerns (Codex flagged HIGH)

1. **Synthetic replaceability proof (Gate 7)** — `runSwapTest` only compares status enum + event kind on synthesized stub adapters. Does not prove real adapter interchangeability. Worst case: `launch_distribution` collapses `resend`+`slack` composite workflow into single pseudo-channel.

2. **Synthetic migration/archival proof (Gate 8)** — Builder generates 27 stub exporter/importer files; remaining archival paths default to `_default-archive`/`_default-restore` identity stubs. Gate 8 can ship green without touching real engine serializers, retention storage, or restore semantics.

3. **Sequencing inversion** — Plans 01-03 completable from sibling CONTEXT + generated stubs WITHOUT any 221-227 implementation. Hard precondition only at 04/05. Phase 228 can accumulate synthetic infrastructure not bound to upstream code. "Backwards for a parity/enforcement phase."

4. **Permanent deferral escape hatch (sign-off)** — Sign-off allows lane closure with deferred cells listed. `--strict` is informational. No mandatory follow-up artifact, blocking milestone, or auto-reopening rule. Permanent escape hatch unless follow-through enforcement added.

### Notable medium concerns

- **Plan 04 internal contradiction:** objective says E2E suite MUST run in slice 04 acceptance, Task 2 defers to slice 05.
- **Chromatic check-the-box:** 5 placeholder stories with trivial JSX prove rendering, not visual mutation safety.
- **Pricing detector too local:** `{{MARKOS_PRICING_ENGINE_PENDING}}` within 5 lines misses cross-file/cross-module pricing assembly.
- **Test coverage circularity:** QA-15 self-referential — verifier script "exists and says row is pass" is not independent evidence.
- **SOC2-I retention vs GDPR erasure:** 7-year retention on identity/consent snapshots not reconciled with P221 tombstone/right-to-erasure model.
- **Plan 06 drift:** still contains stale `coverage_pending` routing language despite B2 removing that concept; "evidence of plan drift inside the supposed canon-sync slice."

### Suggested next move

These are real architectural concerns, not stylistic. Internal checker (gsd-plan-checker) caught task-level issues but missed system-level realism issues. Recommended path:

1. **Reconcile and replan** via `/gsd-plan-phase 228 --reviews` — incorporate Codex's HIGH concerns
2. **Or accept-and-document** — if synthetic proofs are intentional milestone scope (e.g., infrastructure scaffolding ahead of upstream engine implementation), update CONTEXT.md `<deferred>` with explicit deferrals + target phases for "real proof" follow-up

Do not execute as-is without addressing at least the 4 HIGH concerns.

### Divergent views

N/A — single reviewer.

### Reviewer environment

- Codex CLI v0.121.0
- Model: gpt-5.3-codex
- Sandbox: read-only
- Tokens used: 176,549
- Session: 019dc516-8f94-7590-9dfe-97bb0c9c1957
