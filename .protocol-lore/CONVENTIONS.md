<markos_rules>
<purpose>Execution conventions for the MarkOS product and compatibility surfaces. Read before modifying source files.</purpose>

<rule id="tools_gsd">For repo planning and git-aware operations, prefer `.agent/get-shit-done/bin/gsd-tools.cjs` when the GSD workflow applies.</rule>
<rule id="tools_markos">For MarkOS protocol CLI routing, use `.agent/markos/bin/markos-tools.cjs` (mirrors gsd-tools architecture for `.agent/markos/` paths).</rule>
<rule id="overrides">Templates may include `<!-- OVERRIDABLE: .markos-local/... -->`. Resolution: check `.markos-local/{path}` first; if present, use it ([override] log required); else use `.agent/markos/templates/{path}`.</rule>
<rule id="tags">Use `[HUMAN]` in task names when human intervention is required. Executor auto-pauses.</rule>
<rule id="formatting">Keep agent context files dense; XML-style blocks are preferred for machine-readable lore.</rule>
<rule id="identity_contract">
  Public-facing product identity is MarkOS.
  Legacy filesystem and env names may remain for compatibility (for example `.agent/markos/`, `MARKOS-INDEX.md`, `markos-*` vector prefixes). Document compatibility; do not use legacy names in user-facing copy.
</rule>

<rule id="project_slug">Read `project_slug` only from `.markos-project.json`. Vector collection names use the configured prefix (default `markos`) with compatibility reads as implemented in `vector-store-client.cjs`.</rule>
<rule id="path_resolution">Use `onboarding/backend/path-constants.cjs` for filesystem navigation. Avoid hardcoded `../../` chains.</rule>
<rule id="ensure_vector">Agents that touch vector memory should ensure providers are ready (e.g. `bin/ensure-vector.cjs` before local vector operations).</rule>
<rule id="mir_write_path">Approved MIR output goes to `.markos-local/MIR/`, not into versioned templates under `.agent/markos/templates/MIR/`.</rule>
<rule id="hosted_runtime_constraints">Resolve behavior through `onboarding/backend/runtime-context.cjs`. Hosted wrappers must not write to local disk for approve flows unless a persistence backend exists; use `LOCAL_PERSISTENCE_UNAVAILABLE` when local writes are unavailable.</rule>

<rule id="separation_of_concerns">MIR/MSP = state. `.agent/prompts/` = execution logic. Do not embed client strategy data inside prompt templates.</rule>
<rule id="anchoring">Read `.markos-local/MSP/<discipline>/WINNERS/_CATALOG.md` before generating channel assets.</rule>
<rule id="anchor_validation_contract">Winners catalogs: present = proceed; missing = block; stale = warn; mislocated = block with canonical path.</rule>
<rule id="injection">Prompts may use `{{ inject: MIR/... }}` fragments; resolve against `.markos-local/` first.</rule>
</markos_rules>
