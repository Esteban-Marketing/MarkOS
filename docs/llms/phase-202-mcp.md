# Phase 202 — MCP Server GA + Claude Marketplace Launch

MarkOS graduates the MCP (Model Context Protocol) server from 0-day (Phase 200, 10 tools including
stubs) to full GA across 30 live tools with zero stubs:

- **30 live tools** (marketing + CRM + literacy + tenancy) — every handler returns schema-valid payloads
- **OAuth 2.1 + PKCE** session persistence with 24h rolling TTL (no refresh tokens per D-06)
- **Per-tenant 24h cost meter** with hard `402 budget_exhausted` kill-switch
  ($1/day free, $100/day paid default)
- **MCP Resources** (canon, literacy, tenant-status URIs) + SSE progress streaming for long-running LLM tools
- **Strict AJV** input + output validation on every tool call (contract schemas in
  `lib/markos/mcp/_generated/tool-schemas.json`)
- **Prompt-injection deny-list** with NFKC Unicode normalization (fullwidth / homoglyph aware)
- **Rate-limit** 60 rpm/session + 600 rpm/tenant via Upstash Redis
- **@sentry/nextjs** error capture + Vercel Log Drains structured JSON
- **Surface S1** `/settings/mcp` tenant dashboard + **Surface S2** `/oauth/consent` page

Contracts shipped this phase: **F-71-v2** (MCP session), **F-89** (OAuth 2.1 + PKCE), **F-90..F-93**
(30-tool schema per-domain), **F-94** (resources + notifications), **F-95** (cost-meter +
`/settings/mcp` tenant APIs).

## Key docs

- [Tool reference (all 30)](/docs/mcp-tools)
- [VS Code setup](/docs/vscode-mcp-setup)
- [OAuth 2.1 + PKCE flow](/docs/oauth)
- [Red-team checklist](/docs/mcp-redteam-checklist)
- [F-89 OAuth contract](/contracts/F-89-mcp-oauth-v1.yaml)
- [F-94 Resources contract](/contracts/F-94-mcp-resources-v1.yaml)
