# MarkOS MCP — Tool Reference

Phase 202 — 30 tools live (marketing-weighted).

Every tool is accessed via MCP 2025-06-18 JSON-RPC at `POST /api/mcp` with an OAuth 2.1 bearer.
See [VS Code setup](/docs/vscode-mcp-setup) for the first-connection flow + [OAuth flow](/docs/oauth)
for the full PKCE curl walkthrough.

## draft_message

Generate a single marketing draft from a channel + audience + pain + promise + brand brief.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `channel, audience, pain, promise, brand`
- **Input schema additionalProperties:** `false (strict)`

## run_neuro_audit

Run a neuro-audit pass over a draft and return scored issues.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `text`
- **Input schema additionalProperties:** `false (strict)`

## plan_campaign

Produce a campaign plan outline grounded in brand canon from an objective + audience + optional budget.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `objective, audience`
- **Input schema additionalProperties:** `false (strict)`

## research_audience

Return an audience research snapshot (pains + archetypes) for a segment key, tenant-scoped.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `segment`
- **Input schema additionalProperties:** `false (strict)`

## generate_brief

Generate a structured marketing brief (channel, audience, pain, promise, brand) from a freeform prompt.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `prompt`
- **Input schema additionalProperties:** `false (strict)`

## audit_claim

Verify whether a marketing claim is supported by canon evidence. Returns { supported, confidence, evidence }.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `claim`
- **Input schema additionalProperties:** `false (strict)`

## list_pain_points

List canonical pain-point taxonomy entries, tenant-scoped, optionally filtered by category.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## rank_execution_queue

Rank CRM execution-queue items for the session tenant, optionally limited.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## schedule_post

Schedule a post draft onto a channel queue. Mutating — requires approval_token round-trip.

- **Latency tier:** `simple`
- **Mutating:** `yes — requires approval_token round-trip (D-03)`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `channel, content, scheduled_at`
- **Input schema additionalProperties:** `false (strict)`

## explain_literacy

Explain a literacy node or archetype slug, returning description + examples + canonical slug.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## remix_draft

Remix a marketing draft per a directive (e.g. "shorter", "more formal", "different angle"). Returns N variants.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `draft, directive`
- **Input schema additionalProperties:** `false (strict)`

## rank_draft_variants

Score N drafts (2..10) against brand voice + neuro-audit + claim-check. Returns a ranked list.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `variants`
- **Input schema additionalProperties:** `false (strict)`

## brief_to_plan

Expand a marketing brief into a 5-step execution plan (research → pain → promise → drafts → schedule).

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `brief`
- **Input schema additionalProperties:** `false (strict)`

## generate_channel_copy

Produce channel-ready blocks (subject + preview + body + CTA where applicable) for a specific channel + brief.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `channel, brief`
- **Input schema additionalProperties:** `false (strict)`

## expand_claim_evidence

Given a marketing claim, return supporting canon evidence + suggested strengthening variants.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `claim`
- **Input schema additionalProperties:** `false (strict)`

## clone_persona_voice

Given a persona archetype + topic, return a voice-cloned draft with voice markers.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `persona_slug, topic`
- **Input schema additionalProperties:** `false (strict)`

## generate_subject_lines

Return 10 ranked subject-line candidates for a draft body.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `body`
- **Input schema additionalProperties:** `false (strict)`

## optimize_cta

Return alternative CTA options for a marketing draft, ranked by predicted click-weight heuristic.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `draft`
- **Input schema additionalProperties:** `false (strict)`

## generate_preview_text

Return 5 ranked email preview-text candidates for a subject + body pair.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `subject, body`
- **Input schema additionalProperties:** `false (strict)`

## audit_claim_strict

Strict claim auditor — Sonnet-powered; forces at least one canon citation + confidence score.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-sonnet-4-6-20260301`
- **Required input fields:** `claim`
- **Input schema additionalProperties:** `false (strict)`

## list_crm_entities

List CRM entities (contacts / accounts / deals) for the tenant, filtered by kind + optional filter.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `kind`
- **Input schema additionalProperties:** `false (strict)`

## query_crm_timeline

Return the tenant-scoped CRM activity timeline for a given entity (contact / account / deal).

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `entity_id`
- **Input schema additionalProperties:** `false (strict)`

## snapshot_pipeline

Return a tenant-scoped pipeline snapshot: stages with counts + aggregate value. Read-only.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## read_segment

Return tenant-scoped segment membership (entity ids) for a given segment key.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `segment_key`
- **Input schema additionalProperties:** `false (strict)`

## summarize_deal

Summarize a CRM deal (status + activity highlights + next-step suggestions) via Haiku LLM. Tenant-scoped.

- **Latency tier:** `llm`
- **Mutating:** `no`
- **Cost model:** `claude-haiku-4-5-20260301`
- **Required input fields:** `deal_id`
- **Input schema additionalProperties:** `false (strict)`

## query_canon

Free-text search over tenant brand canon; returns top-K matches with title + text snippet.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `query`
- **Input schema additionalProperties:** `false (strict)`

## explain_archetype

Return tenant-scoped archetype description + examples + voice markers for a given archetype slug.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `archetype_slug`
- **Input schema additionalProperties:** `false (strict)`

## walk_taxonomy

Traverse tenant literacy taxonomy neighbors (children / parents / siblings) from a given node id.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `node_id, direction`
- **Input schema additionalProperties:** `false (strict)`

## list_members

List tenant members with their IAM roles and join dates. Read-only.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## query_audit

Query tenant audit log with optional since_iso / actions filters. Read-only. Uses F-88 read surface.

- **Latency tier:** `simple`
- **Mutating:** `no`
- **Cost model:** `simple (no LLM)`
- **Required input fields:** `(none)`
- **Input schema additionalProperties:** `false (strict)`

## See also

- [OAuth 2.1 + PKCE flow](/docs/oauth)
- [VS Code setup](/docs/vscode-mcp-setup)
- [Red-team checklist](/docs/mcp-redteam-checklist)
- [F-89 OAuth contract](/contracts/F-89-mcp-oauth-v1.yaml)
- [F-90..F-95 Tool + Resources + Cost contracts](/contracts)
