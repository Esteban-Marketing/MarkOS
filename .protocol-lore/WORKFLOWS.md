<mgsd_workflows>
<purpose>Machine-readable index of core operational workflows.
LLMs: read this to know which skill file to invoke for each scenario.</purpose>

<execution_loops>
  <loop id="autonomous">mgsd-autonomous iterates phases sequentially. Calls discuss→plan→execute.</loop>
  <loop id="research">mgsd-research-phase builds MIR data independently of execution.</loop>
  <loop id="sync">mgsd-linear-sync pulls linear issue updates to phase tracking.</loop>
  <loop id="chroma_rag_ingest">mgsd-behavioral-scraper queries live sentiment (X/Reddit), embeds text, and loads into Chroma VectorDB natively.</loop>
  <loop id="quantitative_pivot">mgsd-data-scientist monitors post-execution conversions. If CAC > threshold, halts roadmap and injects Urgent Pivot Phase.</loop>
  <loop id="defcon_blitz">mgsd-behavioral-scraper or webhook detects competitor threat (e.g. price slash), instantly injects Phase X.1 'Counter-Positioning Blitz', halting executor and alerting [HUMAN].</loop>

  <!-- Onboarding Engine Workflow (V1.1 addition) -->
  <loop id="onboarding">
    <trigger>Human runs `node onboarding/backend/server.cjs` or `mgsd-new-project`.</trigger>
    <step>1. server.cjs boots → calls bin/ensure-chroma.cjs heartbeat → port 4242 listen.</step>
    <step>2. Human submits form → POST /submit.</step>
    <step>3. server reads/generates .mgsd-project.json (deterministic project_slug).</step>
    <step>4. orchestrator.cjs runs mir-filler + msp-filler in parallel (Promise.allSettled).</step>
    <step>5. Drafts stored to canonical Chroma namespace `{prefix}-{slug}-drafts` with compatibility reads across `mgsd-*` and `markos-*` prefixes.</step>
    <step>6. /status returns drafts → UI displays for review.</step>
    <step>7. Human approves → POST /approve → write-mir.cjs JIT-clones + writes .mgsd-local/MIR/.</step>
    <files>
      server: onboarding/backend/server.cjs
      orchestrator: onboarding/backend/agents/orchestrator.cjs
      write: onboarding/backend/write-mir.cjs
      chroma: onboarding/backend/chroma-client.cjs
    </files>
  </loop>

  <loop id="execution_handoff">
    <trigger>POST /approve writes approved onboarding drafts and returns handoff metadata.</trigger>
    <step>1. Onboarding completion is true when at least one approved draft is persisted to .mgsd-local/MIR/.</step>
    <step>2. Execution readiness is evaluated separately; completion does not imply readiness.</step>
    <step>3. Required approved sections: company_profile, mission_values, audience, competitive, brand_voice, channel_strategy.</step>
    <step>4. Required winners anchors: .mgsd-local/MSP/Paid_Media|Lifecycle_Email|Content_SEO|Social|Landing_Pages/WINNERS/_CATALOG.md.</step>
    <step>5. First execution workflows MUST consume approved local state and winners anchors before generating assets.</step>
    <step>6. If any required section or winners catalog is missing, readiness stays blocked and execution MUST pause.</step>
    <step>6a. Winners anchor behavior: present=proceed, missing=block, stale=warn+proceed only with telemetry, mislocated=block and report canonical path.</step>
    <step>7. Telemetry checkpoints: approval_completed, execution_readiness_ready|execution_readiness_blocked, execution_loop_completed|execution_loop_abandoned.</step>
    <files>
      readiness_api: onboarding/backend/handlers.cjs
      onboarding_ui: onboarding/onboarding.js
      telemetry: onboarding/backend/agents/telemetry.cjs
    </files>
  </loop>

  <!-- Auto-Healing Daemon Workflow (V1.1 addition) -->
  <loop id="ensure_chroma">
    <trigger>Called by bin/install.cjs and onboarding/backend/server.cjs before boot.</trigger>
    <step>1. Resolve mode: cloud if CHROMA_CLOUD_URL exists, else local daemon.</step>
    <step>2. Local mode pings localhost:8000/api/v1/heartbeat (500ms timeout).</step>
    <step>3. If dead + local mode → spawn `python -m chromadb.cli.cli run` as detached daemon.</step>
    <step>4. Re-check heartbeat and return a structured boot report: local_available/local_started/local_boot_failed or cloud_configured.</step>
    <file>bin/ensure-chroma.cjs</file>
  </loop>
</execution_loops>

<gate_enforcement>
  <gate type="mir-audit">mgsd-mir-audit validates MIR structural integrity vs requirements.</gate>
  <gate type="verifier">mgsd-verify-work runs post-phase 7-dimension Nyquist rules.</gate>
  <gate type="health">mgsd-health validates directory health for missing index files.</gate>
  <gate type="privacy">Privacy consent banner on index.html ensures user agreement before data submission. Key: mgsd_privacy_accepted (localStorage).</gate>
</gate_enforcement>
</mgsd_workflows>
