---
phase: "04"
plan: "04-01"
subsystem: "skills"
tags: ["skill-alignment", "templates", "overrides"]
requires: []
provides: ["Aligned markos skills with Phase 3 templates"]
affects: ["markos-new-project", "all markos skills"]
tech-stack.added: []
tech-stack.patterns: []
key-files.modified: [
  ".agent/skills/markos-new-project/SKILL.md",
  ".agent/skills/markos-plan-phase/SKILL.md",
  ".agent/skills/markos-execute-phase/SKILL.md",
  ".agent/skills/markos-discuss-phase/SKILL.md",
  ".agent/skills/markos-verify-work/SKILL.md",
  ".agent/skills/markos-research-phase/SKILL.md",
  ".agent/skills/markos-linear-sync/SKILL.md",
  ".agent/skills/markos-session-report/SKILL.md",
  ".agent/skills/markos-progress/SKILL.md"
]
key-files.created: [
  ".planning/phases/04-skill-alignment-and-local-override-architecture/skill-audit.md"
]
key-decisions: [
  "No hardcoded template paths were found in existing skill workflows. Added standard `## Template Paths` registry section to all relevant skills instead to formalize the fallback logic."
]
requirements-completed: []
duration: 4 min
completed: 2026-03-23T17:08:00Z
---

# Phase 04 Plan 01: Skill alignment and local override architecture Summary

Aligned all markos-* skills with the Phase 3 template structure and added the new `## Template Paths` section.

## Completed Tasks

1. **Audit all markos-* skills**: Ran a full grep search across skills for old template formats. Found 0 hardcoded violations, built an audit table indicating all skills needed the new section.
2. **Update markos-new-project**: Appended the explicit `.markos-local/` override mapping to the end of `markos-new-project/SKILL.md`.
3. **Update remaining skills**: Added the standard `## Template Paths` notice to all remaining markos command skills to specify override resolution behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None

## Next Steps

Ready for 04-02: .markos-local/ override convention and scaffold.
