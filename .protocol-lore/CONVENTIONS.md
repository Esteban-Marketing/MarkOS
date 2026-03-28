<mgsd_rules>
<purpose>Execution conventions for the MarkOS product and its legacy MGSD-compatible protocol surfaces. Read before modifying any source file.</purpose>

<rule id="tools">Always use `gsd-tools.cjs <action>` instead of raw git/file ops where possible.</rule>
<rule id="overrides">Templates use `<!-- OVERRIDABLE: .mgsd-local/... -->`. Resolve overrides during execution.
  Resolution order: check .mgsd-local/{path} → if exists, use it ([override] log MANDATORY) → else use .agent/templates/{path}.</rule>
<rule id="tags">Use `[HUMAN]` in task names for tasks needing human intervention. Executor auto-pauses.</rule>
<rule id="formatting">Agent context files must remain highly dense. Use XML tags instead of conversational markdown.</rule>
<rule id="identity_contract">
  Public/operator-facing identity MUST be MarkOS.
  Legacy MGSD-era surfaces remain compatibility-only during v2.1: `.agent/marketing-get-shit-done/`, `.mgsd-local/`, `.mgsd-project.json`, `.mgsd-install-manifest.json`, `MGSD_TELEMETRY`, and `mgsd-*` Chroma namespaces.
  Only use MGSD wording when documenting compatibility behavior or historical lineage.
</rule>

<!-- V1.1+ Hardening & Scale Rules -->
<rule id="project_slug">
  project_slug MUST always be read from .mgsd-project.json.
  ChromaDB collection prefix remains `mgsd-` until the dedicated namespace migration phase lands.
</rule>
<rule id="path_resolution">
  Always use `onboarding/backend/path-constants.cjs` for filesystem navigation.
  NEVER use hardcoded relative dots (../../) as they break in multi-tenant/server environments.
</rule>
<rule id="ensure_chroma">
  All CLI agents accessing ChromaDB MUST call `bin/ensure-chroma.cjs` first.
</rule>
<rule id="mir_write_path">
  Approved MIR drafts MUST be written to .mgsd-local/MIR/ — NOT to .agent/templates/MIR/.
  This legacy path remains canonical for persisted client data during v2.1.
</rule>
<rule id="hosted_runtime_constraints">
  Runtime behavior MUST be resolved through onboarding/backend/runtime-context.cjs.
  Hosted/API-wrapper runtime is read-compatible for config/status/submit/regenerate, but approve/write persistence MUST reject with LOCAL_PERSISTENCE_UNAVAILABLE unless a dedicated hosted persistence backend is implemented.
</rule>

<!-- V1.2+ Strategic Separation Rules (added 2026-03-27) -->
<rule id="separation_of_concerns">
  Strict "Separation of Concerns":
  - MIR/MSP = State (What is known).
  - .agent/prompts/ = Logic (How to execute).
  - DO NOT mix strategic data into logic templates.
</rule>
<rule id="anchoring">
  "Read-Catalog-First" boot sequence:
  All specialized agents MUST read `.mgsd-local/MSP/<discipline>/WINNERS/_CATALOG.md` before generating new assets.
  New assets MUST be anchored to historical high-performers for tone and structure.
</rule>
<rule id="anchor_validation_contract">
  Execution-facing creators/executors MUST treat winners catalogs as explicit boot requirements.
  Supported states and behavior:
  - present: proceed with anchored generation.
  - missing: block execution with actionable error; do not silently continue.
  - stale: allow execution only with warning telemetry and operator-visible notice.
  - mislocated: block execution and report expected canonical path under `.mgsd-local/MSP/<discipline>/WINNERS/_CATALOG.md`.
</rule>
<rule id="injection">
  Logic templates use `{{ inject: MIR/Core_Strategy/02_BUSINESS/LEAN-CANVAS.md }}` token syntax.
  Executor MUST resolve these fragments against the .mgsd-local/ override layer first.
</rule>
</mgsd_rules>
