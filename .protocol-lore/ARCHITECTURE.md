<mgsd_arch>
<purpose>Defines all major system components, their responsibilities, and how they interact.
LLMs: read this to understand the data flow before modifying any layer of the system.</purpose>

<layer id="navigation">
  <desc>Protocol knowledge base. Read first during any agent session.</desc>
  <file>.protocol-lore/QUICKSTART.md — mandatory boot entry point</file>
  <file>.protocol-lore/CODEBASE-MAP.md — full filesystem map with file purposes</file>
  <file>.planning/STATE.md — current milestone and active phase</file>
</layer>

<layer id="cli_binaries">
  <desc>npm executables. Entry points for `npx marketing-get-shit-done`.</desc>
  <file>bin/install.cjs — first-run install, template copy, ChromaDB boot delegation</file>
  <file>bin/update.cjs — SHA256 idempotent update, patch-safe</file>
  <file>bin/ensure-chroma.cjs — auto-healing ChromaDB daemon, called by install + server</file>
</layer>

<layer id="onboarding_engine">
  <desc>Web-based client onboarding pipeline. Serves form → runs AI → writes MIR.</desc>
  <file>onboarding/backend/server.cjs — HTTP server, routes, boot sequence, slug persistence</file>
  <file>onboarding/backend/agents/orchestrator.cjs — parallel LLM generation, Chroma storage</file>
  <file>onboarding/backend/agents/mir-filler.cjs — MIR draft generators (Company/Audience/Competitive)</file>
  <file>onboarding/backend/agents/msp-filler.cjs — MSP draft generators (Brand Voice/Channels)</file>
  <file>onboarding/backend/agents/llm-adapter.cjs — unified OpenAI/Anthropic/Gemini wrapper</file>
  <file>onboarding/backend/chroma-client.cjs — ChromaDB HTTP client, per-project namespacing</file>
  <file>onboarding/backend/write-mir.cjs — JIT clone, fuzzy-merge, STATE.md stamping</file>
</layer>

<layer id="data_isolation">
  <desc>Strict separation between protocol engine and client data.</desc>
  <layer id="protocol_layer">
    <path>.agent/marketing-get-shit-done/templates/MIR/</path>
    <rule>Base templates. Version-controlled. NEVER write client data here.</rule>
    <rule>Overwritten on every `npx marketing-get-shit-done update`.</rule>
  </layer>
  <layer id="client_data_layer">
    <path>.mgsd-local/MIR/</path>
    <rule>Client override layer. Gitignored. Written by write-mir.cjs on POST /approve.</rule>
    <rule>JIT-cloned from base templates on first write. Safe from updates forever.</rule>
    <path>.mgsd-project.json</path>
    <rule>Persistent project slug. Written once on first POST /submit. Never regenerated.</rule>
  </layer>
</layer>

<components>
  <comp id="mir">MIR (Marketing Intelligence Repo). Gates 1/2. Ground truth brand/audience/competitive facts.
  Files: .mgsd-local/MIR/Core_Strategy/01_COMPANY/, 02_BRAND/, Market_Audiences/03_MARKET/, Products/04_PRODUCTS/</comp>
  <comp id="msp">MSP (Marketing Strategy Plan). Strategic channel blueprints mapped from MIR.
  Files: .mgsd-local/MSP/Strategy/, Channels/, Campaigns/</comp>
  <comp id="orchestrator">execute-phase.md skill. Groups tasks → waves → spawns executor agents.</comp>
  <comp id="executor">execute-plan.md skill. Handles file edits, commits. Auto-pauses on [HUMAN] tag.</comp>
  <comp id="verifier">verification-patterns.md. 7-dimension Nyquist validation. Enforces MIR gates.</comp>
</components>

<flow>
  <!-- Onboarding Flow -->
  1. Human runs `npx marketing-get-shit-done install` → bin/install.cjs
  2. install.cjs delegates to bin/ensure-chroma.cjs (boot ChromaDB daemon)
  3. Human runs `node onboarding/backend/server.cjs` → boots HTTP server on port 4242
  4. Human fills form at localhost:4242 → POST /submit
  5. server.cjs writes .mgsd-project.json (slug) → calls orchestrator.cjs
  6. orchestrator runs mir-filler + msp-filler in parallel → stores in ChromaDB
  7. Human approves drafts → POST /approve
  8. write-mir.cjs JIT-clones templates → fuzzy-merges drafts → stamps STATE.md

  <!-- Strategic Planning Flow (after onboarding complete) -->
  9. Agent reads .mgsd-local/MIR/ (resolves [override] against .agent/templates/)
  10. mgsd-plan-phase: researcher → planner → checker → PLAN.md
  11. mgsd-execute-phase: waves → executor → commits
  12. mgsd-verify-work: 7-dimension Nyquist audit → VERIFICATION.md
</flow>
</mgsd_arch>
