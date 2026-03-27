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
  <desc>Smart Onboarding Engine v2.0. Omni-input extraction pipeline.</desc>
  <file>onboarding/backend/server.cjs — HTTP server, Omni-Input Gate (URL/Files)</file>
  <file>onboarding/backend/agents/orchestrator.cjs — Parallel extraction, confidence scoring</file>
  <file>onboarding/backend/agents/mir-filler.cjs — MIR draft generators (weighted by business_model)</file>
  <file>onboarding/backend/agents/msp-filler.cjs — MSP draft generators (anchored to winners)</file>
  <file>onboarding/backend/path-constants.cjs — Centralized path resolution ("dot-hell" prevention)</file>
</layer>

<layer id="data_isolation">
  <desc>Strict separation between protocol engine, client logic, and data layers.</desc>
  <layer id="execution_layer">
    <path>.agent/prompts/</path>
    <rule>Logic Layer. Holds specialized agent prompt templates (e.g., paid_media_creator.md).</rule>
    <rule>Uses `{{ inject: [PATH] }}` syntax to pull context from Data Layer.</rule>
  </layer>
  <layer id="protocol_data_layer">
    <path>.agent/marketing-get-shit-done/templates/MIR/</path>
    <path>.agent/marketing-get-shit-done/templates/MSP/</path>
    <rule>Base templates. Version-controlled. NEVER write client data here.</rule>
  </layer>
  <layer id="client_workspace">
    <path>.mgsd-local/MIR/</path>
    <path>.mgsd-local/MSP/</path>
    <rule>Client State Layer. Gitignored. Stores project-specific strategy and approved assets.</rule>
    <path>.mgsd-local/MSP/<discipline>/WINNERS/</path>
    <rule>Historical Anchoring Layer. Agents MUST read catalogs here before generation.</rule>
  </layer>
</layer>

<components>
  <comp id="mir">MIR (Marketing Intelligence Repo). Dual-engine strategy: Lean Canvas (Physics) + JTBD (Psychology).</comp>
  <comp id="msp">MSP (Marketing Strategy Plan). Blueprint for execution channels. Anchored to local Winners Catalogs.</comp>
  <comp id="prompts">Specialized Prompt Registry (.agent/prompts/). Decouples "What to do" from "Who is being served".</comp>
  <comp id="orchestrator">execute-phase.md skill. Cross-discipline wave-based parallelization.</comp>
</components>

<flow>
  <!-- Onboarding Flow (v2.0) -->
  1. Human runs `npx marketing-get-shit-done install` → bin/install.cjs
  2. server.cjs receives Omni-Input (URL/Files) → orchestrator.cjs parallel extraction
  3. LLM Scorer assigns confidence (R/Y/G) → server.cjs conducts gap-fill interview
  4. Human approves → write-mir.cjs fuzzy-merges content into .mgsd-local/MIR/

  <!-- Execution Flow (v1.2) -->
  5. Manager calls mgsd-plan-phase → creates waved PLAN.md
  6. Creator Agent Boots → Reads .mgsd-local/MSP/*/WINNERS/_CATALOG.md ([ANCHOR])
  7. Executor calls prompt registry → Injects {{ MIR }} + {{ MSP }} data into .agent/prompts/ logic
  8. Final output Nyquist-verified against mir-gates.md requirements
</flow>
</mgsd_arch>
