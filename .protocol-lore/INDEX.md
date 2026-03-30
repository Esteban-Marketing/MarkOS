<markos_context>
<purpose>Machine-readable protocol navigation map. Live mission state is not stored in this folder.</purpose>
<rule>Read QUICKSTART first, then open .planning/STATE.md for canonical “what’s next” before modifying protocol or agent tasks.</rule>
<map>
<file path="QUICKSTART.md">Mandatory AGENT-BOOT entry point (first read).</file>
<file path="ARCHITECTURE.md">Component interactions, MIR/MSP boundaries.</file>
<file path="STATE.md">Routing note only — canonical state is ../.planning/STATE.md</file>
<file path="CONVENTIONS.md">Execution rules, development guidelines.</file>
<file path="TEAM.md">Hybrid Human + AI role topology and execution handoffs.</file>
<file path="TEMPLATES.md">Tokenized MIR, MSP, and ITM mapping.</file>
<file path="WORKFLOWS.md">Machine-readable workflow loops.</file>
<file path="DEFCON.md">Risk management and escalation thresholds.</file>
<file path="MEMORY.md">Vector/memory conventions.</file>
<file path="CODEBASE-MAP.md">Filesystem map for LLM navigation.</file>
</map>
<canonical_state path="../.planning/STATE.md">GSD planning state — milestone, phase, MIR gates, next actions.</canonical_state>
<implementation_links>
<link path="onboarding/backend/agents/orchestrator.cjs">Draft orchestration runtime.</link>
<link path="onboarding/backend/agents/llm-adapter.cjs">Provider abstraction and fallback logic.</link>
<link path="onboarding/backend/server.cjs">HTTP entrypoint and route wiring.</link>
<link path="onboarding/backend/vector-store-client.cjs">Vector memory persistence adapter.</link>
</implementation_links>
</markos_context>
