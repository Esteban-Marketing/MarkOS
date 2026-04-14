# Phase 97: Universal Template and Business-Model Coverage Upgrade - Research

**Researched:** 2026-04-14  
**Domain:** MarkOS universal template library, reusable literacy assets, and business-model coverage  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Template posture
- **D-01:** Templates must be universal enough to cover B2B, B2C, SaaS, agencies, services, consulting, info products, and ecommerce patterns without becoming generic.
- **D-02:** Template structures must consume the new Phase 96 metadata so company context, ICP signals, and stage nuance can shape the resulting guidance.
- **D-03:** Every template family should encode funnel stage, buying maturity, tone guidance, proof posture, and naturality expectations.

### Scope and guardrails
- **D-04:** Phase 97 is an additive template-library expansion, not a rewrite of the literacy retrieval system.
- **D-05:** Full ICP reasoning logic belongs to Phase 98, and agent/skill training alignment belongs to Phase 99.
- **D-06:** Templates must remain brand-safe, evidence-aware, and portable across MCP, API, CLI, editor, and internal automation surfaces.

### the agent's Discretion
- Exact template family names and grouping model
- Folder and metadata conventions for new universal template assets
- Which business-model scenarios deserve first-class examples vs shared base patterns
- Validation rules for tone and naturality guidance

### Deferred Ideas (OUT OF SCOPE)
- Full ICP reasoning automation is deferred to Phase 98.
- Agent and skill rewiring is deferred to Phase 99.
- Final quality-governance closeout is deferred to Phase 99.1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NLI-03 | MarkOS ships universal but tailorable literacy templates covering B2B, B2C, SaaS, agencies, services, consulting, info products, and ecommerce patterns. | The repo already has model-aware skeletons, MIR/MSP example injection, and a literacy corpus; Phase 97 should unify and extend them into a governed template library with explicit coverage mapping and deterministic fallback. |
| NLI-04 | Literacy templates capture funnel stage, buying maturity, messaging naturality expectations, and brand-safe tone guidance. | Phase 96 already added funnel, trust, objection, emotional-state, neuro-trigger, archetype, and naturality metadata support; Phase 97 should author reusable templates that actually populate and expose those fields. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Keep the change additive to the current MarkOS architecture and GSD planning flow.
- Use the existing Node/CommonJS onboarding backend and file-based template conventions.
- Preserve the verified test posture: `npm test` and targeted `node --test ...` runs.
- Do not propose a platform rewrite, a new retrieval engine, or a separate template runtime.

## Summary

Phase 97 should be planned as a **template-library expansion on top of already-shipped assets**, not as a new generation system. The repo already contains three strong building blocks: business-model-aware starter skeletons from Phase 41, a pain-point-first literacy corpus and chunking pipeline from v3.5.0, and the richer Phase 96 neuro-aware metadata path that now carries objections, trust cues, emotional state, naturality, archetypes, and stage-aware profiles.

What is still missing is a **single repo-native universal template library** that ties those pieces together. Right now the content is split across starter skeletons, MIR/MSP structural templates, and literacy docs. Coverage exists, but it is not yet expressed as one deterministic library that explicitly answers: "for this business model, stage, trust posture, and buying maturity, which reusable template family should MarkOS use?"

**Primary recommendation:** implement Phase 97 as a **metadata-authored template family library inside the existing literacy system**, with a small business-model family registry and deterministic fallback rules. Reuse the current markdown/frontmatter, chunker, ingest, and retrieval flow; do not build a second templating engine.

## Phase objective recap

Build a richer universal template library that works across business models and industries while staying highly tailorable in practice. For Phase 97 specifically, that means turning the repo's existing starter skeletons and literacy assets into a more complete, governed library that can represent:

- business-model differences
- funnel-stage nuance
- buying-maturity shifts
- tone and naturality guidance
- trust and proof posture
- brand-safe persuasion constraints

This phase is **not** the place to implement full ICP reasoning automation or the final prompt/agent rewiring. It should instead prepare clean, reusable assets that Phases 98 and 99 can consume.

## Existing reusable assets and gaps

### Verified reusable assets already in the repo

| Asset | What exists now | Why it matters for Phase 97 |
|------|------------------|-----------------------------|
| Phase 41 starter skeletons | `.agent/markos/templates/SKELETONS/` already contains 35 business-model starter skeletons across 5 disciplines and 7 canonical model slugs. | This is the current seed of the universal template layer. It proves MarkOS already uses model-aware scaffolds. |
| Example resolver | `onboarding/backend/agents/example-resolver.cjs` resolves example and skeleton files for `B2B`, `B2C`, `B2B2C`, `DTC`, `Marketplace`, `SaaS`, and `Agents-aaS`. | Phase 97 should extend this deterministic selection pattern instead of replacing it. |
| Skeleton generation flow | `onboarding/backend/agents/skeleton-generator.cjs` writes tailored skeleton outputs into `.markos-local/MSP/.../SKELETONS/` after approval. | This is the production-safe output surface; the new library should feed it, not bypass it. |
| MIR/MSP structural content templates | Files like `AD-COPY.md`, `EMAIL.md`, `LANDING-PAGE.md`, and `_CAMPAIGN-TEMPLATE.md` already define reusable structural patterns for content and campaign execution. | These are reusable content-shape assets, but they are still mostly static and not yet tied tightly to Phase 96 metadata. |
| Literacy corpus | `.agent/markos/literacy/` contains canonical pain-point-first docs across Paid Media, Content SEO, Lifecycle Email, Social, and Landing Pages. | These give Phase 97 a natural authoring home for reusable template knowledge. |
| Chunking + ingest pipeline | `onboarding/backend/literacy-chunker.cjs` and `bin/ingest-literacy.cjs` already convert markdown docs into reusable retrieval chunks. | Phase 97 can publish template-family docs as frontmatter-authored literacy assets with minimal new plumbing. |
| Phase 96 schema support | `literacy-chunker.cjs` and `vector-store-client.cjs` already support `desired_outcome_tags`, `objection_tags`, `trust_driver_tags`, `trust_blocker_tags`, `emotional_state_tags`, `neuro_trigger_tags`, `archetype_tags`, `naturality_tags`, `icp_segment_tags`, and profile blocks. | The schema substrate is already there; Phase 97 mainly needs authored content and deterministic library organization. |
| Neuromarketing authority | `.agent/markos/references/neuromarketing.md` provides the governed B01-B10 trigger catalog, archetypes, and funnel mappings. | This is the only approved neuro vocabulary; template guidance must reuse it. |

### Concrete repo-grounded gaps

| Gap | Evidence from repo | Planning implication |
|-----|--------------------|----------------------|
| No single universal template registry | Current assets are split across starter skeletons, MIR/MSP content stubs, and literacy docs. | Phase 97 should add one library shape and coverage map. |
| Model coverage is useful but still uneven | The existing 7 canonical slugs do not directly expose all of the Phase 97 language: agencies, services, consulting, info products, ecommerce. | Add a normalized business-model family map and aliases rather than forcing a broad rewrite. |
| Stage and maturity nuance is not yet first-class in authored template assets | Phase 96 metadata fields exist, but the sampled literacy corpus still mostly reflects broad pain-point docs and universal business-model values like `all`. | Phase 97 should author templates that explicitly encode stage, proof posture, and naturality. |
| Current fallback can degrade to empty output | `resolveSkeleton` and `resolveExample` return an empty string on unknown models or missing files. | Phase 97 should introduce deterministic family fallback before empty-string degradation. |
| Existing skeletons are starter stubs, not a full premium library | The current skeletons are strong onboarding scaffolds, but they are not yet a universal “library” of reusable patterns across proof, objection, tone, and buying maturity. | The phase should upgrade from starter skeleton coverage to governed template-family coverage. |

## Recommended template-library implementation shape for Phase 97 only

## Standard Stack

### Core
| Library / Surface | Use | Why standard for this repo |
|-------------------|-----|----------------------------|
| Markdown template assets with frontmatter | Author universal template families | This is already how MarkOS stores reusable literacy and template content. |
| `onboarding/backend/literacy-chunker.cjs` | Chunk authored template docs into retrieval-ready units | Already production-wired and Phase 96-aware. |
| `bin/ingest-literacy.cjs` | Ingest new template docs into the existing literacy pipeline | Avoids creating a separate publishing path. |
| `onboarding/backend/vector-store-client.cjs` | Preserve filterable retrieval and metadata round-trip | Already supports the fields Phase 97 needs. |

### Supporting
| Surface | Purpose | When to use |
|---------|---------|-------------|
| `example-resolver.cjs` | Deterministic model-aware fallback and slug normalization | Keep for starter skeletons and simple file resolution |
| `skeleton-generator.cjs` | Write operator-facing starter outputs into `.markos-local/` | Keep as the output surface after approval |
| `.agent/markos/references/neuromarketing.md` | Authority for trigger tags and ethics posture | Use for any neuro-aware template annotation |

### Don't Hand-Roll
| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Universal template storage | A second DB or custom DSL | Markdown + frontmatter in the existing literacy corpus | The repo already ingests and chunks this format. |
| Business-model selection | A brand-new agentic selection engine | Deterministic alias mapping + fallback order | Phase 98 is where reasoning belongs. |
| Template metadata persistence | A separate schema or sidecar store | Current Phase 96 metadata fields in the literacy pipeline | Avoids data drift and regression risk. |
| Prompt personalization | Hidden prompt-only logic | Explicit template metadata and authored overlays | Keeps behavior inspectable and portable. |

## Recommended Project Structure

Use the existing literacy corpus as the primary home for new universal template assets, while keeping starter skeletons as the operator-facing output surface.

```text
.agent/markos/literacy/
  Paid_Media/
    LIT-PM-...                 # existing standards corpus
    TPL-PM-awareness-....md    # new universal template family docs
    TPL-PM-proof-....md
  Content_SEO/
  Lifecycle_Email/
  Social/
  Landing_Pages/
  Shared/
    TPL-SHARED-business-model-map.md
    TPL-SHARED-tone-and-naturality.md
    TPL-SHARED-proof-posture.md

onboarding/backend/research/
  template-family-map.cjs      # alias normalization + fallback order
  template-library-contract.cjs # optional lightweight validation helper
```

This keeps Phase 97 aligned with the current repo instead of inventing a new subsystem.

## Recommended library model

The best fit for this repo is a **base-family + overlay** model:

### 1. Template families
Create reusable families that represent the important differences MarkOS actually needs to express:

- problem framing
- proof and trust posture
- objection handling
- offer and CTA framing
- stage-specific messaging mode
- naturality and tone guardrails

### 2. Business-model families
Normalize current and required scenarios into a clear coverage map:

| Required Phase 97 scenario | Repo-aligned family recommendation |
|----------------------------|------------------------------------|
| B2B | direct family |
| B2C | direct family |
| SaaS | direct family |
| agencies | alias to `agency` family; bridge existing `Agents-aaS` slug |
| services | `services` family |
| consulting | `consulting` overlay or subtype of services |
| info products | `info-products` family |
| ecommerce | alias/family covering existing `DTC` and `Marketplace` models |

### 3. Metadata contract for each template asset
Every new template-family doc should populate the fields that Phase 96 made available:

- `business_model`
- `funnel_stage`
- `buying_maturity`
- `desired_outcome_tags`
- `objection_tags`
- `trust_driver_tags`
- `trust_blocker_tags`
- `naturality_tags`
- `icp_segment_tags`
- `neuro_trigger_tags` using only the approved B01-B10 catalog
- `company_tailoring_profile`
- `icp_tailoring_profile`
- `stage_tailoring_profile`
- `neuro_profile`

### 4. Deterministic fallback order
Phase 97 should stay deterministic and lightweight:

1. exact discipline + business-model family + funnel stage match  
2. discipline + business-model family match  
3. discipline + stage-aware universal template  
4. existing starter skeleton / MIR structure template  
5. only then generic fallback

That gives MarkOS broader coverage without needing the full ICP reasoning engine yet.

## Risks, guardrails, and non-regression

### Key risks

| Risk | Why it matters | Guardrail |
|------|----------------|-----------|
| Template sprawl | A file per every micro-combination will explode maintenance cost. | Use base families plus overlays, not bespoke one-offs. |
| Generic output regression | “Universal” can become vague and bland. | Require proof posture, naturality rules, and objection/tone guidance in every family. |
| Taxonomy drift | Business model names can fragment across old and new systems. | Add a single alias map and keep old slugs working. |
| Hidden silent fallback | Unknown model values currently degrade quietly to empty strings. | Add coverage audits and family fallback tests. |
| Scope leakage into Phase 98/99 | It is easy to overreach into reasoning or prompt rewiring. | Keep Phase 97 focused on authored assets, registry logic, and verification only. |
| Neuro misuse | Neuromarketing fields can become manipulative if left loose. | Reuse only the approved B01-B10 reference and keep evidence-aware, non-manipulative posture. |

### Non-regression baselines that must remain intact

- v3.6.0 deep-research tailoring and provenance posture
- preview-safe, read-only governance behavior
- existing model-aware example and skeleton resolution
- current approval-triggered `.markos-local/` skeleton generation flow
- current literacy ingestion, chunking, and retrieval pipeline

### Fresh verification evidence

I verified the active baseline during this research pass:

- `node --test test/skeleton-generator.test.js test/example-resolver.test.js`
- Result: **16 passing, 0 failing**

That confirms the current resolver and starter-skeleton system is stable enough to serve as the base for Phase 97 planning.

## Proposed task breakdown for planning

### 97-01 — Coverage matrix and asset inventory
- Inventory current skeleton, MIR/MSP, and literacy assets.
- Define the canonical Phase 97 business-model family map and alias rules.
- Document exact coverage targets for NLI-03 and NLI-04.

### 97-02 — Universal template-family authoring
- Add new reusable template-family docs inside the existing literacy corpus structure.
- Cover high-value families for all required business models and stage patterns.
- Ensure each asset carries funnel-stage, proof, tone, and naturality metadata.

### 97-03 — Deterministic selection and fallback wiring
- Add a lightweight registry or family-map helper.
- Extend current selection logic so unknown or alias models resolve to a sensible family before generic fallback.
- Keep existing resolver and output paths backward-compatible.

### 97-04 — Verification, docs, and regression gate
- Add coverage tests for required model families and required metadata fields.
- Add a completeness audit so missing template families fail fast.
- Re-run current skeleton and resolver tests plus new library-focused tests before closing the phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node built-in `node:test` |
| Config file | none — script-driven from `package.json` |
| Quick run command | `node --test test/skeleton-generator.test.js test/example-resolver.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NLI-03 | Required business-model families resolve to a non-empty universal template or valid family fallback | unit / integration | `node --test test/skeleton-generator.test.js test/example-resolver.test.js test/universal-template-library.test.js` | ⚠️ partial — new Phase 97 test needed |
| NLI-04 | Template assets carry funnel stage, buying maturity, naturality, trust, and tone metadata and round-trip through the chunker | unit | `node --test test/universal-template-library.test.js` | ❌ Wave 0 |

### Wave 0 Gaps
- `test/universal-template-library.test.js` — verify required coverage matrix and alias fallback
- metadata completeness checks for `buying_maturity`, `naturality_tags`, and tone/proof posture fields
- a simple audit that fails when a required business-model family has no authored template asset

## Open Questions

1. **Should services and consulting be separate first-class families or a shared family with overlays?**  
   Recommendation: use one `services` base family with a `consulting` overlay unless the planner finds a strong need for separate copy physics.

2. **Should the new universal library live under `.agent/markos/templates/` or `.agent/markos/literacy/`?**  
   Recommendation: author it under the literacy corpus for ingest/retrieval reuse, and let existing starter skeletons stay the operator output surface.

3. **Should new business-model labels replace current ones?**  
   Recommendation: no. Add a normalized family map and aliases; preserve the current 7 canonical slugs for compatibility.

## Planner-ready conclusion

The repo is already close to supporting Phase 97 well. The missing piece is not infrastructure; it is **organization, coverage, and authored template families**. The safest and highest-leverage plan is to expand the existing literacy corpus into a governed universal template library, add a small business-model family registry with deterministic fallback, and verify that every required scenario now has stage-aware, tone-aware, brand-safe reusable assets.

That approach directly satisfies the phase goal, builds on the shipped Phase 41 and Phase 96 foundations, and avoids premature spillover into Phase 98 reasoning or Phase 99 agent rewiring.

## Sources

### Primary repo sources
- `.planning/phases/97-universal-template-and-business-model-coverage-upgrade/97-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-CONTEXT.md`
- `.planning/phases/96-neuro-aware-literacy-schema-and-taxonomy-expansion/96-RESEARCH.md`
- `onboarding/backend/agents/example-resolver.cjs`
- `onboarding/backend/agents/skeleton-generator.cjs`
- `onboarding/backend/literacy-chunker.cjs`
- `onboarding/backend/vector-store-client.cjs`
- `.agent/markos/references/neuromarketing.md`
- sampled files from `.agent/markos/templates/` and `.agent/markos/literacy/`

### Verification evidence
- Focused baseline run: `node --test test/skeleton-generator.test.js test/example-resolver.test.js` → 16 pass, 0 fail
