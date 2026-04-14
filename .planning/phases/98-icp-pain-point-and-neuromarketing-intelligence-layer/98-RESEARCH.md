# Phase 98: ICP Pain-Point and Neuromarketing Intelligence Layer - Research

**Researched:** 2026-04-14  
**Domain:** ICP reasoning, governed neuromarketing fit selection, and explainable overlay routing  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Reasoning posture
- **D-01:** Phase 98 must be additive to the shipped Phase 96/97 foundation, not a replacement of the current literacy retrieval or template system.
- **D-02:** The reasoning layer should map ICP inputs into motivations, fears, trust drivers, objections, archetype tendencies, and likely trigger clusters using the existing governed literacy metadata.
- **D-03:** The core selection contract should return a **ranked shortlist plus a clear primary winner**, rather than a single opaque answer or an unstructured dump.
- **D-04:** Even when evidence is mixed, the system should still return a primary recommendation, but it must include an explicit **confidence flag** so low-certainty cases are visible rather than implied as certain.

### Governance and explainability
- **D-05:** The existing MarkOS neuromarketing reference remains the authoritative foundation for trigger logic; this phase should not invent ad hoc persuasion heuristics outside that governed model.
- **D-06:** Agent outputs must be explainable enough to state why the selected angle, trigger pattern, or persuasion approach fits the target ICP.
- **D-07:** The reasoning output should stay portable and deterministic enough to be reused later across MCP, API, CLI, editor, and internal automation surfaces.

### Scope guardrails
- **D-08:** Phase 98 focuses on ICP reasoning and explainable fit selection, not full agent instruction rewiring or premium-quality grading gates from later phases.
- **D-09:** The phase should build on the Phase 97 base-plus-overlay handoff and determine which overlay/strategy fit is most appropriate at runtime.

### Claude's Discretion
- Exact JSON/output schema for the ranked shortlist and confidence metadata
- Scoring weights and tie-break rules used to rank candidate angles
- How much rationale is returned in machine-readable fields versus human-readable summary text
- Which runtime seam owns the reasoning call first

### Deferred Ideas (OUT OF SCOPE)
- Broad agent/skill prompt rewiring remains deferred to Phase 99.
- Premium output grading, naturality audits, and final governance closeout remain deferred to Phase 99.1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NLI-05 | MarkOS can map ICPs to likely motivations, fears, trust drivers, objection patterns, and relevant neuromarketing trigger clusters. | Existing Phase 96 metadata and filter families already persist the needed tags; Phase 98 should add deterministic ranking and fit selection on top. |
| NLI-06 | Agent outputs can explain why a selected angle, trigger pattern, or persuasion approach fits the target ICP. | The new contract should include explicit rationale fields, matched signals, tie-break notes, and a confidence flag. |
| NLI-07 | The system uses the existing neuromarketing reference model as a governed foundation rather than ad hoc persuasion heuristics. | Use the governed B01-B10 catalog and archetype/funnel mappings from the existing reference as the only allowed trigger vocabulary. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Planning and implementation should stay aligned with the repo boot order and canonical planning state in `.planning/STATE.md`.
- Primary install/update path is `npx markos`.
- Standard verification commands are `npm test` or `node --test test/**/*.test.js`.
- Local onboarding runtime is the existing Node backend under `onboarding/backend/`.
- Research recommendations must remain additive to the current architecture and avoid contradicting existing repo governance and portability rules.

## Summary

Phase 98 should be implemented as a deterministic reasoning layer that sits **between** the shipped Phase 96 metadata substrate and the Phase 97 base-plus-overlay selection seam. The repo already stores normalized pain, trust, objection, emotion, trigger, archetype, and ICP-segment signals, and the approved-only retrieval stack already transports them safely. The missing capability is therefore **ranking and explanation**, not a new schema, new storage model, or prompt-only judge.

For NLI-05, NLI-06, and NLI-07, the best repo-native path is: normalize raw ICP inputs into the governed Phase 96 tag families, merge company + ICP + stage profiles, generate a finite set of overlay and trigger candidates from the Phase 97 registry, score them with fixed weights and stable tie-breaks, and emit a **ranked shortlist + clear winner + confidence flag**. This stays additive, explainable, and portable while remaining explicitly out of Phase 99 and Phase 99.1 scope.

**Primary recommendation:** Implement Phase 98 in three additive steps only: **98-01** contract helpers and governance guards, **98-02** a pure read-only ranking engine, and **98-03** seam wiring only in `example-resolver.cjs`, `company-knowledge-service.cjs`, and `retrieval-envelope.cjs`.

## Repo-Native Implementation Path

### Requirement-to-seam map

| Requirement | Use existing repo surface | Add in Phase 98 | Do not pull in |
|-------------|---------------------------|-----------------|----------------|
| NLI-05 | `neuro-literacy-taxonomy.cjs`, `neuro-literacy-schema.cjs`, `mergeTailoringProfiles()`, vector metadata | deterministic ICP signal normalizer, candidate builder, fit scorer | new storage model or prompt-only classifier |
| NLI-06 | existing retrieval envelope and overlay resolver contracts | portable recommendation object with matched signals, shortlist ranking, winner, rationale, and confidence | broad agent/skill rewiring from Phase 99 |
| NLI-07 | `MARKOS-REF-NEU-01`, `NEURO-BRIEF.md`, governed B01-B10 vocabulary | fail-closed validation that blocks unsupported triggers and archetypes | ad hoc persuasion heuristics or ungoverned free-text triggers |

### Prescriptive implementation order

1. **Lock the contract first.**  
   Add pure helpers under `onboarding/backend/research/` for ICP signal normalization, confidence policy, and shortlist-plus-winner contract validation. This is the correct first step because it makes the downstream seam deterministic before any live wiring begins.

2. **Build the engine second.**  
   Implement candidate generation and weighted fit scoring as pure, read-only CommonJS modules that consume the existing Phase 96 and Phase 97 substrate. The engine should rank explicit candidates rather than asking a model to improvise a winner.

3. **Integrate only at the safe seam.**  
   Wire the rank-1 winner into resolver and retrieval packaging only:
   - `example-resolver.cjs` should optionally prefer `winner.overlay_key`
   - `company-knowledge-service.cjs` should optionally attach `winner.retrieval_filters`, confidence, and concise rationale
   - `retrieval-envelope.cjs` should continue enforcing `tenant_scope` and `provenance_required: true`

### First safe integration seam

The **first safe seam** lives at the existing resolver and retrieval boundary, not in prompt packs, skill instructions, or evaluation logic. The winner contract should influence **which overlay and retrieval filters are chosen**, while the rest of the generation stack remains unchanged until Phase 99.
## Standard Stack

### Core

| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js + `node:test` | Local environment verified: `v22.13.0`; repo requires `>=20.16.0` | Runtime and deterministic test harness | This is already the repo-wide standard for backend logic and phase verification. |
| `onboarding/backend/research/neuro-literacy-taxonomy.cjs` | Repo-native | Canonical tag normalization for outcome, objection, trust, emotion, trigger, archetype, naturality, and ICP segment signals | Already shipped and tested in Phase 96; do not duplicate it. |
| `onboarding/backend/research/neuro-literacy-schema.cjs` | Repo-native | Applies governed defaults, trigger allow-list, and ethics flags | Already enforces `evidence_required` and `manipulation_blocked`. |
| `onboarding/backend/research/neuro-literacy-overlay.cjs` | Repo-native | Deterministic merge of company, ICP, and stage tailoring profiles | Already gives the correct composable overlay pattern for this phase. |
| `onboarding/backend/research/template-family-map.cjs` + `onboarding/backend/agents/example-resolver.cjs` | Repo-native | Existing base-plus-overlay runtime selection seam | This is the safest first integration point without Phase 99 leakage. |
| `onboarding/backend/pageindex/retrieval-envelope.cjs` + `onboarding/backend/research/company-knowledge-service.cjs` | Repo-native | Portable, approved-only retrieval contract with tenant scoping and provenance | Reuse this contract for the reasoning layer’s filter output. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | Repo pin `^2.58.0`; registry latest observed `2.103.0` on 2026-04-09 | Canonical relational storage for `markos_literacy_chunks` | Use the existing repo pin; no Phase 98 package change is required. |
| `@upstash/vector` | Repo pin `^1.2.3`; registry latest observed `1.2.3` on 2026-04-14 | Vector metadata storage / retrieval fallback | Already integrated; Phase 98 should consume it, not replace it. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Repo-native deterministic ranking | Prompt-only LLM selection | Faster to prototype, but opaque, unstable, and scope-leaks into Phase 99. |
| Governed B01-B10 vocabulary | Free-text “persuasion heuristics” | Violates NLI-07 and weakens governance. |
| Existing overlay resolver seam | Broad agent prompt rewiring | Bigger blast radius and wrong phase boundary. |

**Installation:**
```bash
npm install
```

**Version verification:** No new dependency is recommended for this phase. Existing repo storage dependencies were spot-checked on 2026-04-14 and the current local runtime already satisfies the repo engine requirement.

## Existing Metadata and Storage Findings

The repo already stores or transports the required signal families in stable, reusable form:

| Signal Family | Current Storage / Transport Surface | Evidence |
|--------------|------------------------------------|----------|
| Pain points | `pain_point_tags` in chunk metadata and retrieval filters | `literacy-chunker.cjs`, `vector-store-client.cjs`, `retrieval-envelope.cjs` |
| Desired outcomes | `desired_outcome_tags` | Phase 96 taxonomy/schema and vector round-trip tests |
| Objections | `objection_tags` | Phase 96 taxonomy/schema and vector store upsert payloads |
| Trust drivers / blockers | `trust_driver_tags`, `trust_blocker_tags` | Existing normalized metadata and retrieval envelope |
| Emotional states | `emotional_state_tags` | Existing normalized metadata and retrieval envelope |
| Neuromarketing triggers | `neuro_trigger_tags` plus `neuro_profile.trigger_tags` | Governed B01-B10 allow-list in schema and tests |
| Archetypes | `archetype_tags` | Existing normalized taxonomy and retrieval filters |
| ICP segmentation | `icp_segment_tags` + `icp_tailoring_profile` | Existing retrieval envelope and literacy metadata |
| Overlay composition | `company_tailoring_profile`, `icp_tailoring_profile`, `stage_tailoring_profile` | Existing merge utility and deterministic tests |

**Implication:** Phase 98 should **not** add a second storage model. The data substrate already exists; the missing artifact is a reasoning/ranking contract.

## Architecture Patterns

### Recommended Project Structure

```text
onboarding/
└── backend/
    ├── research/
    │   ├── icp-signal-normalizer.cjs       # raw ICP -> governed Phase 96 tags
    │   ├── icp-confidence-policy.cjs       # thresholds and tie-breaks
    │   ├── icp-recommendation-contract.cjs # shortlist + winner contract validator
    │   ├── icp-candidate-builder.cjs       # finite overlay/trigger/archetype candidates
    │   ├── icp-fit-scorer.cjs              # weighted, explainable scoring
    │   └── icp-reasoning-engine.cjs        # pure orchestration surface
    ├── agents/
    │   └── example-resolver.cjs            # first winner-consumption seam
    └── pageindex/
        └── retrieval-envelope.cjs          # preserves tenant/provenance guardrails
```

This keeps the phase additive, repo-native, and isolated from later prompt rewiring.

### Pattern 1: Normalize to governed signals first
**What:** Convert raw ICP input into the exact tag families already defined by the repo (`pain_point_tags`, `trust_driver_tags`, `objection_tags`, `neuro_trigger_tags`, `archetype_tags`, etc.).

**When to use:** At the very start of the reasoning call, before ranking any overlay, angle, or persuasion strategy.

**Why:** This guarantees NLI-07 compliance and lets the result plug into the existing retrieval envelope with no new contract family.

### Pattern 2: Merge company + ICP + stage profiles before scoring
**What:** Use the existing layered merge posture from Phase 96 so the same company baseline can still produce different decisions per ICP and funnel stage.

**When to use:** After normalization and before candidate generation.

**Why:** The repo already established a deterministic precedence order of `company -> icp -> stage`; the reasoning layer should inherit that instead of inventing new merge logic.

### Pattern 3: Score explicit candidates, not free-form answers
**What:** Generate a finite candidate set of overlay/trigger/archetype combinations, then rank them with fixed weights and stable tie-breaks.

**When to use:** At the selection step that chooses the best fit for downstream content strategy or overlay routing.

**Recommended scoring rubric:**
- Pain / desired-outcome fit: `0.30`
- Trust-driver / trust-blocker fit: `0.20`
- Objection-fit and objection-handling readiness: `0.15`
- Funnel-stage fit: `0.15`
- Trigger + archetype fit from governed reference: `0.15`
- Naturality / ethics / brand-safety fit: `0.05`

**Tie-break order:**
1. Higher governance-eligible score
2. Higher pain-fit subscore
3. Fewer unresolved trust blockers
4. Stable lexical sort on `candidate_id`

### Pattern 4: Integrate first at the runtime selection seam
**What:** Feed the Phase 98 winner into the existing base-plus-overlay path and retrieval filters.

**First integration point:**
1. `example-resolver.cjs` / `resolveTemplateSelection()` for overlay choice and fallback behavior
2. `company-knowledge-service.cjs` / `getLiteracyContext()` for ranked retrieval filters and explainable citations

**Not yet:** agent prompt rewiring, cross-surface behavior training, or final evaluation closeout. Those are Phase 99 / 99.1 scope.

### Recommended First-Handoff Flow

```text
ICP input
  -> normalize to existing tags
  -> merge company / ICP / stage profiles
  -> generate candidate overlay + trigger fits
  -> deterministic ranking
  -> output shortlist + winner + confidence
  -> pass winner.overlay_key to template resolver
  -> pass winner.retrieval_filters to approved knowledge retrieval
```

### Anti-Patterns to Avoid
- **Prompt-only picker:** opaque, non-deterministic, and off-scope for this phase.
- **Second neuro taxonomy:** duplicates governed authority and guarantees drift.
- **No clear winner:** violates the locked phase contract.
- **Winner without confidence flag:** hides uncertainty and weakens operator trust.
- **Long-form chain-of-thought leakage:** return concise rationale fields, not prompt internals.

## Recommended Output Contract

Phase 98 should return one portable JSON object that works across MCP, API, CLI, editor, and internal automation surfaces.

```json
{
  "version": "1.0",
  "authority_token": "MARKOS-REF-NEU-01",
  "contract_type": "icp_reasoning_recommendation",
  "input_fingerprint": "sha256:...",
  "confidence_flag": "high|medium|low",
  "candidate_shortlist": [
    {
      "candidate_id": "overlay:saas|trigger:B04|archetype:sage",
      "rank": 1,
      "score": 0.81,
      "confidence": "high",
      "overlay_key": "saas",
      "primary_trigger": "B04",
      "secondary_triggers": ["B03"],
      "archetype": "sage",
      "matched_signals": {
        "pain_point_tags": ["high_cac"],
        "trust_driver_tags": ["proof", "authority"],
        "objection_tags": ["too_expensive"]
      },
      "retrieval_filters": {
        "pain_point_tags": ["high_cac"],
        "trust_driver_tags": ["proof", "authority"],
        "neuro_trigger_tags": ["B04", "B03"],
        "archetype_tags": ["sage"],
        "tenant_scope": "tenant-123"
      },
      "why_it_fits": [
        "ICP is risk-sensitive and authority-responsive",
        "current objections favor proof-led framing",
        "consideration-stage mapping aligns with B03/B04"
      ],
      "warnings": []
    }
  ],
  "winner": {
    "candidate_id": "overlay:saas|trigger:B04|archetype:sage",
    "rank": 1,
    "score": 0.81,
    "confidence": "high"
  },
  "explanation": {
    "summary": "Authority-led SaaS overlay wins because this ICP is skepticism-heavy and proof-sensitive.",
    "runner_up_reason": "The pain-relief angle scored well but underperformed on trust-fit.",
    "uncertainty": []
  },
  "governance": {
    "provenance_required": true,
    "authority_class": "approved_internal",
    "evidence_required": true,
    "manipulation_blocked": true
  }
}
```

### Confidence Policy
- **High:** top score `>= 0.75` and lead over second place `>= 0.15`
- **Medium:** top score `>= 0.60` and lead `0.05–0.14`
- **Low:** anything lower, but still emit a winner plus explicit uncertainty

This satisfies the locked requirement for a ranked shortlist, clear winner, and visible confidence state.

## Security, Governance, and Non-Regression Constraints

### Required controls
- Keep the reasoning output **read-only and advisory**. No mutation side effects are needed in this phase.
- Preserve `provenance_required: true` and `tenant_scope` in any retrieval envelope produced by the new logic.
- Only use the governed B01-B10 codes and the existing archetype/funnel mapping from the neuromarketing reference.
- Preserve `evidence_required` and `manipulation_blocked` in the normalized neuro profile.
- Continue returning `approved_internal` authority for any retrieved support evidence.

### Non-regression baselines
Phase 98 must not break:
- Phase 96 schema/tag normalization and vector metadata round-trip behavior
- The existing preview-safe and provenance-required retrieval envelope contracts
- Phase 97 base-plus-overlay template selection path and business-model fallback behavior
- v3.6.0 deep research tailoring guarantees around evidence, portability, and operator-visible rationale

### Primary risks
| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Free-text persuasion drift | Breaks NLI-07 and weakens governance | Allow only governed trigger IDs and repo-native taxonomy values |
| Black-box ranking | Violates explainability and portability goals | Return explicit matched signals, rationale arrays, and tie-break notes |
| Scope leakage into prompt rewiring | Pulls Phase 99 work forward and increases blast radius | Integrate at resolver/retrieval seam first |
| Over-narrow filter envelopes | Can accidentally reduce retrieval usefulness | Always keep shortlist fallback and shared-base overlay fallback |
| Manipulative recommendations | Breaks ethical posture | Enforce existing `evidence_required` / `manipulation_blocked` defaults |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Neuro trigger vocabulary | A new free-text persuasion system | `.agent/markos/references/neuromarketing.md` | The authority is already defined and governed. |
| ICP tag normalization | Duplicate regex or custom mapping in multiple files | `normalizeNeuroAwareTaxonomy()` and `normalizeNeuroLiteracyMetadata()` | Existing code already normalizes and filters to supported values. |
| Tailoring profile composition | Another bespoke deep merge | `mergeTailoringProfiles()` | Existing layer ordering is deterministic and tested. |
| Selection seam | Prompt-embedded business-model branching | `template-family-map.cjs` + `example-resolver.cjs` | These are already the runtime overlay path. |
| Retrieval contract | A new query payload or direct ad hoc DB lookup | `normalizeRetrievalEnvelope()` + `company-knowledge-service.cjs` | These already preserve tenant scope, provenance, and portability. |
| Cross-surface alignment | Early prompt rewiring or grading logic | Leave it for Phase 99 / 99.1 | Those concerns are explicitly out of Phase 98 scope. |

**Key insight:** The repo already solved the hard substrate problem. Phase 98 should solve the **ranking and explanation** problem only.

## Common Pitfalls

### Pitfall 1: Treating the phase like a schema project
**What goes wrong:** More fields get added even though the repo already stores the necessary signals.
**Why it happens:** The missing capability feels like “missing metadata,” but the actual gap is decision logic.
**How to avoid:** Reuse existing tag families and focus the plan on a new reasoning contract plus targeted seam integration.
**Warning signs:** New migration ideas, new tables, or new metadata families show up in the plan.

### Pitfall 2: Letting the LLM decide the winner opaquely
**What goes wrong:** Different runs give different winners, with no stable rationale and no portable contract.
**Why it happens:** Prompt-only judgment seems easier than explicit scoring.
**How to avoid:** Use fixed candidate generation, fixed weights, and deterministic tie-break rules.
**Warning signs:** The same input produces a different top choice without a corresponding score delta.

### Pitfall 3: Pulling Phase 99 forward
**What goes wrong:** Work expands into prompt rewiring, agent instruction changes, and wide cross-surface generation updates.
**Why it happens:** The reasoning layer is adjacent to generation behavior.
**How to avoid:** Keep the first integration at template selection and retrieval-filter packaging only.
**Warning signs:** Changes touch orchestrator prompts, skill instructions, or evaluation rubrics.

### Pitfall 4: Returning uncertainty as silence
**What goes wrong:** The API returns a shortlist but avoids naming a primary choice.
**Why it happens:** Fear of being “wrong” leads to indecisive output.
**How to avoid:** Always emit a winner plus `confidence_flag` and uncertainty notes.
**Warning signs:** `winner` is null or optional.

### Pitfall 5: Governance flags become decorative
**What goes wrong:** `evidence_required` and `manipulation_blocked` remain present in metadata but are ignored by the new reasoning layer.
**Why it happens:** The planner focuses on commercial utility and forgets ethical constraints.
**How to avoid:** Fail closed when a candidate would require unsupported or manipulative framing.
**Warning signs:** Free-form triggers or unsupported heuristics appear in the shortlist.

## Code Examples

Verified patterns from the current repo:

### Existing deterministic profile merge pattern
```javascript
const merged = mergeTailoringProfiles({
  company,
  icp,
  stage,
});

// merged.layer_order === ['company', 'icp', 'stage']
```
Source: `onboarding/backend/research/neuro-literacy-overlay.cjs` and the existing Phase 96 merge test.

### Existing portable retrieval-envelope pattern
```javascript
const envelope = normalizeRetrievalEnvelope({
  mode: 'reason',
  discipline: 'Paid Media',
  audience: 'ICP:revops_leader',
  filters: {
    pain_point_tags: ['high_cac'],
    neuro_trigger_tags: ['B01'],
    icp_segment_tags: ['revops_leader'],
    tenant_scope: 'tenant-123',
  },
  provenance_required: true,
});
```
Source: `onboarding/backend/pageindex/retrieval-envelope.cjs` and the existing Phase 96 filter-extension tests.

### Existing vector metadata round-trip pattern
```javascript
await vectorStore.upsertLiteracyChunk({
  chunk_id: 'ENRICHED::001',
  discipline: 'Paid Media',
  chunk_text: 'Neuro-aware chunk body',
  desired_outcome_tags: ['more_pipeline'],
  neuro_trigger_tags: ['B01'],
  icp_segment_tags: ['revops_leader'],
  company_tailoring_profile: { proof_posture: 'evidence_first' },
});
```
Source: `onboarding/backend/vector-store-client.cjs` and the Phase 96 round-trip test.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Business-model-only or channel-only routing | Multi-signal routing with additive pain and neuro metadata | Phase 96 groundwork, 2026-04-14 | Enables ICP-sensitive selection without a rewrite |
| Prompt-implied persuasion choice | Governed B01-B10 trigger catalog with archetype/stage mappings | Existing neuromarketing reference | Makes reasoning auditable and explainable |
| One-answer black box | Ranked shortlist + clear winner + confidence | Recommended for Phase 98 | Portable across surfaces and safer for later agent alignment |

**Deprecated / outdated for this repo context:**
- Ad hoc persuasion heuristics outside the governed neuro reference
- Prompt-only hidden ranking for ICP fit
- New standalone storage models for the same metadata families

## Open Questions

1. **Exact scoring weights**
   - What we know: Fixed weights are needed for determinism.
   - What's unclear: The final numeric balance between pain fit and trust fit may need tuning after first implementation.
   - Recommendation: Start with the rubric in this research and tune only with explicit tests.

2. **How verbose the explanation should be**
   - What we know: The result must be explainable and portable.
   - What's unclear: How much text later surfaces want.
   - Recommendation: Keep one short summary string plus machine-readable rationale arrays.

3. **How many candidates belong in the shortlist**
   - What we know: A ranked shortlist is required, not a single answer.
   - What's unclear: Whether 3 or 5 candidates is the sweet spot.
   - Recommendation: Default to top 3 to keep review light and deterministic.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend research modules and test runner | ✓ | `v22.13.0` | Repo requires `>=20.16.0`; no issue detected |
| npm | Package and verification scripts | ✓ | `10.9.2` | — |
| Git | Planning workflow and diff review | ✓ | `2.53.0.windows.2` | — |
| Supabase / Upstash live credentials | Optional live retrieval validation | Partial / not probed in research | — | Existing mocked unit tests already cover the core logic |

**Missing dependencies with no fallback:**
- None identified for research/planning.

**Missing dependencies with fallback:**
- Live data-plane credentials are not required for Wave 0 because the existing repo test strategy already uses mocked round-trip checks.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` |
| Config file | none — repo uses direct CLI commands |
| Quick run command | `node --test test/phase-98/*.test.js` |
| Full suite command | `npm test` |

### Fresh verification evidence from the repo
- Existing Phase 96 neuro-aware baseline verified on 2026-04-14: **9/9 passing** via `node --test test/phase-96/*.test.js`
- Existing template and routing seam baseline verified on 2026-04-14: **12/12 passing** via `node --test test/example-resolver.test.js test/discipline-router.test.js`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NLI-05 | ICP inputs map to ranked motivations/fears/trust/objection/trigger candidates deterministically | unit | `node --test test/phase-98/icp-reasoning-ranking.test.js -x` | ❌ Wave 0 |
| NLI-06 | Result includes explainable rationale, shortlist, clear winner, and confidence flag | unit / contract | `node --test test/phase-98/icp-recommendation-contract.test.js -x` | ❌ Wave 0 |
| NLI-07 | Only governed neuromarketing reference signals are allowed; ad hoc heuristics are blocked | unit / governance | `node --test test/phase-98/icp-governance-guardrails.test.js -x` | ❌ Wave 0 |
| Non-regression | Existing Phase 96/97 seams still behave the same for unaffected cases | regression | `node --test test/phase-96/*.test.js test/example-resolver.test.js test/discipline-router.test.js` | ✅ existing |
| Portability | Same input yields same JSON contract across MCP/API/CLI-adjacent usage | contract | `node --test test/phase-98/icp-portable-contract.test.js -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --test test/phase-98/*.test.js`
- **Per wave merge:** `node --test test/phase-98/*.test.js test/phase-96/*.test.js test/example-resolver.test.js test/discipline-router.test.js`
- **Phase gate:** `npm test`

### Wave 0 Gaps
- [ ] `test/phase-98/icp-reasoning-ranking.test.js` — covers deterministic ranking and tie-breaks for NLI-05
- [ ] `test/phase-98/icp-recommendation-contract.test.js` — covers shortlist/winner/confidence/rationale packaging for NLI-06
- [ ] `test/phase-98/icp-governance-guardrails.test.js` — covers B01-B10 only, `evidence_required`, and `manipulation_blocked` for NLI-07
- [ ] `test/phase-98/icp-portable-contract.test.js` — covers stable JSON output and input fingerprint portability

## Sources

### Primary (HIGH confidence)
- `.planning/phases/98-icp-pain-point-and-neuromarketing-intelligence-layer/98-CONTEXT.md` — locked decisions and scope guardrails
- `.planning/REQUIREMENTS.md` — NLI-05, NLI-06, NLI-07 and non-regression milestone constraints
- `.planning/ROADMAP.md` and `.planning/STATE.md` — phase order and dependency boundaries
- `.planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-CONTEXT.md` — established additive schema and deterministic overlay posture
- `.planning/phases/97-universal-template-and-business-model-coverage-upgrade/97-CONTEXT.md` — base-plus-overlay handoff that Phase 98 should drive
- `.agent/markos/references/neuromarketing.md` and `.agent/markos/templates/NEURO-BRIEF.md` — governed authority for triggers, archetypes, and funnel-stage mappings
- `onboarding/backend/research/neuro-literacy-taxonomy.cjs` — canonical signal families and normalization
- `onboarding/backend/research/neuro-literacy-schema.cjs` — ethics defaults and governed trigger allow-list
- `onboarding/backend/research/neuro-literacy-overlay.cjs` — deterministic company/ICP/stage composition
- `onboarding/backend/vector-store-client.cjs` — current storage, retrieval, and metadata round-trip path
- `onboarding/backend/research/company-knowledge-service.cjs` — approved-only retrieval packaging and filter handoff
- `onboarding/backend/pageindex/retrieval-envelope.cjs` — portable provenance-required retrieval contract
- `onboarding/backend/agents/example-resolver.cjs` and `onboarding/backend/agents/skeleton-generator.cjs` — first integration seam for overlay routing
- Verified command output on 2026-04-14:
  - `node --test test/phase-96/*.test.js` → 9 pass, 0 fail
  - `node --test test/example-resolver.test.js test/discipline-router.test.js` → 12 pass, 0 fail
  - `node --version`, `npm --version`, `git --version` → environment available

### Secondary (MEDIUM confidence)
- `package.json` — repo-pinned runtime and dependency expectations
- `.planning/research/v3.6.0-deep-research-tailoring-brief.md` — deep-research portability and evidence posture

### Tertiary (LOW confidence)
- None required. The repo and its verified tests were sufficient for this research pass.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — grounded in existing repo modules, local environment checks, and verified tests
- Architecture: **HIGH** — integration points and constraints are explicit in current source files and context docs
- Pitfalls: **HIGH** — directly supported by existing governance flags, reference authority, and non-regression requirements

**Research date:** 2026-04-14  
**Valid until:** 2026-05-14 unless the neuromarketing reference or retrieval contract changes first


