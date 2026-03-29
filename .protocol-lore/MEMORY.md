<markos_memory>
<purpose>Defines the episodic memory and RAG embedding mechanics for MarkOS using Supabase \+ Upstash Vector.
LLMs: read this to understand namespace rules, compatibility reads, and memory mode semantics.</purpose>

<persistence>
  <!-- Project slug is the stable Supabase \+ Upstash Vector namespace root. Read from .markos-project.json first. -->
  <file>.markos-project.json</file>
  <keys>project_slug (string), client_name (string), installed_at (ISO8601)</keys>
  <rule>Written ONCE by onboarding/backend/server.cjs on first POST /submit. Never regenerated.</rule>
  <rule>Agents MUST read this file to determine their collection namespace before any Vector Store operation.</rule>
  <rule>If .markos-project.json is missing, the onboarding flow has not completed â€” run markos-new-project.</rule>
</persistence>

<namespace_contract>
  <canonical_write_prefix>markos</canonical_write_prefix>
  <future_prefix>markos</future_prefix>
  <read_order>
    1. ${MARKOS_VECTOR_PREFIX or canonical write prefix}
    2. markos (legacy compatibility)
    3. markos (future compatibility)
  </read_order>
  <rule>Writes use one canonical prefix; reads probe the compatibility order above.</rule>
  <rule>Runtime MUST NOT perform destructive rename/migration (delete/overwrite) across namespace prefixes automatically.</rule>
  <collections>
    <section>{prefix}-{project_slug}-{section}</section>
    <drafts>{prefix}-{project_slug}-drafts</drafts>
    <meta>{prefix}-{project_slug}-meta</meta>
  </collections>
</namespace_contract>

<vector_boot>
  <!-- Supabase \+ Upstash Vector daemon may die on reboot. Always ensure it is running before vector calls. -->
  <file>bin/ensure-vector.cjs</file>
  <rule>ALL CLI agents that access vector memory MUST call ensure-vector before attempting Vector Store operations.</rule>
  <rule>If UPSTASH_VECTOR_REST_URL is set in .env, local daemon is bypassed entirely.</rule>
  <api_surface>onboarding/backend/vector-store-client.cjs</api_surface>
  <exports>configure(host), setBootReport(report), healthCheck(), storeDraft(slug, section, text), getContext(slug, section, query, n)</exports>
  <health_status>
    <local>local_available | local_started | local_unavailable | local_boot_failed</local>
    <cloud>cloud_configured | cloud_reachable | cloud_unavailable</cloud>
  </health_status>
</vector_boot>

<mechanics>
  <db_instance>Supabase \+ Upstash Vector://collections/{prefix}-{project_slug}-{section|drafts|meta}</db_instance>
  <format>OpenAI text-embedding-ada-002 style vectors, serialized into JSON payload schemas.</format>
  <rules>
    <rule id="never_repeat">Agents MUST query the Vector DB for "What failed previously?" before drafting any copy.</rule>
    <rule id="record_execution">Upon completion of any PLAN.md, `markos-data-scientist` calculates CAC/ROAS and immediately embeds the exact ad copy, CTR, and final ROI into the DB with a classification tag of `[SUCCESS]` or `[FAILURE]`.</rule>
    <rule id="slug_from_file">project_slug MUST be read from .markos-project.json â€” never hardcoded or regenerated.</rule>
    <rule id="compatibility_reads">Reads MUST use compatibility lookup order; missing canonical collections are not treated as migration failures.</rule>
    <rule id="migration_boundary">Namespace migration (rename/copy/delete) is explicit phase work and cannot happen as a side effect of status/submit/regenerate flows.</rule>
  </rules>
</mechanics>

<agent_queries>
  <!-- Active integration instructions for the agents -->
  <agent id="markos-copy-drafter">
    <trigger>Before generating email subject lines, ad hooks, or SEO titles.</trigger>
    <action>Query `markos-episodic-memory` using keyword filters (e.g., "Phase 3 Hooks", "Failed Email Sequences"). Read the returned JSON payload of historic failures and explicitly exclude those psychological angles from the new draft.</action>
  </agent>
  <agent id="markos-campaign-architect">
    <trigger>While assembling the initial campaign structure.</trigger>
    <action>Query Supabase + Upstash Vector for similar historical campaigns targeting the same persona. Adopt matching structures tagged `[SUCCESS]`.</action>
  </agent>
  <agent id="any">
    <trigger>Before any Vector Store read/write.</trigger>
    <action>Run bin/ensure-vector.cjs. Read .markos-project.json for project_slug. Use canonical prefix for writes and compatibility lookup order for reads.</action>
  </agent>
</agent_queries>
</markos_memory>


