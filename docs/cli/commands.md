# MarkOS CLI — Command Index

The `markos` CLI ships 11 top-level commands. Every command accepts global
flags (`--json`, `--profile`, `--no-color`, `--help`) and exits with a
D-10 exit code (see [`errors.md`](./errors.md)). This page is the index —
per-command detail lives under `markos <command> --help`.

> **Install:** `npx markos` (npm), `brew install markos/markos/markos` (Homebrew),
> `scoop install markos/markos` (Scoop on Windows).

## Global flags

| Flag | Effect |
|---|---|
| `--profile=<name>` | Use a named profile from `$XDG_CONFIG_HOME/markos/config.json`. |
| `--json` | Force machine-readable output on stdout + JSON error envelopes on stderr. |
| `--no-color` | Disable ANSI color. Also honored via `NO_COLOR=1` env. |
| `--help` | Print command-specific help and exit `0`. |
| `--version` | Print the CLI version and exit `0`. |

## Command index

| Command | Summary | Common flags | Exit codes used |
|---|---|---|---|
| [`markos init`](#markos-init) | Scaffold a MarkOS workspace (`.markos-local/`) + seed config + optional business-model preset. | `--preset=<b2b-saas\|agency\|ecommerce>`, `--force`, `--json` | `0`, `1`, `5` |
| [`markos generate`](#markos-generate) | Generate one artifact from a brief YAML — draft, variant set, or campaign content. Legacy zero-deps path still honored. | `<brief.yaml>`, `--out=<path>`, `--json` | `0`, `1`, `2`, `3`, `4`, `5` |
| [`markos plan`](#markos-plan) | Produce a dry-run execution plan for a brief without creating a run. | `<brief.yaml>`, `--json` | `0`, `1`, `2`, `3`, `5` |
| [`markos run`](#markos-run) | Kick off a server-side run, stream SSE events, and print the final result. | `<brief.yaml>`, `--watch`, `--json` | `0`, `1`, `2`, `3`, `4`, `5` |
| [`markos eval`](#markos-eval) | Score an existing run or artifact against a local or remote rubric. | `<run-id\|path>`, `--rubric=<path>`, `--json` | `0`, `1`, `2`, `3`, `5` |
| [`markos login`](#markos-login) | Authenticate via OAuth 2.0 device flow (RFC 8628) or paste a CI token. | `--token=<mks_ak_…>`, `--no-browser`, `--json` | `0`, `1`, `2`, `3` |
| [`markos keys`](#markos-keys) | CRUD interface for long-lived API keys. Subcommands: `list`, `create`, `revoke`, `rotate`. | `list`, `create --name=<…>`, `revoke <id>`, `--json` | `0`, `1`, `2`, `3`, `4`, `5` |
| [`markos whoami`](#markos-whoami) | Print the active tenant, profile, and identity. | `--json` | `0`, `3` |
| [`markos env`](#markos-env) | Manage per-tenant server-side env vars. Subcommands: `list`, `pull`, `push`, `delete`. | `list`, `pull <path>`, `push <path>`, `delete <key>`, `--json` | `0`, `1`, `2`, `3`, `4`, `5` |
| [`markos status`](#markos-status) | Aggregate tenant status: recent runs, connectors, quota, subscription. Supports `--watch`. | `--watch`, `run <id>`, `--json` | `0`, `1`, `2`, `3`, `5` |
| [`markos doctor`](#markos-doctor) | Run the 9-check local diagnostic with optional `--fix` auto-remediation and `--check-only` CI gate. | `--check-only`, `--fix`, `--json` | `0`, `1`, `5` |

## markos init

Scaffold `.markos-local/` with an overlay directory for client-specific
templates, seed the XDG config, and optionally apply a business-model preset.
Idempotent when `--force` is omitted. See `markos init --help`.

## markos generate

One-shot artifact generation for briefs that don't need orchestration. This
is the legacy zero-deps path that shipped in v3.0; it remains for CI scripts
and simple workflows. For full DAG orchestration prefer `markos run`.

## markos plan

Server-side dry-run of a brief. Returns the planned DAG, estimated tokens,
estimated cost, and a `plan_id` you can later pass to `markos run --from-plan=<id>`.
No mutations occur. See `markos plan --help`.

## markos run

Create a run from a brief, stream SSE events as the DAG executes, and print
the final result envelope. With `--watch` the CLI attaches to an existing
run and tails events. Uses `Last-Event-ID` for resilient reconnects.

## markos eval

Grade an artifact or run against a rubric. Supports local YAML rubrics
(`--rubric=./rubric.yaml`) and server-side rubrics (`--rubric=@brand-safety`).
Returns per-dimension scores + an aggregate pass/fail.

## markos login

Primary auth entry point. Device flow (RFC 8628) is the default: the CLI
opens the verification URL in your browser and polls the token endpoint.
CI environments should pass `--token=mks_ak_…` instead. See `markos login --help`.

## markos keys

Manage long-lived tenant API keys. `create` returns the key value **once**
— the plaintext is never retrievable after the response. `rotate` issues a
new key and soft-deletes the old one after a 7-day grace window.

## markos whoami

Fast identity check. Returns tenant slug, display name, active profile,
auth method (device_flow / api_key), and the last refresh timestamp.

## markos env

Manage per-tenant server-side environment variables used by `markos run`
nodes. Values are encrypted at rest with `MARKOS_ENV_ENCRYPTION_KEY` (server-side).
`pull` and `push` accept a `.env` file path; `push` diffs before committing.

## markos status

Aggregate tenant snapshot: recent runs, connector health, quota usage,
subscription status. `markos status run <id>` drills into a single run.
`--watch` redraws the dashboard every 5 seconds.

## markos doctor

Nine local checks with pass / warn / fail indicators: node version, config
directory, active token, token validity, `.markos-local/` directory,
`.gitignore` protection, keytar availability, server reachability, and
Supabase connectivity. `--check-only` makes it a read-only CI gate (exit 1
on any failure, no writes). `--fix` auto-remediates filesystem-level issues
but **never** runs `markos login`.

## Exit codes footer

All commands return D-10 exit codes:

| Exit code | Category |
|---|---|
| `0` | success |
| `1` | user_error |
| `2` | transient |
| `3` | auth_failure |
| `4` | quota_permission |
| `5` | internal_bug |

See [`docs/cli/errors.md`](./errors.md) for the full enumeration of error
codes emitted within each band, and [`docs/cli/environment.md`](./environment.md)
for every env var the CLI reads.
