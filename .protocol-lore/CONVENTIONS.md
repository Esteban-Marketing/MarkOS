<mgsd_rules>
<rule id="tools">Always use `gsd-tools.cjs <action>` instead of raw git/file ops where possible.</rule>
<rule id="overrides">Templates use `<!-- OVERRIDABLE: .mgsd-local/... -->`. Resolve overrides during execution.</rule>
<rule id="tags">Use `[HUMAN]` in task names for tasks needing human intervention. Executor auto-pauses.</rule>
<rule id="files">Do not modify GSD base workflows unless necessary. Override via MGSD wrappers.</rule>
<rule id="formatting">Agent context files must remain highly dense. Use XML tags instead of conversational markdown.</rule>
</mgsd_rules>
