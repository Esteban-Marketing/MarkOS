<mgsd_arch>
<components>
<comp id="mir">Marketing Intelligence Repo. Gates 1/2. Ground truth context boundaries.</comp>
<comp id="msp">Marketing Strategy Plan. Strategic blueprints mapped from MIR.</comp>
<comp id="orchestrator">execute-phase.md. Groups tasks -> waves -> spawns executors.</comp>
<comp id="executor">execute-plan.md. Handles file edits, commits. Auto-pauses on [HUMAN] tag.</comp>
<comp id="verifier">verification-patterns.md. 6-pillar validation (Nyquist). Enforces MIR gates.</comp>
</components>
<flow>
1. Researcher gen MIR.
2. Planner gen MSP (Gate 1).
3. Auditor verifies MIR (Gate 2).
4. Executor runs tasks.
5. Verifier validates implementation.
</flow>
</mgsd_arch>
