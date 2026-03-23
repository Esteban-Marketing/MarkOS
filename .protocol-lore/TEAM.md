<mgsd_team>
<purpose>Defines the hybrid Human + AI execution topology and agent roster.</purpose>
<rule id="human_loop">Humans only intervene when `[HUMAN]` is tagged in tasks. The AI completely owns the process and auto-pauses.</rule>

<roster>
  <team id="strategy">
    <agent id="mgsd-onboarder">Scaffolds initial project context and MIR/MSP.</agent>
    <agent id="mgsd-strategist">Architects core strategy. Enforces Gate 1 & 2 requirements.</agent>
    <agent id="mgsd-campaign-architect">Designs campaign structures and selects channels.</agent>
  </team>
  
  <team id="execution">
    <agent id="mgsd-task-synthesizer">Reads static MSP templates + COMPETITIVE-LANDSCAPE.md and dynamically hallucinates competitor-exploiting tasks into the roadmap.</agent>
    <agent id="mgsd-planner">Converts MIR + MSP context into actionable PLAN.md.</agent>
    <agent id="mgsd-plan-checker">Pre-execution quality gate validator.</agent>
    <agent id="mgsd-executor">Runs PLAN.md tasks, makes atomic commits, handles repo changes.</agent>
  </team>

  <team id="content_creative">
    <agent id="mgsd-content-brief">Generates the constraints and briefs for content.</agent>
    <agent id="mgsd-copy-drafter">Operates long and short-form copy writing.</agent>
    <agent id="mgsd-creative-director">Visual alignment judge. Audits UX/Asset generation against Brand Voice.</agent>
    <agent id="mgsd-content-creator">Generates channel-specific content enforcing tone.</agent>
  </team>
  
  <team id="reaction_reconnaissance">
    <agent id="mgsd-behavioral-scraper">Pulls real-world external sentiment (Reddit/Discord) and pipes embeddings into Chroma VectorDB.</agent>
    <agent id="mgsd-data-scientist">Ingests CAC/LTV reporting post-execution. Force-injects Pivot Phases on anomalies.</agent>
  </team>
  
  <team id="verification_audit">
    <agent id="mgsd-neuro-auditor">8-dimension audit using B01-B10 neuromarketing triggers.</agent>
    <agent id="mgsd-gap-auditor">Identifies missing context elements in MIR.</agent>
    <agent id="mgsd-verifier">7-dimension Nyquist post-phase capability.</agent>
  </team>
  
  <team id="human">
    <role id="client">Provides initial `config.json` and market seed data.</role>
    <role id="manager">Reviews PRs, unblocks `[HUMAN]` execution tags, provides approvals.</role>
  </team>
</roster>

<lifecycle>
  <step>AI: `mgsd-behavioral-scraper` -> embeds ongoing market sentiment into Chroma VectorDB natively.</step>
  <step>AI: `mgsd-onboarder` -> builds contextual skeleton.</step>
  <step>AI: `mgsd-strategist` -> queries Chroma DB and maps triggers and audience gaps.</step>
  <step>AI: `mgsd-task-synthesizer` -> crosses static MSPs with live competitor gaps to generate mutated tasks.</step>
  <step>AI: `mgsd-planner` -> builds tasks into `.planning/`.</step>
  <step>AI: `mgsd-executor` -> loops through tasks atomically, triggering external scripts for `[API-EXECUTE]` tags.</step>
  <step>Human: Unblocks executing loops if `[HUMAN]` requires auth/billing/external action.</step>
  <step>AI: `mgsd-verifier` -> ensures constraints passed.</step>
  <step>AI: `mgsd-data-scientist` -> post-execution audit; halts iteration and pivots ROADMAP.md if CAC targets fail.</step>
</lifecycle>
</mgsd_team>
