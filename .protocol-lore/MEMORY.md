<mgsd_memory>
<purpose>Defines the episodic memory and RAG embedding mechanics for MarkOS using ChromaDB.
LLMs: read this to understand namespace rules, compatibility reads, and memory mode semantics.</purpose>

<persistence>
  <!-- Project slug is the stable ChromaDB namespace root. Read from .mgsd-project.json first. -->
  <file>.mgsd-project.json</file>
  <keys>project_slug (string), client_name (string), installed_at (ISO8601)</keys>
  <rule>Written ONCE by onboarding/backend/server.cjs on first POST /submit. Never regenerated.</rule>
  <rule>Agents MUST read this file to determine their collection namespace before any Chroma operation.</rule>
  <rule>If .mgsd-project.json is missing, the onboarding flow has not completed — run mgsd-new-project.</rule>
</persistence>

<namespace_contract>
  <canonical_write_prefix>mgsd</canonical_write_prefix>
  <future_prefix>markos</future_prefix>
  <read_order>
    1. ${MARKOS_CHROMA_PREFIX or canonical write prefix}
    2. mgsd (legacy compatibility)
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

<chroma_boot>
  <!-- ChromaDB daemon may die on reboot. Always ensure it is running before vector calls. -->
  <file>bin/ensure-chroma.cjs</file>
  <rule>ALL CLI agents that access vector memory MUST call ensure-chroma before attempting Chroma operations.</rule>
  <rule>If CHROMA_CLOUD_URL is set in .env, local daemon is bypassed entirely.</rule>
  <api_surface>onboarding/backend/chroma-client.cjs</api_surface>
  <exports>configure(host), setBootReport(report), healthCheck(), storeDraft(slug, section, text), getContext(slug, section, query, n)</exports>
  <health_status>
    <local>local_available | local_started | local_unavailable | local_boot_failed</local>
    <cloud>cloud_configured | cloud_reachable | cloud_unavailable</cloud>
  </health_status>
</chroma_boot>

<mechanics>
  <db_instance>chromadb://collections/{prefix}-{project_slug}-{section|drafts|meta}</db_instance>
  <format>OpenAI text-embedding-ada-002 style vectors, serialized into JSON payload schemas.</format>
  <rules>
    <rule id="never_repeat">Agents MUST query the Vector DB for "What failed previously?" before drafting any copy.</rule>
    <rule id="record_execution">Upon completion of any PLAN.md, `mgsd-data-scientist` calculates CAC/ROAS and immediately embeds the exact ad copy, CTR, and final ROI into the DB with a classification tag of `[SUCCESS]` or `[FAILURE]`.</rule>
    <rule id="slug_from_file">project_slug MUST be read from .mgsd-project.json — never hardcoded or regenerated.</rule>
    <rule id="compatibility_reads">Reads MUST use compatibility lookup order; missing canonical collections are not treated as migration failures.</rule>
    <rule id="migration_boundary">Namespace migration (rename/copy/delete) is explicit phase work and cannot happen as a side effect of status/submit/regenerate flows.</rule>
  </rules>
</mechanics>

<agent_queries>
  <!-- Active integration instructions for the agents -->
  <agent id="mgsd-copy-drafter">
    <trigger>Before generating email subject lines, ad hooks, or SEO titles.</trigger>
    <action>Query `mgsd-episodic-memory` using keyword filters (e.g., "Phase 3 Hooks", "Failed Email Sequences"). Read the returned JSON payload of historic failures and explicitly exclude those psychological angles from the new draft.</action>
  </agent>
  <agent id="mgsd-campaign-architect">
    <trigger>While assembling the initial campaign structure.</trigger>
    <action>Query Chroma DB for similar historical campaigns targeting the same persona. Adopt matching structures tagged `[SUCCESS]`.</action>
  </agent>
  <agent id="any">
    <trigger>Before any Chroma read/write.</trigger>
    <action>Run bin/ensure-chroma.cjs. Read .mgsd-project.json for project_slug. Use canonical prefix for writes and compatibility lookup order for reads.</action>
  </agent>
</agent_queries>
</mgsd_memory>
