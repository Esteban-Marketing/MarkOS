# Phase 16 Context — Documentation Enrichment

## Objective

Harden documentation and context retrieval so autonomous agents and human maintainers can reason about the codebase with lower ambiguity and fewer hallucinations.

## Phase Scope

This phase is strictly documentation and prompt-quality hardening. It does not change product behavior, onboarding flow logic, or protocol naming.

### In Scope
- Add `@llm_context` intent/failure-boundary blocks in critical backend modules.
- Add `FAILURE MODE AWARENESS` and `CONTEXT RELAY` sections to specialized prompt files.
- Deep-link protocol-lore index/map docs to implementation files.
- Create a gold-standard behavior catalog for agent grounding.

### Out of Scope
- MarkOS rebrand execution (Phase 17+).
- Directory renames and migration logic.
- Telemetry or ChromaDB schema changes.

## Locked Targets

1. `onboarding/backend/agents/orchestrator.cjs`
2. `onboarding/backend/agents/llm-adapter.cjs`
3. `.agent/prompts/*.md` (7 specialized prompts)
4. `.protocol-lore/INDEX.md`
5. `.protocol-lore/CODEBASE-MAP.md`
6. `.agent/prompts/examples/GOLD-STANDARD.md` (new)

## Success Criteria Mapping

1. Critical modules include `@llm_context` blocks on major exported behavior.
2. Specialized prompts include explicit failure boundaries and authoritative context references.
3. Protocol-lore has valid deep links from overview docs to implementation files.
4. A high-quality behavior examples catalog exists and is referenceable.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Superficial comments that add noise | Medium | Enforce intent + boundary specificity per function block |
| Prompt sections added inconsistently | Medium | Apply a single section template across all 7 prompt files |
| Broken deep links | High | Add explicit link verification in `VERIFICATION.md` |
| Gold-standard doc becoming generic | Medium | Require concrete role-specific examples with inputs/outputs |
