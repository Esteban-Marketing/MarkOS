---
phase: 201
phase_name: saas-tenancy-hardening
reviewers: [claude-cli-separate-session]
reviewers_attempted: [gemini, claude, codex, opencode]
reviewers_skipped:
  - gemini: not installed
  - codex: usage limit hit until 2026-05-02 (returned `You've hit your usage limit. Upgrade to Plus to continue using Codex`)
  - opencode: not installed
reviewer_note: |
  Workflow rule says skip the current runtime (Claude Code) for independence. In this
  environment NO truly independent CLI was reachable (gemini/opencode missing, codex
  usage-limited). Best available substitute: a fresh `claude -p` invocation, which is
  same model family but runs as a separate process with no shared context. Treat this
  as second-pass adversarial review, not a true cross-AI review. The previous fallback
  on 2026-04-27 was a single-pass orchestrator check; this pass is from an independent
  Claude session given only the structured prompt + plan summaries.
reviewed_at: 2026-04-27
plans_reviewed:
  - 201-01-PLAN.md
  - 201-02-PLAN.md
  - 201-03-PLAN.md
  - 201-04-PLAN.md
  - 201-05-PLAN.md
  - 201-06-PLAN.md
  - 201-07-PLAN.md
  - 201-08-PLAN.md
overall_risk: MEDIUM-HIGH
high_concerns: 6
medium_concerns: 7
low_concerns: 5
---

# Cross-AI Plan Review — Phase 201

> Cross-AI workflow could not assemble independent reviewers in this environment.
> Codex returned a hard usage-limit error until 2026-05-02. Gemini and OpenCode are
> not installed. The reviewer below is `claude -p` running as a fresh, context-free
> CLI session — same model family as the orchestrator, but no shared conversation
> state. This is more rigorous than the 2026-04-27 single-pass fallback already in
> git, but it is still NOT a true multi-model adversarial review. Treat the
> findings as a second-pass internal challenge.

---

## Claude (separate-session) Review

### 1. Summary

Plan set substantively covers D-01..D-17 and QA-01..QA-15 (less 4 declared NA). Architecture is generally sound: pg_advisory_xact_lock + canonical JSON for hash chain, staging table for at-least-once intake, fail-closed Vercel/BotID wrappers, RLS RESTRICTIVE for append-only, partial unique index for D-13. Several non-trivial integrity holes remain (audit emit timing, signed-URL leakage, cache stampede/propagation, replay-bound passkey challenges, rate-limit gap pre-Plan-08). Demoting operational smokes to "informational" is **not justified** for a phase that owns the entire signup→offboard loop. Verdict: ship-blocking gaps remain even though tests are green.

### 2. Strengths

- Plan 02 single-writer SQL fn (`append_markos_audit_row`) eliminates concurrent-fork race at correct layer (DB, not app).
- Pitfall 1 mitigated cleanly in Plan 03: `markos_unverified_signups` buffer means no orphan orgs/tenants on abandoned verify.
- Plan 05 cookie domain chooser (`.markos.dev` vs null for BYOD) — correct cross-origin isolation choice.
- D-13 enforced 2 layers (partial unique index + pre-flight SELECT) — good defense-in-depth.
- Plan 04 wrapper-only `@simplewebauthn` usage. No hand-rolled crypto. Correct call.
- Plan 07 streaming archiver via PassThrough (Pitfall 7) prevents memory blowup on large exports.
- Plan 08 res.end hook keeps handlers.cjs untouched — clean separation, but see Concern H4.

### 3. Concerns

#### HIGH

**H1. Audit emit AFTER res.end (Plan 08, approve.js/submit.js wrapper).**
res.end hook fires post-response. If emit throws/network-fails, client got 200 but audit row missing. Hash chain silently skips an event. For approval/submit flows this is regulatory-grade evidence loss. **Fix:** emit synchronously inside handler before response, OR insert into staging table in same DB txn as the business action. Webhooks path uses `source_domain='webhooks'` and presumably emits inline — apply same pattern for approvals.

**H2. Operational smokes demoted to "informational" — unjustified.**
30-day soft-delete cron, real-device passkey, BotID live, GDPR retrieval, DNS, email delivery, cookie SameSite are correctness gates, not nice-to-haves. Specifically:
- Untested 30-day cron = claims of GDPR deletion that may never fire = enforcement exposure under Art. 17.
- Untested DNS/middleware path = wildcard routing could fail on subset of providers.
- Untested email delivery = magic-link primary auth (D-01) untrusted in prod.

Reconciliation note (2026-04-27) treats these as if they were polish. They are core to phase goal. **Fix:** stand up staging smoke harness; gate v4.0.0 release (not phase-201 commit) on explicit pass.

**H3. GDPR signed URL = bearer credential (Plan 07).**
7-day URL with no IP binding, no download-once, no audience claim. URL leaks via browser history, referer, screenshots, BI tools, error logs. Per Art. 32 this is arguably insufficient technical measure for sensitive data export. **Fix:** download-once token bound to requesting session + IP; OR require re-auth on download; OR cap at 24h with re-issue.

**H4. Hash-chain canonicalization spec under-specified (Plan 02).**
"6-key ordered string, binary-identical Node↔Postgres" — but spec doesn't (in this summary) commit on:
- Number formatting (JS `1` vs Postgres `1.0`; scientific notation thresholds; `-0`).
- Unicode (NFC normalization? composed vs decomposed accents in tenant slugs/emails).
- String escape (`/` escaped or not; `\u00xx` lowercase/uppercase).
- NaN/Infinity rejection.

Single byte divergence breaks the chain; tamper-detection becomes false-positive engine. **Fix:** publish explicit canonicalization spec + property test fuzzing identical objects through both code paths.

**H5. Edge-config slug cache stampede + propagation race (Plans 05, 08).**
60s TTL: at expiry, N concurrent middleware invocations miss → all hit DB. No mention of single-flight/jittered TTL. Worse: rename "synchronous invalidate" — Vercel Edge Config propagation is not instant across regions; race window allows old slug to resolve to new tenant. **Fix:** jittered TTL (45–75s); read-after-write verification on rename; rename should set short transitional cache entry pinning the old route to a 410 with redirect.

**H6. Rate-limit gap in Plan 03 deployed before Plan 08.**
"Rate-limit increment via SQL fn lands Plan 08." Until Plan 08, JS read-then-write race lets concurrent attackers exceed 5/hour. If Plan 03 is live first (typical commit ordering), there's a window where DDoS surface is wider than intended. **Fix:** STATE.md must record Plan 08 as deploy-gate for Plan 03; OR ship 03 with a SELECT FOR UPDATE / atomic upsert from day one.

#### MEDIUM

**M1. Passkey challenge binding (Plan 04).**
"One-time, deleted in verify path" — good against replay. But verify must also bind challenge to: user_id (or null for usernameless), expected origin, expected rpId, server-side. If only tied to user_id, a phishing site could harvest a challenge and relay. **Verify** SimpleWebAuthn config sets `expectedOrigin`/`expectedRPID` correctly per tenant subdomain (and per BYOD vanity host — does rpId vary by host? RP ID change = passkey unusable; this needs an explicit policy).

**M2. BYOD verified-only filter creates silent-outage risk (Plan 06).**
If domain transitions `verified → failed` (cert expiry, DNS drift), middleware drops it → tenant offline. No grace window, no alert in plan summary. Real-world: certs expire silently. **Fix:** soft-failure window (e.g., 24h tolerated `failed` if previously `verified`) + paging hook.

**M3. Custom-domain color contrast (Plan 06 #RRGGBB).**
Validation accepts any hex. Tenant could set `--accent` indistinguishable from background → vanity login unusable; WCAG fail. **Fix:** server-side luminance/contrast computation against vanity bg; reject below ratio threshold.

**M4. Right-to-erasure vs hash chain conflict (cross-cutting Plans 02 + 07).**
Erasure (Art. 17) requires PII removal. Audit log rows reference user_id, IPs, etc. Redacting those breaks `row_hash`. No mention of erasure policy. **Fix:** pseudonymize-in-place policy: PII columns nulled but `row_hash` recomputed using `tombstone` marker preserving chain continuity (with documented exception in tamper-detection logic), OR maintain shadow PII vault keyed by audit row id.

**M5. ZIP export hardening (Plan 07).**
Archiver default: no zip-slip entries since user controls no path, but worth confirming. Export size bomb from a malicious BYOD-tenant uploading large blobs that get bundled? Bundle is per-tenant own data, so DoS-self mostly. Still: cap bundle size + log + reject.

**M6. Reserved-slug blocklist staleness (Plan 01).**
88 hardcoded entries, including profanity (locale-bound) and vendor names (changing). Hardcoded list rots; new vendor lawsuits arrive. **Fix:** load from versioned config + admin override path; profanity via maintained dataset, not hand-rolled.

**M7. QA-06/QA-07 NA declaration weak.**
QA-06 (Playwright) and QA-07 (load) declared NA. Tenancy phase is exactly where E2E (signup → email click → org create → middleware route → settings) pays rent. Unit tests can't catch SameSite/cookie scope/middleware/edge-config issues. Load testing matters because middleware sits in hot path. **Fix:** at minimum a Playwright smoke for golden signup→use→offboard.

#### LOW

**L1.** BotID fail-closed → registration outage on provider downtime (Plan 03). Document SLO + runbook.
**L2.** GDPR bundle's 10 frozen `BUNDLE_DOMAINS` — embed schema version in zip metadata so future v4.x exports stay self-describing.
**L3.** Soft-delete reversibility (Plan 07): does undelete on day 29 cleanly restore audit references? Test the un-purge path.
**L4.** Cookie SameSite policy not stated in summary for first-party `.markos.dev` cross-subdomain. Should be `Lax` for OAuth-style flows; explicit assertion needed.
**L5.** Vercel domain webhook 300s replay window — confirm clock-skew tolerance includes monotonic clock issues across regions.

### 4. Suggestions

1. **Reclassify smokes back to gates.** Block v4.0.0 release (not phase commit) on staging smoke pass for: 30-day cron (use accelerated test clock), real-device passkey, BotID live, magic-link e2e, GDPR retrieve+download.
2. **Move audit emit inline.** Inside same DB txn as approve/submit/webhook business writes. res.end hook is a footgun for evidence-grade logging.
3. **Publish canonicalization spec.** With property-based fuzzer running in CI comparing Node and Postgres outputs over 10k random objects.
4. **Harden GDPR URL.** Download-once + session-bound, OR shorter TTL + reissue endpoint.
5. **Define erasure-vs-chain policy** explicitly in 201.x or escalate to a dedicated phase. Today there's an unresolved compliance contradiction.
6. **Jittered TTL + single-flight** on edge-config slug cache; transitional 410 entry on rename.
7. **Promote rate-limit SQL fn into Plan 03** (or hard-gate Plan 08 as deploy-blocker via STATE.md).
8. **Add Playwright smoke** for the tenancy golden path. Reverse QA-06 NA.
9. **BYOD silent-outage tolerance window** + alert path on `verified→failed` transition.
10. **Contrast check on `--accent`.** Server-side luminance gate.

### 5. Risk Assessment

**MEDIUM-HIGH.**

Justification: Code paths and tests are credible (206 passing). But three classes of issues compound:
- **Compliance under-tested in operation** (H2, H3, M4): GDPR claims unverified end-to-end; signed-URL hygiene below industry norm; erasure-vs-chain unresolved.
- **Audit-chain integrity has soft spots** (H1, H4): the very thing that makes phase 201 trustworthy can silently desync.
- **Cache + cron timing assumed-correct, untested in prod conditions** (H5, M2, L3).

Phase 201 is more shippable than not, but "verified, scope_reconciled" is optimistic. Recommend reopening for 201.x covering H1–H5 + M4 before promoting v4.0.0. Demotion of smokes is the single most concerning judgment call — it converts known-untested-but-required behaviors into invisible risk.

---

## Codex Review

> **SKIPPED — usage limit.** `codex exec` returned `You've hit your usage limit.
> Upgrade to Plus to continue using Codex (<https://chatgpt.com/explore/plus>), or
> try again at May 2nd, 2026 9:44 AM.` No review produced. Re-run after 2026-05-02
> if a Codex pass is still wanted before v4.0.0 sign-off.

---

## Gemini Review

> **SKIPPED — not installed.** `gemini` CLI unavailable on this host. Install via
> https://github.com/google-gemini/gemini-cli to add Gemini to future review passes.

---

## OpenCode Review

> **SKIPPED — not installed.** `opencode` CLI unavailable on this host.

---

## Consensus Summary

Only one reviewer (Claude separate session) returned content, so a true consensus
cannot be computed. Compared against the prior 2026-04-27 fallback review and the
verified `201-VERIFICATION.md`, both reviewers converge on the **same governance
critique** (operational smokes vs unconditional PASS), and the second pass adds
seven concrete technical concerns the first pass did not surface.

### Cross-Review Convergence (2026-04-27 fallback ↔ 2026-04-27 second pass)

Both reviewers, despite same model family, independently flagged:

- **HIGH governance drift**: phase marked "passed" while real-world correctness
  gates (DNS, email, BotID live, passkey ceremony, purge cron, cookie SameSite,
  GDPR retrieval, staging perf) remain unrun. The reconciliation note demoting
  these to "informational" is unjustified for a phase whose core promise is
  signup→middleware→offboard.

### New Concerns From Second Pass (NOT raised in 2026-04-27 fallback)

1. **H1 — Audit emit-after-res.end footgun**: approve/submit audit can drop rows
   silently when emit fails post-response. Recommend inline emit or staging-
   table-in-business-txn.
2. **H3 — GDPR signed-URL bearer-credential weakness**: 7-day URL leaks via
   referer/history/screenshots; no IP binding, no download-once, no audience
   claim. Likely thin under GDPR Art. 32.
3. **H4 — Canonicalization under-specified**: Node↔Postgres byte-identical
   string is asserted but number/Unicode/escape rules not pinned. One stray
   byte = false-positive tamper detection across the chain.
4. **H5 — Edge-config cache stampede + cross-region propagation race**: no
   jittered TTL, no single-flight, "synchronous invalidate on rename" trusts
   global propagation that does not exist.
5. **H6 — Plan 03 rate-limit race pre-Plan-08**: JS upsert lets concurrent
   attackers exceed 5/h until Plan 08's SQL fn lands. Plan 08 is implicitly
   a deploy-blocker for Plan 03 but not declared as such.
6. **M1 — Passkey RP-ID policy ambiguous across BYOD**: passkey usable on
   first-party subdomain may be unusable on vanity host (RP ID change). Needs
   explicit policy.
7. **M4 — Right-to-erasure vs hash chain unresolved**: Art. 17 redaction
   breaks `row_hash`. No tombstone / pseudonymization policy in plans.

### Agreed Strengths

- Architecture choices are correct at the layer where they sit (DB-level lock,
  fail-closed wrappers, RLS RESTRICTIVE, partial unique index, wrapper-only
  WebAuthn).
- Substantial real implementation behind the plans (206 tests pass, no stubs).
- Plan 08 res.end wrapper avoids touching 3000-line handlers.cjs — clean
  separation, but introduces the H1 footgun.

### Agreed Concerns

1. **H2 (both reviewers, HIGH).** Demoting live-platform smokes to
   "informational only" on 2026-04-27 is the strongest recurring critique.
   Both passes recommend reopening, either as a 201.x reconciliation or by
   re-gating v4.0.0 release on explicit smoke pass.

### Divergent Views

- **2026-04-27 fallback** rated overall MEDIUM and recommended only a
  metadata-reconciliation pass (not a full re-plan).
- **2026-04-27 second pass** rated MEDIUM-HIGH and recommends opening 201.x
  with explicit code/contract changes (H1, H3, H4, H5, M4) before v4.0.0
  promotes.
- The first reviewer focused on documentation drift; the second focused on
  runtime / regulatory failure modes that documentation alone cannot fix.

### Recommended Next Move

1. Open **Phase 201.1** scoped to H1, H3, H4, H5, H6, M4 (and folded H2 smoke
   harness if not split into a separate operational phase).
2. Re-run cross-AI review after 2026-05-02 with codex restored AND/OR gemini /
   opencode installed, so a true 3+-model consensus exists before v4.0.0 sign-off.
3. Until then: do **not** treat the current "verified + scope_reconciled" verdict
   as authorization to ship v4.0.0; treat it as authorization to ship the
   downstream phases that depend on Phase 201's *substrate* (which is real and
   working in tests).
