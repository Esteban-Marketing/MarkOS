# Tooling Root

This file defines the authoritative sources used by GSD tooling commands.

## Source Priority

1. `.planning/ROADMAP.md`
2. `.planning/STATE.md`
3. `.planning/phases/*` plan and summary artifacts
4. `.planning/PROGRESS.md` snapshot for humans

## Current Baseline (2026-03-28)

- Milestone baseline: v2.1 Product Hardening & Identity Convergence
- Phase baseline: 27 completed
- Next lifecycle action: milestone close

## Rules

- A phase is considered disk-complete when `*-SUMMARY.md` count equals `*-PLAN.md` count.
- STATE metadata should mirror active-milestone progress metrics; optional global disk metrics can be tracked in PROGRESS.md.
- ROADMAP milestone tracker should explicitly mark active sequencing using ✅, 🚧, and 📋.
- Deferred tracks remain listed but must not override active sequencing decisions.
