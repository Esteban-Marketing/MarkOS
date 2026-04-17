"""MarkOS Python SDK.

Thin wrapper around httpx for now. Full generated client lands via
`openapi-python-client` once `scripts/openapi/build-openapi.cjs` YAML subset
parser is hardened (tracked as 200-01.1).
"""

from __future__ import annotations

from typing import Any, Optional

import httpx


class MarkosClient:
    """Minimal MarkOS HTTP client.

    Methods mirror a subset of the OpenAPI paths. Full typed client will
    replace this once SDK codegen is unblocked.
    """

    def __init__(
        self,
        base_url: str,
        *,
        token: Optional[str] = None,
        client: Optional[httpx.Client] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self._client = client or httpx.Client()

    def _headers(self) -> dict[str, str]:
        headers = {"content-type": "application/json"}
        if self.token:
            headers["authorization"] = f"Bearer {self.token}"
        return headers

    def get_openapi(self) -> dict[str, Any]:
        response = self._client.get(f"{self.base_url}/api/openapi.json", headers=self._headers())
        response.raise_for_status()
        return response.json()

    def subscribe_webhook(self, *, url: str, events: list[str], secret: Optional[str] = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"url": url, "events": events}
        if secret:
            payload["secret"] = secret
        response = self._client.post(
            f"{self.base_url}/api/webhooks/subscribe",
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        return response.json()

    def mcp_session(self) -> dict[str, Any]:
        response = self._client.get(f"{self.base_url}/api/mcp/session", headers=self._headers())
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "MarkosClient":
        return self

    def __exit__(self, *_exc: Any) -> None:
        self.close()


__all__ = ["MarkosClient"]
