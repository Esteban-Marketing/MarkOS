# Install MarkOS via winget (Windows)

MarkOS publishes winget manifests under the public `microsoft/winget-pkgs`
community registry. The manifest points at the same npm tarball used by the
other distribution channels and pins the tarball sha256.

## Install

```powershell
winget install markos.markos
```

To pin a specific release:

```powershell
winget install markos.markos --version 3.3.0
```

## Update

```powershell
winget upgrade markos.markos
```

## Verify

```powershell
markos --version
markos doctor --check-only
```

## Uninstall

```powershell
winget uninstall markos.markos
```

## Manifest Source

The local manifest template lives in this repository under
`winget-pkgs/manifests/m/markos/markos/<version>/`. Release CI renders the
versioned manifests and validates them with:

```powershell
winget validate --manifest winget-pkgs/manifests/m/markos/markos/<version>/
```

The first public release still requires a PR to
`https://github.com/microsoft/winget-pkgs`. Microsoft maintainer review usually
takes 1-7 days; after merge, `winget install markos.markos` becomes available to
end users through the community registry.

## See also

- [Installing `markos` via Scoop](./installation-scoop.md)
- [Installing `markos` via npm](./installation-npm.md)
- [Installing `markos` via apt](./installation-apt.md)
