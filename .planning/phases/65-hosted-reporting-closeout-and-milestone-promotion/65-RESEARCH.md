# Phase 65: Hosted Reporting Closeout and Milestone Promotion - Research

**Researched:** 2026-04-06
**Domain:** Hosted verification closeout, requirement promotion, and milestone-ledger reconciliation for v3.3.0 reporting
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Hosted closeout scope
- **D-01:** Phase 65 covers hosted reporting closeout and milestone promotion only.
- **D-02:** The phase must execute and record the remaining Phase 64 hosted checks using the existing v3.3 live-check artifacts instead of inventing a new verification format.
- **D-03:** ATT-01 and REP-01 are the only requirement IDs Phase 65 is allowed to promote.

### Evidence and promotion rules
- **D-04:** Promotion from `Partial` to `Satisfied` must be based on recorded hosted evidence, not on restating repository-pass results.
- **D-05:** The phase must update milestone evidence surfaces consistently: live-check log, closure matrix, roadmap/state, and any v3.3 closeout report touched by the promotion decision.
- **D-06:** If any hosted step cannot be completed, the phase must preserve an honest `human_needed` or follow-through state rather than overclaim closure.

### Boundary controls
- **D-07:** Phase 65 must reuse the existing CRM reporting shell, readiness surfaces, attribution drill-down, verification route, and governance evidence packaging from Phase 64.
- **D-08:** Phase 64.3 user-home instruction follow-through remains separate from this phase unless a concrete milestone-promotion dependency is discovered.
- **D-09:** MMM, custom BI builder work, and broader reporting expansion remain deferred.

### Claude's Discretion
- Exact grouping of hosted checks into plans.
- Exact evidence file naming for hosted responses or screenshots, provided the destinations are explicit and traceable.
- Exact ordering of ledger and milestone-document updates, provided promotion only happens after evidence review.

### Deferred Ideas (OUT OF SCOPE)
- Phase 64.3 user-home instruction follow-through outside the hosted reporting lane.
- MMM or more advanced attribution modeling.
- A custom BI builder or broader analytics studio.
- New AI-generated reporting surfaces.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ATT-01 | Multi-touch attribution is operationally available at the CRM layer for contact, deal, and campaign reporting, even though full MMM remains deferred. | Reuse Phase 64 attribution drill-down, hosted attribution API check, completed live-check run record, and closure-matrix promotion only after recorded hosted evidence exists. |
| REP-01 | Operators can view pipeline health, conversion, attribution, SLA risk, and agent productivity in one place without leaving the CRM. | Reuse Phase 64 reporting shell, readiness panel, executive summary, verification route, completed live-check run record, and milestone ledger reconciliation after hosted cockpit proof exists. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Read `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, and `.agent/markos/MARKOS-INDEX.md` before changing planning state.
- Treat `.planning/STATE.md` as the canonical live mission state.
- Keep the GSD versus MarkOS split intact: `.planning/` is the engineering workflow source of truth; MarkOS protocol content lives under `.agent/markos/`.
- Client overrides belong only in `.markos-local/`.
- Primary CLI and verification commands remain `npx markos`, `npm test`, and `node --test test/**/*.test.js`.

## Summary

Phase 65 should be planned as a narrow evidence-and-promotion phase, not as a continuation of Phase 64 feature work. The repository already contains the reporting shell, attribution model, readiness surfaces, verification route, governance evidence packaging, v3.3 checklist, and log template. The only legitimate reason to touch product code in Phase 65 is if hosted execution reveals a real defect. Until that happens, the planning shape should assume reuse, human execution of hosted checks, and ledger reconciliation.

The planner should treat the completed hosted run record as the canonical evidence sink. The checklist and log template are operator contracts, not evidence by themselves. Phase 64's validation and verification artifacts remain the canonical repository-pass baseline and should be cited, not rewritten. Phase 65's job is to add hosted proof on top of that baseline, then update milestone ledgers only after the proof is reviewed.

There is one important reconciliation task at the front of the phase: `64-VALIDATION.md` names five hosted review items, while the v3.3 live checklist packages four checks. The planner should explicitly decide whether the central-rollup hosted review is already sufficiently covered inside the existing checklist or whether it needs to be mapped into the hosted closeout contract before promotion. That is a scope-clarity task, not a product-expansion task.

**Primary recommendation:** Keep Phase 65 to three plans: `1)` lock the hosted evidence contract and promotion criteria, `2)` execute and record the hosted checks, `3)` reconcile milestone ledgers and either promote ATT-01 and REP-01 or record the exact remaining blocker honestly.

## Standard Stack

### Core
| Surface | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing CRM reporting shell (`app/(markos)/crm/reporting/page.tsx`) | current repo | Hosted cockpit proof for REP-01 | Already implemented and repository-verified in Phase 64. |
| Existing verification route (`app/(markos)/crm/reporting/verification/page.tsx`) | current repo | Hosted closeout workflow and readiness review | Already designed to anchor live-check execution. |
| Existing reporting APIs (`api/crm/reporting/attribution.js`, `api/crm/reporting/dashboard.js`, `api/crm/reporting/verification.js`) | current repo | API proof for hosted attribution, dashboard, and readiness checks | Already aligned to ATT-01 and REP-01 proof surfaces. |
| Existing governance evidence packaging (`api/governance/evidence.js`, `lib/markos/governance/evidence-pack.cjs`) | current repo | Promotion-ready evidence export path | Phase 64 already proved this path can package reporting closeout artifacts. |
| Existing milestone artifacts (`.planning/milestones/v3.3.0-LIVE-CHECKLIST.md`, `.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md`) | current repo | Canonical operator checklist and log schema | Already created specifically for ATT-01 and REP-01 closeout. |
| Existing closure ledger (`.planning/projects/markos-v3/CLOSURE-MATRIX.md`) | current repo | Requirement promotion target | Already holds ATT-01 and REP-01 in `Partial` with explicit closure-needed text. |

### Supporting
| Surface | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `.planning/phases/64-attribution-reporting-and-verification-closure/64-VALIDATION.md` | current repo | Human-check baseline and hosted review expectations | Use to reconcile what Phase 64 still considered outstanding. |
| `.planning/phases/64-attribution-reporting-and-verification-closure/64-VERIFICATION.md` | current repo | Repository-pass baseline for ATT-01 and REP-01 | Use as the precondition artifact for promotion. |
| `.planning/ROADMAP.md` and `.planning/STATE.md` | current repo | Milestone and next-step ledgers | Update only after hosted evidence review. |
| Phase 65 phase-level verification artifact (recommended: `65-VERIFICATION.md`) | new phase artifact | Hosted closeout verdict for this phase | Use to summarize promotion decision without rewriting Phase 64 verification. |
| Completed live-check run record (recommended: one file created from the template) | new milestone artifact | Canonical hosted evidence sink | Use as the single place that references screenshots, API captures, verdicts, and sign-off. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing the v3.3 checklist and template | A new closeout format or spreadsheet | Adds zero product value and breaks traceability against Phase 64's established workflow. |
| Creating a Phase 65 hosted verdict ledger | Rewriting `64-VERIFICATION.md` | Blurs repository-pass and hosted-pass boundaries; makes the closeout chain less honest. |
| One completed run record as the canonical sink | Treating screenshots or copied API responses as separate truth | Scatters evidence and makes promotion review harder to audit. |
| Keeping 64.3 user-home follow-through separate | Folding it into Phase 65 | Reopens unrelated external work and weakens phase accountability. |

**Installation:**
```bash
# No new packages.
# Reuse the existing repo and hosted reporting surfaces.
```

**Version verification:** No new packages are recommended for this phase. Reuse the current repository surfaces and the existing Node.js test runner.

## Architecture Patterns

### Recommended Project Structure
```text
.planning/
├── phases/65-hosted-reporting-closeout-and-milestone-promotion/
│   ├── 65-RESEARCH.md
│   ├── 65-01-PLAN.md
│   ├── 65-02-PLAN.md
│   ├── 65-03-PLAN.md
│   └── 65-VERIFICATION.md           # recommended phase-level hosted closeout verdict
├── milestones/
│   ├── v3.3.0-LIVE-CHECKLIST.md     # canonical operator contract
│   ├── v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md
│   └── v3.3.0-LIVE-CHECK-RUN.md     # recommended completed run record created from the template
└── projects/markos-v3/
    └── CLOSURE-MATRIX.md            # requirement promotion ledger
```

### Pattern 1: Evidence First, Promotion Second
**What:** Promotion from `Partial` to `Satisfied` must happen only after a completed hosted run record exists and has been reviewed.
**When to use:** Every time a closeout phase converts repository-pass proof into milestone satisfaction.
**Example:**
```markdown
# Source: .planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md
## Final summary
- ATT-01 verdict: Pass
- REP-01 verdict: Pass
- Requirements ready for promotion: ATT-01, REP-01
- Requirements remaining partial:
- Evidence captured:
- Sign-off notes:
```

### Pattern 2: Template as Schema, Run Record as Evidence
**What:** The checklist and log template define how the operator records proof; the completed run record is the actual evidence sink.
**When to use:** Any hosted closeout phase using the established milestone live-check pattern.
**Example:**
```markdown
# Source: .planning/milestones/v3.1.0-LIVE-CHECKLIST.md
4. Save the completed run record using `.planning/milestones/v3.1.0-LIVE-CHECK-LOG-TEMPLATE.md` as the source template.
```

### Pattern 3: Reconcile Outstanding Human Scope Before Planning Execution
**What:** Align `64-VALIDATION.md`, `64-VERIFICATION.md`, the v3.3 checklist, and the closure matrix before executing hosted checks.
**When to use:** At the start of a closeout phase where the checklist and baseline validation artifacts are not perfectly one-to-one.
**Example:**
```markdown
# Source: 64-VALIDATION.md + v3.3.0-LIVE-CHECKLIST.md
- Validation names 5 hosted review items.
- The v3.3 checklist packages 4 checks.
- Wave 1 must make the mapping explicit before any promotion decision.
```

### Pattern 4: Preserve Repository-Pass Versus Hosted-Pass Separation
**What:** Phase 64 stays the repository-pass proof; Phase 65 records hosted execution and milestone promotion.
**When to use:** Always. Do not retrofit hosted outcomes into Phase 64 in a way that erases the original repository-pass boundary.
**Example:**
```markdown
# Source: 64-VERIFICATION.md
| ATT-01 | ✓ REPOSITORY-PASSED | Hosted drill-down evidence still needs to be recorded ... |
| REP-01 | ✓ REPOSITORY-PASSED | Hosted cockpit and readiness review still need to be recorded ... |
```

### Anti-Patterns to Avoid
- **Promotion before evidence:** Updating `CLOSURE-MATRIX.md`, `ROADMAP.md`, or `STATE.md` before the hosted run record exists.
- **Template-as-proof:** Treating the checklist or the log template itself as evidence.
- **Scope reopening:** Redesigning reporting layouts, weights, or AI behavior instead of recording hosted proof.
- **Cross-phase contamination:** Pulling `64.3-HUMAN-UAT.md` work into Phase 65 without a direct milestone-promotion dependency.
- **Scattered evidence:** Storing screenshots and API outputs in disconnected notes without one canonical run record referencing them.

## Human-Only Boundaries

The following boundaries are inherently human or environment-bound and should be called out in the plans instead of implied as automatable:

- Opening the hosted CRM reporting shell in an authenticated browser session and confirming the one-shell experience for cockpit, attribution, readiness, and verification views.
- Reviewing attribution drill-down semantics visually in the hosted product and confirming the UI evidence is consistent with the API payload.
- Capturing screenshots, browser URLs, actor identity, environment URL, and sign-off metadata.
- Supplying valid hosted tokens or accounts for reporting and governance endpoints.
- Deciding whether inconclusive or partial hosted proof is sufficient to keep a requirement in `Partial` rather than promoting it.

These are not failures of automation. They are part of the honesty contract for this closeout phase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hosted reporting closeout workflow | New spreadsheet, ad hoc checklist, or freeform markdown log | `.planning/milestones/v3.3.0-LIVE-CHECKLIST.md` plus one completed run record created from `.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md` | The pattern already exists and is what Phase 64 proved against. |
| Promotion-ready evidence export | New reporting-only evidence packaging path | `api/governance/evidence.js` and `lib/markos/governance/evidence-pack.cjs` | Existing code already supports reporting closeout packaging. |
| Requirement status source of truth | A temporary closeout spreadsheet or plan-local table | `.planning/projects/markos-v3/CLOSURE-MATRIX.md` | This is the canonical requirement ledger already carrying the partial statuses. |
| Hosted verdict summary | Editing Phase 64 verification in place | A new Phase 65 verification ledger that cites Phase 64 plus the completed hosted run record | Keeps the closeout chain auditable. |
| Unrelated manual follow-through | User-home instruction checks from Phase 64.3 | Keep `.planning/phases/64.3-gsd-verification-and-customization-closure/64.3-HUMAN-UAT.md` separate | That work is external and not part of ATT-01 or REP-01 promotion. |

**Key insight:** This phase should not invent a new system. It should complete the last mile of an existing evidence system and then reconcile the ledgers that depend on it.

## Common Pitfalls

### Pitfall 1: Overclaiming Hosted Closure From Repository-Pass Results
**What goes wrong:** The phase promotes ATT-01 or REP-01 because the repo tests are green and the checklist exists.
**Why it happens:** The repository-pass baseline is strong enough that the remaining hosted work looks like paperwork.
**How to avoid:** Require a completed hosted run record with real environment metadata, evidence paths, and verdicts before any status changes.
**Warning signs:** Promotion language appears before screenshots, URLs, API captures, or reviewer notes exist.

### Pitfall 2: Updating the Closure Matrix Before Evidence Review
**What goes wrong:** `CLOSURE-MATRIX.md` is edited first and the evidence is backfilled later.
**Why it happens:** The closure matrix is the visible milestone target, so it attracts early edits.
**How to avoid:** Treat the matrix as the last downstream ledger updated after evidence review.
**Warning signs:** The matrix says `Satisfied` while the run record is missing or incomplete.

### Pitfall 3: Reopening Product Scope Under the Cover of Closeout
**What goes wrong:** The phase starts redesigning reporting surfaces, adding more executive views, or adjusting attribution behavior.
**Why it happens:** Hosted review reveals imperfections that are not actually blockers to ATT-01 or REP-01 promotion.
**How to avoid:** Keep Phase 65 framed as proof collection and ledger reconciliation unless hosted execution reveals a true defect.
**Warning signs:** Plan tasks start modifying reporting UX, weights, or AI behavior before hosted evidence is attempted.

### Pitfall 4: Mixing Unrelated Human Follow-Through
**What goes wrong:** User-home instruction regeneration or other manual work from Phase 64.3 gets pulled into this phase.
**Why it happens:** Both involve human follow-through and open checklist-like work.
**How to avoid:** Keep the hosted reporting closeout lane and the user-home instruction lane separate unless a direct ATT-01 or REP-01 dependency is proven.
**Warning signs:** The plan references `.claude` user-home files or 64.3 manual steps without tying them to reporting promotion.

### Pitfall 5: Silent Drift Between Phase 64 Validation and the v3.3 Checklist
**What goes wrong:** A hosted review obligation from `64-VALIDATION.md` is silently dropped because the milestone checklist is shorter.
**Why it happens:** The planner assumes the checklist is a perfect restatement of the earlier validation artifact.
**How to avoid:** Wave 1 should explicitly map every remaining human requirement from Phase 64 into the Phase 65 hosted execution contract.
**Warning signs:** No document explains how the five hosted review items from `64-VALIDATION.md` reduce to the four v3.3 checklist checks.

## Code Examples

Verified patterns from repository sources:

### Completed Run Record Pattern
```markdown
# Source: .planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md
## Check 2: REP-01 reporting cockpit review
- Requirement coverage: REP-01
- URL visited:
- Commands run:
- Expected result:
- Actual result:
- Evidence captured:
  - Cockpit screenshot path:
  - Executive summary screenshot path:
  - API response path:
- Verdict: Pass / Fail
```

### Promotion Ledger Update Pattern
```markdown
# Source: .planning/projects/markos-v3/CLOSURE-MATRIX.md
| ATT-01 | Revenue reporting | 11 | 64/65 | Satisfied | Phase 64 repository proof plus recorded Phase 65 hosted attribution drill-down evidence. | None. |
| REP-01 | Revenue reporting | 11 | 60/61/64/65 | Satisfied | Phase 64 reporting cockpit proof plus recorded Phase 65 hosted cockpit and readiness evidence. | None. |
```

### Honest Non-Promotion Pattern
```markdown
# Recommended Phase 65 pattern when hosted proof is incomplete
- ATT-01 verdict: Fail
- REP-01 verdict: Pass
- Requirements ready for promotion: REP-01
- Requirements remaining partial: ATT-01
- Sign-off notes: ATT-01 drill-down evidence unavailable in hosted environment; keep matrix status Partial and record blocker in 65-VERIFICATION.md
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Repository verification implies requirement closure | Repository verification establishes baseline; hosted proof is still required for final promotion | v3 closeout pattern, reinforced by Phase 64 | Closeout phases must preserve a two-step proof model. |
| Templates are treated as documentation only | Templates define a repeatable human verification protocol that must produce a completed run record | Proven by v3.1.0 and reused in v3.3.0 | The planner should reuse the checklist pattern instead of improvising. |
| Closeout updates are follow-up admin work | Live-check artifacts and promotion ledgers are direct deliverables of the phase | Phase 64 Wave 3 planning and verification | Promotion work belongs inside the phase plan, not after it. |

**Deprecated/outdated:**
- Treating a `human_needed` or hosted follow-through item as soft or optional once automated tests pass.
- Updating requirement ledgers without a single canonical hosted evidence sink.

## Open Questions

1. **How should the Phase 64 central-rollup human review map into Phase 65?**
   - What we know: `64-VALIDATION.md` names a central-rollup admin review, but the v3.3 checklist packages four checks and does not isolate that review explicitly.
   - What's unclear: Whether REP-01 promotion needs a separate hosted central-rollup record or whether the existing hosted cockpit review is intended to subsume it.
   - Recommendation: Resolve this in `65-01-PLAN.md` by mapping the validation item to an existing check or by explicitly adding a sub-step, not a new feature.

2. **Should Phase 65 create a dedicated v3.3 milestone closeout report?**
   - What we know: Context requires updating any v3.3 closeout report touched by the promotion decision, but no dedicated v3.3 report exists yet in the current milestone artifacts.
   - What's unclear: Whether the milestone should close with only the run record, closure matrix, roadmap/state, and phase verification, or whether one milestone report is also expected.
   - Recommendation: Default to no new broad report unless the planner identifies a real consumer for it; otherwise use `65-VERIFICATION.md` plus the completed run record as the closeout package.

3. **What exact file name should the completed hosted run record use?**
   - What we know: Context leaves evidence-file naming to planner discretion as long as it is explicit and traceable.
   - What's unclear: Whether the team prefers one stable milestone file or date-stamped historical run files.
   - Recommendation: Use one stable path such as `.planning/milestones/v3.3.0-LIVE-CHECK-RUN.md` unless multiple execution attempts need to be preserved separately.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Local regression and smoke commands | Yes | v22.13.0 | -- |
| npm | Local test and dev-server commands | Yes | 10.9.2 | -- |
| Hosted MarkOS v3.3 reporting environment | Hosted verification capture | Unknown | -- | None for final promotion |
| Valid reporting token and operator token | Hosted API checks in the checklist | Unknown | -- | None for final promotion |
| Authorized tenant and reviewer accounts | Browser-based hosted review and sign-off | Unknown | -- | None for final promotion |
| Browser and screenshot capture path | Human evidence collection | Unknown | -- | API captures can supplement, but cannot replace hosted UI proof for cockpit review |

**Missing dependencies with no fallback:**
- Hosted environment access and authenticated accounts capable of executing the v3.3 reporting checks.
- A human executor and reviewer to complete the run record honestly.

**Missing dependencies with fallback:**
- None. Local repo checks can reconfirm the baseline, but they cannot substitute for hosted promotion evidence.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | `package.json` scripts |
| Quick run command | `node --test test/crm-reporting/crm-attribution-model.test.js test/crm-reporting/crm-reporting-shell.test.js test/crm-reporting/crm-executive-summary.test.js test/crm-reporting/crm-central-rollup.test.js test/crm-reporting/crm-verification-workflow.test.js test/crm-reporting/crm-closeout-evidence.test.js test/crm-reporting/crm-readiness-panel.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ATT-01 | Repo baseline for deterministic attribution and verification workflow remains green before hosted promotion | regression plus manual hosted | `node --test test/crm-reporting/crm-attribution-model.test.js test/crm-reporting/crm-verification-workflow.test.js test/crm-reporting/crm-closeout-evidence.test.js` | Yes |
| REP-01 | Repo baseline for unified cockpit, executive summary, readiness, and governed reporting remains green before hosted promotion | regression plus manual hosted | `node --test test/crm-reporting/crm-reporting-shell.test.js test/crm-reporting/crm-executive-summary.test.js test/crm-reporting/crm-readiness-panel.test.js test/crm-reporting/crm-central-rollup.test.js test/tenant-auth/crm-reporting-tenant-isolation.test.js` | Yes |

### Sampling Rate
- **Per task commit:** Run the requirement-specific targeted slice relevant to the artifact being updated.
- **Per wave merge:** Run the full Phase 64 reporting slice listed above.
- **Phase gate:** `npm test` is desirable if code changes occur, but hosted promotion is blocked primarily by the completed run record and human evidence review.

### Wave 0 Gaps
- None for automated infrastructure. Existing Node.js test coverage already protects the repository baseline.
- Human evidence capture is the real gap: a completed hosted run record and phase-level promotion verdict do not yet exist.

## Recommended Planning Shape

**Recommended plan count:** 3 plans.

### Plan 65-01: Hosted closeout contract and evidence destinations
**Purpose:** Freeze the exact hosted checks, map any `64-VALIDATION.md` gaps into the v3.3 checklist, define the completed run record path, and define promotion criteria for ATT-01 and REP-01.
**Depends on:** Phase 64 repository-pass baseline and current milestone artifacts.
**Human checkpoint:** Optional but useful if the planner needs confirmation on whether central-rollup review must be explicitly captured.
**Should reuse:** `64-VALIDATION.md`, `64-VERIFICATION.md`, `v3.3.0-LIVE-CHECKLIST.md`, `v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md`, `CLOSURE-MATRIX.md`.
**Should not rebuild:** New checklist formats, new reporting acceptance models, or new scope for AI/reporting features.

### Plan 65-02: Hosted verification execution and evidence capture
**Purpose:** Execute the hosted reporting shell, attribution drill-down, readiness, and governance-evidence checks and record them in one completed run record.
**Depends on:** 65-01 locked evidence contract.
**Human checkpoint:** Mandatory. This wave cannot be completed honestly without a human executor and reviewer in a real hosted environment.
**Should reuse:** Existing reporting UI routes, existing APIs, existing checklist, existing template, existing governance evidence endpoint.
**Should not rebuild:** Product UI, API contracts, or fresh operator tooling unless a real hosted bug is discovered.

### Plan 65-03: Milestone promotion and honest closeout reconciliation
**Purpose:** Review the completed run record, decide whether ATT-01 and REP-01 qualify for promotion, update `CLOSURE-MATRIX.md`, update `ROADMAP.md` and `STATE.md`, and record any remaining blocker in a Phase 65 verification ledger.
**Depends on:** 65-02 completed hosted run record.
**Human checkpoint:** Mandatory promotion review. If any hosted proof is missing or weak, this wave records `Partial` or `human_needed` honestly rather than forcing closure.
**Should reuse:** Existing closure matrix, existing roadmap/state ledgers, Phase 64 repository-pass artifacts.
**Should not rebuild:** A second evidence system or a wide milestone report unless a clear consumer requires it.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/65-hosted-reporting-closeout-and-milestone-promotion/65-CONTEXT.md` - locked scope, evidence rules, and boundary decisions for Phase 65.
- `.planning/ROADMAP.md` - current planned shape for Phase 65 and its dependency on Phase 64.3.
- `.planning/REQUIREMENTS.md` - authoritative wording for ATT-01 and REP-01.
- `.planning/STATE.md` - canonical live state confirming Phase 65 is the next planned step and that hosted reporting closeout remains pending.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-CONTEXT.md` - original reporting closeout decisions that Phase 65 must not reopen.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-VALIDATION.md` - hosted-review expectations and human testing items still relevant to promotion.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-VERIFICATION.md` - repository-pass baseline and exact remaining hosted evidence needed for ATT-01 and REP-01.
- `.planning/milestones/v3.3.0-LIVE-CHECKLIST.md` - canonical hosted verification checklist for this milestone.
- `.planning/milestones/v3.3.0-LIVE-CHECK-LOG-TEMPLATE.md` - canonical run-record schema for hosted evidence capture.
- `.planning/projects/markos-v3/CLOSURE-MATRIX.md` - current `Partial` statuses and closure-needed text for ATT-01 and REP-01.
- `.planning/phases/64-attribution-reporting-and-verification-closure/64-03-PLAN.md` - original Wave 3 closeout intent showing that live-check artifacts and promotion were direct deliverables, not optional paperwork.
- `.planning/milestones/v3.1.0-LIVE-CHECKLIST.md` and `.planning/milestones/v3.1.0-GAP-REMEDIATION-PLAN.md` - prior proven milestone-promotion pattern for completed run records and post-evidence ledger updates.

### Secondary (MEDIUM confidence)
- `package.json` and local environment probe - confirm Node.js built-in test runner usage and available local tool versions.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - the phase reuses already-existing repository surfaces and milestone artifacts.
- Architecture: HIGH - the phase shape is directly implied by current context, roadmap, validation, verification, and prior milestone closeout patterns.
- Pitfalls: HIGH - the anti-patterns are explicit in the context, closure matrix, and prior human-needed milestones.

**Research date:** 2026-04-06
**Valid until:** 2026-05-06
