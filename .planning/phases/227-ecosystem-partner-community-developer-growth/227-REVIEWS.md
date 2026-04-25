---
phase: 227
phase_name: ecosystem-partner-community-developer-growth
reviewers: [codex]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - claude: current runtime — skipped per independence rule
  - gemini: not installed
  - opencode: not installed
reviewed_at: 2026-04-25
plans_reviewed:
  - 227-01-PLAN.md
  - 227-02-PLAN.md
  - 227-03-PLAN.md
  - 227-04-PLAN.md
  - 227-05-PLAN.md
  - 227-06-PLAN.md
  - 227-07-PLAN.md
codex_model: gpt-5.3-codex
codex_tokens_used: 222862
overall_risk: HIGH
high_concerns: 5
medium_concerns: 6
low_concerns: 2
---

# Cross-AI Plan Review — Phase 227

> **Single-reviewer caveat:** Only Codex (`gpt-5.3-codex`) was available. Claude is the current runtime (skipped per independence rule). Gemini and OpenCode are not installed. No triangulation — Codex's findings stand alone.

---

## Codex Review

# Codex Review — Phase 227

## Summary
Phase 227 is ambitious and mostly well-structured, but it still has several approval-blocking integrity gaps. The biggest issues are not missing scope; they are unsafe sequencing and weak enforcement boundaries: the plans allow dependency-skipping migrations instead of hard failing, mark payout credits as `paid` too early, rely on cron/app-layer behavior for some trust guarantees that should be DB-enforced, and contain at least one concrete codebase mismatch (`lookupPlugin` vs actual `resolvePlugin`). I would not approve execution unchanged.

## Strengths
- The phase has unusually good cross-phase awareness. P220/P221/P222/P224/P225/P226 touchpoints are explicitly identified instead of hand-waved.
- The single-ledger attribution posture is correct. Extending `attribution_touches` instead of creating an ecosystem side-ledger is the right architectural choice.
- The certification model is much stronger than a simple boolean badge. Versioned criteria templates, recertification, and terminal revocation are the right trust primitives.
- Fraud, payout, install, and co-sell all at least recognize that approvals and audit trails matter. The plans are not treating growth motions as "just marketing."
- Public-surface hardening is reasonably comprehensive: SSR + ISR + BotID + rate-limit + honeypot + sitemap/robots + JSON-LD are all explicitly planned.

## Concerns
- `HIGH` — `.planning/phases/227-ecosystem-partner-community-developer-growth/227-01-PLAN.md:150`, `:278`, `.planning/phases/227-ecosystem-partner-community-developer-growth/227-RESEARCH.md:329`, `:1186` assume `lib/markos/plugins/registry.js` exports `lookupPlugin()`, but the actual file exports `resolvePlugin(registry, pluginId)` at `lib/markos/plugins/registry.js:94-113`. This is not a naming nit; the adapter plan is wired to a nonexistent API and also assumes a global registry shape the file does not expose.
- `HIGH` — Migration dependency handling is too permissive and violates the stated dependency posture. `227-01-PLAN.md` and the assumptions log allow conditional behavior if P220 is absent; `227-05-PLAN.md:216` says migration 166 should log a warning and skip if `cdp_consent_states` is absent; `227-06-PLAN.md` similarly tries to make 167 adaptive. Phase 227 explicitly depends on 220/221/225. Silently skipping ALTERs creates partial execution states that look green but are semantically broken. This should hard-fail, not degrade.
- `HIGH` — `227-04-PLAN.md:315-317` marks payout credits `status='paid'` immediately after CSV generation and batch assignment. That is not "paid"; that is "exported." If finance never executes the batch, executes it partially, or rejects rows, the ledger will falsely show settlement. This is the most serious operational bug in the package.
- `HIGH` — Manual CSV payout is still operationally under-governed. `227-CONTEXT.md:68` and `227-04-PLAN.md:83-85` defer Stripe Connect/KYC/1099/tax, but nothing in the plan blocks real payout processing pending those controls. The placeholder rule only governs copy, not disbursement authority. You currently have a path to create, clear, export, and mark payouts as paid without legal/tax readiness.
- `HIGH` — Certification expiry still has a visibility race. `227-03-PLAN.md:240` admits the real "belt-and-suspenders" filter (`certification_records.expires_at > now()`) is deferred to 227-07, while `227-02` public reads only use `PUBLIC_LISTING_FILTER` = `status='active' AND certification_state='certified'`. If the cron misses a day, expired listings can remain visible until cleanup. That contradicts the trust posture.
- `MEDIUM` — Webhook replay protection is underspecified. The plan relies on `UNIQUE (source, source_message_id)` plus signature verification (`227-05-PLAN.md:241`, `227-RESEARCH.md:993-996`), but there is no timestamp freshness/skew window enforcement even where timestamp headers exist, especially Discord (`227-05-PLAN.md:226`). DB dedupe is helpful, but not enough as a replay policy.
- `MEDIUM` — The fraud engine is easy to game and too short-windowed. `227-04-PLAN.md:196` only inspects recent attribution touches in the last hour. That catches burst abuse but misses slower fraud patterns. The evaluator set is also simplistic: IP/device/account-age heuristics without maturation windows or delayed-clear policy means high false negatives, and the only automatic hard hold is `critical`.
- `MEDIUM` — Human review posture for fraud is incomplete. The plan blocks payouts automatically only for `critical` (`227-04-PLAN.md:196`, `:212`), but medium/high signals are not clearly held pending review. That means a non-critical but still suspicious program can clear into payout with no mandatory review checkpoint.
- `MEDIUM` — Co-sell commission immutability is application-only. `227-06-PLAN.md:264`, `:271`, `:356` rely on `commission_locked_at` plus service-layer rejection, but migration 165 only stores the timestamp; there is no DB trigger/check preventing direct SQL mutation after acceptance. Financial immutability should not depend solely on API discipline.
- `MEDIUM` — The attribution extension weakens referential integrity relative to its own truth statement. `227-06-PLAN.md:26` says attribution gains six nullable FK columns, but behavior at `:165` makes `partner_id` and `referral_program_id` soft refs. That creates a weaker single-ledger guarantee than the phase summary claims.
- `MEDIUM` — `227-05-PLAN.md:372-396` defines poll-fallback around "integrations where webhook is configured," but the engine's actual source-of-truth for those integrations is not clearly identified in this phase. That makes the fallback cron look conceptually plausible but operationally vague.
- `LOW` — `227-07-PLAN.md:257-258` adds a late "RLS hardening pass" migration after multiple waves have already assumed the policies are correct. If RLS needs hardening in 170, then earlier plans are not actually safe enough to execute independently.
- `LOW` — Some verification steps are still grep-shape heavy rather than behavior-first, especially around generated files and registry usage. That is not fatal, but it is the kind of synthetic-proof pattern that can let a broken implementation pass planning review.

## Suggestions
- Replace all dependency-skipping migration behavior with explicit hard-fail guards. If P220/P221/P225 are not shipped, Phase 227 should stop.
- Fix the plugin registry plan before execution. Either adapt to `resolvePlugin(registry, pluginId)` or define the real runtime access seam first; do not proceed with a fictional `lookupPlugin`.
- Introduce an intermediate payout status such as `exported` or `submitted`. Only move to `paid` after explicit finance confirmation or reconciliation import.
- Add a v1 payout governance gate: no export unless a tenant-level compliance/finance acknowledgement exists. The placeholder rule is not enough.
- Move expired-listing hiding to render/query time in 227-02 or 227-03, not 227-07. Cron should clean state, not be the only trust barrier.
- Add timestamp freshness validation to webhook verification wherever the provider supports it, and document acceptable skew.
- Add DB-level enforcement for commission immutability after acceptance, either with a trigger or by snapshotting accepted commercial terms into an append-only immutable row.
- Tighten fraud posture:
  - Hold `high` severity for review, not just `critical`.
  - Add a maturation/holding period before `clearPayout`.
  - Extend fraud evaluation beyond a 1-hour window.
- Make poll-fallback concrete: identify the canonical integration health table/record that owns `last_received_at` and polling eligibility.
- Split "RLS hardening" from "RLS initial correctness." Earlier slices should already be safe without waiting for migration 170.

## Risk Assessment
**Overall: HIGH**

The plan quality is strong, but the remaining issues cluster around finance, trust, and sequencing. Those are exactly the areas where "mostly right" is not good enough. The package is close, but as written it can produce false payout finality, partial schema rollout, expired listing exposure, and enforcement gaps that only exist at the app layer.

## Specific Questions for Plan Author
- Why does the phase allow migration skips/no-ops for missing P220/P221/P225 dependencies instead of hard-failing execution?
- What is the real adapter seam for the plugin registry, given the actual registry exports `resolvePlugin`, not `lookupPlugin`?
- Why are payout credits marked `paid` at CSV generation time instead of after confirmed external settlement?
- What blocks a tenant from using the manual CSV flow before legal/tax/compliance posture is accepted?
- Why is the expired-cert marketplace fail-safe deferred to 227-07 instead of enforced in the first public listing read path?
- Should `high` fraud severity also block payout clearance pending review?
- Why are `partner_id` and `referral_program_id` only soft refs in attribution if the phase claims six FK-backed ecosystem references?
- What is the exact source of truth for webhook health and poll eligibility in `poll-fallback.ts`?
- Do you want commission immutability to survive direct SQL/service-role mutation, or is app-layer-only enforcement considered acceptable for this ledger?

---

## Consensus Summary

> Single reviewer (Codex) — no triangulation. Treat findings as one strong external signal.

### Top concerns (Codex flagged HIGH)

1. **Concrete codebase mismatch** — `lookupPlugin()` doesn't exist; actual export is `resolvePlugin(registry, pluginId)` at `lib/markos/plugins/registry.js:94-113`. Plan 01 + RESEARCH wired to fictional API. Must adapt or define real runtime seam first.

2. **Migration skip-if-missing violates dependency posture** — Phase 227 declares `Depends on: 220, 221, 225` but Plans 01/05/06 allow conditional ALTER skip if upstream tables missing. Silently degrading creates partial schema looking green. Must hard-fail.

3. **Payout `paid` set at CSV generation, not settlement** — Plan 04:315-317. "That is not 'paid'; that is 'exported.'" Most serious operational bug. Need intermediate `exported`/`submitted` status; only move to `paid` after finance reconciliation.

4. **Manual CSV payout governance gap** — placeholder rule governs copy, not disbursement authority. Tenant can create→clear→export→mark-paid without legal/tax/compliance posture. Need v1 governance gate (compliance ack required before export).

5. **Certification expiry visibility race** — public listing filter only checks `certification_state='certified'`, not `expires_at > now()`. Real belt-and-suspenders deferred to 227-07. Cron miss = expired listings stay visible. Move expiry filter to render/query time, not cleanup cron.

### Top concerns (MEDIUM)

6. **Webhook replay protection lacks timestamp freshness** — DB dedupe alone insufficient; need provider-supported timestamp skew validation (especially Discord).

7. **Fraud window too short (1hr) + only `critical` blocks payouts** — slow-fraud patterns missed; `high` severity should also hold pending review; add maturation period before `clearPayout`.

8. **Commission immutability app-only** — `commission_locked_at` is timestamp; no DB trigger preventing direct SQL mutation. Add DB-level enforcement (trigger OR append-only snapshot).

9. **Attribution FK soft-ref weakens single-ledger claim** — Plan 06 declares 6 FK columns but `partner_id` + `referral_program_id` are soft refs.

10. **Poll-fallback source of truth vague** — "integrations where webhook is configured" not concretely identified. Need canonical health table/record.

11. **RLS hardening deferred to migration 170** — earlier slices not safe to execute independently if RLS needs hardening later. Split initial correctness vs hardening.

### Suggested next move

Cross-AI review found 5 HIGH concerns. Two are concrete bugs (codebase mismatch + payout-paid-too-early), two are governance (migration skip + payout authority), one is trust (cert expiry race). All addressable.

**Recommended:** `/gsd-plan-phase 227 --reviews` to incorporate Codex feedback before execution.

Same caveat as Phase 228: single reviewer, no triangulation. Internal `gsd-plan-checker` passed iter 2 but missed:
- Codebase API verification (would need to grep `lib/markos/plugins/registry.js` for actual exports)
- Lifecycle-state-vs-real-world-meaning checks (`paid` vs `exported`)
- DB-level vs app-level enforcement boundary analysis
- Multi-phase governance gates (compliance/legal sign-off)

### Reviewer environment

- Codex CLI v0.121.0
- Model: gpt-5.3-codex
- Sandbox: read-only
- Tokens used: 222,862
- 13 concerns across 7 plans + RESEARCH/CONTEXT
