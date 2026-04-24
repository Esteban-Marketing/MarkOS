# MarkOS CLI — Error Code Reference

Every non-zero exit from the `markos` CLI emits a structured error envelope to
stderr and exits with a stable D-10 exit code. Error codes are part of the
public API — your scripts can depend on the string remaining stable across
releases.

> **Canonical sources:**
> - `bin/lib/cli/errors.cjs` — `ERROR_TO_EXIT` map (single source of truth)
> - Phase 204 `204-CONTEXT.md` decision **D-10** — exit code semantics
> - Phase 204 Plan 02 — OAuth device flow error codes (RFC 8628)
>
> The test `test/cli/errors-map.test.js` asserts that every code documented
> here is present in the `ERROR_TO_EXIT` map, and vice versa — CI blocks any
> PR that lets code and docs drift apart.

## Exit code bands (D-10)

| Exit code | Category | Meaning |
|---|---|---|
| `0` | success | Command completed without error. |
| `1` | user_error | User-fixable input, missing flags, invalid args or brief. |
| `2` | transient | Network, timeout, upstream 5xx. Retry is appropriate. |
| `3` | auth_failure | No token, expired token, unauthorized. Run `markos login`. |
| `4` | quota_permission | Forbidden, rate-limited, or quota/plan exceeded. |
| `5` | internal_bug | Unexpected error. Re-run with `--json` and file a bug. |

## Envelope format

In a TTY, errors render as a 3-line unicode box on stderr:

```
┌── UNAUTHORIZED
│ Access token is missing or invalid.
└── hint: Run `markos login` to authenticate.
```

In non-TTY contexts (CI, pipes), the CLI emits a single JSON line on stderr:

```json
{"error":"UNAUTHORIZED","message":"Access token is missing or invalid.","hint":"Run `markos login` to authenticate."}
```

Use `--json` to force JSON mode in an interactive shell.

## Public error codes

Every code below is stable — callers can match on the `error` string.

| Code | Exit | Description | Example hint |
|---|---|---|---|
| `INVALID_BRIEF` | `1` | The brief file failed schema validation. | `Check brief against $schema; see docs/cli/commands.md#generate.` |
| `INVALID_ARGS` | `1` | One or more flags or positional args are malformed. | `Run markos <command> --help for the flag reference.` |
| `NOT_FOUND` | `1` | The referenced resource (run, key, env var, profile) does not exist. | `List available resources with markos status or markos keys list.` |
| `NETWORK_ERROR` | `2` | DNS, TCP, or TLS failure before a response was read. | `Check connectivity and MARKOS_API_BASE_URL; retry.` |
| `TIMEOUT` | `2` | Upstream took longer than the CLI timeout budget. | `Retry, or raise the timeout with --timeout=<seconds>.` |
| `SERVER_ERROR` | `2` | Upstream returned 5xx. Server-side incident. | `Retry; if persistent, see markos.dev/status.` |
| `UNAUTHORIZED` | `3` | Request reached the API but the token was rejected. | `Run markos login to re-authenticate.` |
| `NO_TOKEN` | `3` | No credentials found for the active profile. | `Run markos login, or export MARKOS_API_KEY.` |
| `TOKEN_EXPIRED` | `3` | Access token expired and cannot be silently refreshed. | `Run markos login to obtain a new token.` |
| `FORBIDDEN` | `4` | The token is valid but the tenant lacks permission for this action. | `Confirm role; contact your tenant admin.` |
| `RATE_LIMITED` | `4` | Per-tenant rate limit exceeded. The envelope includes `retry_after_seconds`. | `Wait retry_after_seconds and retry.` |
| `QUOTA_EXCEEDED` | `4` | Plan usage allowance exhausted (runs, tokens, seats). | `Upgrade plan or wait for the next billing cycle.` |
| `INTERNAL` | `5` | Unexpected error — fell through all handlers. | `Re-run with --json and file a bug at github.com/estebanooortz/markos/issues.` |

## OAuth device-flow error codes (RFC 8628)

`markos login` surfaces the device-flow error stream from the authorization
server. These codes come from RFC 8628 §3.5 and are returned verbatim in the
error envelope.

| Code | Exit | Polling action | Description |
|---|---|---|---|
| `authorization_pending` | — | continue polling | User has not yet completed the browser consent. Not surfaced as a terminal error. |
| `slow_down` | — | increase interval by 5s | Client is polling too fast. Not surfaced as a terminal error. |
| `expired_token` | `3` | stop | Device code expired (default 15 min). User must restart `markos login`. |
| `access_denied` | `3` | stop | User explicitly denied authorization in the browser. |
| `invalid_token` | `3` | — | Token presented to a protected endpoint is malformed or unknown. |
| `revoked_token` | `3` | — | Token was revoked in `/settings/sessions` or by an admin. |

`authorization_pending` and `slow_down` are never surfaced to the user — the
poller handles them internally and only emits an error envelope once the
outer deadline is reached or a terminal code is received.

## Machine-readable fields

Every error envelope contains at least `error` and `message`. Additional
fields appear when meaningful:

| Field | When present | Type |
|---|---|---|
| `error` | always | string — one of the codes above |
| `message` | always | string — human-readable |
| `hint` | usually | string — actionable next step |
| `retry_after_seconds` | `RATE_LIMITED`, `slow_down` | number |
| `trace_id` | when available | string — request correlation id |

## See also

- [`docs/cli/environment.md`](./environment.md) — environment variables the CLI reads
- [`docs/cli/commands.md`](./commands.md) — 11-command index with per-command exit-code usage
- `bin/lib/cli/errors.cjs` — source of truth for the `ERROR_TO_EXIT` map
