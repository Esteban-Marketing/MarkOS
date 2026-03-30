<markos_workflows>
<purpose>Index of operational workflows. Map skill names to `.agent/markos/workflows/` and `.agent/skills/markos-*`.</purpose>

<execution_loops>
  <loop id="autonomous">markos-autonomous: phases in order; discuss then plan then execute.</loop>
  <loop id="research">markos-research-phase: MIR research outside execution waves.</loop>
  <loop id="sync">markos-linear-sync: Linear issue templates and sync.</loop>
  <loop id="vector_rag_ingest">Optional: behavioral scraper pipelines into Upstash Vector.</loop>
  <loop id="quantitative_pivot">Optional: performance monitors may inject pivot phases when KPIs breach thresholds.</loop>
  <loop id="defcon_blitz">DEFCON: event-driven phase injection; see DEFCON.md.</loop>

  <loop id="onboarding">
    <trigger>`node onboarding/backend/server.cjs` or markos-new-project scaffold.</trigger>
    <step>1. server.cjs boots; ensure-vector; listen (default port 4242).</step>
    <step>2. POST /submit with seed.</step>
    <step>3. Persist or generate `.markos-project.json` (project_slug).</step>
    <step>4. orchestrator runs mir-filler and msp-filler.</step>
    <step>5. Drafts stored in vector namespaces per `vector-store-client.cjs`.</step>
    <step>6. GET /status for review UI.</step>
    <step>7. POST /approve -> write-mir.cjs -> `.markos-local/MIR/`.</step>
    <files>
      <server>onboarding/backend/server.cjs</server>
      <orchestrator>onboarding/backend/agents/orchestrator.cjs</orchestrator>
      <write>onboarding/backend/write-mir.cjs</write>
      <vector>onboarding/backend/vector-store-client.cjs</vector>
    </files>
  </loop>

  <loop id="execution_handoff">
    <trigger>Successful approve path and readiness evaluation in handlers.</trigger>
    <step>Onboarding completion: approved drafts under `.markos-local/MIR/`.</step>
    <step>Execution readiness: required sections + winners `_CATALOG.md` files per discipline.</step>
    <step>Telemetry: approval_completed, execution_readiness_ready|blocked, execution loop checkpoints.</step>
    <files>
      <readiness>onboarding/backend/handlers.cjs</readiness>
      <ui>onboarding/onboarding.js</ui>
      <telemetry>onboarding/backend/agents/telemetry.cjs</telemetry>
    </files>
  </loop>

  <loop id="ensure_vector">
    <trigger>install.cjs and server boot.</trigger>
    <step>Cloud mode if UPSTASH_VECTOR_REST_URL; else local daemon per ensure-vector.cjs.</step>
    <file>bin/ensure-vector.cjs</file>
  </loop>
</execution_loops>

<gate_enforcement>
  <gate type="mir-audit">markos-mir-audit</gate>
  <gate type="verifier">markos-verify-work</gate>
  <gate type="health">markos-health</gate>
  <gate type="privacy">onboarding UI: localStorage key `markos_privacy_accepted`</gate>
</gate_enforcement>
</markos_workflows>
