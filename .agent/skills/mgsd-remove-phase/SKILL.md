---
name: mgsd-remove-phase
description: Remove a future phase from the marketing roadmap with human confirmation
---

# mgsd-remove-phase

<context>
Safely removes a not-yet-started phase from ROADMAP.md. Requires human confirmation. Moves any phase content to .planning/backlog/ instead of deleting.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/remove-phase.md
</execution_context>

<process>
Execute the `/mgsd-remove-phase` workflow as documented.
Arguments: phase number.
</process>
