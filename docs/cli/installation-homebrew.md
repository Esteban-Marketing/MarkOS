# Homebrew Installation — MarkOS CLI

Install `markos` on macOS and Linux via a Homebrew tap. The formula wraps the
official npm package; every release pins the tarball `sha256`, so Homebrew
verifies integrity at install time.

- **Tap repo:** `markos/homebrew-tap`
- **Formula path:** `Formula/markos.rb`
- **Underlying artifact:** `https://registry.npmjs.org/markos/-/markos-<version>.tgz`
- **Runtime dep:** `node` (floating Homebrew LTS; `markos` enforces `>=22` at runtime).

> If you prefer the npm-native path or your platform does not have Homebrew,
> see `./installation-npm.md` (Plan 12) or run `npm install -g markos`.

## 1. Install

```bash
brew tap markos/tap
brew install markos
```

The tap command is only needed the first time. Future upgrades resolve against
the tapped formula automatically.

## 2. Verify

```bash
markos --version
markos doctor --check-only
```

`markos doctor --check-only` is a zero-side-effect health gate: exit code `0`
means your install + config dir + keychain fallback + server reachability are
all green. It never writes to disk in `--check-only` mode, so it is safe to
chain into CI or a shell prompt.

## 3. First-run

The CLI authenticates via OAuth 2.0 device flow — no client secrets on disk.

```bash
markos login
```

Output walks you through entering the user code in your browser; the token is
stored in your OS keychain (Keychain on macOS, libsecret on Linux) with an XDG
file fallback (`~/.config/markos/credentials.json`, mode `0600`) when the
keychain is unavailable.

Once logged in:

```bash
markos whoami
```

## 4. Upgrade

```bash
brew update
brew upgrade markos
```

The tap re-fetches the formula; the pinned `sha256` guarantees the tarball has
not been tampered with since the release was published.

## 5. Troubleshooting

Run the diagnostic:

```bash
markos doctor
markos doctor --json   # machine-readable output for CI
```

### Keychain / libsecret (Linux)

On headless Linux or slim container images `keytar` may fail to load because
`libsecret-1-dev` is missing. `markos doctor` will warn, and the CLI will
silently fall back to the XDG credentials file. To enable real keychain:

```bash
# Debian / Ubuntu
sudo apt-get install -y libsecret-1-dev

# Fedora / RHEL
sudo dnf install -y libsecret-devel
```

Then re-run `markos login` to store the token in the system keychain.

### `MARKOS_API_KEY` env var fallback (CI)

For CI runners where neither keychain nor XDG are practical, set a headless
credential:

```bash
export MARKOS_API_KEY="mk_..."
markos whoami
```

The env var takes precedence over both keychain and XDG (see
`./errors.md` for the full resolution order and error envelopes).

### Homebrew tarball checksum mismatch

If `brew install` fails with a checksum error, the tap repo has drifted from
the registry; file an issue at `markos/homebrew-tap` so the release CI can
republish. You can pin to a prior known-good tag:

```bash
brew install markos/tap/markos@<previous-version>
```

### Node version

```bash
node --version   # must report >=22.0.0
brew upgrade node
```

MarkOS enforces Node 22 at runtime via
`bin/cli-runtime.cjs::assertSupportedNodeVersion`.

## 6. Uninstall

```bash
brew uninstall markos
brew untap markos/tap
rm -rf ~/.config/markos
```

The final `rm` removes the non-secret config dir (profiles, preferences, and
the XDG credential fallback). Keychain entries for the `markos-cli` service
are left untouched by `brew uninstall`; remove them explicitly via your OS
keychain UI or:

```bash
# macOS (replace <profile>)
security delete-generic-password -s markos-cli -a <profile>

# Linux libsecret
secret-tool clear service markos-cli account <profile>
```

## 7. Pre-tap-provisioning fallback

If `markos/homebrew-tap` is not yet live (the tap repo ships with Plan 204-12
release CI), install from a local clone of this repository:

```bash
git clone https://github.com/<org>/MarkOS.git
brew install --build-from-source ./MarkOS/Formula/markos.rb
```

`--build-from-source` bypasses the tap registry and points Homebrew at the
formula file directly. The formula still downloads the npm tarball, so you
need network access to `registry.npmjs.org`.

Alternatively, clone only the Formula file into a private tap:

```bash
brew tap-new <you>/markos
cp MarkOS/Formula/markos.rb "$(brew --repository <you>/markos)/Formula/"
brew install <you>/markos/markos
```

Once the upstream `markos/homebrew-tap` is provisioned, migrate to:

```bash
brew untap <you>/markos
brew tap markos/tap
brew install markos
```

---

Related:

- `./installation-npm.md` — cross-platform npm install path.
- `./installation-scoop.md` — Windows Scoop bucket (Plan 204-11).
- `./errors.md` — exit codes and structured error envelopes (Plan 204-12).
