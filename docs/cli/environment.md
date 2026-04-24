# MarkOS CLI — Environment Variables

The `markos` CLI reads configuration from the environment before falling back
to the XDG config file or the OS keychain. This document enumerates every
environment variable the CLI observes, its purpose, default, and an example.

> **Canonical sources:**
> - Phase 204 `204-RESEARCH.md` §Runtime State Inventory
> - `bin/lib/cli/config.cjs` — profile + base-URL resolution
> - `bin/lib/cli/keychain.cjs` — token fallback decision tree
> - D-02/D-06 — environment > keychain > XDG file priority

## Credential resolution order

For every request, the CLI resolves the bearer token using this priority:

1. `MARKOS_API_KEY` — direct env-var bypass (CI friendly).
2. OS keychain via `keytar`, keyed on the active profile.
3. `$XDG_CONFIG_HOME/markos/credentials` — encrypted fallback when keytar is unavailable.

The first hit wins. A one-time stderr warning is emitted the first time the
XDG fallback is used in a session.

## CLI-owned variables

| Name | Purpose | Default | Example |
|---|---|---|---|
| `MARKOS_API_KEY` | Direct token injection; bypasses keychain and XDG lookup. Primary path for CI. | unset | `export MARKOS_API_KEY=mks_ak_…` |
| `MARKOS_PROFILE` | Select which named profile (token, base URL, tenant) to use. | `default` | `export MARKOS_PROFILE=staging` |
| `MARKOS_API_BASE_URL` | Override the API base URL (e.g. for self-hosted or dev). | `https://markos.dev` | `export MARKOS_API_BASE_URL=http://localhost:3000` |
| `MARKOS_OAUTH_DEVICE_ENDPOINT` | **Deprecated alias** for the base URL; honored by `markos login` for legacy scripts. Prefer `MARKOS_API_BASE_URL`. | unset | `export MARKOS_OAUTH_DEVICE_ENDPOINT=https://markos.dev` |
| `MARKOS_NO_BROWSER` | Suppress the auto-open of the browser in `markos login`. Forces URL to be printed for manual copy. | unset | `export MARKOS_NO_BROWSER=1` |
| `MARKOS_ENV_ENCRYPTION_KEY` | **Server-side** key used by `markos env` endpoints to encrypt secret values at rest (pgcrypto). Documented here for operator awareness — never set this on a user workstation. | unset | `# server-side only` |

## Standard variables honored

| Name | Purpose | Default | Example |
|---|---|---|---|
| `XDG_CONFIG_HOME` | Root for the config + credentials fallback files. Follows the [XDG Base Directory Spec](https://specifications.freedesktop.org/basedir-spec/). | `$HOME/.config` | `export XDG_CONFIG_HOME=$HOME/.config` |
| `NO_COLOR` | Disable ANSI color output. Follows [no-color.org](https://no-color.org). | unset | `export NO_COLOR=1` |
| `CI` | When set to any truthy value, the CLI auto-selects non-interactive mode: JSON output, no browser open, no progress spinners. | unset | `# set by CI runners` |
| `GITHUB_ACTIONS` | Treated the same as `CI`; auto-detected. | unset | `# set by GitHub Actions runners` |

## Config files referenced

| Path | Purpose |
|---|---|
| `$XDG_CONFIG_HOME/markos/config.json` | Profile registry: base URL, tenant slug, default profile name. |
| `$XDG_CONFIG_HOME/markos/credentials` | Encrypted fallback credential store when keytar is unavailable. Mode `0600`. |
| `$XDG_CONFIG_HOME/markos/` | Directory mode `0700`; verified by `markos doctor`. |

On Windows, `$XDG_CONFIG_HOME` defaults to `%APPDATA%`; on macOS, `$HOME/Library/Application Support` when `$XDG_CONFIG_HOME` is unset but `HOME` is. Linux defaults to `$HOME/.config`.

## Non-interactive mode

The CLI enters non-interactive mode automatically when any of the following
is true:

- `--json` flag is passed
- `CI` or `GITHUB_ACTIONS` env var is set
- stdout or stderr is not a TTY

In non-interactive mode:

- Errors render as single-line JSON envelopes on stderr
- `markos login` refuses to open a browser and requires `--token=<mks_ak_…>` or an already-populated keychain
- Progress spinners are suppressed
- Tables render as pipe-delimited plain text

## See also

- [`docs/cli/commands.md`](./commands.md) — per-command flag reference
- [`docs/cli/errors.md`](./errors.md) — exit codes and error envelopes
- `bin/lib/cli/config.cjs` — profile resolution source of truth
