<mgsd_codebase_map>
<purpose>LLM-navigable, token-efficient map of every source file in the MGSD repository.
Read this file after QUICKSTART.md to locate any component without filesystem search.</purpose>
<last_updated>2026-03-25</last_updated>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOT
     ═══════════════════════════════════════════════════════════════════════════ -->
<root>
  <file path="README.md">Project overview, quick-start, architecture guide for humans.</file>
  <file path="CHANGELOG.md">Versioned history of all MGSD protocol changes.</file>
  <file path="VERSION">Single-line semver string (e.g. "1.1.0"). Read by install.cjs and update.cjs.</file>
  <file path="package.json">npm binaries: `marketing-get-shit-done install|update`. Dev deps: dotenv, openai, chromadb.</file>
  <file path=".env.example">Template for required secrets. Copy to `.env`. Variables: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, CHROMA_CLOUD_URL.</file>
  <file path=".gitignore">Excludes: node_modules/, .env, .mgsd-local/ (client data NEVER committed).</file>
  <file path="GEMINI.md">Gemini-specific agent boot rules. Points to .protocol-lore/QUICKSTART.md.</file>
  <file path="CLAUDE.md">Claude-specific agent boot rules. Same pointer.</file>
  <file path="tokenize.cjs">Utility: counts tokens in MIR/MSP files. Used during optimization passes.</file>
  <file path="patch.ps1">PowerShell helper for applying local patches after a version update.</file>
</root>

<!-- ═══════════════════════════════════════════════════════════════════════════
     .protocol-lore/  — Agent navigation layer (READ FIRST)
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path=".protocol-lore">
  <purpose>Machine-readable protocol knowledge base. Mandatory pre-read for any agent session.</purpose>
  <file path="QUICKSTART.md">MANDATORY AGENT-BOOT. Context search map, high-frequency commands, boundary defs, DEFCON handoff, override logic.</file>
  <file path="INDEX.md">XML pointer map to all other .protocol-lore files.</file>
  <file path="ARCHITECTURE.md">Component interaction model: MIR → MSP → Orchestrator → Executor → Verifier flow.</file>
  <file path="WORKFLOWS.md">Machine-readable workflow loops: autonomous, onboarding, ensure_chroma, linear-sync, defcon-blitz.</file>
  <file path="CONVENTIONS.md">Execution rules: override resolution, [HUMAN] tags, project_slug persistence, privacy banner.</file>
  <file path="TEAM.md">Hybrid human+AI roster. Agent IDs, team groups, lifecycle steps.</file>
  <file path="TEMPLATES.md">Token map of MIR/MSP/ITM template paths. Replaces need to load full MGSD-INDEX.md.</file>
  <file path="MEMORY.md">Chroma VectorDB mechanics: episodic memory, embedding rules, agent query patterns, slug persistence.</file>
  <file path="DEFCON.md">Escalation thresholds and risk management protocols.</file>
  <file path="CODEBASE-MAP.md">THIS FILE. Full filesystem map for LLM navigation.</file>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     bin/  — CLI entry points (run by `npx marketing-get-shit-done`)
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path="bin">
  <purpose>CLI executables. Called by `package.json` bin scripts. Never imported by browser code.</purpose>
  <file path="bin/install.cjs">
    First-run installer. Copies `.agent/marketing-get-shit-done/` templates into user's project.
    Writes `.mgsd-install-manifest.json` for idempotent re-runs and patch detection.
    Delegates ChromaDB daemon startup to `ensure-chroma.cjs`.
    Entrypoint: `npx marketing-get-shit-done install`
  </file>
  <file path="bin/update.cjs">
    Updater. Computes SHA256 hashes of installed files vs new version.
    Only overwrites files the user hasn't locally patched.
    Reads/writes `.mgsd-install-manifest.json`.
    Entrypoint: `npx marketing-get-shit-done update`
  </file>
  <file path="bin/ensure-chroma.cjs">
    Auto-healing ChromaDB daemon. Pings `localhost:8000/api/v2/heartbeat`.
    If dead AND no `CHROMA_CLOUD_URL` is set, spawns `python -m chromadb.cli.cli run` as detached daemon.
    Called by: `bin/install.cjs` and `onboarding/backend/server.cjs` before boot.
    Export: `ensureChroma()` — returns Promise.
  </file>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     onboarding/  — Web UI + AI backend for client onboarding
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path="onboarding">
  <purpose>Self-contained client onboarding engine. Serves a multi-step HTML form, runs AI agents on submission, writes approved outputs to .mgsd-local/MIR/.</purpose>
  <file path="onboarding/index.html">
    Multi-step onboarding form (5 steps). Includes dismissible AI Data Privacy Notice banner
    (id="privacyNotice"). Steps: Company → Product → Audience → Competitive → Launch.
    Loads: onboarding.js, onboarding.css.
  </file>
  <file path="onboarding/onboarding.js">
    All UI logic: step navigation, draft polling, approve/regenerate, form state persistence (localStorage).
    Privacy banner dismiss logic: key `mgsd_privacy_accepted`.
    Calls backend endpoints: POST /submit, POST /regenerate, POST /approve.
  </file>
  <file path="onboarding/onboarding.css">Custom design system for the onboarding UI. Dark-mode glassmorphism theme.</file>
  <file path="onboarding/onboarding-config.json">
    Local runtime config read by server.cjs.
    Keys: port (default 4242), auto_open_browser, output_path, chroma_host, project_slug, mir_output_path.
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
      Boot sequence: ensureChroma() → server.listen().
      Port fallback: if 4242 in use, tries 4243.
      On POST /submit: reads seed, computes/persists project_slug to .mgsd-project.json, runs orchestrator.
      On POST /approve: calls write-mir.cjs → writes to .mgsd-local/MIR/.
    </file>
    <file path="onboarding/backend/write-mir.cjs">
      Writes approved AI drafts into local MIR template files.
      3-step write flow:
        1. JIT clone: if .mgsd-local/MIR/ file doesn't exist, copy from .agent/templates/MIR/
        2. Fuzzy-match: find matching ## header in template, replace body content
        3. Fallback: if no header match, append as Fallback Draft Insert block
      Also updates STATE.md rows from `empty` → `complete` with ISO date.
      Key map: SECTION_FILE_MAP — section_key → MIR relative path.
      Export: applyDrafts(mirPath, baseMirPath, approvedDrafts) → { written, stateUpdated, errors }
    </file>
    <file path="onboarding/backend/chroma-client.cjs">
      Thin wrapper around ChromaDB HTTP API.
      Reads CHROMA_CLOUD_URL (cloud) or falls back to localhost:8000 (local).
      Per-project collection: `mgsd-{project_slug}`.
      Exports: configure(host), healthCheck(), storeDraft(slug, section, text), getDrafts(slug).
    </file>

    <dir path="onboarding/backend/agents">
      <purpose>AI agent modules that generate MIR/MSP draft content from onboarding seed data.</purpose>
      <file path="onboarding/backend/agents/llm-adapter.cjs">
        Unified LLM call wrapper. Priority: OPENAI_API_KEY → ANTHROPIC_API_KEY → GEMINI_API_KEY.
        Uses native fetch for Anthropic/Gemini; openai NPM package for OpenAI.
        Export: call(systemPrompt, userPrompt, opts) → { ok, text, error }
      </file>
      <file path="onboarding/backend/agents/orchestrator.cjs">
        Runs all MIR+MSP generators in parallel (Promise.allSettled).
        Handles exponential backoff retry (3 attempts, 1.5s base delay, 2x multiplier).
        Stores all drafts into ChromaDB after generation.
        Export: orchestrate(seed, slug) → { drafts, chromaResults, errors }
      </file>
      <file path="onboarding/backend/agents/mir-filler.cjs">
        Generates MIR (Marketing Intelligence Repository) draft content.
        Functions:
          generateCompanyProfile(seed) → Core_Strategy/01_COMPANY/PROFILE.md
          generateMissionVisionValues(seed) → Core_Strategy/01_COMPANY/MISSION-VISION-VALUES.md
          generateAudienceProfile(seed) → Market_Audiences/03_MARKET/AUDIENCES.md
          generateCompetitiveLandscape(seed) → Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md
        Each function calls llm-adapter.call() with a structured marketing prompt.
      </file>
      <file path="onboarding/backend/agents/msp-filler.cjs">
        Generates MSP (Marketing Strategy Plan) draft content.
        Functions:
          generateBrandVoice(seed) → Core_Strategy/02_BRAND/VOICE-TONE.md
          generateChannelStrategy(seed) → MSP/Strategy/00_MASTER-PLAN/CHANNEL-STRATEGY.md
        Each function calls llm-adapter.call() with a structured strategy prompt.
      </file>
    </dir>
  </dir>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     test/  — Zero-dependency integration test suite
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path="test">
  <purpose>Node built-in test runner (`node --test`). No jest/mocha. Tests run against real tmpdir copies of the codebase.</purpose>
  <file path="test/setup.js">Shared test helpers: createTestEnvironment(), runCLI(), readManifest(). Creates isolated tmp dirs with seeded .agent/ and onboarding/ content.</file>
  <file path="test/install.test.js">Suite 1: Install lifecycle — fresh install, idempotency, version stamp.</file>
  <file path="test/onboarding-server.test.js">Suite 3: Server port fallback, privacy banner presence, POST /submit end-to-end including AI draft pipeline (requires NODE_PATH to resolve openai from root).</file>
  <file path="test/protocol.test.js">Suite 2: MIR/MSP file integrity — checks all referenced files exist.</file>
  <file path="test/update.test.js">Suite 4: Update lifecycle — hash-comparison patching, user-modified file preservation.</file>
  <file path="test/write-mir.test.js">Suite 5: write-mir.cjs unit — JIT cloning, fuzzy-merge content append, STATE.md row updates.</file>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     .agent/  — Protocol engine (DO NOT MODIFY unless extending protocol)
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path=".agent">
  <purpose>The MGSD protocol engine. Version-controlled by npx install/update. Client data is NEVER stored here.</purpose>
  <file path=".agent/marketing-get-shit-done/MGSD-INDEX.md">Full token registry of all MIR/MSP templates. 21KB+ — use .protocol-lore/TEMPLATES.md instead when context is limited.</file>
  <file path=".agent/marketing-get-shit-done/templates/MIR/">Base MIR template files. DO NOT WRITE CLIENT DATA HERE. Use .mgsd-local/MIR/ overrides instead.</file>
  <dir path=".agent/skills">
    <purpose>GSD and MGSD skill definitions. Each has a SKILL.md with execution instructions.</purpose>
    <file path=".agent/skills/mgsd-new-project/SKILL.md">Initializes a new client project. Launches onboarding/backend/server.cjs.</file>
    <file path=".agent/skills/mgsd-plan-phase/SKILL.md">Creates PLAN.md with researcher→planner→checker agent chain.</file>
    <file path=".agent/skills/mgsd-execute-phase/SKILL.md">Executes all plans in a phase with wave-based parallelization.</file>
    <!-- ...additional skills follow same pattern -->
  </dir>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     .mgsd-local/  — Client workspace (gitignored, client-specific overrides)
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path=".mgsd-local">
  <purpose>Client-specific override layer. Never committed to git. Decouples client data from protocol engine.</purpose>
  <file path=".mgsd-local/MIR/">JIT-cloned MIR files with client-approved AI draft content. Written by write-mir.cjs POST /approve.</file>
  <file path=".mgsd-project.json">Persistent project state. Keys: project_slug (ChromaDB namespace), client_name, installed_at. Written once by server.cjs on first POST /submit.</file>
</dir>

<!-- ═══════════════════════════════════════════════════════════════════════════
     .planning/  — GSD planning state
     ═══════════════════════════════════════════════════════════════════════════ -->
<dir path=".planning">
  <file path=".planning/STATE.md">Current milestone, active phase, last commit context. First read after .protocol-lore/ files during agent boot.</file>
  <file path=".planning/milestones/">Phase-by-phase PLAN.md history organized by milestone version.</file>
</dir>

</mgsd_codebase_map>
