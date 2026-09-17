"""
Foundation-level security checks that don't fit test_url_validation.py:
CORS is actually restrictive (not just configured), an unexpected server
error never leaks internals to the client, and configuration is genuinely
environment-driven rather than only "not hardcoded" by inspection.
"""
import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.core.config import Settings


def test_cors_allows_the_configured_frontend_origin(client: TestClient) -> None:
    response = client.options(
        "/v1/analyze",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_does_not_reflect_an_arbitrary_origin(client: TestClient) -> None:
    response = client.options(
        "/v1/analyze",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    # Starlette's CORS middleware simply omits the header for a
    # disallowed origin (the browser is what enforces the block) - it
    # must never echo back an origin that isn't on the allow list.
    assert response.headers.get("access-control-allow-origin") != "http://evil.example.com"


def test_security_headers_present_on_every_response(client: TestClient) -> None:
    response = client.get("/healthz")
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert response.headers.get("x-request-id")


def test_unexpected_exception_returns_safe_message_not_internals() -> None:
    """
    Wires a route that deliberately raises, to prove the generic Exception
    handler in app/core/errors.py actually intercepts it - not just that
    it's registered.

    Uses raise_server_exceptions=False: Starlette's ServerErrorMiddleware
    always sends the handler's response to the real client *and* re-raises
    the original exception afterward (so a real server can still log it) -
    the default TestClient surfaces that re-raise as a test failure, which
    would make this test fail even though the safe response was sent
    correctly. Disabling it here lets us inspect the response actually
    sent over the wire, which is what a real caller receives.
    """
    from app.main import app

    boom_router = APIRouter()

    @boom_router.get("/__test_boom__")
    async def boom() -> None:
        raise RuntimeError("db password is hunter2, do not leak this")

    app.include_router(boom_router)

    with TestClient(app, raise_server_exceptions=False) as safe_client:
        response = safe_client.get("/__test_boom__")

    assert response.status_code == 500
    body = response.json()
    assert "hunter2" not in response.text
    assert "RuntimeError" not in response.text
    assert "Traceback" not in response.text
    assert body["error"]["code"] == "internal_error"


def test_settings_are_driven_by_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://someone:somepass@db.internal/testdb")
    monkeypatch.setenv("ALLOWED_ORIGINS", "https://example.com,https://staging.example.com")

    settings = Settings()

    assert settings.database_url == "postgresql+asyncpg://someone:somepass@db.internal/testdb"
    assert settings.allowed_origins_list == ["https://example.com", "https://staging.example.com"]
