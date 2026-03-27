<mgsd_rules>
<purpose>Execution conventions for all MGSD agents. Read before modifying any source file.</purpose>

<rule id="tools">Always use `gsd-tools.cjs <action>` instead of raw git/file ops where possible.</rule>
<rule id="overrides">Templates use `<!-- OVERRIDABLE: .mgsd-local/... -->`. Resolve overrides during execution.
  Resolution order: check .mgsd-local/{path} → if exists, use it ([override] log MANDATORY) → else use .agent/templates/{path}.</rule>
<rule id="tags">Use `[HUMAN]` in task names for tasks needing human intervention. Executor auto-pauses.</rule>
<rule id="formatting">Agent context files must remain highly dense. Use XML tags instead of conversational markdown.</rule>

<!-- V1.1+ Hardening & Scale Rules -->
<rule id="project_slug">
  project_slug MUST always be read from .mgsd-project.json.
  ChromaDB collection name = `mgsd-{project_slug}`.
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
<rule id="injection">
  Logic templates use `{{ inject: MIR/Core_Strategy/02_BUSINESS/LEAN-CANVAS.md }}` token syntax.
  Executor MUST resolve these fragments against the .mgsd-local/ override layer first.
</rule>
</mgsd_rules>
