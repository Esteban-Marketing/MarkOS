<markos_codebase_map>
<purpose>LLM-navigable, token-efficient map of every source file in the MARKOS repository.
Read this file after QUICKSTART.md to locate any component without filesystem search.</purpose>
<last_updated>2026-03-25</last_updated>
<implementation_index>
  <file path="onboarding/backend/agents/orchestrator.cjs">Draft generation orchestrator and retry boundaries.</file>
  <file path="onboarding/backend/agents/llm-adapter.cjs">LLM provider routing, fallback behavior, output contract.</file>
  <file path="onboarding/backend/server.cjs">HTTP onboarding runtime and endpoint surface.</file>
  <file path="onboarding/backend/vector-store-client.cjs">Supabase \+ Upstash Vector persistence and retrieval boundaries.</file>
</implementation_index>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ROOT
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<root>
  <file path="README.md">Project overview, quick-start, architecture guide for humans.</file>
  <file path="CHANGELOG.md">Versioned history of all MARKOS protocol changes.</file>
  <file path="VERSION">Single-line semver string (e.g. "1.1.0"). Read by install.cjs and update.cjs.</file>
  <file path="package.json">npm binaries: `markos install|update`. Dev deps: dotenv, openai, Supabase \+ Upstash Vector.</file>
  <file path=".env.example">Template for required secrets. Copy to `.env`. Variables: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, UPSTASH_VECTOR_REST_URL.</file>
  <file path=".gitignore">Excludes: node_modules/, .env, .markos-local/ (client data NEVER committed).</file>
  <file path="GEMINI.md">Gemini-specific agent boot rules. Points to .protocol-lore/QUICKSTART.md.</file>
  <file path="CLAUDE.md">Claude-specific agent boot rules. Same pointer.</file>
  <file path="tokenize.cjs">Utility: counts tokens in MIR/MSP files. Used during optimization passes.</file>
  <file path="patch.ps1">PowerShell helper for applying local patches after a version update.</file>
</root>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     .protocol-lore/  â€” Agent navigation layer (READ FIRST)
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path=".protocol-lore">
  <purpose>Machine-readable protocol knowledge base. Mandatory pre-read for any agent session.</purpose>
  <file path="QUICKSTART.md">MANDATORY AGENT-BOOT. Context search map, high-frequency commands, boundary defs, DEFCON handoff, override logic.</file>
  <file path="INDEX.md">XML pointer map to all other .protocol-lore files.</file>
  <file path="ARCHITECTURE.md">Component interaction model: MIR â†’ MSP â†’ Orchestrator â†’ Executor â†’ Verifier flow.</file>
  <file path="WORKFLOWS.md">Machine-readable workflow loops: autonomous, onboarding, ensure_vector, linear-sync, defcon-blitz.</file>
  <file path="CONVENTIONS.md">Execution rules: override resolution, [HUMAN] tags, project_slug persistence, privacy banner.</file>
  <file path="TEAM.md">Hybrid human+AI roster. Agent IDs, team groups, lifecycle steps.</file>
  <file path="TEMPLATES.md">Token map of MIR/MSP/ITM template paths. Replaces need to load full MARKOS-INDEX.md.</file>
  <file path="MEMORY.md">Upstash Vector mechanics: episodic memory, embedding rules, agent query patterns, slug persistence.</file>
  <file path="DEFCON.md">Escalation thresholds and risk management protocols.</file>
  <file path="CODEBASE-MAP.md">THIS FILE. Full filesystem map for LLM navigation.</file>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     bin/  â€” CLI entry points (run by `npx markos`)
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path="bin">
  <purpose>CLI executables. Called by `package.json` bin scripts. Never imported by browser code.</purpose>
  <file path="bin/install.cjs">
    First-run installer. Copies `.agent/markos/` templates into user's project.
    Writes `.markos-install-manifest.json` for idempotent re-runs and patch detection.
    Delegates Supabase \+ Upstash Vector daemon startup to `ensure-vector.cjs`.
    Entrypoint: `npx markos install`
  </file>
  <file path="bin/update.cjs">
    Updater. Computes SHA256 hashes of installed files vs new version.
    Only overwrites files the user hasn't locally patched.
    Reads/writes `.markos-install-manifest.json`.
    Entrypoint: `npx markos update`
  </file>
  <file path="bin/ensure-vector.cjs">
    Auto-healing Supabase \+ Upstash Vector daemon. Pings `localhost:8000/api/v2/heartbeat`.
    If dead AND no `UPSTASH_VECTOR_REST_URL` is set, spawns `python -m Supabase \+ Upstash Vector.cli.cli run` as detached daemon.
    Called by: `bin/install.cjs` and `onboarding/backend/server.cjs` before boot.
    Export: `ensureVector()` â€” returns Promise.
  </file>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     onboarding/  â€” Web UI + AI backend for client onboarding
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path="onboarding">
  <purpose>Self-contained client onboarding engine. Serves a multi-step HTML form, runs AI agents on submission, writes approved outputs to .markos-local/MIR/.</purpose>
  <file path="onboarding/index.html">
    Multi-step onboarding form (5 steps). Includes dismissible AI Data Privacy Notice banner
    (id="privacyNotice"). Steps: Company â†’ Product â†’ Audience â†’ Competitive â†’ Launch.
    Loads: onboarding.js, onboarding.css.
  </file>
  <file path="onboarding/onboarding.js">
    All UI logic: step navigation, draft polling, approve/regenerate, form state persistence (localStorage).
    Privacy banner dismiss logic: key `markos_privacy_accepted`.
    Calls backend endpoints: POST /submit, POST /regenerate, POST /approve.
  </file>
  <file path="onboarding/onboarding.css">Custom design system for the onboarding UI. Dark-mode glassmorphism theme.</file>
  <file path="onboarding/onboarding-config.json">
    Local runtime config read by server.cjs.
    Keys: port (default 4242), auto_open_browser, output_path, vector_endpoint, project_slug, mir_output_path.
    Override this file to change server behavior without modifying source.
  </file>
  <file path="onboarding/onboarding-seed.schema.json">
    JSON Schema for the onboarding form payload.
    Defines all accepted fields: company (name, industry, mission, brand_values, tone_of_voice...),
    product (name, category, primary_benefit, top_features...), audience, competitive, market sections.
    Agents read this schema to know expected input shape.
  </file>

  <dir path="onboarding/backend">
    <purpose>Node.js HTTP server + AI orchestration layer. No external framework dependency.</purpose>
    <file path="onboarding/backend/server.cjs">
      MAIN ENTRY POINT for the onboarding engine.
      Routes: GET /, GET /config, GET /status, POST /submit, POST /regenerate, POST /approve.
      Boot sequence: ensureVector() â†’ server.listen().
      Port fallback: if 4242 in use, tries 4243.
      On POST /submit: reads seed, computes/persists project_slug to .markos-project.json, runs orchestrator.
      On POST /approve: calls write-mir.cjs â†’ writes to .markos-local/MIR/.
    </file>
    <file path="onboarding/backend/write-mir.cjs">
      Writes approved AI drafts into local MIR template files.
      3-step write flow:
        1. JIT clone: if .markos-local/MIR/ file doesn't exist, copy from .agent/templates/MIR/
        2. Fuzzy-match: find matching ## header in template, replace body content
        3. Fallback: if no header match, append as Fallback Draft Insert block
      Also updates STATE.md rows from `empty` â†’ `complete` with ISO date.
      Key map: SECTION_FILE_MAP â€” section_key â†’ MIR relative path.
      Export: applyDrafts(mirPath, baseMirPath, approvedDrafts) â†’ { written, stateUpdated, errors }
    </file>
    <file path="onboarding/backend/vector-store-client.cjs">
      Thin wrapper around Supabase \+ Upstash Vector HTTP API.
      Reads UPSTASH_VECTOR_REST_URL (cloud) or falls back to localhost:8000 (local).
      Per-project collection: `markos-{project_slug}`.
      Exports: configure(host), healthCheck(), storeDraft(slug, section, text), getDrafts(slug).
    </file>

    <dir path="onboarding/backend/agents">
      <purpose>AI agent modules that generate MIR/MSP draft content from onboarding seed data.</purpose>
      <file path="onboarding/backend/agents/llm-adapter.cjs">
        Unified LLM call wrapper. Priority: OPENAI_API_KEY â†’ ANTHROPIC_API_KEY â†’ GEMINI_API_KEY.
        Uses native fetch for Anthropic/Gemini; openai NPM package for OpenAI.
        Export: call(systemPrompt, userPrompt, opts) â†’ { ok, text, error }
      </file>
      <file path="onboarding/backend/agents/orchestrator.cjs">
        Runs all MIR+MSP generators in parallel. Handles exponential backoff retry.
        Stores all drafts into Supabase \+ Upstash Vector after generation.
      </file>
      <file path="onboarding/backend/agents/mir-filler.cjs">
        Generates MIR (Marketing Intelligence Repo) draft content.
        Updated: Injects LEAN-CANVAS and JTBD-MATRIX logic based on seed.
      </file>
      <file path="onboarding/backend/agents/msp-filler.cjs">
        Generates MSP (Marketing Strategy Plan) draft content.
        Updated: Anchored to `.markos-local/MSP/*/WINNERS/` catalogs.
      </file>
    </dir>
    <file path="onboarding/backend/path-constants.cjs">Centralized path resolution. Prevents "dot-hell" in v1.2+.</file>
    <file path="onboarding/backend/utils.cjs">Shared utilities for body parsing, JSON serialization, and response handling.</file>
  </dir>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     test/  â€” Zero-dependency integration test suite
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path="test">
  <purpose>Node built-in test runner (`node --test`). No jest/mocha. Tests run against real tmpdir copies of the codebase.</purpose>
  <file path="test/setup.js">Shared test helpers: createTestEnvironment(), runCLI(), readManifest().</file>
  <file path="test/install.test.js">Suite 1: Install lifecycle â€” fresh install, idempotency, version stamp.</file>
  <file path="test/onboarding-server.test.js">Suite 3: Server port fallback, privacy banner, POST /submit E2E.</file>
  <file path="test/protocol.test.js">Suite 2: MIR/MSP file integrity â€” checks all referenced files exist.</file>
  <file path="test/update.test.js">Suite 4: Update lifecycle â€” hash-comparison patching.</file>
  <file path="test/write-mir.test.js">Suite 5: write-mir.cjs unit â€” JIT cloning, fuzzy-merge.</file>
  <file path="test/example-resolver.test.js">Suite 6: Verifies business_model example injection logic.</file>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     .agent/  â€” Protocol engine
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path=".agent">
  <purpose>The MARKOS protocol engine. Version-controlled by npx install/update.</purpose>
  <dir path=".agent/prompts">
    <purpose>Execution Layer. Logic templates for specialized agents.</purpose>
    <file path=".agent/prompts/paid_media_creator.md">Creative strategist for paid acquisition.</file>
    <file path=".agent/prompts/email_lifecycle_strategist.md">CRM and retention copywriter.</file>
    <file path=".agent/prompts/cro_landing_page_builder.md">High-conversion wireframer.</file>
    <file path=".agent/prompts/seo_content_architect.md">Organic search and authority builder.</file>
    <file path=".agent/prompts/telemetry_synthesizer.md">PostHog/Analytics insight generator.</file>
  </dir>
  <file path=".agent/markos/MARKOS-INDEX.md">Full token registry. Updated for v1.2.</file>
  <dir path=".agent/skills">
    <purpose>GSD and MARKOS skill definitions.</purpose>
    <file path=".agent/skills/markos-new-project/SKILL.md">Initializes project + launches onboarding.</file>
    <file path=".agent/skills/markos-plan-phase/SKILL.md">Researcher â†’ Planner â†’ Checker chain.</file>
  </dir>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     .markos-local/  â€” Client workspace
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path=".markos-local">
  <purpose>Client-specific override layer. Never committed to git.</purpose>
  <dir path=".markos-local/MIR">Approved MIR strategy files.</dir>
  <dir path=".markos-local/MSP">Approved MSP strategic blueprints.</dir>
  <dir path=".markos-local/MSP/<discipline>/WINNERS">Historical winners catalogues for agent anchoring.</dir>
  <file path=".markos-project.json">Persistent project slug and metadata.</file>
</dir>

<!-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     .planning/  â€” GSD planning state
     â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• -->
<dir path=".planning">
  <file path=".planning/PROJECT.md">Project scope, current milestone, architectural pillars.</file>
  <file path=".planning/STATE.md">Current milestone, active phase, last commit context.</file>
  <file path=".planning/ROADMAP.md">Full history of phases 01-15 and future vision.</file>
  <dir path=".planning/phases">Documentation artifacts (PLAN, SUMMARY, VERIFICATION) for every phase.</dir>
</dir>

</markos_codebase_map>


