<purpose>
Research channel approaches, competitor campaigns, audience signals, and benchmarks for a marketing phase before planning begins. Produces RESEARCH.md used by mgsd-planner.
</purpose>

<process>

## 1. Initialize

```bash
PHASE_INFO=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" roadmap get-phase "${PHASE}" --raw)
PHASE_DIR=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" find-phase "${PHASE}" --raw)
```

If phase not found → Error: "Phase {N} not found in ROADMAP.md".

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► RESEARCHING — Phase {N}: {Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning market researcher...
```

## 2. Spawn mgsd-market-researcher

```
Task(
  prompt="
<objective>
Research everything needed to plan Phase {N}: {phase_name}.
Goal: {phase goal from ROADMAP.md}
Output: RESEARCH.md that enables concrete, measurable marketing plans.
</objective>

<files_to_read>
- {context_path} (Phase context — if exists)
- .planning/REQUIREMENTS.md
- .planning/PROJECT.md
- templates/MIR/Market_Audiences/03_MARKET/COMPETITIVE-LANDSCAPE.md
- templates/MIR/Campaigns_Assets/05_CHANNELS/ (all channel files)
- templates/MIR/Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md
</files_to_read>

<research_areas>
1. **Competitive landscape for this phase:** What are competitors doing in this
   channel/tactic right now? What ad angles, copy hooks, offers are active?
2. **Audience intelligence:** ICP language patterns, objections, content formats
   they engage with on target channels
3. **Channel benchmarks:** CPL, CTR, ROAS, CR benchmarks for industry + audience
   on all relevant channels for this phase
4. **Platform capabilities:** What does the platform/channel support that's relevant?
   New features, targeting options, format specs
5. **Tracking requirements:** What events, properties, and attribution windows are
   needed to measure this phase's success?
6. **Risks and pitfalls:** Common mistakes for this phase type — ad fatigue,
   audience saturation, tracking gaps, compliance issues
</research_areas>

<output>
Write to: {phase_dir}/{padded_phase}-RESEARCH.md

Required sections:
## Competitive Landscape
## Audience Intelligence
## Channel Benchmarks (table: metric | industry avg | target)
## Recommended Approach
## Platform Capabilities and Constraints
## Tracking Requirements
## Risks and Pitfalls
## Validation Architecture

End with: ## RESEARCH COMPLETE
</output>
  ",
  subagent_type="mgsd-market-researcher",
  description="Research Phase {N}"
)
```

## 3. Handle Return

- `## RESEARCH COMPLETE` → Commit and display next steps
- `## RESEARCH BLOCKED` → Display blocker, offer: Provide missing info / Continue without / Abort

## 4. Commit and Next Up

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit "mktg(phase-${PHASE}): market research complete"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Research saved: {phase_dir}/{padded_phase}-RESEARCH.md

## ▶ Next Up

/mgsd-plan-phase {N}
```

</process>

<success_criteria>
- [ ] mgsd-market-researcher spawned with phase context
- [ ] RESEARCH.md created with all required sections
- [ ] Benchmark table includes measurable targets
- [ ] Validation Architecture section present
- [ ] Committed to repository
</success_criteria>
