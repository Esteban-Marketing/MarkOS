<markos_team>
<purpose>Defines the hybrid Human + AI execution topology and agent roster.</purpose>
<rule id="human_loop">Humans only intervene when `[HUMAN]` is tagged in tasks. The AI completely owns the process and auto-pauses.</rule>

<roster>
  <team id="strategy">
    <agent id="markos-onboarder">Scaffolds initial project context and MIR/MSP.</agent>
    <agent id="markos-strategist">Architects core strategy. Enforces Gate 1 & 2 requirements.</agent>
    <agent id="markos-campaign-architect">Designs campaign structures and selects channels.</agent>
  </team>
  
  <team id="execution">
    <agent id="markos-task-synthesizer">Reads static MSP templates + COMPETITIVE-LANDSCAPE.md and dynamically hallucinates competitor-exploiting tasks into the roadmap.</agent>
    <agent id="markos-planner">Converts MIR + MSP context into actionable PLAN.md.</agent>
    <agent id="markos-plan-checker">Pre-execution quality gate validator.</agent>
    <agent id="markos-executor">Runs PLAN.md tasks, makes atomic commits, handles repo changes.</agent>
  </team>

  <team id="content_creative">
    <agent id="markos-content-brief">Generates the constraints and briefs for content.</agent>
    <agent id="markos-copy-drafter">Operates long and short-form copy writing.</agent>
    <agent id="markos-creative-director">Visual alignment judge. Audits UX/Asset generation against Brand Voice.</agent>
    <agent id="markos-content-creator">Generates channel-specific content enforcing tone.</agent>
  </team>
  
  <team id="reaction_reconnaissance">
    <agent id="markos-behavioral-scraper">Pulls real-world external sentiment (Reddit/Discord) and pipes embeddings into Upstash Vector.</agent>
    <agent id="markos-data-scientist">Ingests CAC/LTV reporting post-execution. Force-injects Pivot Phases on anomalies.</agent>
  </team>
  
  <team id="verification_audit">
    <agent id="markos-neuro-auditor">8-dimension audit using B01-B10 neuromarketing triggers.</agent>
    <agent id="markos-gap-auditor">Identifies missing context elements in MIR.</agent>
    <agent id="markos-verifier">7-dimension Nyquist post-phase capability.</agent>
  </team>
  
  <team id="human">
    <role id="client">Provides initial `config.json` and market seed data.</role>
    <role id="manager">Reviews PRs, unblocks `[HUMAN]` execution tags, provides approvals.</role>
  </team>
</roster>

<lifecycle>
  <step>AI: `markos-behavioral-scraper` -> embeds ongoing market sentiment into Upstash Vector natively.</step>
  <step>AI: `markos-onboarder` -> builds contextual skeleton.</step>
  <step>AI: `markos-strategist` -> queries Supabase + Upstash Vector and maps triggers and audience gaps.</step>

    <step>AI: `markos-task-synthesizer` -> crosses static MSPs with live competitor gaps to generate mutated tasks.</step>
    <step>AI: `markos-planner` -> builds tasks into `.planning/`.</step>
    <step>AI: `markos-executor` -> loops through tasks atomically, triggering external scripts for `[API-EXECUTE]` tags.</step>
    <step>Human: Unblocks executing loops if `[HUMAN]` requires auth/billing/external action.</step>
    <step>AI: `markos-verifier` -> ensures constraints passed.</step>
    <step>AI: `markos-data-scientist` -> post-execution audit; halts iteration and pivots ROADMAP.md if CAC targets fail.</step>
</lifecycle>
</markos_team>

</markos_team>
