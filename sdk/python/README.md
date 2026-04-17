# MarkOS Python SDK

Minimal Python client for the MarkOS marketing operating system.

## Install

```bash
pip install markos
```

## Usage

```python
from markos import MarkosClient

with MarkosClient("https://markos.dev", token="sk_...") as client:
    spec = client.get_openapi()
    session = client.mcp_session()
    sub = client.subscribe_webhook(
        url="https://your.site/hook",
        events=["approval.created", "campaign.launched"],
    )
```

## Scope

This SDK is currently a hand-written subset covering `/api/openapi.json`,
`/api/webhooks/*`, and `/api/mcp/session`. The full generated client — powered
by `openapi-python-client` against `contracts/openapi.json` — will replace this
once the upstream YAML subset parser (see `scripts/openapi/build-openapi.cjs`)
is hardened for flow-style arrays + inline object literals (tracked as 200-01.1).

CI regenerates the TypeScript + Python SDKs on every change to
`contracts/openapi.json`; see `.github/workflows/sdk-publish.yml`.
