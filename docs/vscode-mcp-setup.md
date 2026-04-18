# VS Code + MarkOS MCP

Phase 202 certifies MarkOS on two MCP clients:

1. **Claude Marketplace** (primary)
2. **VS Code** (second cert — D-08)

## Configure

Create or edit `.vscode/mcp.json` in your project root or user-profile location:

```json
{
  "servers": {
    "markos": {
      "type": "http",
      "url": "https://markos.dev/api/mcp"
    }
  }
}
```

## First connection (OAuth flow)

1. VS Code fetches `/api/mcp` → receives `401 Unauthorized` with header
   `WWW-Authenticate: Bearer resource_metadata="https://markos.dev/.well-known/oauth-protected-resource"`.
2. VS Code reads the resource metadata → discovers the authorization server URL
   (`/.well-known/oauth-authorization-server`).
3. VS Code POSTs to `/oauth/register` (RFC 7591 Dynamic Client Registration) → receives a `client_id`.
4. VS Code opens your browser to
   `https://markos.dev/oauth/authorize?client_id=...&redirect_uri=http://127.0.0.1:33418&code_challenge=...&resource=https://markos.dev/api/mcp&...`.
5. Sign in to MarkOS via magic link (Phase 201 flow), **pick a target tenant**, and approve.
6. The browser redirects to `http://127.0.0.1:33418?code=...` — VS Code's local listener captures it.
7. VS Code POSTs to `/oauth/token` with the PKCE verifier → receives an opaque bearer token (24h rolling TTL).

Subsequent tool calls send `Authorization: Bearer <opaque_token>` on every JSON-RPC request.

## Troubleshooting

**401 on every call.** Confirm the bearer token is sent on every JSON-RPC request (not just the first one).
This is the most common MCP OAuth pitfall.

**Silent stop after 24h.** The token expired from idle. VS Code will auto-redirect back through OAuth on
next tool invocation.

**DCR (Dynamic Client Registration) fails.** Confirm `/oauth/register` is reachable and your VS Code build is current
(MCP OAuth support landed in VS Code 1.87+).

**Cross-tenant 403.** The session is tenant-bound at consent time (D-07). To switch tenants, revoke the
session in `/settings/mcp` and reconnect.

**Rate limited (429).** Per-session cap is 60 rpm; per-tenant cap is 600 rpm. Back off using the
`Retry-After` header.

**402 budget_exhausted.** Your tenant hit the rolling 24h cost cap ($1 free / $100 paid default).
Upgrade the plan or wait for the window to reset (`reset_at` in the 402 envelope).

## See also

- [OAuth 2.1 + PKCE flow](/docs/oauth)
- [Tool reference (all 30)](/docs/mcp-tools)
- [Red-team checklist](/docs/mcp-redteam-checklist)
