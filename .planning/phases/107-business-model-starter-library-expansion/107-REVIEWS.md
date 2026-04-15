---
phase: 107
reviewers: [copilot-claude-sonnet]
reviewed_at: 2026-04-15T00:00:00Z
plans_reviewed:
  - 107-01-PLAN.md
  - 107-02-PLAN.md
  - 107-03-PLAN.md
  - 107-04-PLAN.md
  - 107-05-PLAN.md
  - 107-06-PLAN.md
external_clis_available: []
note: "No external AI CLIs (gemini, claude, codex, opencode, coderabbit) found on system. Review performed by current agent (GitHub Copilot / Claude Sonnet 4.6). For multi-reviewer independence, install at least one external CLI and re-run /gsd-review."
---

# Cross-AI Plan Review — Phase 107

> **Note:** `gemini`, `claude`, `codex`, `opencode`, and `coderabbit` were not found in PATH. Review is single-reviewer. Install any of these CLIs and re-run `/gsd-review 107` for additional perspectives.

---

## GitHub Copilot (Claude Sonnet 4.6) Review

### Summary

Phase 107 is a content-authoring phase with a clean, well-bounded scope: produce per-family tone docs, discipline PROMPTS.md files, and skeleton READMEs for the 5 priority business model families (B2B, B2C, SaaS, Ecommerce, Services), then wire the pack manifests in Wave 2. The plans are highly structured with explicit decision records from CONTEXT.md properly propagated into each plan's `must_haves`. The wave-based dependency model (01-05 parallel, 06 sequential) is correct. Overall the planning quality is high with a few actionable gaps.

---

### Strengths

- **Wave dependency is correct.** Plans 01–05 have `depends_on: []` and plan 06 depends on all five, correctly sequencing content authoring before manifest wiring.
- **Scope creep is locked.** D-14 restricts Plan 06 to exactly 4 mutations per pack.json file (only `assets.baseDoc`, `completeness`). No other fields touched — this is explicitly stated in the plan context.
- **Overlay reuse is intentional and differentiated.** B2B and B2C get full tone docs (no existing overlay); SaaS, Ecommerce, and Services get thin extensions of existing overlay docs. This prevents content duplication and is correctly flagged in each plan's `interfaces` block.
- **Verifiable must_have truths.** Every plan lists machine-checkable truth conditions (YAML frontmatter keys, file paths, no `[PLACEHOLDER]` syntax). These are well-formed and sufficient for automated verification.
- **Explicit deferral of agency/info-products.** D-02 and D-13 are reinforced in every plan's context — no risk of accidentally authoring deferred families.
- **Test reference is correct.** Plan 06 correctly names `test/pack-loader.test.js` as the suite to keep green, and the actual test file confirms no `completeness` value assertions that would break on `stub` → `partial` change.

---

### Concerns

**MEDIUM — False-alarm test update warning in CONTEXT.md**

CONTEXT.md warns: _"tests may need updating to `partial`"_ for `getFamilyRegistry()` shape tests. After reviewing the actual test file (`test/pack-loader.test.js`), no test asserts a specific `completeness` value — test 106.2 checks field shape (`typeof entry.baseDoc === 'string'`), not values. This creates a risk that an executor reads the CONTEXT warning and unnecessarily modifies the test file, potentially introducing regressions. The warning should be clarified: _"no test currently asserts `completeness` values; no test changes are needed."_

**MEDIUM — No naming consistency gate across parallel Wave 1 plans**

Plans 01–05 run independently. If any plan produces a tone doc with a different slug (e.g., `business-model-b2-b.md` instead of `business-model-b2b.md`), Plan 06's `key_links` pattern matching would fail at runtime, not at authoring time. D-06's naming convention (`TPL-SHARED-business-model-{slug}.md`) is stated but not enforced by any cross-plan pre-check. Consider adding a validation step in Plan 06 that confirms all 5 expected files exist before mutating pack.json files.

**MEDIUM — SKELETONS path is unverified against downstream phase expectations**

All 5 content plans write to `onboarding/templates/SKELETONS/{slug}/{Discipline}/PROMPTS.md`. Phase 109 is the hydration wiring phase that will consume these paths. If Phase 109 expects a different path structure, the refactor cost will be high (5 families × 5 disciplines = 25 files to move). It's worth confirming now that `onboarding/templates/SKELETONS/` is the agreed integration path for Phase 109, not just an intermediate staging path.

**LOW — SaaS "thinness" constraint is unverifiable**

Plan 03 says the SaaS tone doc should be "~20% shorter than B2B/B2C" and Plan 04 applies the same pattern to Ecommerce. This is defensible as a quality guideline but cannot be expressed as a must_have truth and will not be caught by automated verification. This is acceptable given agent discretion over content wording, but reviewers should flag it during verification.

**LOW — Version bump semantics**

Plan 06 sets `version: 1.1.0` across all 5 pack.json files. Pack JSON files are not published versioned APIs; this is an internal manifest change. A minor (0.0.x) bump would be more consistent with the scope of change (content assets added, no schema change). Not a blocker, but misaligned with conventional versioning.

**LOW — Services tone doc calls out "consulting overlay" but slug is `services`**

Plan 05 correctly notes that `TPL-SHARED-overlay-consulting.md` is the reference doc (the pack's `overlayDocs.consulting` field per test 106.7). However, the asset being created is named `TPL-SHARED-business-model-services.md` — the naming is correct and the test confirms the `consulting` overlay key. Just worth confirming that the consulting overlay slug (`consulting`) is intentionally different from the pack family slug (`services`), and that this asymmetry is documented.

---

### Suggestions

1. **Clarify the CONTEXT.md test warning.** Replace the ambiguous sentence about `completeness` assertions with: _"No test currently asserts `completeness` values. Plan 06 does NOT need to update test/pack-loader.test.js."_ This prevents an executor from touching tests unnecessarily.

2. **Add a file-existence pre-check to Plan 06.** Before the 5 pack.json mutations, add a task that verifies all 5 expected tone doc paths exist (from Wave 1). If any are missing, Plan 06 should halt rather than produce broken `assets.baseDoc` references. This pre-check closes the naming consistency gap.

3. **Confirm SKELETONS path with Phase 109 context.** Check `.planning/phases/109-*/` (once planned) or the ROADMAP entry for Phase 109 to confirm `onboarding/templates/SKELETONS/` is the canonical integration path. If it is, add a comment in Plan 06's must_haves noting it; if it differs, update Plans 01–05.

4. **Drop version bump from Plan 06 or lower to patch.** Change `version: 1.1.0` → `version: 1.0.1` in the 5 pack.json mutations. This is cosmetic but avoids implying API-level changes that didn't happen.

---

### Risk Assessment

**LOW-MEDIUM overall.**

The structural planning quality is high. The dependency model, wave sequencing, scope deferral, and must_have truths are all well-formed. The two actionable concerns (false-alarm test warning and missing naming consistency gate in Plan 06) are easy to address with a clarification and a pre-check task. No plan needs to be rewritten — targeted amendments are sufficient before execution.

---

## Consensus Summary

*Single reviewer — no multi-reviewer consensus available.*

### Top Concerns (Priority Order)

1. **False-alarm test update note in CONTEXT.md** — can cause unnecessary test modification by executor. Clarify now.
2. **Plan 06 has no pre-check for Wave 1 file existence** — add a task to verify all 5 tone docs exist before mutating pack.json files.
3. **SKELETONS path** — confirm it is the agreed Phase 109 integration contract.

### Cleared Concerns

- **`completeness` test breakage** — NOT a real risk. Actual test file does not assert completeness values. CONTEXT.md warning is misleading.
- **Inter-family content consistency** — Each plan has explicit interfaces and frontmatter schema constraints. Low free-form drift risk.

### Recommended Action Before Execution

Address concern #1 (CONTEXT.md clarification) and #2 (Plan 06 pre-check task) before running `/gsd-execute-phase 107`. These changes take < 5 minutes and eliminate the two highest-probability failure modes.

To execute after incorporating feedback:
```
/gsd-execute-phase 107
```
