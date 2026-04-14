# Phase 95: Evaluation and Governance - Research

**Researched:** 2026-04-14  
**Domain:** deep-research evaluation, governance, and safe promotion review  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Comparison and scoring posture
- **D-01:** Phase 95 v1 should present a ranked scorecard with a clear winner and runner-up rather than a flat equal-weight matrix.
- **D-02:** The evaluation surface should help the operator see why one provider or result won, not just display raw numbers.

### Grounding failure behavior
- **D-03:** When grounding or citation quality is weak, promotion should be blocked and routed into explicit review rather than silently continuing.
- **D-04:** Weakly grounded results may still be visible for inspection, but they should not clear the promotion boundary automatically.

### Acceptance review model
- **D-05:** Acceptance should happen at the run level with per-artifact flags so operators can approve the overall batch while still isolating risky artifacts.
- **D-06:** The evaluation flow should preserve artifact-level warnings and governance diagnostics instead of collapsing everything into one pass or fail line.

### Promotion criteria
- **D-07:** Safe promotion should use a conservative weighted score with a documented human override note rather than fully rigid all-or-nothing gates.
- **D-08:** Manual override should remain explicit, reviewable, and audit-friendly, not an invisible bypass.

### Claude's Discretion
- Exact score dimensions and weighting formulas
- Whether the review surface uses badges, score bands, or diagnostic panels
- How provider-comparison history is stored or summarized in v1
- Which metrics are mandatory blockers versus advisory warnings inside the conservative scoring model

### Deferred Ideas (OUT OF SCOPE)
- Fully autonomous promotion without human review is deferred.
- Expanding the phase into a general analytics dashboard is deferred.
- Replacing the existing approval or governance systems is deferred.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRT-08 | Operators can inspect the active filter stack, evidence sources, and proposed artifact deltas before accepting or rerunning research output. | Phase 95 should return a read-safe evaluation envelope with filter stack, source evidence, provider winner/runner-up, and artifact flags. |
| DRT-09 | Deep research runs are auditable and safe, preserving provenance and change history for every generated recommendation. | Reuse repo governance telemetry, evidence-pack, reason codes, and append-only override notes. |
| DRT-10 | A verification suite measures relevance, grounding, and personalization lift across representative industries, companies, and audiences. | Phase 95 should add an evaluation scorecard contract and focused node:test coverage for grounding, acceptance, and promotion decisions. |
| DRT-13 | External research connectors preserve citations, freshness metadata, domain allow-lists, and provider-level audit records for every live research run. | Comparison payloads must carry per-provider route trace, citation counts, freshness signals, and audit metadata into the decision surface. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Follow the repo boot order: QUICKSTART, INDEX, STATE, then MARKOS-INDEX.
- Stay aligned with the GSD/MarkOS split; do not replace the existing protocol surfaces.
- Use the existing Node-based test workflow: `npm test` or `node --test test/**/*.test.js`.
- Local onboarding runtime remains the current backend server surface.
- Client overrides belong only in `.markos-local/`.

## Summary

Phase 95 should **not** invent a new governance system. The repo already has the right primitives: fail-closed gates, machine-readable diagnostics, provider-policy metadata, audit evidence packs, and explicit approval-needed or suggestion-only behavior. The planner should build a thin evaluation layer that consumes Phase 93 context packs and Phase 94 preview diffs, scores them conservatively, and returns a decision envelope of **promotable**, **review_required**, or **blocked**.

The strongest repo-native pattern is clear: **unsafe or weakly grounded output stays visible, but it does not silently pass**. The v1 design should therefore remain read-safe, batch-level for acceptance, artifact-level for warnings, and human-reviewed for all promotion decisions. Promotion means “eligible for human acceptance,” not “auto-applied.”

**Primary recommendation:** Build a pure evaluation contract first, then attach audit telemetry and manual override recording without adding any auto-write or auto-publish path.

## Repo-Native Findings

### Existing governance patterns already in the repo

1. **Fail-closed gate pattern already exists**  
   `onboarding/backend/brand-governance/closure-gates.cjs` uses deterministic pass/fail gates, tenant isolation checks, and contract integrity checks. This is the right model for promotion blockers.

2. **Machine-readable denial payloads are the norm**  
   `onboarding/backend/brand-governance/governance-diagnostics.cjs` normalizes stable reason codes. Phase 95 should emit deterministic evaluation diagnostics, not prose-only warnings.

3. **Audit telemetry schema is already strict and reusable**  
   `onboarding/backend/vault/telemetry-schema.cjs` requires tenant, artifact, retrieval mode, run ID, evidence refs, anomaly flags, and timestamp. Phase 95 should use the same telemetry vocabulary.

4. **Safe action semantics already prefer approval-needed and suggestion-only**  
   `lib/markos/crm/execution.ts` exposes `approval_needed`, `suggestion_only`, and bounded safe actions. This matches the requested human-reviewed posture.

5. **Provider routing and fallback policy already exists**  
   `onboarding/backend/runtime-context.cjs` and `lib/markos/llm/adapter.ts` already model primary provider, allowed providers, fallback behavior, and external-mutation denial by default.

6. **Governance evidence packaging already exists**  
   `lib/markos/governance/evidence-pack.cjs` and `api/governance/evidence.js` show the preferred append-only, audit-friendly packaging style for review and closeout evidence.

### What this means for Phase 95

- Keep the phase **additive**.
- Reuse existing deny-code and telemetry conventions.
- Return structured diagnostics per artifact and per run.
- Preserve a strict human-review boundary.
- Do **not** auto-accept, auto-apply, or auto-promote any MIR/MSP delta.

## Standard Stack

### Core repo modules

| Module / Surface | Purpose | Why it is standard for this phase |
|------------------|---------|-----------------------------------|
| `lib/markos/llm/adapter.ts` | provider abstraction, fallback, LLM telemetry | already canonical for provider calls and comparison metadata |
| `onboarding/backend/runtime-context.cjs` | provider policy and safe tool policy | already normalizes primary provider, allowed providers, and fallback posture |
| `onboarding/backend/brand-governance/governance-diagnostics.cjs` | machine-readable reason codes | matches the repo’s existing governance denial style |
| `onboarding/backend/brand-governance/closure-gates.cjs` | fail-closed deterministic gating | ideal backbone for promotion blocker logic |
| `onboarding/backend/vault/telemetry-schema.cjs` | governance telemetry normalization | required for audit-friendly evaluation events |
| `lib/markos/governance/evidence-pack.cjs` | append-only review evidence packaging | aligns with manual override and acceptance review history |
| `lib/markos/crm/execution.ts` | safe recommendation semantics | already encodes approval-needed and suggestion-only behavior |

### External/provider layer already present in repo

| Package | Repo-pinned Version | Purpose | Use in Phase 95 |
|---------|---------------------|---------|-----------------|
| `openai` | `^6.32.0` | provider calls and eval-oriented workflows | compare run outputs; do not hard-couple governance to one vendor |
| `@anthropic-ai/sdk` | `^0.82.0` | alternate provider path | compare quality and fallback behavior |
| `@google/generative-ai` | `^0.24.1` | alternate provider path | compare quality and fallback behavior |
| Tavily API surface | existing integration | search and evidence retrieval | preserve citation, score, freshness, and request metadata |

**Recommendation:** Use the existing stack only. No new governance framework or dashboard dependency is needed for v1.

## Recommended Architecture

### 1) Evaluation stays read-safe and side-effect-light

Phase 95 should consume:
- the Phase 93 context pack and provider-attempt ledger
- the Phase 94 preview payloads and evidence-linked diffs
- the active filter stack and route trace metadata

It should return a structured evaluation result only. The only persistent write in v1 should be an **audit event** for review outcomes or manual override notes.

### 2) Use one run-level decision with artifact-level flags

Recommended decision contract:

```ts
interface EvaluationDecisionEnvelope {
  run_id: string;
  best_candidate: { provider: string; score: number; band: 'winner' | 'runner_up' | 'other' };
  runner_up: { provider: string; score: number } | null;
  decision: 'promotable' | 'review_required' | 'blocked';
  score_breakdown: Array<{
    provider: string;
    grounding: number;
    evidence_sufficiency: number;
    personalization: number;
    delta_safety: number;
    efficiency: number;
    total: number;
  }>;
  artifact_flags: Array<{
    artifact_id: string;
    status: 'ok' | 'warning' | 'blocked';
    warnings: string[];
    blockers: string[];
  }>;
  governance_diagnostics: Array<{ code: string; detail: string; machine_readable: true }>;
  override: null | { actor_id: string; rationale: string; timestamp: string };
  read_safe: true;
}
```

### 3) Recommended weighted score model

Use a conservative weighted score with **hard blockers**:

| Dimension | Weight | Why it matters |
|----------|--------|----------------|
| Grounding and citation integrity | 35% | most important requirement for trust and promotion safety |
| Evidence sufficiency and contradiction handling | 25% | weak or conflicting evidence must not be promoted silently |
| Relevance and personalization lift | 20% | required by DRT-10 and the milestone promise |
| Delta safety and precision | 10% | Phase 94 previews must stay surgical, not rewrite-heavy |
| Efficiency and provider hygiene | 10% | latency/cost matters, but it is subordinate to grounding and safety |

Recommended score bands:
- **Promotable:** score ≥ 80 and zero hard blockers
- **Review required:** score 60-79 or any advisory warning set
- **Blocked:** any hard blocker, or score < 60

### 4) Hard blockers vs advisory warnings

**Mandatory blockers**
- missing or unusable citations
- unresolved contradiction on a material claim
- evidence does not support the proposed delta
- provider route trace or run provenance is missing
- tenant or audit metadata is incomplete
- telemetry payload is invalid

**Advisory warnings**
- stale but still cited evidence
- weak personalization lift
- high-cost or slow provider path
- limited provider coverage in the comparison run
- non-critical artifact warnings on individual sections

### 5) Manual override must be explicit and reviewable

A manual override should only:
- change the decision from `blocked` or `review_required` to “human accepted with override”
- require actor, reason, timestamp, and linked evidence refs
- be emitted as a governance event and stored in the same audit style already used elsewhere in the repo

It should **never** silently bypass diagnostics or erase artifact warnings.

## Provider Comparison Guidance

The comparison surface should show a **winner and runner-up**, with short reasons such as:
- stronger citation coverage
- fewer contradiction flags
- better alignment to the active filter stack
- more precise preview deltas
- better latency/cost only after quality is already acceptable

### Recommended comparison dimensions

| Dimension | Compare Across Providers? | Notes |
|----------|---------------------------|-------|
| citation count and quality | Yes | first-order grounding signal |
| freshness metadata present | Yes | needed for recent claims |
| contradiction rate | Yes | must be operator-visible |
| filter-stack relevance | Yes | verifies real tailoring, not generic output |
| preview diff precision | Yes | ties Phase 95 back to Phase 94 |
| latency and estimated usage | Yes | helpful tie-breaker, not the lead criterion |

**Planning implication:** keep the scorecard compact and decision-oriented. Do not build a broad analytics dashboard in v1.

## Architecture Patterns

### Pattern 1: Pure evaluator + thin adapters
**What:** Keep the scoring engine as a pure function and let API/MCP/CLI/editor surfaces only render its output.  
**When to use:** for every evaluation or acceptance request.  
**Why:** easier to test, portable across clients, and fully read-safe.

### Pattern 2: Deterministic diagnostics envelope
**What:** Every blocker or warning uses stable reason codes plus human-readable detail.  
**When to use:** whenever promotion is denied or downgraded.  
**Why:** this matches the repo’s existing closure-gate and governance-diagnostics style.

### Pattern 3: Run acceptance with artifact isolation
**What:** one decision for the run, but each artifact keeps its own status and warnings.  
**When to use:** whenever a batch contains both safe and risky deltas.  
**Why:** exactly matches the locked decisions in the phase context.

### Anti-patterns to avoid
- **Do not auto-apply accepted deltas in Phase 95.** This phase is evaluation and governance, not mutation.
- **Do not flatten everything into one opaque score.** Operators need winner reasons and blocker visibility.
- **Do not treat all dimensions equally.** Grounding must dominate the score.
- **Do not hide override behavior.** Manual override needs durable evidence.
- **Do not create provider-specific governance logic per client surface.** One shared contract should drive API, MCP, CLI, and editor output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| governance denial language | ad hoc strings | existing machine-readable reason-code format | keeps automation and review deterministic |
| promotion logic | a separate approval framework | current fail-closed gate and approval-needed patterns | repo already solved the boundary semantics |
| audit storage | a custom analytics store | append-only governance evidence / telemetry events | v1 only needs review-safe evidence, not BI |
| provider ranking UI | a full dashboard | compact scorecard with winner, runner-up, and reasons | matches scope and context constraints |

**Key insight:** the repo already has the governance vocabulary; Phase 95 should compose it, not reinvent it.

## Planning Implications

1. **Wave 0 — contract and tests first**
   - define the evaluation envelope
   - define score dimensions and hard blockers
   - add fixtures for good grounding, weak grounding, contradiction, and mixed-artifact runs

2. **Wave 1 — provider comparison engine**
   - implement pure scoring utilities
   - rank winner and runner-up
   - emit human-readable “why this won” summaries

3. **Wave 2 — grounding and acceptance review**
   - block unsafe promotion on citation or contradiction failures
   - preserve per-artifact warnings in the run result
   - expose review-friendly status bands

4. **Wave 3 — audit-friendly override and telemetry**
   - capture explicit override notes
   - reuse governance telemetry schema and evidence-pack packaging
   - keep an append-only comparison history summary if needed

5. **Wave 4 — thin cross-client presentation**
   - keep output portable across MCP, API, CLI, and editor views
   - do not expand into a dashboard or autonomous workflow engine

## Environment Availability

| Dependency | Required By | Available | Version / State | Fallback |
|------------|------------|-----------|-----------------|----------|
| Node.js | backend and tests | ✓ | v22.13.0 | — |
| npm | test scripts and package workflow | ✓ | 10.9.2 | — |
| OpenAI API key | optional provider comparison | ✗ | not configured locally | use internal-only / offline comparison fixtures |
| Anthropic API key | optional provider comparison | ✗ | not configured locally | use internal-only / offline comparison fixtures |
| Gemini API key | optional provider comparison | ✗ | not configured locally | use internal-only / offline comparison fixtures |
| Tavily API key | optional external evidence runs | ✗ | not configured locally | evaluate cached or fixture-based evidence packs |
| Firecrawl API key | optional structured crawl runs | ✗ | not configured locally | out of path for v1; keep optional |

**Missing dependencies with no fallback:** None for v1 planning. The phase can be implemented and tested using deterministic fixtures and internal evidence packs.

**Missing dependencies with fallback:** All external providers. Design the validation suite so it does not require live network access by default.

## Common Pitfalls

### Pitfall 1: confusing “promotable” with “accepted”
**What goes wrong:** the system starts acting as if a score alone grants approval.  
**Why it happens:** the evaluation result is treated as an execution permission rather than an eligibility signal.  
**How to avoid:** keep acceptance human-owned and separate from scoring.  
**Warning signs:** automatic writes, missing approval notes, or hidden overrides.

### Pitfall 2: collapsing artifact warnings into one run score
**What goes wrong:** a mostly good run hides one risky artifact.  
**Why it happens:** only a single aggregate score is shown.  
**How to avoid:** retain per-artifact flags and warnings in the response envelope.  
**Warning signs:** operators cannot see which exact section is risky.

### Pitfall 3: over-weighting latency or cost
**What goes wrong:** cheap or fast providers win even when the evidence is weaker.  
**Why it happens:** equal-weight or ops-heavy scoring.  
**How to avoid:** grounding and evidence sufficiency must dominate the score.  
**Warning signs:** fast but weakly cited results are marked promotable.

### Pitfall 4: burying blockers in prose-only UI
**What goes wrong:** the operator sees a warning message but automation cannot consume it.  
**Why it happens:** no stable reason-code schema.  
**How to avoid:** reuse machine-readable diagnostics with codes and detail fields.  
**Warning signs:** inconsistent wording across clients.

## Code Examples

### Example decision payload

```json
{
  "run_id": "rrun-001",
  "decision": "review_required",
  "best_candidate": { "provider": "openai", "score": 82, "band": "winner" },
  "runner_up": { "provider": "tavily+vault", "score": 77 },
  "artifact_flags": [
    {
      "artifact_id": "mir-positioning",
      "status": "ok",
      "warnings": [],
      "blockers": []
    },
    {
      "artifact_id": "msp-channel-plan",
      "status": "warning",
      "warnings": ["freshness_low"],
      "blockers": []
    }
  ],
  "governance_diagnostics": [
    { "code": "GROUNDING_REVIEW_REQUIRED", "detail": "One material claim lacks a first-party or cited source.", "machine_readable": true }
  ],
  "override": null,
  "read_safe": true
}
```

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in test runner |
| Config file | package.json test script |
| Quick run command | `node --test test/phase-95/**/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRT-08 | filter stack, evidence, and deltas remain inspectable before acceptance | unit/integration | `node --test test/phase-95/acceptance-review-envelope.test.js` | ❌ Wave 0 |
| DRT-09 | run decisions and overrides remain auditable with provenance | unit | `node --test test/phase-95/governance-audit-telemetry.test.js` | ❌ Wave 0 |
| DRT-10 | relevance, grounding, and personalization lift are scored and blocked correctly | unit | `node --test test/phase-95/evaluation-scorecard.test.js` | ❌ Wave 0 |
| DRT-13 | provider comparison preserves citations, freshness, and audit metadata | unit | `node --test test/phase-95/provider-comparison-history.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-95/**/*.test.js`
- **Per wave merge:** `npm run test:llm && node --test test/phase-95/**/*.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/phase-95/evaluation-scorecard.test.js` — weighted scoring and winner/runner-up ranking
- [ ] `test/phase-95/grounding-blocks-promotion.test.js` — hard blockers on citation or contradiction failure
- [ ] `test/phase-95/acceptance-review-envelope.test.js` — run-level accept + artifact-level flags
- [ ] `test/phase-95/governance-audit-telemetry.test.js` — override logging and required evidence refs
- [ ] `test/phase-95/provider-comparison-history.test.js` — provider audit summary and ordering determinism

## Open Questions

1. **Where should v1 comparison history live?**
   - What we know: the repo already supports append-only audit evidence and governance telemetry.
   - What’s unclear: whether history should live only in telemetry/audit records or also as a lightweight planner-facing JSON artifact.
   - Recommendation: start with audit records plus a compact summary object in the response envelope; defer dashboards.

2. **Which advisory warnings should still allow promotion eligibility?**
   - What we know: the phase context explicitly allows conservative scoring plus human override.
   - What’s unclear: the exact threshold between `review_required` and `promotable` for stale-but-cited evidence.
   - Recommendation: lock hard blockers first, then tune advisory bands with fixture-based evals.

## Sources

### Primary (HIGH confidence)
- Repo source audit:
  - `onboarding/backend/brand-governance/closure-gates.cjs`
  - `onboarding/backend/brand-governance/governance-diagnostics.cjs`
  - `onboarding/backend/vault/telemetry-schema.cjs`
  - `onboarding/backend/runtime-context.cjs`
  - `lib/markos/llm/adapter.ts`
  - `lib/markos/crm/execution.ts`
  - `lib/markos/governance/evidence-pack.cjs`
  - `api/governance/evidence.js`
- Phase context inputs:
  - `.planning/phases/95-evaluation-and-governance/95-CONTEXT.md`
  - `.planning/phases/93-multi-source-deep-research-orchestration/93-CONTEXT.md`
  - `.planning/phases/94-mir-and-msp-delta-patch-engine/94-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/STATE.md`
  - `.planning/ROADMAP.md`
  - `.planning/research/v3.6.0-deep-research-tailoring-brief.md`
  - `.planning/research/v3.6.0-research-task-framework.md`

### Secondary (MEDIUM confidence)
- OpenAI evals guide: https://developers.openai.com/api/docs/guides/evals
- Tavily Search API docs: https://docs.tavily.com/documentation/api-reference/endpoint/search

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — the repo already contains the required governance, telemetry, and provider abstractions.
- Architecture: HIGH — the phase context and existing runtime boundaries point to one clear additive design.
- Pitfalls: HIGH — the repo repeatedly favors fail-closed diagnostics, approval-needed states, and audit lineage.

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
