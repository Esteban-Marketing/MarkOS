# Phase 99: Agent and Skill Training Alignment for Tailored Generation - Context

**Gathered:** 2026-04-14
**Status:** Discussed — core training and review posture locked

<domain>
## Phase Boundary

Upgrade agent instructions, skills, and review logic so the new literacy and ICP intelligence from Phase 98 consistently shapes planning and generation across all supported surfaces. This phase is about alignment and enforcement of the already-built intelligence layer; it is not the final premium-quality evaluation and governance closeout from Phase 99.1.

</domain>

<decisions>
## Implementation Decisions

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

### the agent's Discretion
- Which specific prompts, skills, and review checkpoints should be updated first
- The exact wording and structure of anti-generic / anti-template review rules
- The smallest portable contract shape that all supported surfaces can share without drift
- How rewrite-required outcomes are surfaced in review summaries versus inline agent feedback

</decisions>

<specifics>
## Specific Ideas

- Tailoring should survive the full chain from research → planning → generation → review rather than getting lost after the first step.
- The user wants premium output to feel clearly custom, specific, and non-generic.
- Generic or template-sounding content should be blocked from being treated as “good enough.”
- Cross-surface behavior should stay logically consistent even if the UI or formatting changes by surface.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md` — especially NLI-08, NLI-09, NLI-10
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/98-icp-pain-point-and-neuromarketing-intelligence-layer/98-CONTEXT.md`
- `.planning/phases/98-icp-pain-point-and-neuromarketing-intelligence-layer/98-RESEARCH.md`
- `.agent/markos/references/neuromarketing.md`
- `.agent/markos/literacy/Shared/TPL-SHARED-tone-and-naturality.md`
- `.agent/markos/agents/markos-content-creator.md`
- `.agent/markos/agents/markos-copy-drafter.md`
- `.agent/markos/agents/markos-campaign-architect.md`
- `.agent/markos/agents/markos-neuro-auditor.md`
- `.agent/markos/MARKOS-INDEX.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 98 already established a portable reasoning object with winner, shortlist, rationale, and confidence semantics.
- The MarkOS repo already contains neuromarketing-aware agent files, a neuro auditor skill, and shared naturality guidance that can be aligned rather than replaced.
- Existing prompts already contain anti-generic language in places, but the enforcement appears uneven and not yet centrally governed.

### Integration Points
- Phase 99 should align prompt packs, skills, and review surfaces to the same reasoning outputs from Phase 98.
- The most important surfaces appear to be strategist/planner/generator/reviewer layers rather than raw storage or retrieval modules.
- The rewrite-required behavior should show up in review logic, not only in human interpretation.

</code_context>

<deferred>
## Deferred Ideas

- Final measurable scoring and premium-quality governance closeout remain deferred to Phase 99.1.
- Broader future-grade evaluation metrics, non-regression scoring, and governance reporting should stay in the next phase rather than expanding this one.

</deferred>

---

*Phase: 99-agent-and-skill-training-alignment-for-tailored-generation*
*Context gathered: 2026-04-14*
