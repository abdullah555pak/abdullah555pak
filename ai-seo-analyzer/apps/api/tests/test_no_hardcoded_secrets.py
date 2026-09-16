"""
Proves secrets are loaded from the environment, not hardcoded in source.

Two checks:
  1. Settings() only ever gets secret-looking values from the environment
     (there are no secret settings defined yet at all - this step doesn't
     build auth/payments/AI, so there is nothing to leak yet; this test
     also guards against that changing carelessly later).
  2. No tracked source file in the project contains a string that looks
     like a real vendor API key.
"""
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]  # ai-seo-analyzer/

SCAN_DIRS = [PROJECT_ROOT / "apps" / "api" / "app", PROJECT_ROOT / "apps" / "web" / "app"]

SECRET_PATTERNS = [
    re.compile(r"sk-ant-[a-zA-Z0-9-_]{20,}"),  # Anthropic API key
    re.compile(r"sk_live_[a-zA-Z0-9]{16,}"),  # Stripe live secret key
    re.compile(r"sk_test_[a-zA-Z0-9]{16,}"),  # Stripe test secret key
    re.compile(r"AKIA[0-9A-Z]{16}"),  # AWS access key id
    re.compile(r"AIza[0-9A-Za-z\-_]{35}"),  # Google API key
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),  # GitHub personal access token
]


def _iter_source_files():
    for directory in SCAN_DIRS:
        if not directory.exists():
            continue
        for path in directory.rglob("*"):
            if path.is_file() and path.suffix in {".py", ".ts", ".tsx", ".js", ".jsx"}:
                yield path


def test_no_vendor_api_key_patterns_in_source() -> None:
    offenders = []
    for path in _iter_source_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                offenders.append(str(path))
    assert not offenders, f"Possible hardcoded secret found in: {offenders}"


def test_settings_defines_no_secret_fields_yet() -> None:
    """
    This step doesn't build auth/payments/AI, so Settings() must not yet
    define any field that looks like a secret. When a later step adds one
    (e.g. jwt_secret), it must come from the environment with no non-empty
    default - update this test then, not before.
    """
    from app.core.config import Settings

    secret_like_fields = [
        name
        for name in Settings.model_fields
        if any(marker in name for marker in ("secret", "password", "token", "api_key"))
    ]
    assert secret_like_fields == []


def test_env_example_has_no_real_looking_values() -> None:
    env_example = PROJECT_ROOT / "apps" / "api" / ".env.example"
    text = env_example.read_text(encoding="utf-8")
    for pattern in SECRET_PATTERNS:
        assert not pattern.search(text)
