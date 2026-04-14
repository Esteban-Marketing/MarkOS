# Phase 99: Agent and Skill Training Alignment for Tailored Generation - Research

**Researched:** 2026-04-14  
**Domain:** Repo-native agent alignment, anti-generic review enforcement, and portable tailoring behavior across supported surfaces  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Alignment posture
- **D-01:** Phase 99 should build on the shipped Phase 98 reasoning contract rather than inventing a second tailoring system or alternate instruction logic.
- **D-02:** The rollout should use a **hybrid enforcement posture**: planning and review layers must hard-enforce the new ICP and neuromarketing signals, while generation layers may stay somewhat flexible as long as they are clearly guided by the same contract.
- **D-03:** Research, planning, and generation agents should all consume the same core tailoring signals so the system stops losing intelligence between phases and surfaces.

### Quality gate behavior
- **D-04:** If output is shallow, generic, or template-sounding, it should be treated as **blocking** for premium-quality content and require rewrite rather than merely being noted.
- **D-05:** Review logic should explicitly look for missing ICP fit, weak specificity, low naturality, and ungrounded neuro language instead of passing generic content through.

### Cross-surface contract
- **D-06:** Phase 99 should use **one shared core contract** across MCP, API, CLI, editor, and internal automation surfaces, with only presentation formatting varying by surface.
- **D-07:** The shared contract should preserve the Phase 98 explainability posture: tailored signals, rationale, and confidence should remain portable rather than being hidden inside one surface-specific prompt.

### Scope guardrails
- **D-08:** Phase 99 focuses on instructions, skills, and review alignment only; it should not absorb the broader measurable quality-eval and governance-closeout work reserved for Phase 99.1.
- **D-09:** The neuromarketing reference remains governed authority. This phase should train agents and reviewers to use it consistently, not improvise outside it.

### Claude's Discretion
- Which specific prompts, skills, and review checkpoints should be updated first
- The exact wording and structure of anti-generic / anti-template review rules
- The smallest portable contract shape that all supported surfaces can share without drift
- How rewrite-required outcomes are surfaced in review summaries versus inline agent feedback

### Deferred Ideas (OUT OF SCOPE)
- Final measurable scoring and premium-quality governance closeout remain deferred to Phase 99.1.
- Broader future-grade evaluation metrics, non-regression scoring, and governance reporting should stay in the next phase rather than expanding this one.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NLI-08 | Research, planning, and generation agents consume the upgraded literacy signals consistently across prompts, skills, and review paths. | Reuse the existing Phase 96 `tailoring_signals` transport and the Phase 98 `icp_reasoning_recommendation` winner contract; make planner, checker, auditor, and generator surfaces require the same fields. |
| NLI-09 | MarkOS can detect and flag shallow, generic, or template-sounding output before it is treated as premium-quality content. | Use the repo’s existing blocker-style and `REWRITE REQUIRED` review pattern; hard-fail outputs that ignore ICP fit, specificity, naturality, or governed neuro logic. |
| NLI-10 | The upgraded training and literacy logic remains portable across MCP, API, CLI, editor, and internal automation surfaces. | Mirror the existing Phase 95 surface-adapter pattern so the payload stays identical and only the presentation layer changes by surface. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Canonical planning state lives in `.planning/STATE.md` and should remain the reference point for phase status and next actions.
- Primary install/update path is `npx markos`.
- Standard verification commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding runtime is the Node backend under `onboarding/backend/`.
- `.planning/config.json` currently has `workflow.nyquist_validation: true`, so Phase 99 should include and preserve automated validation coverage.
- Recommendations must stay additive to the existing repo architecture and must not contradict governed neuromarketing authority.

## Summary

Phase 99 should be implemented as a **contract-alignment and enforcement phase**, not as a new reasoning engine, new evaluation framework, or second tailoring system. The repo already has the necessary primitives: Phase 96 transports structured tailoring signals, Phase 98 emits a portable shortlist-plus-winner recommendation with confidence and rationale, and Phase 95 already packages review semantics consistently across API, MCP, CLI, and editor surfaces. The missing work is therefore **instructional consistency and blocking review behavior**, not new intelligence logic.

The most repo-native path is to align the surfaces that create and police work **before** the surfaces that draft copy. Planning and review must become the hard gate for ICP fit, specific proof posture, naturality, and governed neuro usage; generation should then stay flexible in style but must still consume the same winner, matched signals, and rationale. This directly satisfies NLI-08 through NLI-10 while staying inside the approved Phase 99 boundary.

**Primary recommendation:** promote the shipped Phase 98 recommendation object into one mandatory shared tailoring envelope, wire it into planning and review first, and require `REWRITE REQUIRED` whenever output ignores the contract or sounds generic.

## Repo-Native Implementation Path

### Align these surfaces first

| Priority | Surface | Existing repo seam | What Phase 99 should enforce |
|---------|---------|--------------------|-------------------------------|
| 1 | Planning | `.agent/markos/agents/markos-planner.md`, `.agent/markos/agents/markos-plan-checker.md`, `.agent/markos/workflows/plan-phase.md` | Plans must explicitly reference the reasoning winner, matched ICP signals, tone/naturality expectations, and concrete anti-generic acceptance criteria. |
| 2 | Review | `.agent/markos/agents/markos-neuro-auditor.md`, `onboarding/backend/research/evaluation-diagnostics.cjs`, `onboarding/backend/research/evaluation-review-entrypoint.cjs` | Missing ICP fit, weak specificity, abstract neuro language, or template-sounding output must surface as blocking rewrite outcomes. |
| 3 | Generation | `.agent/markos/agents/markos-campaign-architect.md`, `.agent/markos/agents/markos-content-creator.md`, `.agent/markos/agents/markos-copy-drafter.md`, prompt packs under `.agent/prompts/` | Generators may vary format by surface, but must read the same winner, trigger, archetype, objections, trust cues, and naturality posture. |
| 4 | Cross-surface portability | `onboarding/backend/research/context-pack-contract.cjs`, `icp-recommendation-contract.cjs`, `evaluation-review-entrypoint.cjs` | Keep the payload identical across API, MCP, CLI, editor, and internal automation; only the presentation wrapper may differ. |

### Minimal shared tailoring contract

Do **not** create a second tailoring schema. Use one transport envelope that carries the existing Phase 96 and Phase 98 data and lets review attach a stable gate decision.

```json
{
  "tailoring_signals": {
    "pain_point_tags": ["..."],
    "desired_outcome_tags": ["..."],
    "objection_tags": ["..."],
    "trust_driver_tags": ["..."],
    "trust_blocker_tags": ["..."],
    "emotional_state_tags": ["..."],
    "neuro_trigger_tags": ["B04"],
    "naturality_tags": ["plainspoken", "specific"],
    "company_tailoring_profile": {},
    "icp_tailoring_profile": {},
    "stage_tailoring_profile": {}
  },
  "reasoning": {
    "version": "1.0",
    "authority_token": "MARKOS-REF-NEU-01",
    "confidence_flag": "high|medium|low",
    "winner": {
      "overlay_key": "saas",
      "primary_trigger": "B04",
      "archetype": "sage",
      "retrieval_filters": {},
      "matched_signals": {},
      "why_it_fits_summary": "..."
    },
    "candidate_shortlist": [],
    "explanation": {
      "summary": "...",
      "uncertainty": []
    }
  },
  "review": {
    "status": "passed|warnings|rewrite_required",
    "blocking_reasons": [],
    "required_fixes": []
  }
}
```

### Hard-enforcement order

1. **Planner and checker first**  
   The repo already treats shallow planning as a core failure mode. Phase 99 should require every planning surface to carry forward the shared contract into task actions and acceptance criteria. If a plan says “write tailored copy” without naming the ICP pain, trust driver, stage, and trigger fit, it should fail the checker.

2. **Reviewer second**  
   The repo already has strong `REWRITE REQUIRED` semantics in the neuro auditor and blocker/warning semantics in the evaluation diagnostics. Phase 99 should standardize these into one cross-surface rewrite decision so premium output cannot be promoted when it is generic.

3. **Generators third**  
   Campaign and copy agents should be updated after the hard-gate surfaces are aligned. This ensures output drift is caught even if a generator prompt is imperfect.

### Rewrite-required outcomes should surface like this

| Outcome | Meaning | Surface behavior |
|---------|---------|------------------|
| `PASSED` | The output clearly uses the winner, ICP fit, proof posture, and naturality guidance. | Continue normally. |
| `WARNINGS` | Output is directionally correct but has non-blocking issues such as low proof density or weak runner-up explanation. | Human may review, but no automatic promotion to premium by default. |
| `REWRITE REQUIRED` | Output is shallow, generic, template-sounding, ignores the winner contract, or uses ungrounded neuro language. | Block execution/promotion and return exact fixes. |

**Blocker conditions for `REWRITE REQUIRED`:**
- No visible ICP-specific pain, objection, trust driver, or desired outcome in the output
- The content could plausibly fit any audience with minimal edits
- Neuro or persuasion language is abstract, manipulative, or outside `MARKOS-REF-NEU-01`
- Tone feels robotic, listicle-like, or hype-heavy against the shared naturality guidance
- Reviewer cannot explain *why* the chosen angle fits the winner recommendation

### Portability rule

Follow the same packaging pattern already used by the repo for evaluation review bundles: one payload, many presenters. The correct implementation is **shared data contract + surface-specific formatting**, not separate prompt logic per surface.

## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js + `node:test` | Verified locally: `v22.13.0`; repo requires `>=20.16.0` | Runtime and verification harness | Already the repo-wide standard and sufficient for this phase. |
| `onboarding/backend/research/context-pack-contract.cjs` | Repo-native | Carries read-safe `tailoring_signals` across research and generation surfaces | Already shipped and portable; Phase 99 should reuse it. |
| `onboarding/backend/research/icp-recommendation-contract.cjs` | Repo-native `version: 1.0` | Authoritative shortlist-plus-winner reasoning contract | Already shipped in Phase 98 and verified by tests; do not replace it. |
| `onboarding/backend/research/evaluation-review-entrypoint.cjs` | Repo-native | Adapts one review payload across API, MCP, CLI, and editor | Provides the exact portability pattern NLI-10 needs. |
| `.agent/markos/references/neuromarketing.md` | Active governed reference | Authority for allowed triggers, archetypes, and stage mappings | Prevents ad hoc persuasion logic and keeps explainability grounded. |
| `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md` | Active shared literacy guidance | Naturality and anti-hype tone baseline | Already encodes the anti-generic posture required for this phase. |

### Supporting

| Module / Surface | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `.agent/markos/agents/markos-planner.md` | Active repo manifest | Converts research into enforceable plans | First hard gate for NLI-08. |
| `.agent/markos/agents/markos-plan-checker.md` | Active repo manifest | Blocks shallow or unverifiable plans before execution | First machine-readable anti-generic gate. |
| `.agent/markos/agents/markos-neuro-auditor.md` | Active repo manifest | Returns `PASSED`, `WARNINGS`, or `REWRITE REQUIRED` | Use as the rewrite model for premium-content gating. |
| `.agent/markos/agents/markos-content-creator.md` / `markos-copy-drafter.md` / `markos-campaign-architect.md` | Active repo manifests | Generator consumption surfaces | Update only after planner and reviewer logic are aligned. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing the Phase 98 contract | A second prompt-only tailoring schema | Faster to draft, but guarantees prompt drift and contradicts D-01 / D-06. |
| Existing repo review signals | A brand-new premium grading framework | Pulls Phase 99.1 forward and expands scope unnecessarily. |
| Surface adapters with one payload | Separate rules for API, CLI, MCP, editor | Increases maintenance cost and portability risk. |

**Installation:**
```bash
npm install
```

**Version verification:** No new dependency is recommended for this phase. The verified local environment already supports the repo runtime and the focused contract tests passed on 2026-04-14.

## Architecture Patterns

### Recommended Project Structure

```text
.agent/
├── markos/
│   ├── references/
│   │   ├── neuromarketing.md
│   │   └── tailoring-alignment.md        # recommended shared instruction contract for Phase 99
│   ├── agents/
│   │   ├── markos-planner.md
│   │   ├── markos-plan-checker.md
│   │   ├── markos-neuro-auditor.md
│   │   ├── markos-campaign-architect.md
│   │   ├── markos-content-creator.md
│   │   └── markos-copy-drafter.md
│   └── workflows/
│       ├── plan-phase.md
│       └── plan-campaign.md
onboarding/
└── backend/
    └── research/
        ├── context-pack-contract.cjs
        ├── icp-recommendation-contract.cjs
        ├── evaluation-diagnostics.cjs
        └── evaluation-review-entrypoint.cjs
```

### Pattern 1: Single authoritative contract, many consumers
**What:** Every surface reads the same `tailoring_signals` + `reasoning` object.  
**When to use:** Always, for planning, generation, and review.  
**Why:** This is the only reliable way to stop ICP and neuro intelligence from disappearing between surfaces.

### Pattern 2: Hard gate upstream, flex downstream
**What:** Planning and review enforce the contract strictly; generation is allowed stylistic freedom but not contract drift.  
**When to use:** For all external-facing outputs.  
**Why:** It matches the user’s locked hybrid enforcement posture and minimizes rewrite churn.

### Pattern 3: Surface adapters, not surface-specific prompt logic
**What:** Reuse the Phase 95 adapter pattern where a read-safe payload is wrapped for API, MCP, CLI, and editor views.  
**When to use:** Any time the same review or reasoning result must travel across surfaces.  
**Why:** This preserves portability and explainability while avoiding prompt drift.

### Pattern 4: Rewrite loop is first-class, not an afterthought
**What:** Treat generic or shallow output as a blocking artifact state with explicit required fixes.  
**When to use:** In checker, auditor, and review-entrypoint surfaces.  
**Why:** NLI-09 is about prevention and detection before premium treatment, not just after-the-fact commentary.

### Anti-Patterns to Avoid
- **Second tailoring system:** a new prompt schema or alternate ranking logic that ignores Phase 98
- **Soft-only review:** warnings without blocking status for generic output
- **Free-text neuromarketing improvisation:** triggers or persuasion claims outside `MARKOS-REF-NEU-01`
- **Per-surface drift:** API, CLI, editor, and MCP each inventing their own contract language
- **Phase 99.1 leakage:** broad scoring, benchmark dashboards, or governance closeout work pulled forward prematurely

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shared tailoring logic | A new prompt-only “tailoring brain” | The shipped Phase 98 reasoning contract | It already includes winner, shortlist, rationale, confidence, and governed filters. |
| Cross-surface output packaging | Separate serializer rules for every surface | The existing review bundle adapter pattern | One payload keeps the behavior portable and auditable. |
| Generic-output detection | A shallow banned-word list only | Contract-aware rewrite rules in planner/checker/auditor | Generic quality failure is about missing signals and weak specificity, not only words. |
| Neuromarketing authority | New trigger names or custom persuasion heuristics | `MARKOS-REF-NEU-01` and the existing archetype / stage mapping | Keeps behavior explainable, ethical, and governed. |
| Premium scoring closeout | New benchmark dashboards or heavy eval framework | Existing blocker/warning semantics only in Phase 99 | Full measurable evaluation belongs to Phase 99.1. |

**Key insight:** Phase 99 should not create new intelligence; it should make the already-shipped intelligence impossible to ignore.

## Common Pitfalls

### Pitfall 1: Prompt drift between planner, reviewer, and generator
**What goes wrong:** Each surface uses different wording for the same ICP and neuro logic, so the system behaves inconsistently.  
**Why it happens:** The contract is restated in multiple prompts instead of referenced from one shared source.  
**How to avoid:** Centralize the contract wording and require all surfaces to read the same fields.  
**Warning signs:** The planner talks about “tailoring signals,” the generator talks about “angles,” and the reviewer talks about “quality” with no shared schema.

### Pitfall 2: Generic output only gets warned on, not blocked
**What goes wrong:** Premium-looking but shallow content still passes because the review layer does not fail it decisively.  
**Why it happens:** Review logic is advisory instead of authoritative.  
**How to avoid:** Standardize `REWRITE REQUIRED` as a blocking outcome and attach specific required fixes.  
**Warning signs:** Review comments say “could be more specific” but still allow promotion.

### Pitfall 3: The generator receives too much raw context and ignores the winner
**What goes wrong:** The prompt becomes broad and noisy, and the resulting copy sounds like a template.  
**Why it happens:** Large raw context dumps dilute the rank-1 recommendation and matched signals.  
**How to avoid:** Feed generators the compact winner, matched signals, objections, trust posture, and tone guidance rather than the entire raw retrieval body.  
**Warning signs:** Copy mentions many generic benefits but none of the chosen ICP pain, trust cue, or stage-specific trigger.

### Pitfall 4: Ungoverned neuromarketing claims
**What goes wrong:** Copy uses persuasion language that is not grounded in the governed reference or is manipulative in tone.  
**Why it happens:** The system treats neuro language as free-form inspiration instead of constrained authority.  
**How to avoid:** Keep `MARKOS-REF-NEU-01` as the only allowed trigger vocabulary and preserve the existing evidence and manipulation guardrails.  
**Warning signs:** Uncited claims, vague urgency, or abstract “emotional activation” language with no mechanism.

### Pitfall 5: Pulling Phase 99.1 forward
**What goes wrong:** The phase balloons into dashboards, metrics, and full governance closeout work.  
**Why it happens:** It is tempting to solve enforcement and scoring in one pass.  
**How to avoid:** Keep Phase 99 focused on instructions, skills, review alignment, and rewrite gating only.  
**Warning signs:** New scoring dimensions, benchmark reporting, or milestone-closeout logic appear in the implementation plan.

## Code Examples

Verified repo-native patterns to mirror:

### Example 1: Portable reasoning winner already exists
```javascript
const reasoningWinner = options && typeof options === 'object'
  ? (options.reasoning?.winner || options.winner || null)
  : null;
const preferredOverlayKey = String(reasoningWinner?.overlay_key || '').trim().toLowerCase();
```
**Source:** `onboarding/backend/agents/example-resolver.cjs`

**Use in Phase 99:** make planner, generator, and reviewer prompts consume this same winner object rather than inventing a second “best angle” field.

### Example 2: Cross-surface review packaging already exists
```javascript
return {
  read_safe: true,
  write_disabled: true,
  evaluation,
  review_package: reviewPackage,
  surfaces: {
    api: adaptForSurface(evaluation, reviewPackage, 'api'),
    mcp: adaptForSurface(evaluation, reviewPackage, 'mcp'),
    cli: adaptForSurface(evaluation, reviewPackage, 'cli'),
    editor: adaptForSurface(evaluation, reviewPackage, 'editor'),
  },
};
```
**Source:** `onboarding/backend/research/evaluation-review-entrypoint.cjs`

**Use in Phase 99:** package rewrite outcomes with one payload and many presenters so portability is guaranteed by construction.

### Example 3: Recommended review result shape for shallow-output blocking
```json
{
  "status": "rewrite_required",
  "blocking_reasons": [
    {
      "code": "GENERIC_OUTPUT_BLOCKED",
      "detail": "Copy does not reference the winner ICP pain, trust cue, or concrete proof posture."
    }
  ],
  "required_fixes": [
    "Name the top pain point in the opening.",
    "Use the winner.primary_trigger activation method explicitly.",
    "Replace abstract claims with specific peer or evidence-backed proof."
  ]
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Repo runtime, tests, shared backend helpers | ✓ | 22.13.0 | — |
| npm | Dependency install and full suite runs | ✓ | 10.9.2 | — |

**Missing dependencies with no fallback:**
- None for Phase 99 research/planning. This phase is code and instruction alignment on top of the existing repo runtime.

**Missing dependencies with fallback:**
- None identified.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner |
| Config file | none — use `package.json` scripts |
| Quick run command | `node --test test/phase-95/cross-surface-review-envelope.test.js test/phase-98/*.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NLI-08 | Planner, checker, and generators all consume the same contract fields | unit / integration | `node --test test/phase-99/shared-tailoring-alignment.test.js` | ❌ Wave 0 |
| NLI-09 | Generic or template-sounding output returns blocking rewrite status with exact fixes | unit | `node --test test/phase-99/rewrite-required-gates.test.js` | ❌ Wave 0 |
| NLI-10 | API, MCP, CLI, editor, and internal automation preserve one payload with surface-specific presentation only | unit / portability | `node --test test/phase-99/cross-surface-tailoring-portability.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** run the relevant `test/phase-99/*.test.js` target plus the focused Phase 95/98 baseline tests.
- **Per wave merge:** run `npm test`.
- **Phase gate:** full suite green plus a manual review confirming that generic output now returns `REWRITE REQUIRED` instead of silently passing.

### Wave 0 Gaps
- [ ] `test/phase-99/shared-tailoring-alignment.test.js` — proves planner/checker/generator surfaces all require the same contract keys
- [ ] `test/phase-99/rewrite-required-gates.test.js` — proves shallow/generic outputs are blocked with explicit reasons
- [ ] `test/phase-99/cross-surface-tailoring-portability.test.js` — proves API/MCP/CLI/editor preserve the same semantics
- [ ] Small fixture set for “generic vs tailored” examples so the review rules are tested against real behavior, not mocks

## Sources

### Primary (HIGH confidence)
- Local repo source: `onboarding/backend/research/icp-recommendation-contract.cjs` — verified the Phase 98 portable winner contract and confidence behavior
- Local repo source: `onboarding/backend/research/context-pack-contract.cjs` — verified the existing read-safe tailoring signal transport
- Local repo source: `onboarding/backend/research/evaluation-review-entrypoint.cjs` and `evaluation-diagnostics.cjs` — verified the cross-surface review adapter and blocker diagnostics pattern
- Local repo source: `.agent/markos/references/neuromarketing.md` — verified the governed trigger authority and anti-patterns
- Local repo source: `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md` — verified anti-generic naturality expectations
- Local repo source: `.agent/markos/agents/markos-planner.md`, `markos-plan-checker.md`, `markos-neuro-auditor.md`, `markos-content-creator.md`, `markos-copy-drafter.md`, `markos-campaign-architect.md` — verified the exact instruction and gate surfaces that need alignment
- Fresh verification evidence on 2026-04-14: `node --test test/phase-95/cross-surface-review-envelope.test.js test/phase-98/*.test.js` returned **10 pass, 0 fail**

### Secondary (MEDIUM confidence)
- `.agent/prompts/seo_content_architect.md` and related prompt packs — used to confirm the existing anti-fluff and anti-generic posture in generation surfaces
- `.agent/markos/workflows/plan-phase.md` and `plan-campaign.md` — used to confirm hard-gate behavior for plan creation and rewrite loops

### Tertiary (LOW confidence)
- None needed. This phase research was completed from verified repo-native sources and fresh local test evidence.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entirely based on repo-native modules and verified local runtime
- Architecture: HIGH — based on existing implemented seams and fresh test evidence
- Pitfalls: HIGH — directly corroborated by current planner, checker, auditor, and prompt rules already in the repo

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14 for planning purposes unless the underlying Phase 95/98 contract surfaces change first
