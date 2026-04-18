# OAuth 2.1 + PKCE for MarkOS MCP

Phase 202 implements OAuth 2.1 with PKCE (RFC 7636 S256), Dynamic Client Registration (RFC 7591),
and resource indicators (RFC 8707) per the MCP 2025-06-18 authorization spec.

## Discovery

```bash
curl https://markos.dev/.well-known/oauth-protected-resource
curl https://markos.dev/.well-known/oauth-authorization-server
```

The protected-resource metadata points at the authorization server; the AS metadata advertises
`S256` as the only supported `code_challenge_method`.

## Dynamic Client Registration

```bash
curl -X POST https://markos.dev/oauth/register \
  -H 'content-type: application/json' \
  -d '{"client_name":"my-agent","redirect_uris":["http://127.0.0.1:12345"]}'
```

Response:

```json
{
  "client_id": "mcp-cli-...",
  "grant_types": ["authorization_code"],
  "token_endpoint_auth_method": "none"
}
```

## Authorize (browser)

Compute a PKCE `code_verifier` (43-128 characters, random) and derive the `code_challenge`:

```bash
VERIFIER=$(openssl rand -hex 32)
CHALLENGE=$(printf "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr -d '=' | tr '/+' '_-')
```

Then open:

```
https://markos.dev/oauth/authorize?client_id=<client_id>&redirect_uri=http://127.0.0.1:12345&response_type=code&code_challenge=$CHALLENGE&code_challenge_method=S256&scope=read+plan&state=abc&resource=https://markos.dev/api/mcp
```

Sign in (magic link) and **pick the target tenant** on the consent screen (D-07 tenant-bind at consent time).
After approval the browser redirects to `http://127.0.0.1:12345?code=<auth_code>&state=abc`.

## Token exchange

```bash
curl -X POST https://markos.dev/oauth/token \
  -d grant_type=authorization_code \
  -d code=<auth_code> \
  -d code_verifier=$VERIFIER \
  -d client_id=<client_id> \
  -d redirect_uri=http://127.0.0.1:12345 \
  -d resource=https://markos.dev/api/mcp
```

Response:

```json
{
  "access_token": "<64-hex>",
  "token_type": "Bearer",
  "expires_in": 86400,
  "scope": "read plan"
}
```

**Note (D-06):** MarkOS does NOT issue refresh tokens — the leak surface is removed entirely. When a
token expires, the client re-runs the authorization code flow.

## Revoke

```bash
curl -X POST https://markos.dev/oauth/revoke \
  -H 'content-type: application/json' \
  -H 'x-markos-user-id: <your-user-id>' \
  -d '{"token":"<opaque-token>"}'
```

RFC 7009: the revoke endpoint ALWAYS returns 200 for an authenticated caller regardless of whether
the token was known, to prevent token-existence probing.

## Using the token against MCP

```bash
curl -X POST https://markos.dev/api/mcp \
  -H 'authorization: Bearer <opaque-token>' \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Send the bearer on **every** JSON-RPC request — not just the first one.

## References

- [RFC 7636 — PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 7591 — Dynamic Client Registration](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 8707 — Resource Indicators](https://datatracker.ietf.org/doc/html/rfc8707)
- [RFC 8414 — AS Metadata](https://datatracker.ietf.org/doc/html/rfc8414)
- [RFC 9728 — RS Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [RFC 7009 — Token Revocation](https://datatracker.ietf.org/doc/html/rfc7009)
- [MCP 2025-06-18 — Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)

## See also

- [VS Code setup](/docs/vscode-mcp-setup)
- [Tool reference (all 30)](/docs/mcp-tools)
- [Red-team checklist](/docs/mcp-redteam-checklist)
