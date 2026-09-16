"""
The malicious-URL battery required by docs/BLUEPRINT.md (Section T,
Testing architecture): every one of these must be rejected by
validate_public_url before a crawler is ever allowed to exist.

This is intentionally kept separate from tests/test_url_validation.py so
it stays easy to find and easy to extend as new bypass techniques are
discovered.
"""
import pytest

from app.core.security import UnsafeURLError, validate_public_url

MALICIOUS_URLS = [
    # Disallowed schemes
    "file:///etc/passwd",
    "ftp://internal-server/",
    "gopher://127.0.0.1:6379/_FLUSHALL",
    "data:text/html,<script>alert(1)</script>",
    "javascript:alert(document.cookie)",
    # Loopback
    "http://localhost/",
    "http://127.0.0.1/",
    "http://127.1/",
    "http://0.0.0.0/",
    "http://[::1]/",
    # Cloud metadata endpoints
    "http://169.254.169.254/latest/meta-data/",
    "http://169.254.170.2/",
    # RFC1918 private ranges
    "http://10.0.0.1/",
    "http://172.16.0.1/",
    "http://172.31.255.255/",
    "http://192.168.0.1/",
    # Link-local
    "http://169.254.1.1/",
    # Credentials embedded to smuggle a trusted-looking prefix
    "http://trusted.com@169.254.169.254/",
    "http://user:pass@127.0.0.1/",
    # Malformed / empty
    "",
    "   ",
    "not-a-url",
]


@pytest.mark.parametrize("malicious_url", MALICIOUS_URLS)
def test_malicious_url_is_rejected(malicious_url: str) -> None:
    with pytest.raises(UnsafeURLError):
        validate_public_url(malicious_url)
