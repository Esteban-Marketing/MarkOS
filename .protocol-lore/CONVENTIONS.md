<mgsd_rules>
<purpose>Execution conventions for all MGSD agents. Read before modifying any source file.</purpose>

<rule id="tools">Always use `gsd-tools.cjs <action>` instead of raw git/file ops where possible.</rule>
<rule id="overrides">Templates use `<!-- OVERRIDABLE: .mgsd-local/... -->`. Resolve overrides during execution.
  Resolution order: check .mgsd-local/{path} → if exists, use it ([override] log MANDATORY) → else use .agent/templates/{path}.</rule>
<rule id="tags">Use `[HUMAN]` in task names for tasks needing human intervention. Executor auto-pauses.</rule>
<rule id="files">Do not modify .agent/ base workflows unless extending the protocol. Override via .mgsd-local/ wrappers.</rule>
<rule id="formatting">Agent context files must remain highly dense. Use XML tags instead of conversational markdown.</rule>

<!-- V1.1 Hardening Rules (added 2026-03-25) -->
<rule id="project_slug">
  project_slug MUST always be read from .mgsd-project.json.
  It is written ONCE by onboarding/backend/server.cjs on first POST /submit.
  Never compute a new slug. Never hardcode one. ChromaDB collection name = `mgsd-{project_slug}`.
</rule>
<rule id="ensure_chroma">
  All CLI agents that access ChromaDB MUST call `bin/ensure-chroma.cjs` before any vector read/write.
  Failure to do so will cause silent crashes if the daemon was killed by a system reboot.
  Export: ensureChroma() — returns a resolved Promise once the DB is accessible.
</rule>
<rule id="privacy_banner">
  The onboarding UI privacy consent banner is controlled by `onboarding/onboarding.js`.
  localStorage key: `mgsd_privacy_accepted` (value: "true").
  The banner must always be shown on first load. Do not bypass or auto-dismiss programmatically.
</rule>
<rule id="mir_write_path">
  Approved MIR drafts MUST be written to .mgsd-local/MIR/ — NOT to .agent/templates/MIR/.
  The write function `applyDrafts()` in onboarding/backend/write-mir.cjs enforces this.
  Writing to .agent/templates/ would cause data loss on the next `npx marketing-get-shit-done update`.
</rule>
</mgsd_rules>
