<markos_arch>
<purpose>Major components, responsibilities, and data flow. Read before changing any layer.</purpose>

<layer id="navigation">
  <desc>Protocol knowledge base. Read during every agent session.</desc>
  <file>.protocol-lore/QUICKSTART.md — mandatory boot entry</file>
  <file>.protocol-lore/CODEBASE-MAP.md — filesystem map</file>
  <file>.planning/STATE.md — canonical milestone and phase (GSD)</file>
</layer>

<layer id="cli_binaries">
  <desc>npm package `markos` exposes `bin/install.cjs`. Primary CLI: `npx markos` (install) and `npx markos update`.</desc>
  <file>bin/install.cjs — first-run install, template copy, vector boot delegation</file>
  <file>bin/update.cjs — SHA256 idempotent update</file>
  <file>bin/ensure-vector.cjs — Supabase + Upstash Vector health / local daemon</file>
</layer>

<layer id="onboarding_engine">
  <desc>Onboarding Engine v2: omni-input extraction, scoring, approve path.</desc>
  <file>onboarding/backend/server.cjs — HTTP server</file>
  <file>onboarding/backend/runtime-context.cjs — local vs hosted, auth, slug guards</file>
  <file>onboarding/backend/agents/orchestrator.cjs — parallel draft generation</file>
  <file>onboarding/backend/agents/mir-filler.cjs — MIR drafts</file>
  <file>onboarding/backend/agents/msp-filler.cjs — MSP drafts</file>
  <file>onboarding/backend/path-constants.cjs — canonical paths</file>
</layer>

<layer id="data_isolation">
  <desc>Separate protocol templates, execution prompts, and client state.</desc>
  <layer id="execution_layer">
    <path>.agent/prompts/</path>
    <rule>Channel execution prompts; inject fragments from client MIR/MSP via tokens.</rule>
  </layer>
  <layer id="protocol_data_layer">
    <path>.agent/markos/templates/MIR/</path>
    <path>.agent/markos/templates/MSP/</path>
    <rule>Versioned templates only; never persist client data here.</rule>
  </layer>
  <layer id="client_workspace">
    <path>.markos-local/MIR/</path>
    <path>.markos-local/MSP/</path>
    <path>.markos-local/MSP/{discipline}/WINNERS/</path>
    <rule>Gitignored client state and winners anchors.</rule>
  </layer>
</layer>

<layer id="methodology">
  <desc>GSD (`.agent/get-shit-done/`) drives engineering phases and `.planning/`. MarkOS (`.agent/markos/`, `.agent/skills/markos-*`) drives marketing protocol execution.</desc>
</layer>

<components>
  <comp id="mir">MIR — Marketing Intelligence (Lean Canvas + JTBD).</comp>
  <comp id="msp">MSP — channel and campaign matrices.</comp>
  <comp id="prompts">`.agent/prompts/` — execution logic.</comp>
  <comp id="skills">`.agent/skills/markos-*` — Cursor skill entry points to workflows under `.agent/markos/workflows/`.</comp>
</components>

<flow>
  <onboarding>Human runs `npx markos` (install) -> optional onboarding server -> POST /submit -> orchestrator -> drafts -> POST /approve -> write-mir.cjs writes `.markos-local/MIR/`.</onboarding>
  <execution>`.planning/STATE.md` defines phase -> `markos-plan-phase` -> `markos-execute-phase` -> `markos-verify-work`; readiness gates in `mir-gates.md` and winners catalogs.</execution>
</flow>
</markos_arch>
