---
name: mgsd-session-report
description: Generate a session report with token usage estimates, work summary, and outcomes
---

# mgsd-session-report

<context>
Generates a summary of all work done in the current session.
</context>

<execution_context>
@.agent/marketing-get-shit-done/workflows/session-report.md
</execution_context>

<process>
Execute the `/mgsd-session-report` workflow exactly as documented in the workflow file.
</process>

## Template Paths

This skill operates within the MGSD structure. It honors overrides placed in the client .mgsd-local/ directory before falling back to the default .agent/marketing-get-shit-done/ templates.
