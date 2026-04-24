# Installing `markos` via Scoop (Windows)

> Scoop is the recommended channel for Windows developers. It drops a direct `node.exe` entry (no `cmd /c` wrapper), which sidesteps the UNC-path issues that sometimes break `npx markos` on enterprise setups.

MarkOS is a developer-native Marketing Operating System. The Scoop bucket wraps the same npm tarball that `npm install -g markos` pulls — you get identical behavior with a local, hash-verified install path.

---

## 1. Install

```powershell
# One-time: add the MarkOS bucket
scoop bucket add markos https://github.com/markos/scoop-bucket

# Install the CLI
scoop install markos
```

Scoop will:

1. Download `markos-<version>.tgz` from `registry.npmjs.org`.
2. Verify the sha256 against the bucket manifest (`bucket/markos.json`).
3. Extract to `%USERPROFILE%\scoop\apps\markos\current\` (package contents).
4. Run `npm install --production --prefix "$dir"` to materialize dependencies.
5. Wire `markos` into `%USERPROFILE%\scoop\shims\` so it is on `PATH`.

> **Prerequisite:** `nodejs-lts` is declared as a Scoop dependency and will be installed automatically if missing. MarkOS requires Node 22+; the `nodejs-lts` bucket package currently satisfies that floor (same parity as the Homebrew `node` dependency).

---

## 2. Verify

Both PowerShell and Windows `cmd` work:

```powershell
# PowerShell (recommended)
markos --version
```

```cmd
REM Classic cmd
markos --version
```

Expected output: the installed MarkOS version (e.g. `markos 3.3.0`).

If the shim is missing after install:

```powershell
scoop reset markos
```

---

## 3. First-run: `markos login`

Operator authentication uses the RFC 8628 device flow. On Windows, tokens are persisted in the **Windows Credential Vault** via the OS keychain primitive — no plaintext secrets on disk.

```powershell
markos login
```

The command will:

1. Print a short `user_code` (e.g. `ABCD-EFGH`) and a verification URL.
2. Open your default browser automatically to that URL.
3. Poll until you approve the session in the browser.
4. Write the resulting token to the Windows Credential Vault (or fall back to an XDG config file if the vault is unreachable — a one-time stderr warning is emitted in that case).

You can confirm you are logged in with:

```powershell
markos whoami
```

To manage multiple profiles (e.g. dev vs prod tenants):

```powershell
markos login --profile prod
markos whoami --profile prod
```

---

## 4. Upgrade

```powershell
# Upgrade only markos
scoop update markos

# Or update everything Scoop-managed
scoop update *
```

Scoop uses the manifest's `checkver` + `autoupdate` stanzas to detect new releases on the npm registry; there is no manual version bump required on your side.

---

## 5. Troubleshooting

### UNC paths + `cmd /c` wrapper (important)

Running `markos` from a **UNC path** (`\\server\share\project`) under classic `cmd.exe` will fail. `cmd.exe` historically refuses to `cd` into UNC paths, and any wrapper that invokes `cmd /c` inherits the limitation.

**Workarounds (pick one):**

1. **Use PowerShell instead** — PowerShell handles UNC paths natively.
2. **Run from a local drive** — `cd C:\work\project && markos ...`.
3. **Map the share to a drive letter** — `net use Z: \\server\share`, then work from `Z:\`.

This is exactly why Scoop is the recommended Windows channel: Scoop's shim calls `node.exe` directly, not via `cmd /c`, so you can often avoid the limitation entirely by invoking `markos` from a PowerShell session — even when the project itself lives on a UNC path.

### Windows Credential Vault access / permissions

The first `markos login` under a given Windows user profile may surface a Credential Vault prompt ("Allow MarkOS to store a credential?"). Approve it. Subsequent logins are silent.

If the vault is locked by Group Policy on an enterprise machine, MarkOS automatically falls back to an XDG-style encrypted credential file at `%USERPROFILE%\.config\markos\credentials` (mode `0o600`). A one-time stderr warning is printed so you know the fallback engaged.

To force a fresh credential write (e.g. after a token rotation):

```powershell
markos logout
markos login
```

### `MARKOS_API_KEY` env var fallback (CI / headless)

For unattended CI runs where no interactive login is possible, set a long-lived API key instead of using the device flow:

```powershell
$env:MARKOS_API_KEY = "mk_live_..."
markos whoami
```

The CLI resolves credentials in this order: `MARKOS_API_KEY` env var → Windows Credential Vault → XDG fallback file. CI runners should prefer the env var so secrets are scoped to the job and never touched by the keychain.

### `markos doctor` for health diagnosis

If something feels off, run:

```powershell
markos doctor --check-only
```

`doctor` inspects:

- Node runtime floor (`>= 22.0.0`)
- CLI binary integrity + version
- Credential Vault vs XDG fallback state
- Network reachability to the MarkOS API
- Obsidian vault presence (if you use the installer-bootstrapped vault)

The `--check-only` flag prints diagnostics without attempting any remediation.

### PowerShell execution policy

Scoop itself requires PowerShell execution policy `RemoteSigned` or permissive. If `scoop install markos` fails with a script-signing error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 6. Uninstall

```powershell
# Remove the CLI
scoop uninstall markos

# (Optional) Remove the bucket too, if you're not tracking the manifest
scoop bucket rm markos
```

To also clear stored credentials:

```powershell
markos logout --all-profiles
```

This removes every profile's token from the Windows Credential Vault and the XDG fallback file.

---

## 7. Pre-bucket-provisioning fallback (local clone install)

Until the `markos/scoop-bucket` repository is fully provisioned on GitHub (currently tracked as assumption A11 in `.planning/phases/204-cli-markos-v1-ga/204-11-PLAN.md`), you can install the manifest directly from a local copy of this repo:

```powershell
git clone https://github.com/markos/markos.git
scoop install .\markos\bucket\markos.json
```

This uses the same manifest Scoop would resolve via `scoop bucket add`, but bypasses the missing remote. Once the bucket repo is live, `scoop uninstall markos && scoop install markos` via the standard `scoop bucket add` path will migrate you onto the maintained release channel with no configuration change.

---

## See also

- [Installing `markos` via Homebrew (macOS/Linux)](./installation-homebrew.md) — sibling channel, same npm tarball
- [Installing `markos` via npm](./installation-npm.md) — lowest-level channel
- `markos doctor` — built-in diagnostic command
- `.planning/phases/204-cli-markos-v1-ga/204-RESEARCH.md` §Pitfall 5 — deep dive on the UNC/cmd wrapper issue
