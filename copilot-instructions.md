<!-- GSD Project Contract -->
# Project Instructions

This repository intentionally keeps two root instruction contracts:

- `copilot-instructions.md` is the shared project contract for the `.github` GSD and Copilot surface.
- `CLAUDE.md` remains the localized project contract for the `.claude` runtime.

The hidden shared-framework Copilot instructions file is a separate artifact class. It does not replace this project-root file.

<!-- GSD Configuration — managed by get-shit-done installer -->
# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
<!-- /GSD Configuration -->