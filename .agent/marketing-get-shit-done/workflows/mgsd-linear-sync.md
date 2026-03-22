---
description: Automatically sync MGSD roadmap phases and checked tasks to Linear using the mgsd-linear-manager agent.
---

# MGSD Linear Sync Workflow

1. Call the `mgsd-linear-manager` agent to parse the execution context from `.planning/ROADMAP.md` and `.planning/STATE.md`.
2. Extract all incomplete tasks, verification checks, and unmapped roadmap phases in the current project root.
3. Authenticate with the Linear GraphQL API using the natively configured `LINEAR_API_KEY` (must be defined in your `.env` securely).
4. Generate tickets automatically for any untracked item in the active milestone.
5. If a task under a mapped `.planning/phases/XX/PLAN.md` is marked completely as `[x]`, execute a mutation to Linear setting the status of the exact corresponding issue to `Done`.

> **Note:** Execute this workflow continuously via `/mgsd-linear-sync` to ensure project states match codebase realities perfectly.
