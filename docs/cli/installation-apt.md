# Install MarkOS via apt (Debian / Ubuntu)

MarkOS publishes a signed Debian repository at `https://apt.markos.dev`. The apt
package wraps the same npm tarball used by npm, Homebrew, Scoop, and winget; the
repository metadata is signed so apt can verify the channel before install.

## Install

```bash
# Trust the MarkOS apt repo signing key.
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://apt.markos.dev/key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/markos.gpg

# Add the repo.
echo "deb [signed-by=/etc/apt/keyrings/markos.gpg] https://apt.markos.dev stable main" | sudo tee /etc/apt/sources.list.d/markos.list

# Install.
sudo apt update
sudo apt install markos
```

## Update

```bash
sudo apt update
sudo apt upgrade markos
```

## Verify

```bash
markos --version
markos doctor --check-only
```

`markos doctor --check-only` is safe for CI and never writes remediation changes
to disk.

## Uninstall

```bash
sudo apt remove markos
sudo rm -f /etc/apt/sources.list.d/markos.list /etc/apt/keyrings/markos.gpg
sudo apt update
```

## Trust

The MarkOS apt repo is signed with GPG. The signing key is available at
`https://apt.markos.dev/key.gpg`. Verify the fingerprint matches the value
documented at `https://markos.dev/security#apt-key-fingerprint` before importing
the key on production hosts.

The `.deb` package does not install `preinst`, `postinst`, `prerm`, or `postrm`
scripts. It places the npm package under `/usr/lib/markos` and exposes the CLI
through `/usr/bin/markos`.

## See also

- [Installing `markos` via npm](./installation-npm.md)
- [Installing `markos` via Homebrew](./installation-homebrew.md)
- [Installing `markos` via Scoop](./installation-scoop.md)
- [Installing `markos` via winget](./installation-winget.md)
