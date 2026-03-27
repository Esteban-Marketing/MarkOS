<mgsd_context>
<purpose>Machine-readable protocol state/architecture mapping.</purpose>
<rule>Read relevant sub-files before modifying MGSD protocol or handling agent tasks.</rule>
<map>
<file path="QUICKSTART.md">Mandatory AGENT-BOOT entry point (First read).</file>
<file path="ARCHITECTURE.md">Component interactions, MIR/MSP boundaries.</file>
<file path="STATE.md">Current milestone, active phases, tech debt.</file>
<file path="CONVENTIONS.md">Execution rules, development guidelines.</file>
<file path="TEAM.md">Hybrid Human + AI role topology and execution handoffs.</file>
<file path="TEMPLATES.md">Tokenized MIR, MSP, and ITM mapping.</file>
<file path="WORKFLOWS.md">Token-efficient machine readable workflow loops.</file>
<file path="DEFCON.md">Risk management and escalation thresholds.</file>
</map>
<implementation_links>
<link path="onboarding/backend/agents/orchestrator.cjs">Draft orchestration runtime.</link>
<link path="onboarding/backend/agents/llm-adapter.cjs">Provider abstraction and fallback logic.</link>
<link path="onboarding/backend/server.cjs">HTTP entrypoint and route wiring.</link>
<link path="onboarding/backend/chroma-client.cjs">Vector memory persistence adapter.</link>
</implementation_links>
</mgsd_context>
