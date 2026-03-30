<markos_memory>
<purpose>Vector memory: namespaces, compatibility reads, and boot rules. Implementation: `onboarding/backend/vector-store-client.cjs`.</purpose>

<persistence>
  <file>.markos-project.json</file>
  <keys>project_slug (required for collection names), optional client metadata</keys>
  <rule>Written on first successful submit. Do not regenerate slug arbitrarily.</rule>
  <rule>If missing, complete onboarding or run new-project scaffold before relying on vector collections.</rule>
</persistence>

<namespace_contract>
  <canonical_write_prefix>Configured via MARKOS_VECTOR_PREFIX or default `markos`</canonical_write_prefix>
  <read_order>
    <item>Canonical prefix (writes and primary reads)</item>
    <item>Legacy compatibility prefix `markos` (reads only, when distinct)</item>
  </read_order>
  <rule>Destructive namespace migration is explicit phase work, not a side effect of HTTP handlers.</rule>
  <collections>
    <section>{prefix}-{project_slug}-{section}</section>
    <drafts>{prefix}-{project_slug}-drafts</drafts>
    <meta>{prefix}-{project_slug}-meta</meta>
  </collections>
</namespace_contract>

<vector_boot>
  <file>bin/ensure-vector.cjs</file>
  <rule>Call before relying on local vector daemon; cloud URL bypasses local spawn.</rule>
  <api_surface>onboarding/backend/vector-store-client.cjs</api_surface>
</vector_boot>

<mechanics>
  <rule id="slug_from_file">project_slug from `.markos-project.json` only.</rule>
  <rule id="compatibility_reads">Reads follow getCollectionReadPrefixes() order in code.</rule>
</mechanics>

<agent_queries>
  <agent id="any">
    <trigger>Before vector read/write</trigger>
    <action>ensure-vector when local; read slug from `.markos-project.json`; use configure() + healthCheck() as needed.</action>
  </agent>
</agent_queries>
</markos_memory>
