# Phase 90: Retrieval Verification Backfill and Audit Normalization - Research

**Researched:** 2026-04-13
**Domain:** Retrieval verification evidence backfill, non-destructive audit normalization, and traceability closure
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Backfill Evidence Strategy
- **D-01:** Phase 90 uses re-run targeted retrieval verification flows as the primary closure method for ROLEV-01/02/03.
- **D-02:** Backfill evidence must be generated from deterministic runtime/test execution in current code, not inferred from old summaries alone.
- **D-03:** Historical artifacts can be cited for context, but requirement closure must anchor to fresh Phase 90 verification outputs.

### Artifact Normalization Policy
- **D-04:** Use append corrective artifacts (non-destructive) for conflicting legacy evidence.
- **D-05:** Do not rewrite historical phase artifacts in place unless strictly required for metadata integrity.
- **D-06:** Corrective outputs must clearly reference which prior artifact/version they normalize.

### Audit and Traceability Closure
- **D-07:** REQUIREMENTS traceability and milestone audit updates happen after new verification evidence is produced.
- **D-08:** ROLEV requirement status transitions to Complete only when verification artifacts and commands are reproducible and linked.
- **D-09:** Nyquist metadata consistency should be improved for in-scope retrieval closure artifacts in this phase.

### Claude's Discretion
- Exact naming of corrective verification/audit append artifacts.
- Exact test command split between smoke and full retrieval backfill runs.
- Exact ordering of normalization writes after evidence capture, as long as D-01 through D-09 are preserved.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROLEV-01 | Agents can retrieve vault artifacts in three modes: (1) Retrieve+Reason (raw artifact for LLM customization), (2) Retrieve+Apply (actionable template), (3) Retrieve+Iterate (with outcome verification). | Re-run deterministic mode-contract tests and produce fresh Phase 90 verification evidence proving mode isolation and tenant-safe retrieval in current runtime. |
| ROLEV-02 | Retrieval queries support both discipline-scoped and audience-scoped filters; results include artifact ID, provenance, and audience context. | Re-run filter + retriever integration tests with explicit evidence capture for discipline filter and audience_tags AND semantics. |
| ROLEV-03 | Execution handoff payloads are deterministic and include reasoning context for agent multi-step loops and outcome verification. | Re-run handoff-pack and retriever tests to prove deterministic idempotency keys, reasoning_context fields, and iterate verification_hook outputs; link outputs into normalized audit artifacts. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Boot/read order is mandatory: `.protocol-lore/QUICKSTART.md`, `.protocol-lore/INDEX.md`, `.planning/STATE.md`, `.agent/markos/MARKOS-INDEX.md`.
- `.planning/STATE.md` is canonical live mission state.
- Keep GSD and MarkOS boundaries explicit; client overrides remain under `.markos-local/` only.
- Preferred install/update path remains `npx markos`.
- Test compatibility must be preserved for `npm test` and `node --test test/**/*.test.js`.
- Local onboarding server command remains `node onboarding/backend/server.cjs`.

## Summary

Phase 90 is a verification-and-normalization closure phase. The code for ROLEV-01/02/03 already exists in runtime and tests (Phase 86), but milestone audit and requirements traceability remain open because closure evidence was remapped and not yet backfilled with fresh, reproducible outputs. The correct approach is evidence-first and deterministic: rerun targeted Phase 86 retrieval tests, capture machine-verifiable results, and only then update audit/traceability artifacts.

The non-destructive normalization requirement is strict. Historical artifacts should remain intact; Phase 90 should append corrective closure artifacts that explicitly reference normalized predecessors (for example, Phase 86 summary claims and milestone audit gap entries). This preserves forensic lineage and avoids rewriting historical context that may still be useful.

The closure sequence should be: (1) deterministic backfill execution evidence, (2) Phase 90 verification artifact authoring with explicit command/result mapping per ROLEV ID, (3) append-only audit normalization artifacts, (4) requirements and milestone status transitions to Complete once reproducibility is established.

**Primary recommendation:** Use targeted Node test reruns as the single source of fresh ROLEV evidence, then perform append-only audit/traceability normalization that references prior artifacts and closes pending requirement statuses.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22.13.0 (local verified) | Runtime and test execution for retrieval contracts | Existing project runtime baseline; all phase tests and artifacts use node tooling |
| node:test | Built-in (Node 22) | Deterministic test harness for backfill evidence | Already used across `test/phase-86/*.test.js` and repo-wide scripts |
| npm | 10.9.2 (local verified) | Script runner for full-suite compatibility checks | Required by project constraints (`npm test`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:assert/strict | Built-in | Stable assertions for contract checks | Required by existing phase-86 tests |
| node:fs/node:path | Built-in | Evidence artifact persistence and deterministic file path references | Use when writing verification/normalization outputs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Targeted Phase 86 test reruns | Narrative-only closure from historical summary | Violates D-02 (not deterministic fresh evidence) |
| Append-only normalization artifacts | In-place rewrites of older phase files | Violates D-04/D-05 and reduces audit traceability |
| Requirement-specific command evidence | Single broad `npm test` only | Harder to attribute pass/fail evidence to each ROLEV requirement |

**Installation:**
```bash
npm ci
```

**Version verification:**
- Local verified: `node --version` -> `v22.13.0`
- Local verified: `npm --version` -> `10.9.2`
- Registry context checked: `npm view node version` -> `25.9.0` (not required for this phase; runtime remains project-pinned)

## Architecture Patterns

### Recommended Project Structure
```
.planning/phases/90-retrieval-verification-backfill-and-audit-normalization/
├── 90-RESEARCH.md          # This file
├── 90-VERIFICATION.md      # Fresh deterministic evidence and requirement closure proofs
├── 90-VALIDATION.md        # Nyquist alignment and phase validation surface
└── 90-*-NORMALIZATION.md   # Append-only corrective audit/traceability artifacts
```

### Pattern 1: Deterministic Evidence-First Closure
**What:** Run requirement-targeted tests first, then write closure artifacts from actual command outputs.
**When to use:** ROLEV-01/02/03 closure in Phase 90.
**Example:**
```bash
node --test test/phase-86/vault-retriever.test.js
node --test test/phase-86/retrieval-filter.test.js
node --test test/phase-86/handoff-pack.test.js
```

### Pattern 2: Append-Only Audit Normalization
**What:** Add new corrective artifacts that reference older conflicting/incomplete artifacts without rewriting originals.
**When to use:** Milestone audit normalization and traceability reconciliation.
**Example:**
```markdown
Normalized source: .planning/v3.5.0-MILESTONE-AUDIT.md (audited 2026-04-13T23:05:00Z)
Correction basis: Phase 90 deterministic rerun evidence (command + pass counts + artifact links)
Disposition: ROLEV-01/02/03 moved from Pending to Complete after reproducible verification.
```

### Pattern 3: Requirement-to-Command Traceability Matrix
**What:** Map each ROLEV ID to explicit command(s), expected behavior, and evidence file section.
**When to use:** Requirements status transitions.
**Example:**
```markdown
| Requirement | Command | Evidence Section | Result |
| ROLEV-01 | node --test test/phase-86/vault-retriever.test.js | 90-VERIFICATION.md#mode-contracts | PASS |
```

### Anti-Patterns to Avoid
- **Narrative backfill without command output:** cannot satisfy D-02 or audit reproducibility expectations.
- **In-place edits of Phase 86 historical summaries:** violates non-destructive normalization policy.
- **Updating REQUIREMENTS status before evidence exists:** violates D-07 and can create false closure.
- **Only running full-suite tests for closure evidence:** weak requirement-level attribution and slower remediation loops.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retrieval mode verification | New ad hoc harness | Existing `test/phase-86/vault-retriever.test.js` contracts | Already validates mode behavior, tenant isolation, and role gating |
| Filter semantics proof | Manual fixture scripts | Existing `test/phase-86/retrieval-filter.test.js` | Encodes discipline + audience_tags AND semantics directly |
| Deterministic handoff proof | New payload comparator tool | Existing `test/phase-86/handoff-pack.test.js` | Already asserts idempotency key determinism and mode-specific fields |
| Milestone closure normalization | Rewrite old milestone audit | Append corrective Phase 90 normalization artifact | Preserves history while closing traceability gaps |

**Key insight:** Phase 90 should compose and re-run existing deterministic retrieval contracts, then normalize audit artifacts additively; no new retrieval framework is needed.

## Common Pitfalls

### Pitfall 1: Treating Historical Completion Claims as Closure Evidence
**What goes wrong:** Team cites Phase 86 summary claims but does not produce fresh reproducible outputs.
**Why it happens:** Historical artifacts look complete and can be mistaken for current closure proof.
**How to avoid:** Require fresh command outputs in Phase 90 verification before any status transition.
**Warning signs:** `REQUIREMENTS.md` updated to Complete but no new `90-VERIFICATION.md` command/result matrix.

### Pitfall 2: Destructive Normalization
**What goes wrong:** Old summaries/audits are rewritten, erasing original context.
**Why it happens:** Desire for a single clean artifact.
**How to avoid:** Add a corrective normalization artifact referencing prior files and rationale.
**Warning signs:** Large edits to older phase files without explicit metadata integrity requirement.

### Pitfall 3: Non-Deterministic Evidence Capture
**What goes wrong:** Evidence comes from mixed local runs, ad hoc environment changes, or partial logs.
**Why it happens:** Lack of a single reproducible command set.
**How to avoid:** Pin to explicit command list and record pass/fail counts per run.
**Warning signs:** Inability to reproduce same pass counts for phase-86 suite.

### Pitfall 4: Traceability Updated Out of Order
**What goes wrong:** Audit/requirements statuses are changed before command evidence is captured.
**Why it happens:** Administrative updates done ahead of verification.
**How to avoid:** Enforce strict ordering: evidence -> verification artifact -> normalization artifact -> status updates.
**Warning signs:** Pending requirements changed to Complete with no linked command evidence.

## Code Examples

Verified patterns from repository code:

### Retrieval mode API surface (ROLEV-01)
```javascript
// Source: onboarding/backend/vault/vault-retriever.cjs
return {
  async retrieveReason({ tenantId, claims, filter }) {
    return retrieve({ mode: 'reason', claims, resourceContext: { tenantId }, filter });
  },
  async retrieveApply({ tenantId, claims, filter }) {
    return retrieve({ mode: 'apply', claims, resourceContext: { tenantId }, filter });
  },
  async retrieveIterate({ tenantId, claims, filter }) {
    return retrieve({ mode: 'iterate', claims, resourceContext: { tenantId }, filter });
  },
};
```

### Filter AND semantics (ROLEV-02)
```javascript
// Source: onboarding/backend/vault/retrieval-filter.cjs
if (filterTags !== null && Array.isArray(filterTags) && filterTags.length > 0) {
  const entryAudienceTags = Array.isArray(entry.audience_tags) ? entry.audience_tags : [];
  const hasAllTags = filterTags.every((tag) => entryAudienceTags.includes(tag));
  if (!hasAllTags) {
    return false;
  }
}
```

### Deterministic handoff pack idempotency (ROLEV-03)
```javascript
// Source: onboarding/backend/vault/handoff-pack.cjs
const idempotencyKey = `retrieve:${tenantId}:${docId}:${mode}:${contentHash}`;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase claim accepted from summary-only evidence | Requirement closure requires deterministic command-linked verification artifacts | v3.5 audit gap closure (2026-04-13) | Stronger audit reproducibility and lower false-positive closure risk |
| Rewrite old artifact for normalization | Append corrective normalization artifact with references | Locked by Phase 90 decisions D-04/D-05 | Preserves forensic history and improves traceability |
| Global-suite-first evidence | Requirement-targeted command matrix + optional global confirmation | Phase 90 closure posture | Faster root-cause isolation and clearer ROLEV attribution |

**Deprecated/outdated:**
- Using Phase 86 completion summaries alone as closure proof for ROLEV-01/02/03 is outdated under current milestone audit policy.

## Open Questions

1. **Which exact file names should be used for normalization artifacts?**
   - What we know: naming is discretionary under D-04 to D-06.
   - What's unclear: preferred naming convention for future audit automation.
   - Recommendation: choose deterministic names (for example, `90-01-NORMALIZATION.md`) and keep one artifact per normalization concern.

2. **Should full-suite `npm test` be mandatory at Phase 90 gate, or phase-scoped suites suffice?**
   - What we know: project supports both and phase-scoped evidence is primary for ROLEV closure.
   - What's unclear: whether deferred unrelated failures should be tolerated at milestone closeout in this cycle.
   - Recommendation: enforce `node --test test/phase-86/*.test.js` as required gate, run `npm test` as secondary signal and document deferred failures explicitly if any.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Retrieval test reruns and artifact generation | Yes | 22.13.0 | None |
| npm | Script compatibility and optional full-suite validation | Yes | 10.9.2 | Direct `node --test ...` commands |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node test runner (`node:test`) |
| Config file | none - CLI and package scripts |
| Quick run command | `node --test test/phase-86/*.test.js` |
| Full suite command | `node --test test/**/*.test.js` (or `npm test`) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROLEV-01 | Three retrieval modes with correct mode-specific payload shape and tenant-safe retrieval | integration | `node --test test/phase-86/vault-retriever.test.js` | Yes |
| ROLEV-02 | Discipline filter + audience_tags AND semantics with scoped retrieval behavior | unit/integration | `node --test test/phase-86/retrieval-filter.test.js test/phase-86/vault-retriever.test.js` | Yes |
| ROLEV-03 | Deterministic handoff payload and reasoning/verification context | unit/integration | `node --test test/phase-86/handoff-pack.test.js test/phase-86/vault-retriever.test.js` | Yes |

### Sampling Rate
- **Per task commit:** `node --test test/phase-86/*.test.js`
- **Per wave merge:** `node --test test/phase-86/*.test.js; node --test test/phase-89/*.test.js`
- **Phase gate:** `node --test test/phase-86/*.test.js` plus traceability artifact checks

### Wave 0 Gaps
- [ ] `90-VERIFICATION.md` missing - must include command outputs and ROLEV requirement matrix.
- [ ] Phase 90 normalization artifact missing - must document append-only corrections against milestone audit and legacy retrieval closure claims.
- [ ] REQUIREMENTS traceability update pending until Phase 90 evidence artifacts exist.
- [ ] Milestone audit normalization rerun pending after Phase 90 evidence capture.

## Sources

### Primary (HIGH confidence)
- Repository planning sources:
  - `.planning/phases/90-retrieval-verification-backfill-and-audit-normalization/90-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
  - `.planning/v3.5.0-MILESTONE-AUDIT.md`
  - `.planning/phases/86-agentic-retrieval-modes-reason-apply-iterate/86-03-SUMMARY.md`
- Repository runtime/test contracts:
  - `onboarding/backend/vault/vault-retriever.cjs`
  - `onboarding/backend/vault/retrieval-filter.cjs`
  - `onboarding/backend/vault/handoff-pack.cjs`
  - `test/phase-86/vault-retriever.test.js`
  - `test/phase-86/retrieval-filter.test.js`
  - `test/phase-86/handoff-pack.test.js`
- Local deterministic execution evidence:
  - `node --test test/phase-86/*.test.js` run on 2026-04-13: 23/23 passing

### Secondary (MEDIUM confidence)
- `.planning/phases/89-runtime-governance-wiring-and-closure-emission/89-VERIFICATION.md` for normalization and evidence-linking patterns transferable to Phase 90.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - uses existing repo runtime/tooling only.
- Architecture: HIGH - directly derived from locked decisions and existing phase artifacts.
- Pitfalls: HIGH - derived from current pending audit gaps and requirement traceability state.

**Research date:** 2026-04-13
**Valid until:** 2026-05-13
