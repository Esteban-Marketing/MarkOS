<mgsd_memory>
<purpose>Defines the episodic memory and RAG embedding mechanics for the MGSD agent swarm using Chroma DB.</purpose>

<mechanics>
  <db_instance>chromadb://collections/mgsd-episodic-memory</db_instance>
  <format>OpenAI text-embedding-ada-002 style vectors, serialized into JSON payload schemas.</format>
  <rules>
    <rule id="never_repeat">Agents MUST query the Vector DB for "What failed previously?" before drafting any copy.</rule>
    <rule id="record_execution">Upon completion of any PLAN.md, `mgsd-data-scientist` calculates CAC/ROAS and immediately embeds the exact ad copy, CTR, and final ROI into the DB with a classification tag of `[SUCCESS]` or `[FAILURE]`.</rule>
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
</agent_queries>
</mgsd_memory>
