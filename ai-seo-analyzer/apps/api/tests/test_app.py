"""
Proves the application starts and the basic HTTP surface responds.
"""
import pytest
from fastapi.testclient import TestClient

import app.api.v1.routers.health as health_router


def test_app_imports_without_error() -> None:
    from app.main import app  # noqa: F401


def test_liveness_endpoint_returns_ok(client: TestClient) -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_endpoint_never_500s_even_if_dependencies_are_down(client: TestClient) -> None:
    # Whether or not Postgres/Redis are reachable in this environment, the
    # readiness endpoint must report status per dependency, not crash.
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert set(body["dependencies"]) == {"database", "redis"}


def test_readiness_endpoint_reports_degraded_when_database_is_down(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_db_check() -> bool:
        return False

    monkeypatch.setattr(health_router, "check_database_connection", fake_db_check)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "degraded"
    assert body["dependencies"]["database"] == "unavailable"


def test_unknown_route_returns_404_not_a_stack_trace(client: TestClient) -> None:
    response = client.get("/this-route-does-not-exist")
    assert response.status_code == 404
    assert "Traceback" not in response.text
