---
description: Generate a structured campaign performance report from KPI data, VERIFICATION.md records, and analytics inputs
---

# /mgsd-report-campaign

<purpose>
Compile a structured performance report for one or more campaign phases. Aggregates KPI actuals from VERIFICATION.md records, SUMMARY.md campaign_impact fields, and human-provided analytics data. Spawns mgsd-analyst for variance computation. Produces a LINEAR-ready report and a markdown REPORT.md artifact for the client record.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" init report-campaign "${PERIOD_ARG}" --raw)
```

**Arguments:**
- `--phase {N}` — report for a single phase
- `--period {YYYY-MM}` — all phases completed in a calendar month
- `--campaign {campaign_id}` — all phases for a specific campaign

Parse: `report_scope`, `phases[]`, `campaign_ids[]`, `kpi_framework_path`, `verification_files[]`, `summary_files[]`.
</step>

<step name="collect_data">
Load all available data sources:

**From MGSD artifacts (automatic):**
```bash
SUMMARIES=$(find ".planning/phases" -name "*-SUMMARY.md" -newer "${PERIOD_START}")
VERIFICATIONS=$(find ".planning/phases" -name "VERIFICATION.md" -newer "${PERIOD_START}")
```

For each SUMMARY.md, extract: `campaign_impact`, `key_decisions`, `completed_date`, `discipline`
For each VERIFICATION.md, extract: dimension results, human UAT outcomes

**From KPI-FRAMEWORK.md:**
Load KPI targets for comparison.

**From human (checkpoint — required):**
```
╔══════════════════════════════════════════════════════════════╗
║  DATA INPUT REQUIRED — Report: {scope}                       ║
╚══════════════════════════════════════════════════════════════╝

Please provide platform analytics data for this period.
(If connected via API, this step may be skipped.)

For each active campaign, provide:

Campaign: {campaign_id}
Period:   {start_date} → {end_date}

→ Meta Ads: total spend, impressions, clicks, leads, CPL
→ Google Ads: total spend, clicks, conversions, CPA
→ Email: sends, opens, clicks, conversions
→ Organic: sessions, leads, top pages

Paste data or type "skip" if unavailable:
```

Write human-provided data to `{phase_dir}/ANALYTICS-INPUT.md`.
</step>

<step name="spawn_analyst">
Spawn `mgsd-analyst` for KPI variance computation:

```
Task(
  subagent_type="mgsd-analyst",
  prompt="
  Compute KPI variance report for {report_scope}.

  Read:
  - {kpi_framework_path}
  - All VERIFICATION.md files: {verification_files}
  - All SUMMARY.md files: {summary_files}
  - ANALYTICS-INPUT.md (human-provided metrics)

  Compute variance per KPI against targets.
  Generate ranked optimization recommendations.
  Check PSY-KPI linkage from neuro_spec blocks.

  Output: ANALYTICS-REPORT-{YYYYMM}.md in .planning/reports/
  Return: overall_health, top_recommendations[], human_decisions_required[]
  "
)
```
</step>

<step name="human_review">
Present analyst findings to human for review:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► CAMPAIGN REPORT — {scope}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Period: {start} → {end}
Campaigns: {N}
Overall Health: {ON TARGET 🟢 | DRIFT 🟡 | ALERT 🔴}

KPI Summary:
{variance table from analyst}

Top Recommendations:
{ranked recommendations from analyst}

Decisions Required:
{list of P1 items requiring human approval}
```

**Human responds to each required decision before report is finalized.**

For each decision:
```
Decision {N}: {item}
Options: [approve] / [reject] / [defer to next cycle]
Your response:
```

Record human decisions in report.
</step>

<step name="compile_report">
Spawn `mgsd-report-compiler` to produce final REPORT.md:

```
Task(
  subagent_type="mgsd-report-compiler",
  prompt="
  Compile final campaign report for {report_scope}.

  Combine:
  - ANALYTICS-REPORT-{YYYYMM}.md (analyst variance)
  - Human decisions recorded in this session
  - VERIFICATION.md outcomes for all phases
  - SUMMARY.md campaign_impact fields

  Format as REPORT-{YYYYMM}.md in .planning/reports/.
  Include executive summary, KPI table, recommendations, decisions, next actions.
  "
)
```
</step>

<step name="linear_sync">
Create Linear report ticket:

```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear create \
  --title "[MGSD] Campaign Report: {scope} — {overall_health}" \
  --body "{report_summary}" \
  --label "report,campaign-review"
```

Trigger post-execution-sync hook:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" linear sync \
  --period "${REPORT_PERIOD}" \
  --direction bidirectional
```
</step>

<step name="completion">
Commit report:
```bash
node ".agent/marketing-get-shit-done/bin/mgsd-tools.cjs" commit \
  "mktg(report): campaign report {scope} — {overall_health}"
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MGSD ► REPORT COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report:  .planning/reports/REPORT-{YYYYMM}.md
Linear:  [MGSD] Campaign Report ticket created
Health:  {overall_health}

Next:
/mgsd-performance-review   → detailed performance analysis
/mgsd-discuss-phase {N+1}  → plan next cycle based on findings
```
</step>

</process>

<success_criteria>
- [ ] Analytics data collected (automated + human-provided)
- [ ] mgsd-analyst spawned — ANALYTICS-REPORT created
- [ ] Human reviewed analyst findings and responded to all required decisions
- [ ] Final REPORT.md compiled
- [ ] Linear ticket created
- [ ] Post-execution-sync hook triggered
</success_criteria>
