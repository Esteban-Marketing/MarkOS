# Feature Landscape: MarkOS Rebrand Scope

**Domain:** Agent, Skill, Command & File Rebrand Audit
**Researched:** 2026-03-27

---

## 1. DIRECTORY RENAME

| Current Path | Proposed Path |
|-------------|---------------|
| `.agent/marketing-get-shit-done/` | `.agent/markos/` |
| `.agent/marketing-get-shit-done/MGSD-INDEX.md` | `.agent/markos/MARKOS-INDEX.md` |
| `.mgsd-local/` | `.markos-local/` |
| `.mgsd-project.json` | `.markos-project.json` |
| `.mgsd-install-manifest.json` | `.markos-install-manifest.json` |

---

## 2. AGENT FILES (39 files)

All under `.agent/marketing-get-shit-done/agents/` → `.agent/markos/agents/`

| # | Current File | Proposed File | Internal Name (old) | Internal Name (new) | Token ID (old) | Token ID (new) |
|---|-------------|---------------|--------------------|--------------------|----------------|----------------|
| 1 | `mgsd-strategist.md` | `markos-strategist.md` | `mgsd-strategist` | `markos-strategist` | `MGSD-AGT-STR-01` | `MARKOS-AGT-STR-01` |
| 2 | `mgsd-planner.md` | `markos-planner.md` | `mgsd-planner` | `markos-planner` | `MGSD-AGT-STR-02` | `MARKOS-AGT-STR-02` |
| 3 | `mgsd-campaign-architect.md` | `markos-campaign-architect.md` | `mgsd-campaign-architect` | `markos-campaign-architect` | `MGSD-AGT-STR-03` | `MARKOS-AGT-STR-03` |
| 4 | `mgsd-creative-brief.md` | `markos-creative-brief.md` | `mgsd-creative-brief` | `markos-creative-brief` | `MGSD-AGT-STR-04` | `MARKOS-AGT-STR-04` |
| 5 | `mgsd-cro-hypothesis.md` | `markos-cro-hypothesis.md` | `mgsd-cro-hypothesis` | `markos-cro-hypothesis` | `MGSD-AGT-STR-05` | `MARKOS-AGT-STR-05` |
| 6 | `mgsd-neuro-auditor.md` | `markos-neuro-auditor.md` | `mgsd-neuro-auditor` | `markos-neuro-auditor` | `MGSD-AGT-NEU-01` | `MARKOS-AGT-NEU-01` |
| 7 | `mgsd-executor.md` | `markos-executor.md` | `mgsd-executor` | `markos-executor` | `MGSD-AGT-EXE-01` | `MARKOS-AGT-EXE-01` |
| 8 | `mgsd-verifier.md` | `markos-verifier.md` | `mgsd-verifier` | `markos-verifier` | `MGSD-AGT-EXE-02` | `MARKOS-AGT-EXE-02` |
| 9 | `mgsd-plan-checker.md` | `markos-plan-checker.md` | `mgsd-plan-checker` | `markos-plan-checker` | `MGSD-AGT-EXE-03` | `MARKOS-AGT-EXE-03` |
| 10 | `mgsd-content-creator.md` | `markos-content-creator.md` | `mgsd-content-creator` | `markos-content-creator` | `MGSD-AGT-CNT-01` | `MARKOS-AGT-CNT-01` |
| 11 | `mgsd-copy-drafter.md` | `markos-copy-drafter.md` | `mgsd-copy-drafter` | `markos-copy-drafter` | `MGSD-AGT-CNT-02` | `MARKOS-AGT-CNT-02` |
| 12 | `mgsd-social-drafter.md` | `markos-social-drafter.md` | `mgsd-social-drafter` | `markos-social-drafter` | `MGSD-AGT-CNT-03` | `MARKOS-AGT-CNT-03` |
| 13 | `mgsd-email-sequence.md` | `markos-email-sequence.md` | `mgsd-email-sequence` | `markos-email-sequence` | `MGSD-AGT-CNT-04` | `MARKOS-AGT-CNT-04` |
| 14 | `mgsd-content-brief.md` | `markos-content-brief.md` | `mgsd-content-brief` | `markos-content-brief` | `MGSD-AGT-CNT-05` | `MARKOS-AGT-CNT-05` |
| 15 | `mgsd-seo-planner.md` | `markos-seo-planner.md` | `mgsd-seo-planner` | `markos-seo-planner` | `MGSD-AGT-CNT-06` | `MARKOS-AGT-CNT-06` |
| 16 | `mgsd-audience-intel.md` | `markos-audience-intel.md` | `mgsd-audience-intel` | `markos-audience-intel` | `MGSD-AGT-AUD-01` | `MARKOS-AGT-AUD-01` |
| 17 | `mgsd-market-researcher.md` | `markos-market-researcher.md` | `mgsd-market-researcher` | `markos-market-researcher` | `MGSD-AGT-AUD-02` | `MARKOS-AGT-AUD-02` |
| 18 | `mgsd-competitive-monitor.md` | `markos-competitive-monitor.md` | `mgsd-competitive-monitor` | `markos-competitive-monitor` | `MGSD-AGT-AUD-03` | `MARKOS-AGT-AUD-03` |
| 19 | `mgsd-market-scanner.md` | `markos-market-scanner.md` | `mgsd-market-scanner` | `markos-market-scanner` | `MGSD-AGT-AUD-04` | `MARKOS-AGT-AUD-04` |
| 20 | `mgsd-funnel-analyst.md` | `markos-funnel-analyst.md` | `mgsd-funnel-analyst` | `markos-funnel-analyst` | `MGSD-AGT-ANA-01` | `MARKOS-AGT-ANA-01` |
| 21 | `mgsd-performance-monitor.md` | `markos-performance-monitor.md` | `mgsd-performance-monitor` | `markos-performance-monitor` | `MGSD-AGT-ANA-02` | `MARKOS-AGT-ANA-02` |
| 22 | `mgsd-gap-auditor.md` | `markos-gap-auditor.md` | `mgsd-gap-auditor` | `markos-gap-auditor` | `MGSD-AGT-ANA-03` | `MARKOS-AGT-ANA-03` |
| 23 | `mgsd-report-compiler.md` | `markos-report-compiler.md` | `mgsd-report-compiler` | `markos-report-compiler` | `MGSD-AGT-ANA-04` | `MARKOS-AGT-ANA-04` |
| 24 | `mgsd-analyst.md` | `markos-analyst.md` | `mgsd-analyst` | `markos-analyst` | `MGSD-AGT-ANA-05` | `MARKOS-AGT-ANA-05` |
| 25 | `mgsd-tracking-spec.md` | `markos-tracking-spec.md` | `mgsd-tracking-spec` | `markos-tracking-spec` | `MGSD-AGT-TRK-01` | `MARKOS-AGT-TRK-01` |
| 26 | `mgsd-utm-architect.md` | `markos-utm-architect.md` | `mgsd-utm-architect` | `markos-utm-architect` | `MGSD-AGT-TRK-02` | `MARKOS-AGT-TRK-02` |
| 27 | `mgsd-context-loader.md` | `markos-context-loader.md` | `mgsd-context-loader` | `markos-context-loader` | `MGSD-AGT-OPS-01` | `MARKOS-AGT-OPS-01` |
| 28 | `mgsd-librarian.md` | `markos-librarian.md` | `mgsd-librarian` | `markos-librarian` | `MGSD-AGT-OPS-02` | `MARKOS-AGT-OPS-02` |
| 29 | `mgsd-automation-architect.md` | `markos-automation-architect.md` | `mgsd-automation-architect` | `markos-automation-architect` | `MGSD-AGT-OPS-03` | `MARKOS-AGT-OPS-03` |
| 30 | `mgsd-calendar-builder.md` | `markos-calendar-builder.md` | `mgsd-calendar-builder` | `markos-calendar-builder` | `MGSD-AGT-OPS-04` | `MARKOS-AGT-OPS-04` |
| 31 | `mgsd-budget-monitor.md` | `markos-budget-monitor.md` | `mgsd-budget-monitor` | `markos-budget-monitor` | `MGSD-AGT-OPS-05` | `MARKOS-AGT-OPS-05` |
| 32 | `mgsd-lead-scorer.md` | `markos-lead-scorer.md` | `mgsd-lead-scorer` | `markos-lead-scorer` | `MGSD-AGT-OPS-06` | `MARKOS-AGT-OPS-06` |
| 33 | `mgsd-linear-manager.md` | `markos-linear-manager.md` | `mgsd-linear-manager` | `markos-linear-manager` | `MGSD-AGT-OPS-07` | `MARKOS-AGT-OPS-07` |
| 34 | `mgsd-auditor.md` | `markos-auditor.md` | `mgsd-auditor` | `markos-auditor` | `MGSD-AGT-OPS-08` | `MARKOS-AGT-OPS-08` |
| 35 | `mgsd-researcher.md` | `markos-researcher.md` | `mgsd-researcher` | `markos-researcher` | `MGSD-AGT-RES-01` | `MARKOS-AGT-RES-01` |
| 36 | `mgsd-onboarder.md` | `markos-onboarder.md` | `mgsd-onboarder` | `markos-onboarder` | `MGSD-AGT-ONB-01` | `MARKOS-AGT-ONB-01` |
| 37 | `mgsd-data-scientist.md` | `markos-data-scientist.md` | `mgsd-data-scientist` | `markos-data-scientist` | (frontmatter name) | (frontmatter name) |
| 38 | `mgsd-task-synthesizer.md` | `markos-task-synthesizer.md` | `mgsd-task-synthesizer` | `markos-task-synthesizer` | (frontmatter name) | (frontmatter name) |
| 39 | `mgsd-behavioral-scraper.md` | `markos-behavioral-scraper.md` | `mgsd-behavioral-scraper` | `markos-behavioral-scraper` | (frontmatter name) | (frontmatter name) |

---

## 3. SKILL FILES (25 skill directories)

All under `.agent/skills/` — each is a directory containing `SKILL.md`

| # | Current Skill Dir | Proposed Skill Dir | Internal `name:` (old) | Internal `name:` (new) |
|---|------------------|-------------------|----------------------|----------------------|
| 1 | `mgsd-discipline-activate/` | `markos-discipline-activate/` | `mgsd-discipline-activate` | `markos-discipline-activate` |
| 2 | `mgsd-autonomous/` | `markos-autonomous/` | `mgsd-autonomous` | `markos-autonomous` |
| 3 | `mgsd-discuss-phase/` | `markos-discuss-phase/` | `mgsd-discuss-phase` | `markos-discuss-phase` |
| 4 | `mgsd-new-project/` | `markos-new-project/` | `mgsd-new-project` | `markos-new-project` |
| 5 | `mgsd-remove-phase/` | `markos-remove-phase/` | `mgsd-remove-phase` | `markos-remove-phase` |
| 6 | `mgsd-audit-milestone/` | `markos-audit-milestone/` | `mgsd-audit-milestone` | `markos-audit-milestone` |
| 7 | `mgsd-pause-work/` | `markos-pause-work/` | `mgsd-pause-work` | `markos-pause-work` |
| 8 | `mgsd-progress/` | `markos-progress/` | `mgsd-progress` | `markos-progress` |
| 9 | `mgsd-execute-phase/` | `markos-execute-phase/` | `mgsd-execute-phase` | `markos-execute-phase` |
| 10 | `mgsd-verify-work/` | `markos-verify-work/` | `mgsd-verify-work` | `markos-verify-work` |
| 11 | `mgsd-performance-review/` | `markos-performance-review/` | `mgsd-performance-review` | `markos-performance-review` |
| 12 | `mgsd-campaign-launch/` | `markos-campaign-launch/` | `mgsd-campaign-launch` | `markos-campaign-launch` |
| 13 | `mgsd-linear-sync/` | `markos-linear-sync/` | `mgsd-linear-sync` | `markos-linear-sync` |
| 14 | `mgsd-session-report/` | `markos-session-report/` | `mgsd-session-report` | `markos-session-report` |
| 15 | `mgsd-insert-phase/` | `markos-insert-phase/` | `mgsd-insert-phase` | `markos-insert-phase` |
| 16 | `mgsd-neuro-auditor/` | `markos-neuro-auditor/` | `mgsd-neuro-auditor` | `markos-neuro-auditor` |
| 17 | `mgsd-help/` | `markos-help/` | `mgsd-help` | `markos-help` |
| 18 | `mgsd-stats/` | `markos-stats/` | `mgsd-stats` | `markos-stats` |
| 19 | `mgsd-plan-phase/` | `markos-plan-phase/` | `mgsd-plan-phase` | `markos-plan-phase` |
| 20 | `mgsd-complete-milestone/` | `markos-complete-milestone/` | `mgsd-complete-milestone` | `markos-complete-milestone` |
| 21 | `mgsd-new-milestone/` | `markos-new-milestone/` | `mgsd-new-milestone` | `markos-new-milestone` |
| 22 | `mgsd-mir-audit/` | `markos-mir-audit/` | `mgsd-mir-audit` | `markos-mir-audit` |
| 23 | `mgsd-health/` | `markos-health/` | `mgsd-health` | `markos-health` |
| 24 | `mgsd-resume-work/` | `markos-resume-work/` | `mgsd-resume-work` | `markos-resume-work` |
| 25 | `mgsd-research-phase/` | `markos-research-phase/` | `mgsd-research-phase` | `markos-research-phase` |

---

## 4. WORKFLOW FILES (27 files)

Under `.agent/marketing-get-shit-done/workflows/` → `.agent/markos/workflows/`

| # | Current File | Proposed File | Notes |
|---|-------------|---------------|-------|
| 1 | `performance-review.md` | `performance-review.md` | Content refs to update |
| 2 | `plan-campaign.md` | `plan-campaign.md` | Content refs to update |
| 3 | `help.md` | `help.md` | Content refs to update |
| 4 | `progress.md` | `progress.md` | Content refs to update |
| 5 | `verify-campaign.md` | `verify-campaign.md` | Content refs to update |
| 6 | `pause-work.md` | `pause-work.md` | Content refs to update |
| 7 | `discipline-activate.md` | `discipline-activate.md` | Content refs to update |
| 8 | `health.md` | `health.md` | Content refs to update |
| 9 | `verify-work.md` | `verify-work.md` | Content refs to update |
| 10 | `report-campaign.md` | `report-campaign.md` | Content refs to update |
| 11 | `session-report.md` | `session-report.md` | Content refs to update |
| 12 | `remove-phase.md` | `remove-phase.md` | Content refs to update |
| 13 | `audit-milestone.md` | `audit-milestone.md` | Content refs to update |
| 14 | `mgsd-linear-sync.md` | `markos-linear-sync.md` | **Filename uses mgsd prefix** |
| 15 | `resume-work.md` | `resume-work.md` | Content refs to update |
| 16 | `plan-phase.md` | `plan-phase.md` | Content refs to update |
| 17 | `add-phase.md` | `add-phase.md` | Content refs to update |
| 18 | `discuss-phase.md` | `discuss-phase.md` | Content refs to update |
| 19 | `stats.md` | `stats.md` | Content refs to update |
| 20 | `insert-phase.md` | `insert-phase.md` | Content refs to update |
| 21 | `autonomous.md` | `autonomous.md` | Content refs to update |
| 22 | `pause-campaign.md` | `pause-campaign.md` | Content refs to update |
| 23 | `campaign-launch.md` | `campaign-launch.md` | Content refs to update |
| 24 | `research-phase.md` | `research-phase.md` | Content refs to update |
| 25 | `new-project.md` | `new-project.md` | Content refs to update |
| 26 | `mir-audit.md` | `mir-audit.md` | Content refs to update |
| 27 | `new-milestone.md` | `new-milestone.md` | Content refs to update |
| 28 | `complete-milestone.md` | `complete-milestone.md` | Content refs to update |
| 29 | `execute-phase.md` | `execute-phase.md` | Content refs to update |
| 30 | `cleanup.md` | `cleanup.md` | Content refs to update |

---

## 5. HOOK FILES (5 files)

Under `.agent/marketing-get-shit-done/hooks/` → `.agent/markos/hooks/`

| # | Current File | Token ID (old) | Token ID (new) | Notes |
|---|-------------|----------------|----------------|-------|
| 1 | `pre-campaign-check.md` | `MGSD-HKP-OPS-01` | `MARKOS-HKP-OPS-01` | References mgsd-execute-phase, mgsd-campaign-launch |
| 2 | `pre-content-check.md` | `MGSD-HKP-OPS-02` | `MARKOS-HKP-OPS-02` | References mgsd-content-creator, mgsd-copy-drafter |
| 3 | `post-execution-sync.md` | `MGSD-HKP-OPS-03` | `MARKOS-HKP-OPS-03` | References mgsd-linear-manager, mgsd-librarian |
| 4 | `commit-msg` | — | — | Path in `cp` instruction references `marketing-get-shit-done` |
| 5 | `pre-push` | — | — | References `marketing-get-shit-done` in path, `mgsd-tools.cjs` |

---

## 6. BIN / CLI TOOLS (1 + libs)

Under `.agent/marketing-get-shit-done/bin/` → `.agent/markos/bin/`

| Current File | Proposed File | Notes |
|-------------|---------------|-------|
| `mgsd-tools.cjs` | `markos-tools.cjs` | Main CLI entry point |
| `lib/security.cjs` | `lib/security.cjs` | Content refs to update |
| `lib/init.cjs` | `lib/init.cjs` | Content refs to update |
| `lib/config.cjs` | `lib/config.cjs` | Content refs to update |
| `lib/core.cjs` | `lib/core.cjs` | Content refs to update |
| `lib/commands.cjs` | `lib/commands.cjs` | Content refs to update |
| `lib/verify.cjs` | `lib/verify.cjs` | Content refs to update |
| `lib/state.cjs` | `lib/state.cjs` | Content refs to update |
| `lib/phase.cjs` | `lib/phase.cjs` | Content refs to update |
| `lib/template.cjs` | `lib/template.cjs` | Content refs to update |
| `lib/frontmatter.cjs` | `lib/frontmatter.cjs` | Content refs to update |
| `lib/roadmap.cjs` | `lib/roadmap.cjs` | Content refs to update |
| `lib/milestone.cjs` | `lib/milestone.cjs` | Content refs to update |

---

## 7. PROMPTS (6 files)

Under `.agent/marketing-get-shit-done/prompts/` → `.agent/markos/prompts/`

| Token ID (old) | File | Token ID (new) |
|----------------|------|----------------|
| `MGSD-PRM-OPS-01` | `telemetry_synthesizer.md` | `MARKOS-PRM-OPS-01` |
| `MGSD-PRM-STR-01` | `cro_landing_page_builder.md` | `MARKOS-PRM-STR-01` |
| `MGSD-PRM-EXE-01` | `paid_media_creator.md` | `MARKOS-PRM-EXE-01` |
| `MGSD-PRM-CNT-01` | `email_lifecycle_strategist.md` | `MARKOS-PRM-CNT-01` |
| `MGSD-PRM-CNT-02` | `seo_content_architect.md` | `MARKOS-PRM-CNT-02` |
| `MGSD-PRM-CNT-03` | `social_community_manager.md` | `MARKOS-PRM-CNT-03` |
| `MGSD-PRM-OPS-02` | `brand_enforcer_qa.md` | `MARKOS-PRM-OPS-02` |

---

## 8. LINEAR TASK TEMPLATES (22+ files)

Under `.agent/marketing-get-shit-done/templates/LINEAR-TASKS/` → `.agent/markos/templates/LINEAR-TASKS/`

Every file is prefixed `MGSD-ITM-*`. All need rename:

| Current File | Proposed File |
|-------------|---------------|
| `MGSD-ITM-CNT-01-lead-magnet.md` | `MARKOS-ITM-CNT-01-lead-magnet.md` |
| `MGSD-ITM-CNT-02-ad-copy.md` | `MARKOS-ITM-CNT-02-ad-copy.md` |
| `MGSD-ITM-CNT-03-email-sequence.md` | `MARKOS-ITM-CNT-03-email-sequence.md` |
| `MGSD-ITM-CNT-04-social-calendar.md` | `MARKOS-ITM-CNT-04-social-calendar.md` |
| `MGSD-ITM-CNT-05-landing-page-copy.md` | `MARKOS-ITM-CNT-05-landing-page-copy.md` |
| `MGSD-ITM-CNT-06-seo-article.md` | `MARKOS-ITM-CNT-06-seo-article.md` |
| `MGSD-ITM-CNT-07-case-study.md` | `MARKOS-ITM-CNT-07-case-study.md` |
| `MGSD-ITM-CNT-08-video-script.md` | `MARKOS-ITM-CNT-08-video-script.md` |
| `MGSD-ITM-STR-01-audience-research.md` | `MARKOS-ITM-STR-01-audience-research.md` |
| `MGSD-ITM-STR-02-funnel-architecture.md` | `MARKOS-ITM-STR-02-funnel-architecture.md` |
| `MGSD-ITM-TRK-01-utm-tracking.md` | `MARKOS-ITM-TRK-01-utm-tracking.md` |
| `MGSD-ITM-ANA-01-performance-review.md` | `MARKOS-ITM-ANA-01-performance-review.md` |
| `MGSD-ITM-ANA-02-ab-test.md` | `MARKOS-ITM-ANA-02-ab-test.md` |
| `MGSD-ITM-ANA-02-ab-test-config.md` | `MARKOS-ITM-ANA-02-ab-test-config.md` |
| `MGSD-ITM-OPS-01-campaign-launch.md` | `MARKOS-ITM-OPS-01-campaign-launch.md` |
| `MGSD-ITM-ACQ-01-paid-social-setup.md` | `MARKOS-ITM-ACQ-01-paid-social-setup.md` |
| `MGSD-ITM-ACQ-02-retargeting-setup.md` | `MARKOS-ITM-ACQ-02-retargeting-setup.md` |
| `MGSD-ITM-ACQ-03-linkedin-outbound.md` | `MARKOS-ITM-ACQ-03-linkedin-outbound.md` |
| `MGSD-ITM-ACQ-04-affiliate-influencer.md` | `MARKOS-ITM-ACQ-04-affiliate-influencer.md` |
| `MGSD-ITM-COM-01-community-event.md` | `MARKOS-ITM-COM-01-community-event.md` |
| `_CATALOG.md` | `_CATALOG.md` | Content refs to update |
| `_SCHEMA.md` | `_SCHEMA.md` | Content refs to update |

---

## 9. REFERENCE FILES (16 files)

Under `.agent/marketing-get-shit-done/references/` → `.agent/markos/references/`

All have MGSD-REF-* token IDs that need updating:

| Token ID (old) | Token ID (new) | File |
|----------------|----------------|------|
| `MGSD-REF-NEU-01` | `MARKOS-REF-NEU-01` | `neuromarketing.md` |
| `MGSD-REF-OPS-01` | `MARKOS-REF-OPS-01` | `mir-gates.md` |
| `MGSD-REF-OPS-02` | `MARKOS-REF-OPS-02` | `marketing-living-system.md` |
| `MGSD-REF-OPS-03` | `MARKOS-REF-OPS-03` | `verification-patterns.md` |
| `MGSD-REF-OPS-04` | `MARKOS-REF-OPS-04` | `questioning.md` |
| `MGSD-REF-OPS-05` | `MARKOS-REF-OPS-05` | `planning-config.md` |
| `MGSD-REF-OPS-06` | `MARKOS-REF-OPS-06` | `continuation-format.md` |
| `MGSD-REF-OPS-07` | `MARKOS-REF-OPS-07` | `checkpoints.md` |
| `MGSD-REF-OPS-08` | `MARKOS-REF-OPS-08` | `user-profiling.md` |
| `MGSD-REF-OPS-09` | `MARKOS-REF-OPS-09` | `model-profiles.md` |
| `MGSD-REF-OPS-10` | `MARKOS-REF-OPS-10` | `model-profile-resolution.md` |
| `MGSD-REF-OPS-11` | `MARKOS-REF-OPS-11` | `decimal-phase-calculation.md` |
| `MGSD-REF-OPS-12` | `MARKOS-REF-OPS-12` | `phase-argument-parsing.md` |
| `MGSD-REF-OPS-13` | `MARKOS-REF-OPS-13` | `git-integration.md` |
| `MGSD-REF-OPS-14` | `MARKOS-REF-OPS-14` | `git-planning-commit.md` |
| `MGSD-REF-CNT-01` | `MARKOS-REF-CNT-01` | `ui-brand.md` |

---

## 10. TEMPLATE FILES (17+ generic templates)

Under `.agent/marketing-get-shit-done/templates/` → `.agent/markos/templates/`

Token IDs `MGSD-TPL-*` → `MARKOS-TPL-*` (16 template token IDs listed in MGSD-INDEX.md)

---

## 11. SKILL TOKEN IDs (24 skills in INDEX)

| Token ID (old) | Token ID (new) |
|----------------|----------------|
| `MGSD-SKL-NEU-01` | `MARKOS-SKL-NEU-01` |
| `MGSD-SKL-OPS-01` through `MGSD-SKL-OPS-19` | `MARKOS-SKL-OPS-01` through `MARKOS-SKL-OPS-19` |
| `MGSD-SKL-CAM-01` through `MGSD-SKL-CAM-03` | `MARKOS-SKL-CAM-01` through `MARKOS-SKL-CAM-03` |
| `MGSD-SKL-ANA-01` | `MARKOS-SKL-ANA-01` |

---

## 12. COMMAND NAMES (User-Facing)

These are the commands referenced in QUICKSTART.md, WORKFLOWS.md, and skill descriptions:

| Current Command | Proposed Command |
|----------------|-----------------|
| `mgsd-progress` | `markos-progress` |
| `mgsd-plan-phase` | `markos-plan-phase` |
| `mgsd-execute-phase` | `markos-execute-phase` |
| `mgsd-verify-work` | `markos-verify-work` |
| `mgsd-health` | `markos-health` |
| `mgsd-new-project` | `markos-new-project` |
| `mgsd-new-milestone` | `markos-new-milestone` |
| `mgsd-autonomous` | `markos-autonomous` |
| `mgsd-discuss-phase` | `markos-discuss-phase` |
| `mgsd-research-phase` | `markos-research-phase` |
| `mgsd-campaign-launch` | `markos-campaign-launch` |
| `mgsd-linear-sync` | `markos-linear-sync` |
| `mgsd-mir-audit` | `markos-mir-audit` |
| `mgsd-session-report` | `markos-session-report` |
| `mgsd-insert-phase` | `markos-insert-phase` |
| `mgsd-remove-phase` | `markos-remove-phase` |
| `mgsd-pause-work` | `markos-pause-work` |
| `mgsd-resume-work` | `markos-resume-work` |
| `mgsd-stats` | `markos-stats` |
| `mgsd-help` | `markos-help` |
| `mgsd-complete-milestone` | `markos-complete-milestone` |
| `mgsd-audit-milestone` | `markos-audit-milestone` |
| `mgsd-performance-review` | `markos-performance-review` |
| `mgsd-discipline-activate` | `markos-discipline-activate` |
| `mgsd-neuro-auditor` | `markos-neuro-auditor` |

---

## 13. INFRASTRUCTURE & CONFIG IDENTIFIERS

| Current | Proposed | Location |
|---------|----------|----------|
| `.mgsd-local/` | `.markos-local/` | Directory path (in .gitignore, all override references) |
| `.mgsd-project.json` | `.markos-project.json` | Project root config file |
| `.mgsd-install-manifest.json` | `.markos-install-manifest.json` | Install tracking file |
| `mgsd-{project_slug}` | `markos-{project_slug}` | ChromaDB collection namespace |
| `mgsd_privacy_accepted` | `markos_privacy_accepted` | localStorage key in onboarding UI |
| `mgsd-episodic-memory` | `markos-episodic-memory` | ChromaDB memory collection name |
| `[MGSD]` prefix | `[MARKOS]` prefix | Linear issue title prefix |
| `[MGSD-STALE]` tag | `[MARKOS-STALE]` tag | Linear staleness ticket prefix |
| `[MGSD-URGENT]` tag | `[MARKOS-URGENT]` tag | Linear urgency tag |
| `mgsd` label | `markos` label | Linear label |

---

## 14. npm PACKAGE

| Current | Proposed |
|---------|----------|
| `"name": "marketing-get-shit-done"` | `"name": "markos"` (or `"@markos/cli"`) |
| `npx marketing-get-shit-done install` | `npx markos install` |
| `npm install marketing-get-shit-done` | `npm install markos` |

---

## 15. PROTOCOL-LORE FILES (Content Updates)

These files don't get renamed but contain heavy `mgsd` / `MGSD` references:

| File | Occurrences | What to Update |
|------|-------------|----------------|
| `.protocol-lore/QUICKSTART.md` | 15+ | Commands, paths, file refs |
| `.protocol-lore/WORKFLOWS.md` | 12+ | Workflow loop IDs, agent refs |
| `.protocol-lore/ARCHITECTURE.md` | 8+ | Path refs to .mgsd-local/ |
| `.protocol-lore/CONVENTIONS.md` | 10+ | Override paths, ChromaDB namespace |
| `.protocol-lore/MEMORY.md` | 12+ | Agent IDs, collection names, .mgsd-project.json |
| `.protocol-lore/INDEX.md` | 3 | XML tags (`<mgsd_context>`) |
| `.protocol-lore/CODEBASE-MAP.md` | 2+ | localStorage key ref |
| `.protocol-lore/STATE.md` | TBD | Check for mgsd refs |
| `.protocol-lore/DEFCON.md` | TBD | Check for mgsd refs |

---

## 16. DOCUMENTATION FILES (Content Updates)

| File | What to Update |
|------|----------------|
| `TECH-MAP.md` | 30+ refs to `marketing-get-shit-done`, `.mgsd-*` paths |
| `ARCH-DIAGRAM.md` | 15+ refs to paths and npm commands |
| `RESEARCH/PRODUCT-RESEARCH.md` | npm command, .mgsd-local refs |
| `RESEARCH/ORG-PROFILE.md` | npm command ref |
| `RESEARCH/MARKET-TRENDS.md` | .mgsd-local ref |
| `CLAUDE.md` | Path to QUICKSTART (indirect, may need update if protocol-lore refs change) |
| `README.md` | npm command, product name |
| `package.json` | name, description, homepage, keywords |

---

## 17. .mgsd-local/ OVERRIDE FILES (Content Updates)

All files in `.mgsd-local/` (→ `.markos-local/`) contain self-referencing override comments:

| Pattern | Replace With |
|---------|-------------|
| `<!-- OVERRIDE: .mgsd-local layer` | `<!-- OVERRIDE: .markos-local layer` |
| `Copy this file to .mgsd-local/` | `Copy this file to .markos-local/` |
| `npx marketing-get-shit-done` | `npx markos` |

---

## 18. ONBOARDING CODE (Content Updates)

| File | What to Update |
|------|----------------|
| `onboarding/onboarding-config.json` | `mir_output_path`, `msp_output_path` paths |
| `onboarding/backend/server.cjs` | `.mgsd-local`, `.mgsd-project.json` refs |
| `onboarding/backend/handlers.cjs` | `.mgsd-local`, `.mgsd-project.json` refs |
| `onboarding/backend/agents/mir-filler.cjs` | `.mgsd-local` path comments |
| `onboarding/backend/agents/msp-filler.cjs` | `.mgsd-local` path comments |
| `onboarding/backend/agents/orchestrator.cjs` | Path to `marketing-get-shit-done/agents/` |
| `onboarding/backend/agents/example-resolver.cjs` | Path to `marketing-get-shit-done/templates/` |

---

## ANTI-FEATURES

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Renaming GSD-layer files (`gsd-*`) | Out of scope — GSD is a separate product/framework |
| Changing MIR/MSP acronyms | These are domain terms, not brand terms |
| Changing `mktg()` commit prefix | Already brand-neutral, established convention |

---

## GLOBAL FIND-REPLACE PATTERNS

These regex patterns cover 95%+ of the rename:

| Pattern (case-sensitive) | Replacement | Scope |
|--------------------------|-------------|-------|
| `mgsd-` (lowercase, in names) | `markos-` | Agent names, skill names, commands |
| `MGSD-` (uppercase, in token IDs) | `MARKOS-` | Token IDs everywhere |
| `MGSD ` (uppercase + space, in prose) | `MarkOS ` | Prose references |
| `marketing-get-shit-done` | `markos` | Directory names, npm package |
| `.mgsd-local` | `.markos-local` | Config paths |
| `.mgsd-project` | `.markos-project` | Config file refs |
| `.mgsd-install-manifest` | `.markos-install-manifest` | Manifest file refs |
| `mgsd_privacy_accepted` | `markos_privacy_accepted` | localStorage key |
| `mgsd-tools.cjs` | `markos-tools.cjs` | CLI tool name |
| `MGSD-INDEX` | `MARKOS-INDEX` | Index file name |
| `<mgsd_` (XML tags) | `<markos_` | Protocol-lore XML |
| `</mgsd_` | `</markos_` | Protocol-lore XML |

---

## TOTAL COUNT SUMMARY

| Category | Files to Rename | Files with Content Updates |
|----------|----------------|---------------------------|
| Agent definitions | 39 | 39 |
| Skill directories | 25 | 25 |
| Workflows | 1 (mgsd-linear-sync.md) | 27 |
| Hooks | 0 | 5 |
| Bin/CLI | 1 (mgsd-tools.cjs) | 12 |
| Prompts | 0 | 7 |
| Linear task templates | 20 | 22 |
| Reference files | 0 | 16 |
| Generic templates | 0 | 17+ |
| Index file | 1 (MGSD-INDEX.md) | 1 |
| Infrastructure config | 3 (.mgsd-*) | 3 |
| Protocol-lore docs | 0 | 9 |
| Onboarding code | 0 | 7 |
| Root-level docs | 0 | 6+ |
| .mgsd-local/ overrides | Dir rename | 10+ |
| **TOTAL** | **~90 file renames** | **~200+ content updates** |
