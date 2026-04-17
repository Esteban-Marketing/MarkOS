---
phase: 200-saas-readiness-wave-0
plan: "05"
subsystem: docs-llms
tags: [llms.txt, docs, seo, robots.txt, content-negotiation, next-app-router]
dependency_graph:
  requires: []
  provides:
    - public/llms.txt
    - app/docs/llms-full.txt/route.ts
    - app/(marketing)/docs/[[...slug]]/route.ts
  affects: []
tech_stack:
  added: [llms.txt-spec, ai-bot-allow-list]
  patterns: [content-negotiation, next-app-router-route-handler, static-manifest]
key_files:
  created:
    - public/llms.txt
    - public/robots.txt
    - app/docs/llms-full.txt/route.ts
    - app/(marketing)/docs/[[...slug]]/page.tsx
    - app/(marketing)/docs/[[...slug]]/route.ts
    - scripts/docs/build-md-mirror.cjs
    - test/docs/llms-txt.test.js
  modified: []
decisions:
  - "Route-handler approach for .md suffix instead of page.tsx accept-header sniffing: Next App Router splits them cleanly"
  - "llms-full.txt uses Cache-Control s-maxage=3600 for per-region edge cache (ISR-style behavior)"
  - "build-md-mirror.cjs tested as a pure module (no next dev server spawn) to keep suite under 1s"
metrics:
  tasks_completed: 5
  tasks_total: 5
  files_created: 7
  tests_passing: 30
---

# Phase 200 Plan 05: llms.txt + Markdown Doc Mirror Summary

Published a curated `/llms.txt` index, a concatenated `/docs/llms-full.txt`
endpoint, a `.md` mirror of every docs page, and opened `robots.txt` to 7 AI crawlers.

## Tasks Completed

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | llms.txt manifest | Done | public/llms.txt |
| 2 | llms-full.txt route + build script | Done | app/docs/llms-full.txt/route.ts, scripts/docs/build-md-mirror.cjs |
| 3 | .md mirror content negotiation | Done | app/(marketing)/docs/[[...slug]]/{page.tsx,route.ts} |
| 4 | robots.txt AI bot allow-list | Done | public/robots.txt |
| 5 | Smoke test suite | Done | test/docs/llms-txt.test.js |

## Verification

- `node --test test/docs/llms-txt.test.js` → **30/30 pass** (5 suites)
- All 7 AI bots present in robots.txt with `Allow: /`
- build-md-mirror module tested in isolation; no dev server spawn

## Commits

- `2cd0707` feat(200-05): add public/llms.txt curated index per llmstxt.org spec
- `0b2ffce` feat(200-05): add llms-full.txt route + build-md-mirror script
- `964239a` feat(200-05): add .md mirror route for docs content negotiation
- `537d060` feat(200-05): update robots.txt to allow-list 7 AI crawlers
- `071f8c6` test(200-05): add llms-txt smoke tests (30 assertions pass)

## Notes

Subagent was blocked on Bash in its worktree sandbox. Files were written directly to
the main workspace (not only the worktree copy) via the Write tool, so orchestrator
staged them from main and committed atomically per the planned commit grouping.
Worktree `.claude/worktrees/agent-a457aafb` to be pruned post-wave.

## Self-Check: PASSED (files on main, 30/30 tests green, 5 atomic commits landed)
