<markos_workflows>
<purpose>Machine-readable index of core operational workflows.
LLMs: read this to know which skill file to invoke for each scenario.</purpose>

<execution_loops>
  <loop id="autonomous">markos-autonomous iterates phases sequentially. Calls discussâ†’planâ†’execute.</loop>
  <loop id="research">markos-research-phase builds MIR data independently of execution.</loop>
  <loop id="sync">markos-linear-sync pulls linear issue updates to phase tracking.</loop>
  <loop id="vector_rag_ingest">markos-behavioral-scraper queries live sentiment (X/Reddit), embeds text, and loads into Upstash Vector natively.</loop>
  <loop id="quantitative_pivot">markos-data-scientist monitors post-execution conversions. If CAC > threshold, halts roadmap and injects Urgent Pivot Phase.</loop>
  <loop id="defcon_blitz">markos-behavioral-scraper or webhook detects competitor threat (e.g. price slash), instantly injects Phase X.1 'Counter-Positioning Blitz', halting executor and alerting [HUMAN].</loop>

  <!-- Onboarding Engine Workflow (V1.1 addition) -->
  <loop id="onboarding">
    <trigger>Human runs `node onboarding/backend/server.cjs` or `markos-new-project`.</trigger>
    <step>1. server.cjs boots â†’ calls bin/ensure-vector.cjs heartbeat â†’ port 4242 listen.</step>
    <step>2. Human submits form â†’ POST /submit.</step>
    <step>3. server reads/generates .markos-project.json (deterministic project_slug).</step>
    <step>4. orchestrator.cjs runs mir-filler + msp-filler in parallel (Promise.allSettled).</step>
    <step>5. Drafts stored to canonical Vector Store namespace `{prefix}-{slug}-drafts` with compatibility reads across `markos-*` prefixes.</step>
    <step>6. /status returns drafts â†’ UI displays for review.</step>
    <step>7. Human approves â†’ POST /approve â†’ write-mir.cjs JIT-clones + writes .markos-local/MIR/.</step>
    <files>
      server: onboarding/backend/server.cjs
      orchestrator: onboarding/backend/agents/orchestrator.cjs
      write: onboarding/backend/write-mir.cjs
      vector: onboarding/backend/vector-store-client.cjs
    </files>
  </loop>

  <loop id="execution_handoff">
    <trigger>POST /approve writes approved onboarding drafts and returns handoff metadata.</trigger>
    <step>1. Onboarding completion is true when at least one approved draft is persisted to .markos-local/MIR/.</step>
    <step>2. Execution readiness is evaluated separately; completion does not imply readiness.</step>
    <step>3. Required approved sections: company_profile, mission_values, audience, competitive, brand_voice, channel_strategy.</step>
    <step>4. Required winners anchors: .markos-local/MSP/Paid_Media|Lifecycle_Email|Content_SEO|Social|Landing_Pages/WINNERS/_CATALOG.md.</step>
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
  <loop id="ensure_vector">
    <trigger>Called by bin/install.cjs and onboarding/backend/server.cjs before boot.</trigger>
    <step>1. Resolve mode: cloud if UPSTASH_VECTOR_REST_URL exists, else local daemon.</step>
    <step>2. Local mode pings localhost:8000/api/v1/heartbeat (500ms timeout).</step>
    <step>3. If dead + local mode â†’ spawn `python -m Supabase \+ Upstash Vector.cli.cli run` as detached daemon.</step>
    <step>4. Re-check heartbeat and return a structured boot report: local_available/local_started/local_boot_failed or cloud_configured.</step>
    <file>bin/ensure-vector.cjs</file>
  </loop>
</execution_loops>

<gate_enforcement>
  <gate type="mir-audit">markos-mir-audit validates MIR structural integrity vs requirements.</gate>
  <gate type="verifier">markos-verify-work runs post-phase 7-dimension Nyquist rules.</gate>
  <gate type="health">markos-health validates directory health for missing index files.</gate>
  <gate type="privacy">Privacy consent banner on index.html ensures user agreement before data submission. Key: markos_privacy_accepted (localStorage).</gate>
</gate_enforcement>
</markos_workflows>


