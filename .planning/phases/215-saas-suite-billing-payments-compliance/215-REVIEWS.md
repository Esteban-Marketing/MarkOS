---
phase: 215
phase_name: saas-suite-billing-payments-compliance
reviewers: [claude-runtime-override]
reviewers_attempted: [codex, claude, gemini, opencode]
reviewers_skipped:
  - codex: usage limit reached (resets 2026-05-02 09:44 AM)
  - gemini: not installed
  - opencode: not installed
reviewer_note: |
  Claude (current runtime) per user override. Independence rule waived (consistent with P216-P224 posture).
reviewed_at: 2026-04-26
plans_reviewed:
  - 215-01-PLAN.md
  - 215-02-PLAN.md
  - 215-03-PLAN.md
  - 215-04-PLAN.md
  - 215-05-PLAN.md
  - 215-06-PLAN.md
overall_risk: BLOCKED
high_concerns: 2
medium_concerns: 9
low_concerns: 1
---

# Cross-AI Plan Review — Phase 215

> **Single-reviewer caveat (override):** Codex usage limit. Claude runtime review.

> **CRITICAL FINDING:** Plans are STUBS (25 lines each). Same as P216-P220. P215 has elevated risk (HIGH x2) due to multi-country billing compliance + raw credential handling + DIAN legal billing rejection paths — security/legal scope amplifies stub risk. Recommend `/gsd-plan-phase 215 --research`.

---

## Claude Review

# Claude Review — Phase 215

## Summary

Phase 215 (SaaS Billing + Payments + Multi-Country Compliance) is **same stub pattern as P216-P220**. 6 plans @ 25 lines. CONTEXT 48 lines (5 non-negotiables + 7-step phase shape; legal/security focus). RESEARCH 68 lines (with 2026-04-23 codebase addendum). DISCUSS 49 lines (Decision matrix table — strong).

**P215 specifics distinct from P216-P220:**
- Multi-country billing — US (Stripe + Stripe Tax + QuickBooks) + Colombia (Mercado Pago + Siigo/Alegra + DIAN)
- **Legal compliance scope** — DIAN electronic invoicing (CUFE/QR), IVA/retefuente/reteIVA/reteICA Colombian taxes, US sales tax
- **Sensitive credential handling** — raw certificates / API keys / webhook secrets MUST NOT appear in logs/prompts/tasks/MCP payloads (CONTEXT non-negotiable #3)
- **Webhook engine reuse** — P215 routes processor events through existing engine (P203 substrate per `Depends on: 203, 205, 206, 214`); WHK-01 already exists
- **Pricing Engine ownership** — P205 owns PricingRecommendation; P215 invoices REFERENCE pricing FK or sentinel (mirror P218/P219 pattern)
- **Future payout reservation** — Plan 06 reserves hooks for referral/affiliate/partner/incentive but does NOT activate (translation_gate_for P218-P220)
- 6 domains: SaaSInvoice contracts, US path (Stripe+QuickBooks), Colombia path (Mercado Pago+DIAN+Siigo/Alegra), webhook routing reuse, billing approvals+corrections+dunning, future payout hooks

## Strengths

- **CONTEXT 5 non-negotiables explicit:** webhook engine reuse, country-specific compliance gates, NO raw credentials in logs/prompts/tasks/MCP, Pricing Engine save-offer routing, future payout pricing/billing/approval/audit/tax/legal posture
- **DISCUSS Decision matrix** — 6 explicit decisions (US processor / Colombia processor / DIAN path / Accounting sync / Webhook path / Future payouts) with options + recommended defaults
- **DISCUSS Acceptance Gate** — 6 measurable conditions including credential safety + future payout posture
- **RESEARCH codebase addendum** — documents existing webhook engine + billing UI substrate + governance evidence packs (REUSE pattern, not greenfield)
- **Plan 04 explicit "No processor webhook bypasses MarkOS webhook durability"** — reuse posture sound
- **Plan 06 explicit non-activation pattern** — matches P217-P220 P06 translation_gate_for pattern
- **Multi-country abstraction** — DISCUSS recommends Mercado Pago + abstraction for Colombia, Siigo/Alegra first for DIAN

## Concerns

### HIGH (2)

- `HIGH` — **Plans are STUBS, not executable** (same as P216-P220 H1). 25 lines each. NO frontmatter (wave/depends_on/files_modified/autonomous/requirements). NO tasks (read_first/action/acceptance_criteria). NO code refs. NO F-IDs. NO migration slots. NO test files. NO Stripe/QuickBooks/Mercado Pago/Siigo/Alegra/DIAN endpoint enumeration. NO tax field schemas. **Cannot pass `gsd-plan-checker`; cannot execute via `/gsd-execute-phase`.**
  - **Fix:** `/gsd-plan-phase 215 --research`. Mirror P216-P220 successful recovery.

- `HIGH` — **Sensitive credential handling under-specified for stub state**. CONTEXT non-negotiable #3: "No raw certificates, API keys, or webhook secrets in logs, prompts, tasks, or MCP payloads." Stub plans don't document SECRET STORE pattern (Vault / Supabase Vault / KMS), credential rotation cadence, MCP tool sanitization layer, log redaction filter, prompt-injection defense for Stripe/Mercado Pago webhook payloads. Multi-country credentials (US Stripe + Colombia Mercado Pago + DIAN certificate + Siigo/Alegra API keys) compound risk. P226 RH5/RH6 + P218/P219 compliance lessons all show app-only enforcement bypassable; secret handling needs DB-trigger AND app-layer defense-in-depth.
  - **Fix:** Plan 02 + Plan 03 + Plan 04 must specify: (a) credential storage in Supabase Vault or KMS-encrypted column with `pgcrypto` ENCRYPT; (b) DB-trigger `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` blocking inserts where credential field is plaintext (length > 0 AND not vault-ref pattern); (c) MCP tool output sanitization layer that strips fields matching credential ENUM list; (d) log redaction middleware for processor webhook payloads (Stripe/Mercado Pago payloads contain raw card last4 + customer PII); (e) prompt-injection defense for any LLM call that could surface processor payload content.

### MEDIUM (9)

- `MEDIUM` — **No upstream-gate preflight for P203, P205, P206, P214** (4 prereqs). ROADMAP says "Depends on: Phases 203, 205, 206, 214". None landed. Same A-N pattern P226 RH8 / P217 RM2 / P218 RM2 / P219 RM2 / P220 RM2.
  - **Fix:** Plan 01 Task 0.5 ships `scripts/preconditions/215-check-upstream.cjs` REQUIRED_UPSTREAM = [P203 (webhook engine), P205 (Pricing Engine), P206, P214 (saas_suite_activations + saas_subscriptions)] HARD; SOFT [P207 CRM, P208 approvals, P209 evidence].

- `MEDIUM` — **No architecture-lock**. Plans don't pin: legacy `api/*.js`; `requireHostedSupabaseAuth`; `npm test`; `contracts/openapi.json`; `mcp/tools/index.cjs`; `buildApprovalPackage`; `resolvePlugin`. Same as P216-P220.
  - **Fix:** Plan 01 Task 0.5 architecture-lock + forbidden-pattern detector.

- `MEDIUM` — **Compliance enforcement boundary undefined per domain**. CONTEXT non-negotiables: "No processor webhook bypasses webhook durability" (Plan 04), "No legal invoice without country compliance" (Plan 02 + Plan 03), "No raw credentials in logs/prompts/tasks/MCP" (Plans 02-04), "No discount/save-offer bypasses Pricing Engine" (Plan 05), "No future payout bypasses Pricing Engine + billing + approval + audit + tax/legal" (Plan 06). All cited but no DB-trigger pinned.
  - **Fix:** Plans must specify DB-trigger exception names per domain:
    - Plan 01: `INVOICE_REQUIRES_PRICING_AND_LEGAL_FIELDS` (insert without pricing_recommendation_id OR sentinel + tax_jurisdiction + invoice_number_legal = block)
    - Plan 02: `STRIPE_INVOICE_REQUIRES_TAX_CALCULATION` (US invoice without sales_tax_calculated_at = block)
    - Plan 03: `DIAN_INVOICE_REQUIRES_CUFE_AND_PROVIDER_RESPONSE` (Colombia legal invoice without CUFE OR provider_response_id = block) + `DIAN_REJECTION_CREATES_P1_TASK` (rejection event MUST create approval task with priority=P1)
    - Plan 04: `PROCESSOR_WEBHOOK_REQUIRES_SIGNATURE_AND_IDEMPOTENCY` (event without signature_verified_at + idempotency_key = block; reuse P203 webhook engine pattern)
    - Plan 05: `BILLING_CORRECTION_REQUIRES_APPROVAL` (refund/credit/discount/write-off without approval_id + evidence_pack_ref = block)
    - Plan 06: NOT a DB-trigger (translation gate; mirror P217 P06)
    - **PLUS HIGH-2 fix:** `BILLING_CREDENTIAL_REQUIRES_VAULT_REF` (across Plans 02+03+04 — credential storage)

- `MEDIUM` — **Plan 06 SG-04/06/11/12 + PRC-09 ownership ambiguous (mirror P217 Plan 06 issue)**. Stub Plan 06 lists SG-04/SG-06/SG-11/SG-12/PRC-09 in requirements. SG-04/06 = P220 (referral/community/PR); SG-11/12 = P218/P219/P220 (every-domain task creation + external dispatch); PRC-09 = P218 (pricing copy routing). P215 Plan 06 documents post-217 PAYOUT HOOKS but does NOT activate growth modules.
  - **Fix:** Plan 06 frontmatter `requirements:` should be `[QA-01..15]` only; add `translation_gate_for: [P218, P219, P220]`; document hooks reserved for: referral payouts (P220 Plan 01), affiliate commissions (P220 Plan 05), partner payouts (P220 Plan 05), incentive experiments (P218 Plan 05).

- `MEDIUM` — **Plan 01 BILL-01 + COMP-01 ownership unclear**. BILL-01 referenced in stub Plan 01; COMP-01 in ROADMAP requirements. Verify each against REQUIREMENTS.md table; likely BILL-01 = P215-OWNED (foundational billing); COMP-01 may be cross-phase (P207 governance + P215 billing extension).
  - **Fix:** Verify in REQUIREMENTS.md. If BILL-01 is genuinely P215-owned, keep. If COMP-01 is shared, document `co_owns_with: [P207]`.

- `MEDIUM` — **PRC-01..09 ownership in Plan 01-05 unclear**. ROADMAP P215 requirements include PRC-01..09. Pricing Engine substrate = P205. P215 invoices REFERENCE pricing_recommendation_id FK; do NOT define PRC-01..09 contracts.
  - **Fix:** Plans 01-05 frontmatter `requirements:` should NOT list PRC-01..09; add `integrates_with: [PRC-01..09 from P205]` (P215 invoices read pricing_recommendations FK or use sentinel `{{MARKOS_PRICING_ENGINE_PENDING}}` per Pricing Engine Canon).

- `MEDIUM` — **No F-ID + migration slot allocation**. Same as P216-P220 RM7. P215 needs slots avoiding all prior reservations: foundation 82-89+96+100, P220 90-95+97, P217 98-99, P218 101-106, P219 107-111, P216 112-117. **Free slots: 118+.** Recommended P215 = slots 118-123 (6 slots, one per domain) OR 118-121 (4 slots, multi-table per slot).
  - **Fix:** Pre-allocate. Recommended F-IDs P215 = F-271..F-285 (15 IDs to cover invoice + billing event + processor configs + accounting configs + DIAN config + webhook routing + correction + payout hooks; multi-country needs more F-IDs than typical phase).

- `MEDIUM` — **DIAN provider abstraction decision unresolved**. DISCUSS lists 4 options (Direct DIAN / Siigo / Alegra / provider interface) with recommended "Siigo/Alegra first; direct DIAN future research". Research must produce concrete provider adapter shape + sandbox flow + CUFE/QR field schema before plan ships F-IDs. Stub plans reference "DIAN provider path" but no contract enumeration.
  - **Fix:** Research must resolve: (a) which Colombian provider first (Siigo OR Alegra — pick one for v4.1.0); (b) provider adapter shape (interface signature for issue-invoice / fetch-CUFE / handle-rejection / dunning); (c) certificate handling pattern (PKCS12 stored in Supabase Vault); (d) sandbox vs production credential management.

- `MEDIUM` — **Multi-country slot ordering crisis (similar to P216 Q-6)**. P215 execution-order BEFORE P216-P220 but slot-order AFTER all (slots 118+). FK direction must be strictly P216-P220 READ P215 (no reverse FKs). Document in Plan 01 Task 0.1 coordination doc append.
  - **Fix:** Plan 01 Task 0.1 documents Q-7 SLOT ORDERING CRISIS (P215 execution before P216 but slot-order LATEST among V4.1.0 reservations). FK direction: P216 saas_health_scores READ P215 saas_invoices (for billing risk health dimension); P218 InAppCampaign READS P215 saas_payment_attempts; etc. P215 must NOT FK INTO any P216-P220 table. Coordination doc CREATE-or-APPEND pattern (mirror P216 Plan 01).

### LOW (1)

- `LOW` — **DISCUSS Decision matrix is strong but missing DIAN sandbox/production cutover policy**. Acceptable for v4.1.0; defer to v4.2.0 ops runbook.

## Suggestions

- **Run `/gsd-plan-phase 215 --research`**.
- **Cross-phase ownership flips:** PRC-01..09 → integrates_with P205; SG-04/06/11/12 + PRC-09 in Plan 06 → translation_gate_for [P218, P219, P220]; verify BILL-01/COMP-01 ownership in REQUIREMENTS.md.
- **Sensitive credential handling FOUNDATIONAL** (HIGH 2): Vault/KMS storage + DB-trigger BILLING_CREDENTIAL_REQUIRES_VAULT_REF + MCP sanitization + log redaction + prompt-injection defense across Plans 02+03+04.
- **DIAN provider decision:** research resolves Siigo OR Alegra first (pick one); provider adapter pattern; PKCS12 certificate handling; sandbox flow.
- **Migration slots:** P215 = 118-123 (6 slots) OR 118-121 (4 multi-table); F-IDs F-271..F-285 (15 IDs); document Q-7 P215 slot ordering crisis (similar to P216 Q-6 — P215 execution before P216 but slot-order LATEST among V4.1.0).
- **Apply P216-P220 lessons:** architecture-lock + assertUpstreamReady (HARD P203/P205/P206/P214) + DB-trigger compliance (6 triggers) + F-ID/migration slot pre-allocation + Plan 06 autonomous=true (mirror P217 P06).
- **Webhook engine reuse:** Plan 04 explicit RE-USE pattern (no greenfield) — verify P203 webhook engine substrate available.
- **Future payout hooks (Plan 06):** explicit reservation pattern — referral payouts (P220 Plan 01) + affiliate commissions (P220 Plan 05) + partner payouts (P220 Plan 05) + incentive experiments (P218 Plan 05).
- **Append V4.1.0-MIGRATION-SLOT-COORDINATION.md** (created by P217 OR P216 first; P215 appends).

## Risk Assessment

**Overall: BLOCKED**

Same as P216-P220 — plans are stubs. Cannot review architecturally. Recovery: re-research + re-plan via `/gsd-plan-phase 215 --research`.

**Mitigating:** stubs have stronger CONTEXT/RESEARCH/DISCUSS than P217-P220 (5 non-negotiables + Decision matrix + Acceptance Gate); legal/security focus is well-bounded.

**Aggravating vs P216-P220:**
1. **Multi-country compliance scope** — US + Colombia legal billing requires more contracts (likely 12+ F-IDs vs typical 8-10).
2. **Sensitive credential handling** — security-critical; raw cert/API key/webhook secret leaks could breach SOC2 + GDPR + DIAN compliance.
3. **DIAN P1 task on rejected invoice** — incident-response posture needs documentation (rejection within 24h timeout = legal compliance issue).
4. **Slot ordering crisis (Q-7)** — P215 execution before P216-P220 but slot-order LATEST.

## Specific Questions for Plan Author

1. Same stub-state as P216-P220 — intentional defer or expansion?
2. DIAN provider — Siigo OR Alegra first (pick one for v4.1.0)?
3. Mercado Pago — direct integration OR provider abstraction for Colombia processor?
4. Plan 02 US path — Stripe Billing direct OR processor abstraction?
5. Plan 06 SG-04/06/11/12 + PRC-09 — translation_gate_for or integrates_with?
6. Plan 01 BILL-01 + COMP-01 — verify ownership against REQUIREMENTS.md.
7. PRC-01..09 in Plans 01-05 — flip to integrates_with: P205?
8. Slot allocation — slots 118-123 (6 slots) OR 118-121 (4 slots multi-table)?
9. F-IDs F-271..F-285 (15 IDs) — acceptable range?
10. Sensitive credential storage — Supabase Vault OR KMS-encrypted pgcrypto column OR external KMS?
11. DIAN rejected invoice P1 task SLA — 24h response window or shorter?
12. Compliance enforcement — DB-trigger per domain (6+1 triggers including BILLING_CREDENTIAL_REQUIRES_VAULT_REF)?
13. Plan 06 autonomous — true (UI/handoff only) OR false (first-tenant payout activation)?

---

## Consensus Summary

> Single-reviewer (Claude under user override). Codex blocked until 2026-05-02.

### Top concerns (HIGH)

1. **Plans are STUBS** — same as P216-P220. Path: `/gsd-plan-phase 215 --research`.
2. **Sensitive credential handling under-specified** — multi-country credentials (Stripe + Mercado Pago + DIAN cert + Siigo/Alegra) compound SOC2/GDPR risk. Need Vault/KMS + DB-trigger BILLING_CREDENTIAL_REQUIRES_VAULT_REF + MCP sanitization + log redaction + prompt-injection defense.

### MEDIUM (9)

3. No upstream-gate preflight (P203/P205/P206/P214)
4. No architecture-lock
5. Compliance enforcement undefined (6 active-schema DB-triggers + BILLING_CREDENTIAL trigger needed)
6. Plan 06 SG-04/06/11/12 + PRC-09 ownership ambiguous (translation_gate_for [P218, P219, P220])
7. Plan 01 BILL-01 + COMP-01 ownership verification needed
8. PRC-01..09 in Plans 01-05 likely P205-owned (flip to integrates_with: P205)
9. No F-ID + migration slot allocation (slots 118-123, F-IDs F-271..F-285)
10. DIAN provider decision unresolved (Siigo vs Alegra first)
11. Q-7 Multi-country slot ordering crisis (P215 execution before P216-P220 but slot-order LATEST among V4.1.0)

### LOW (1)

12. DISCUSS Decision matrix missing DIAN sandbox/production cutover policy (defer to v4.2.0 ops runbook)

### Suggested next move

`/gsd-plan-phase 215 --research`. Apply lessons:
- Wave 0.5 architecture-lock + assertUpstreamReady (P203/P205/P206/P214 HARD)
- 6+1 DB-trigger compliance (Plans 01-05 + BILLING_CREDENTIAL_REQUIRES_VAULT_REF across 02-04)
- F-IDs F-271..F-285 (15 IDs) + migration slots 118-123 (6 slots)
- Cross-phase ownership flips (PRC-01..09 → integrates_with P205; SG-* + PRC-09 in Plan 06 → translation_gate_for; verify BILL-01/COMP-01)
- DIAN provider single-pick (Siigo for v4.1.0 recommended)
- Sensitive credential handling: Supabase Vault + DB-trigger + MCP sanitization + log redaction (defense-in-depth)
- Plan 06 autonomous=true (UI/handoff only — no first-tenant payout activation in P215; payouts activate in P218-P220)
- Append V4.1.0-MIGRATION-SLOT-COORDINATION.md (P217 or P216 created; P215 appends)
- Document Q-7 P215 slot ordering crisis (FK direction P216-P220 READ P215; zero reverse FKs)

### Reviewer environment

- Reviewer: Claude (current runtime; user override)
- Independence rule: waived (consistent with P216-P224 posture)
- Files inspected: 215-CONTEXT.md (48 lines), 215-RESEARCH.md (68 lines), 215-{01..06}-PLAN.md (25 lines each), DISCUSS.md (49 lines)
- Cross-reference: P216+P217+P218+P219+P220 review patterns

### Trust caveat

Single-reviewer (Claude). Re-run `/gsd-review --phase 215 --codex` 2026-05-02 — but more useful to first run `/gsd-plan-phase 215 --research`.

### Cross-phase impact note (CRITICAL)

**Sequencing:** P203+P205+P206+P214 → **P215** → P216 → P217 → P218 → P219+P220.

**P215 ships:** saas_invoices + saas_payment_attempts + saas_billing_events + saas_processor_configs + saas_accounting_configs + saas_dian_config + future-payout-hooks.

**Downstream consumers:**
- P216 saas_health_scores reads saas_invoices (billing risk dimension); reads saas_payment_attempts (failed payment health signal)
- P217 SaaSMRRSnapshot reads saas_invoices (revenue intelligence)
- P218 InAppCampaign reads saas_payment_attempts (failed-payment in-app prompt) + saas_invoices (upgrade context)
- P219 expansion-signal-scanner reads saas_invoices (MRR uptick detection)
- P220 referral payouts (P220 Plan 01) + affiliate commissions (P220 Plan 05) + partner payouts (P220 Plan 05) consume P215 future-payout-hooks (Plan 06 reservation)

**P215 re-plan must land BEFORE P216 execute** since P216 plans HARD-depend on P215 saas_invoices/saas_payment_attempts. Sequencing order: P215 replan → P216 (already replanned) verifies contract → P217 (already replanned) consumes → execute chain.
