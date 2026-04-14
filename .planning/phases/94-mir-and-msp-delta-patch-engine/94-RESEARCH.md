# Phase 94: MIR and MSP Delta Patch Engine - Research

**Researched:** 2026-04-14  
**Domain:** Review-safe MIR/MSP patch previews and evidence-linked delta generation  
**Confidence:** HIGH for repo findings, MEDIUM for exact scoring thresholds

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 94 v1 should prefer section-level surgical diffs rather than full-document rewrites.
- **D-02:** Patch generation should stay narrowly targeted to the exact section or block supported by the evidence.
- **D-03:** Every proposed MIR or MSP patch requires explicit human review before acceptance.
- **D-04:** No low-risk auto-approval path should exist in v1.
- **D-05:** Each proposed patch should carry inline evidence support for the specific change, not just a high-level summary.
- **D-06:** Operators should be able to trace each diff back to its supporting source or contradiction signal.
- **D-07:** When evidence is weak, incomplete, or contradictory, the system should downgrade to suggestion-only mode rather than generating a concrete patch preview.

### Claude's Discretion
- Exact patch payload format and diff representation
- Confidence scoring thresholds for patch vs suggestion-only mode
- How inline evidence is rendered in CLI, MCP, API, and editor views
- Whether the engine stores prior patch preview history for audit convenience in this phase or defers it

### Deferred Ideas (OUT OF SCOPE)
- Auto-applying low-risk updates is deferred.
- Full-document rewrites as the default patch behavior are deferred.
- Hard-blocking all weak-evidence cases is deferred in favor of suggestion-only output.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DRT-06 | The literacy layer supports advanced retrieval filters beyond discipline, including product family, segment, region, regulation, and strategic intent | The patch engine should preserve and surface the active filter stack and only propose deltas for sections those filters materially affect |
| DRT-07 | When context changes, the system can issue delta updates that refresh only the affected Literacy, MIR, or MSP artifacts | Phase 94 should emit section-level patch previews with before/after evidence, not whole-document rewrites |
| DRT-10 | A verification suite measures relevance, grounding, and personalization lift across representative industries, companies, and audiences | Wave 0 should lock evidence-linking, contradiction visibility, and suggestion-only downgrade behavior with targeted tests |
| DRT-16 | MarkOS exposes consistent command surfaces for MCP tools, API endpoints, and CLI or slash-command workflows so the same deep research system can be used in Claude Code, VS Code Copilot, Cursor, and internal automation | The preview payload should be one portable JSON envelope that all surfaces can render without changing semantics |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- `.planning/STATE.md` is the canonical live mission state.
- MarkOS must extend the current runtime rather than inventing a parallel platform.
- Local onboarding runtime is `node onboarding/backend/server.cjs`.
- Repo-standard verification is `npm test` or `node --test test/**/*.test.js`.
- Human approval boundaries already exist and must not be bypassed.
- `.markos-local/` remains the override layer; base templates should not be mutated directly.
- Nyquist validation is enabled and the planner should include a clean Wave 0 phase-94 test slice.

## Summary

MarkOS already has three critical pieces in place for this phase: a structured research/context direction from Phases 91-93, a strict approval gate around high-impact mutation, and deterministic MIR/MSP destination mapping into the canonical vault. What is missing is the **middle layer** that converts evidence-backed context into a precise, operator-reviewable patch preview before any approval or write path is even considered.

The safest v1 is a **preview-only patch contract** that resolves the exact MIR or MSP section, shows a before/after excerpt with inline evidence and contradiction notes, and always marks the result as review-required. When evidence is weak or conflicting, the engine should still help the operator by surfacing a suggestion-only refresh candidate, but it should not fabricate a confident diff.

**Primary recommendation:** Build Phase 94 as a section-targeted, evidence-linked preview engine that sits between the Phase 93 context pack and the existing approval/write surfaces.

## 1) Research Question

What repo-native contract should MarkOS use to transform a ranked research context pack into trustworthy, section-level MIR/MSP patch previews with inline evidence, contradiction visibility, and mandatory human review—without writing files or broad-rewriting artifacts by default?

## 2) Key Findings from Current Codebase

1. **Approval boundaries already exist and are explicit.**  
   `handleApprove()` in `onboarding/backend/handlers.cjs` requires local write availability, validates approval metadata, and uses `assertAwaitingApproval()` plus `recordApprovalDecision()` before any high-impact write proceeds.

2. **The current write path is direct and canonical, not preview-oriented.**  
   `writeApprovedDrafts()` in `onboarding/backend/vault/vault-writer.cjs` writes approved notes into deterministic canonical destinations and blocks conflicts. This is the eventual landing zone, but it is too late in the flow to serve as the preview engine itself.

3. **Legacy MIR writing already assumes section-level structure.**  
   `write-mir.cjs` merges generated content by `##` headings using fuzzy header matching and explicit fallback append behavior. This is strong evidence that Phase 94 should target **logical section anchors** and normalized headings instead of raw line offsets or full-document regeneration.

4. **Stable section keys and artifact destinations already exist.**  
   `destination-map.cjs` defines a registry for `company_profile`, `mission_values`, `audience`, `competitive`, `brand_voice`, and `channel_strategy`. This should become the canonical routing layer for preview targets.

5. **Confidence and contradiction patterns already exist elsewhere in the repo.**  
   `confidence-scorer.cjs` and `contradiction-detector.cjs` provide a workable foundation for downgrade logic and explicit challenge surfacing. Phase 94 should reuse these patterns instead of inventing new opaque heuristics.

6. **Suggestion-only is already an accepted safety posture in MarkOS.**  
   CRM execution contracts in `lib/markos/crm/execution.ts` already model `suggestion_only: true`, disabled send actions, and review-safe previews. Phase 94 can mirror that posture for MIR/MSP patch proposals.

7. **There is no dedicated patch-preview contract yet.**  
   Repo search shows planned references to `preview_artifact_delta`, but no concrete implementation. This confirms the phase gap and keeps the scope clear.

## Standard Stack

### Core
| Component | Use in Phase 94 | Why Standard for this repo |
|-----------|------------------|----------------------------|
| Existing Node/CommonJS backend modules | patch contract and preview engine | matches current onboarding runtime |
| `destination-map.cjs` | resolve target artifact and canonical destination | already deterministic and tenant-safe |
| `approval-gate.cjs` + run lifecycle | enforce review-only posture | already governs high-impact actions |
| `contradiction-detector.cjs` | show explicit challenge signals | already used for conflict annotations |
| `confidence-scorer.cjs` | support downgrade heuristics | already provides low/medium/high style scoring primitives |

### Supporting
| Component | Use | When to Use |
|-----------|-----|-------------|
| `note-format.cjs` metadata ordering | stable preview metadata fields | when serializing preview envelopes or review notes |
| Phase 93 context pack contract | evidence input and route trace | on every preview build |
| existing node:test suite | validation and Nyquist sampling | Wave 0 onward |

## 3) Recommended Patch-Preview Architecture and Payload Shape

### Recommended flow

```text
1. receive Phase 93 context_pack + target artifact intent
2. resolve candidate MIR/MSP section keys from evidence implications
3. load current section snapshot and normalize heading anchors
4. generate a narrow patch proposal for only the affected block(s)
5. attach inline evidence refs, contradictions, freshness, and confidence
6. classify result as preview-ready or suggestion-only
7. return portable preview JSON for operator review
8. do not call any write path in this phase
```

### Recommended modules for the planner

- `onboarding/backend/research/patch-preview-contract.cjs`  
  Portable response envelope shared across API, CLI, MCP, and editor surfaces.

- `onboarding/backend/research/section-target-resolver.cjs`  
  Maps evidence implications to stable `section_key`, canonical note target, and section heading anchors.

- `onboarding/backend/research/mir-msp-delta-engine.cjs`  
  Produces reviewable section patch proposals and downgrade decisions.

### Recommended payload shape

```json
{
  "preview_id": "patchprev_94_001",
  "artifact_family": "MIR",
  "artifact_type": "strategy_note",
  "section_key": "audience",
  "target": {
    "note_id": "strategy-audience-acme",
    "destination_path": "MarkOS-Vault/Strategy/audience.md",
    "heading_path": ["# Audience", "## Primary customer type"]
  },
  "status": "proposed",
  "approval_required": true,
  "suggestion_only": false,
  "write_disabled": true,
  "confidence": 0.84,
  "evidence_strength": "strong",
  "summary": "Tighten the ICP summary to reflect new segment and region evidence.",
  "diff": {
    "mode": "section_replace",
    "before_excerpt": "Current approved section text...",
    "after_excerpt": "Proposed updated section text...",
    "change_rationale": "New ranked evidence shows a narrower buying committee and stronger regional focus."
  },
  "evidence": [
    {
      "evidence_id": "ev_01",
      "source_class": "approved_internal",
      "title": "Current approved audience brief",
      "freshness": "2026-04-12",
      "supports": ["buyer-role change", "region emphasis"],
      "excerpt": "..."
    }
  ],
  "contradictions": [],
  "warnings": [],
  "route_trace": [],
  "provider_attempts": []
}
```

### Why this shape fits MarkOS

- It is **portable JSON**, so Phase 94 can serve MCP, API, CLI, and editor clients without branching the contract.
- It uses **stable section keys and destination mapping** that the repo already understands.
- It preserves the current **approval-first safety posture** by keeping `approval_required: true` and `write_disabled: true`.
- It supports **section-level surgical diffs** while leaving full-document rewrites out of the default path.

## 4) Evidence-Linking and Suggestion-Only Fallback Implications

### Inline evidence rules to lock

1. Every patch summary should reference at least one evidence item tied to the exact claim being changed.
2. Every evidence object should preserve source class, freshness, and excerpt text.
3. Contradictions should be shown side-by-side instead of collapsed into a single synthesized claim.
4. Weak evidence should never masquerade as a concrete patch.

### Suggested downgrade rules

Use three operator-visible modes:

| Mode | When to Use | Output |
|------|-------------|--------|
| `preview_ready` | evidence is strong and non-contradictory | concrete section patch with before/after preview |
| `review_required` | evidence is mixed but still directionally usable | concrete patch plus warnings and contradiction notes |
| `suggestion_only` | evidence is weak, incomplete, or materially contradictory | no authoritative diff; provide refresh suggestions, open questions, and supporting evidence only |

### Suggestion-only implications

When `suggestion_only: true`:
- `approval_required` stays true
- `write_disabled` stays true
- the engine should omit any “ready to apply” posture
- the payload should prefer `refresh_candidates`, `questions_for_review`, and `supporting_evidence` over a confident `after_excerpt`

This matches the repo’s existing safe-draft posture in CRM where suggestion artifacts are explicitly non-executable.

## 5) Approval and Safety Implications

1. **Phase 94 must remain preview-only.**  
   It should not call `writeApprovedDrafts()`, `applyDrafts()`, or any local vault mutation path.

2. **Human review remains mandatory for every patch.**  
   The repo already models run-state and approval immutability. Phase 94 should feed that review system, not short-circuit it.

3. **Conflicts must be explicit, not auto-resolved.**  
   If internal truth and external evidence disagree, show both and downgrade confidence.

4. **Unknown or ambiguous targets should fail closed.**  
   If the engine cannot resolve a clean section anchor or deterministic destination, it should return a blocked preview rather than a risky rewrite.

5. **Auditability should travel with the preview.**  
   Include `preview_id`, `run_id` or `context_pack_id`, `route_trace`, and evidence IDs so later approval or governance layers can trace the decision.

## 6) Planning Implications / Tasks the Planner Should Create

### Plan A — Wave 0 contract and safety tests
Create the failing tests first:
- `test/phase-94/patch-preview-contract.test.js`
- `test/phase-94/section-target-resolution.test.js`
- `test/phase-94/suggestion-only-fallback.test.js`
- `test/phase-94/approval-boundary.test.js`
- `test/phase-94/evidence-linking.test.js`

These should lock:
- section-level diffs only by default
- no write path or approval bypass in the preview engine
- suggestion-only downgrade when evidence is weak or contradictory
- portable envelope parity across API/MCP/CLI/editor surfaces

### Plan B — Target resolver and delta engine
Implement the preview core:
- section resolver based on `destination-map.cjs`
- heading-anchor normalization for current note snapshots
- diff builder for `section_replace`, `section_append`, and `metadata_refresh`
- preview classifier for `preview_ready`, `review_required`, and `suggestion_only`

### Plan C — Review renderers and audit packaging
Add operator-facing packaging:
- renderable before/after excerpt blocks
- inline evidence footnotes or evidence chips
- contradiction panel and warning summaries
- optional preview history or audit note stub only if it remains strictly non-mutating in this phase

## 7) Short Recommendation

Do **not** plan Phase 94 as a write engine. Plan it as a **review contract**: resolve the exact MIR/MSP section, show a narrow evidence-backed diff, downgrade to suggestion-only when certainty drops, and leave final acceptance to the existing approval boundary.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node test runner (`node:test`) |
| Config file | none — direct `node --test` and repo scripts |
| Quick run command | `node --test test/phase-94/patch-preview-contract.test.js test/phase-94/suggestion-only-fallback.test.js` |
| Phase regression command | `node --test test/phase-94/*.test.js test/agents/approval-gate.test.js test/vault-writer.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DRT-06 | filter-backed evidence resolves the right MIR/MSP section target | unit/contract | `node --test test/phase-94/section-target-resolution.test.js` | ❌ Wave 0 |
| DRT-07 | only affected blocks receive patch previews; no broad rewrite default | unit/integration | `node --test test/phase-94/patch-preview-contract.test.js test/phase-94/delta-engine.test.js` | ❌ Wave 0 |
| DRT-10 | evidence, contradiction, and confidence metadata remain reviewable and grounded | unit/integration | `node --test test/phase-94/evidence-linking.test.js test/phase-94/suggestion-only-fallback.test.js` | ❌ Wave 0 |
| DRT-16 | preview envelope is portable across MCP, API, CLI, and editor clients | contract | `node --test test/phase-94/cross-surface-preview-envelope.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** run the smallest relevant phase-94 test slice
- **Per wave merge:** run `node --test test/phase-94/*.test.js test/agents/approval-gate.test.js test/vault-writer.test.js`
- **Phase gate:** `npm test` must be green before verification

### Wave 0 Gaps
- [ ] `test/phase-94/patch-preview-contract.test.js` — preview-safe envelope and diff mode coverage
- [ ] `test/phase-94/section-target-resolution.test.js` — stable section targeting and heading normalization coverage
- [ ] `test/phase-94/delta-engine.test.js` — narrow section replace/append behavior
- [ ] `test/phase-94/evidence-linking.test.js` — inline evidence and contradiction display coverage
- [ ] `test/phase-94/suggestion-only-fallback.test.js` — weak or conflicting evidence downgrade coverage
- [ ] `test/phase-94/approval-boundary.test.js` — proof that preview generation never invokes vault writes or approval bypass paths
- [ ] `test/phase-94/cross-surface-preview-envelope.test.js` — API/MCP/CLI/editor contract parity coverage

## Sources

### Primary (HIGH confidence)
- `.planning/phases/94-mir-and-msp-delta-patch-engine/94-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md`
- `.planning/research/v3.6.0-research-task-framework.md`
- `onboarding/backend/handlers.cjs`
- `onboarding/backend/vault/vault-writer.cjs`
- `onboarding/backend/write-mir.cjs`
- `onboarding/backend/vault/destination-map.cjs`
- `onboarding/backend/agents/approval-gate.cjs`
- `onboarding/backend/brand-strategy/contradiction-detector.cjs`
- `lib/markos/crm/execution.ts`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all recommendations reuse existing repo primitives and established runtime patterns
- Architecture: HIGH - the repo already separates preview/review from approval/write and uses deterministic destination mapping
- Threshold tuning: MEDIUM - exact numeric cutoffs for patch vs suggestion-only still need implementation-time calibration

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14
