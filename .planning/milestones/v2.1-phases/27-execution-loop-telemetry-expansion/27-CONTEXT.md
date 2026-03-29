# Phase 27 Context â€” Execution Loop & Telemetry Expansion

## Objective

Strengthen the path from approved onboarding outputs into repeatable execution by defining the minimum post-onboarding execution loop, validating winners-catalog and prompt-injection requirements, and focusing telemetry on operational checkpoints that change decisions rather than merely counting events.

Phase 27 is the capstone of the v2.1 hardening sequence. Earlier phases clarified identity, runtime, onboarding quality, and memory operations. This phase turns those stabilized inputs into an execution-ready contract so the product no longer stops conceptually at draft generation.

## Phase Scope

### In Scope
- Define the minimum execution loop that starts from approved MIR/MSP state and leads into creator/executor workflows.
- Validate winners-catalog boot requirements and prompt-injection assumptions across execution-facing prompts and workflow docs.
- Expand telemetry around approval, execution readiness, and major failure points where operator action meaningfully changes.
- Produce a handoff specification tying onboarding artifacts, local overrides, and execution workflows together.

### Out of Scope
- Broad onboarding hardening already scoped to Phase 25.
- Vector Store namespace and multi-tenant memory contract work already scoped to Phase 26.
- Full product analytics strategy beyond execution-critical checkpoints.
- Rewriting the underlying GSD execution engine.

## Locked Decisions

1. **Approved state is the execution boundary:** execution loops must consume approved MIR/MSP files, not transient draft payloads.
2. **Anchoring remains mandatory:** winners catalogs and injection rules are first-class execution prerequisites, not optional best practices.
3. **Telemetry must change action:** instrumentation should focus on readiness, approval, execution start, failure, and loop completion rather than generic volume.
4. **Execution contract beats tribal knowledge:** the handoff from onboarding to execution must be documented in code-adjacent artifacts, not implied by prompt comments alone.
5. **Phase 27 builds on hardening, not around it:** runtime, quality, and memory assumptions should be inherited from Phases 24â€“26 rather than redefined here.

## Requirements Mapped

- **EXE-01**: Downstream execution workflows consume approved MIR/MSP state predictably and from explicit sources of truth.
- **EXE-02**: Winners-catalog anchoring and prompt injection are validated as required execution inputs across creator and executor flows.
- **TLM-02**: Telemetry focuses on actionable operational checkpoints such as approval, execution readiness, major failures, and loop completion.

## Key Files and Surfaces

| Surface | Why It Matters | Likely Outputs |
|---------|----------------|----------------|
| `.agent/prompts/*.md` | Execution prompts currently encode injection and winners assumptions | Validated execution-input contract and anchor requirements |
| `.agent/get-shit-done/workflows/execute-phase.md` | Existing execution loop is documented here, but not tied tightly to onboarding outputs | Handoff checkpoints and required inputs made explicit |
| `.protocol-lore/CONVENTIONS.md` | Winners-catalog and injection rules are defined here as conventions | Execution-facing rules promoted into a usable contract |
| `.protocol-lore/WORKFLOWS.md` | Onboarding loop ends at approval today; execution continuation is still sparse | Extended workflow showing onboarding-to-execution path |
| `.markos-local/MIR/` and `.markos-local/MSP/` | Approved state and winners catalogs live here | Explicit readiness requirements and artifact mapping |
| `onboarding/backend/agents/telemetry.cjs` | Current telemetry is light and mostly generation-centric | Actionable execution checkpoint events and reporting rules |
| `onboarding/onboarding.js` and approval flow surfaces | Approval is the main bridge from onboarding to execution readiness | Clearer readiness telemetry and handoff semantics |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Execution prompts reference state that onboarding does not reliably produce | High | Define a minimum approved-state contract before expanding execution instrumentation |
| Winners anchoring remains a rule on paper but not a validated runtime requirement | High | Add explicit checks, docs, or tests around catalog presence and lookup paths |
| Telemetry volume grows without operator value | Medium | Instrument only checkpoints tied to readiness, failure, and loop progression |
| Phase 27 drifts into a broad analytics or workflow rewrite | Medium | Keep scope on handoff, anchoring, and operational telemetry only |

## Deliverables

1. `27-CONTEXT.md` â€” this document.
2. `27-01-PLAN.md` â€” define the minimum post-onboarding execution loop and required inputs.
3. `27-02-PLAN.md` â€” validate winners-catalog boot requirements across creator and executor flows.
4. `27-03-PLAN.md` â€” add telemetry around approval, execution readiness, and major failure points.
5. `27-04-PLAN.md` â€” produce a handoff spec tying onboarding outputs to execution workflows.

## Exit Criteria

Phase 27 is complete when approved MIR/MSP state has a documented execution-ready contract, winner-anchoring and prompt-injection assumptions are validated as real prerequisites, telemetry reflects meaningful execution checkpoints, and the repo contains a clear handoff path from onboarding completion into repeatable execution loops.

