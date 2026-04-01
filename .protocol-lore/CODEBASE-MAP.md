<markos_codebase_map>
<purpose>LLM-navigable map of the MarkOS repository. Read after QUICKSTART.md to locate components without blind filesystem search.</purpose>
<last_updated>2026-03-29</last_updated>
<canonical_state path="../.planning/STATE.md">GSD mission state (milestone, phase, next actions).</canonical_state>
<canonical_codebase_docs path="../.planning/codebase/README.md">Canonical route, folder, and file inventories live under `.planning/codebase/` and override summary-level topology notes.</canonical_codebase_docs>

<implementation_index>
  <file path="onboarding/backend/agents/orchestrator.cjs">Draft generation orchestrator and retry boundaries.</file>
  <file path="onboarding/backend/agents/llm-adapter.cjs">LLM provider routing, fallback behavior, output contract.</file>
  <file path="onboarding/backend/server.cjs">HTTP onboarding runtime and endpoint surface.</file>
  <file path="onboarding/backend/vector-store-client.cjs">Supabase + Upstash Vector persistence and retrieval boundaries.</file>
</implementation_index>

<!-- ==================== ROOT ==================== -->
<root>
  <file path="README.md">Project overview, quick-start, architecture guide for humans.</file>
  <file path="CHANGELOG.md">Versioned history of protocol and product changes.</file>
  <file path="VERSION">Single-line semver string. Read by install.cjs and update.cjs.</file>
  <file path="package.json">npm binary `markos` -> `bin/install.cjs`. Scripts: `npm test` runs `node --test test/**/*.test.js`.</file>
  <file path=".env.example">Template for required secrets. Copy to `.env`.</file>
  <file path=".gitignore">Excludes: node_modules/, .env, .markos-local/ (client data never committed).</file>
  <file path="GEMINI.md">Gemini agent boot. Same read order as CLAUDE.md.</file>
  <file path="CLAUDE.md">Claude agent boot. Points to `.protocol-lore/QUICKSTART.md`.</file>
  <file path=".cursorrules">Cursor agent boot. Same read order as CLAUDE.md.</file>
  <file path="tokenize.cjs">Utility: token counts for MIR/MSP files during optimization passes.</file>
  <file path="patch.ps1">PowerShell helper for applying local patches after a version update.</file>
</root>

<!-- ==================== .protocol-lore/ ==================== -->
<dir path=".protocol-lore">
  <purpose>Agent navigation layer. Read QUICKSTART first; canonical mission state lives in `.planning/STATE.md`.</purpose>
  <file path="QUICKSTART.md">Mandatory agent boot: search order, commands, boundaries, overrides.</file>
  <file path="INDEX.md">Pointer map to other `.protocol-lore` files and canonical state.</file>
  <file path="ARCHITECTURE.md">Component interaction: MIR/MSP, onboarding, GSD vs MarkOS.</file>
  <file path="WORKFLOWS.md">Workflow loops: onboarding, ensure-vector, execution handoff.</file>
  <file path="CONVENTIONS.md">Execution rules: overrides, hosted runtime, winners anchors.</file>
  <file path="TEAM.md">Hybrid human+AI roster and lifecycle.</file>
  <file path="TEMPLATES.md">Token map of MIR/MSP/ITM template paths.</file>
  <file path="MEMORY.md">Vector namespaces, slug, ensure-vector boot.</file>
  <file path="DEFCON.md">Escalation and event-driven phase injection.</file>
  <file path="CODEBASE-MAP.md">This file.</file>
  <file path="STATE.md">Routing note only; live state is `.planning/STATE.md`.</file>
</dir>

<!-- ==================== bin/ ==================== -->
<dir path="bin">
  <purpose>CLI entry points. Invoked via `npx markos` (install) and `npx markos update`.</purpose>
  <file path="bin/install.cjs">
    First-run installer. Copies `.agent/markos/` protocol files into the project.
    Writes `.markos-install-manifest.json` for idempotent re-runs.
    May invoke `ensure-vector.cjs` during boot.
    Entry: `npx markos` or `npx markos install`
  </file>
  <file path="bin/update.cjs">
    Updater. Compares installed files to the package; respects local patches via manifest.
    Entry: `npx markos update`
  </file>
  <file path="bin/ensure-vector.cjs">
    Boot-time check that Supabase and Upstash Vector env vars are present.
    Exports `ensureVectorStores()` returning a status report (no local Python daemon).
  </file>
</dir>

<!-- ==================== onboarding/ ==================== -->
<dir path="onboarding">
  <purpose>Web UI and Node backend for client onboarding; writes approved output under `.markos-local/`.</purpose>
  <file path="onboarding/index.html">
    Multi-step onboarding form. Privacy notice banner (id="privacyNotice").
    Steps: Company -> Product -> Audience -> Competitive -> Launch.
  </file>
  <file path="onboarding/onboarding.js">UI logic, draft polling, approve/regenerate, localStorage.</file>
  <file path="onboarding/onboarding.css">Onboarding UI styles.</file>
  <file path="onboarding/onboarding-config.json">Runtime config: port, paths, slug (read by server).</file>
  <file path="onboarding/onboarding-seed.schema.json">JSON Schema for onboarding payload.</file>

  <dir path="onboarding/backend">
    <purpose>HTTP server and AI orchestration (no heavy framework).</purpose>
    <file path="onboarding/backend/server.cjs">
      Routes: GET /, GET /config, GET /status, POST /submit, POST /regenerate, POST /approve.
      Boot: ensure vector providers as configured, then listen (default port 4242, fallback 4243).
      Persists `project_slug` to `.markos-project.json` on submit where applicable.
    </file>
    <file path="onboarding/backend/write-mir.cjs">
      Writes approved drafts into `.markos-local/MIR/` (and related paths per SECTION_FILE_MAP).
      JIT clone from `.agent/markos/templates/MIR/` when local MIR files are missing.
      May update `.planning/STATE.md` completion markers when configured.
    </file>
    <file path="onboarding/backend/vector-store-client.cjs">
      Supabase + Upstash Vector HTTP integration.
      Collection naming and compatibility reads: see `getCollectionReadPrefixes()` in source.
    </file>
    <file path="onboarding/backend/runtime-context.cjs">Hosted vs local persistence, telemetry env, slug guards.</file>
    <file path="onboarding/backend/path-constants.cjs">Canonical path resolution for templates and outputs.</file>
    <file path="onboarding/backend/utils.cjs">Shared HTTP helpers.</file>

    <dir path="onboarding/backend/agents">
      <file path="onboarding/backend/agents/llm-adapter.cjs">Unified LLM calls (OpenAI / Anthropic / Gemini).</file>
      <file path="onboarding/backend/agents/orchestrator.cjs">Parallel MIR/MSP draft generation; vector storage.</file>
      <file path="onboarding/backend/agents/mir-filler.cjs">MIR draft generation.</file>
      <file path="onboarding/backend/agents/msp-filler.cjs">MSP draft generation.</file>
      <file path="onboarding/backend/agents/telemetry.cjs">Backend telemetry helpers.</file>
    </dir>
  </dir>
</dir>

<!-- ==================== test/ ==================== -->
<dir path="test">
  <purpose>Node built-in test runner (`node --test`). Run via `npm test` or `node --test test/**/*.test.js`.</purpose>
  <file path="test/setup.js">Shared test helpers.</file>
  <file path="test/install.test.js">Install lifecycle.</file>
  <file path="test/update.test.js">Update lifecycle.</file>
  <file path="test/onboarding-server.test.js">Server and onboarding E2E.</file>
  <file path="test/protocol.test.js">Protocol integrity and `.agent/markos` link checks.</file>
  <file path="test/write-mir.test.js">write-mir behavior.</file>
  <file path="test/example-resolver.test.js">Example injection logic.</file>
</dir>

<!-- ==================== .agent/ ==================== -->
<dir path=".agent">
  <purpose>Versioned protocol engine (installed by `npx markos`) and GSD methodology.</purpose>
  <dir path=".agent/get-shit-done">
    <purpose>GSD workflow engine, planners, and `gsd-tools` CLI patterns.</purpose>
  </dir>
  <dir path=".agent/markos">
    <purpose>MarkOS protocol corpus: MARKOS-INDEX, agents, workflows, templates.</purpose>
    <file path=".agent/markos/MARKOS-INDEX.md">Registry of paths, skills, and ITM tokens.</file>
  </dir>
  <dir path=".agent/prompts">
    <purpose>Channel execution prompts (inject from `.markos-local/`, not from templates).</purpose>
  </dir>
  <dir path=".agent/skills">
    <purpose>Cursor skills: `markos-*` (MarkOS) live here; user may also install `gsd-*` skills for GSD.</purpose>
    <file path=".agent/skills/markos-plan-phase/SKILL.md">Example: phase planning skill entry.</file>
  </dir>
</dir>

<!-- ==================== .markos-local/ ==================== -->
<dir path=".markos-local">
  <purpose>Client workspace. Gitignored.</purpose>
  <dir path=".markos-local/MIR">Approved MIR files.</dir>
  <dir path=".markos-local/MSP">Approved MSP files and discipline folders.</dir>
  <dir path=".markos-local/MSP/&lt;discipline&gt;/WINNERS">Winners catalogs per channel.</dir>
  <file path=".markos-project.json">Persistent project slug and metadata.</file>
</dir>

<!-- ==================== .planning/ ==================== -->
<dir path=".planning">
  <purpose>GSD planning state for this repo.</purpose>
  <file path=".planning/PROJECT.md">Scope, milestone framing, pillars.</file>
  <file path=".planning/STATE.md">Canonical current milestone, phase, and next actions.</file>
  <file path=".planning/ROADMAP.md">Phase history and future work.</file>
  <dir path=".planning/phases">Per-phase PLAN, research, verification artifacts.</dir>
  <dir path=".planning/milestones">Milestone-scoped history and archives.</dir>
</dir>

</markos_codebase_map>
