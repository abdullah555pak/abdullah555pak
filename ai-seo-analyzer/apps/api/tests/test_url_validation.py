"""
Proves URL validation exists and rejects unsafe/invalid input, and that
the /v1/analyze endpoint uses it correctly (400 for unsafe, 501 for the
not-yet-built feature on an otherwise-safe URL).
"""
import socket

import pytest
from fastapi.testclient import TestClient

from app.core.security import UnsafeURLError, validate_public_url


def _fake_public_getaddrinfo(monkeypatch: pytest.MonkeyPatch, ip: str = "93.184.216.34") -> None:
    """Avoid depending on real DNS/network for a 'valid public site' case."""

    def fake(host, *args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, 0))]

    monkeypatch.setattr(socket, "getaddrinfo", fake)


class TestValidateFunctionAcceptsSafeInput:
    def test_accepts_bare_domain_and_normalizes_it(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _fake_public_getaddrinfo(monkeypatch)
        assert validate_public_url("example.com") == "https://example.com"

    def test_accepts_explicit_https_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _fake_public_getaddrinfo(monkeypatch)
        assert validate_public_url("https://example.com/some/page") == "https://example.com"

    def test_accepts_explicit_http_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        _fake_public_getaddrinfo(monkeypatch)
        assert validate_public_url("http://example.com") == "http://example.com"


class TestValidateFunctionRejectsUnsafeInput:
    @pytest.mark.parametrize(
        "bad_url",
        [
            "",
            "   ",
            "ftp://example.com",
            "file:///etc/passwd",
            "gopher://example.com",
            "javascript:alert(1)",
            "http://user:pass@example.com",
            "not a url at all !!",
        ],
    )
    def test_rejects_malformed_or_disallowed_scheme(self, bad_url: str) -> None:
        with pytest.raises(UnsafeURLError):
            validate_public_url(bad_url)

    @pytest.mark.parametrize(
        "internal_url",
        [
            "http://localhost",
            "http://localhost:8000",
            "http://127.0.0.1",
            "http://127.0.0.1:5432",
            "http://0.0.0.0",
            "http://169.254.169.254",  # cloud metadata endpoint
            "http://10.0.0.5",
            "http://172.16.5.5",
            "http://192.168.1.1",
            "http://[::1]",
        ],
    )
    def test_rejects_private_and_internal_addresses(self, internal_url: str) -> None:
        with pytest.raises(UnsafeURLError):
            validate_public_url(internal_url)

    def test_rejects_hostname_that_does_not_resolve(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake(host, *args, **kwargs):
            raise socket.gaierror("name not known")

        monkeypatch.setattr(socket, "getaddrinfo", fake)
        with pytest.raises(UnsafeURLError):
            validate_public_url("this-domain-should-not-exist-sitewell.test")


class TestAnalyzeEndpoint:
    def test_rejects_unsafe_url_with_400(self, client: TestClient) -> None:
        response = client.post("/v1/analyze", json={"url": "http://127.0.0.1"})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_url"

    def test_rejects_empty_body_with_422(self, client: TestClient) -> None:
        response = client.post("/v1/analyze", json={})
        assert response.status_code == 422

    def test_safe_url_returns_not_implemented_not_fake_results(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _fake_public_getaddrinfo(monkeypatch)
        response = client.post("/v1/analyze", json={"url": "example.com"})
        assert response.status_code == 501
        body = response.json()
        assert body["error"]["code"] == "not_implemented"
        # Guard against ever accidentally shipping fake analysis data here.
        for forbidden_key in ("score", "findings", "issues", "traffic", "keywords", "backlinks"):
            assert forbidden_key not in body
