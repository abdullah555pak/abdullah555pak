"""
URL safety validation.

This module answers exactly one question: "Is it safe to eventually let the
crawler fetch this URL?" It does NOT fetch anything itself - there is no
crawler yet. It exists now because every future feature that touches a
user-submitted URL depends on this check existing first.

Rules enforced:
  - Only http/https schemes are accepted.
  - No embedded credentials (http://user:pass@host).
  - The hostname must resolve, and none of its resolved addresses may be
    private, loopback, link-local, multicast, reserved, or otherwise
    non-public (this blocks localhost, RFC1918 ranges, and the cloud
    metadata address 169.254.169.254, among others).

Important: DNS can answer differently between this check and a later real
connection (DNS rebinding). This function is a first line of defense for
rejecting obviously-unsafe input early and with a clear message; the
crawler being built in a later step MUST re-resolve and re-check the IP at
actual connect time and on every redirect hop. This module is not a
substitute for that.
"""
import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"http", "https"}

# Address ranges that must never be treated as a public, scannable website,
# beyond what ipaddress.ip_address's own is_private/is_loopback/etc. cover.
_EXTRA_BLOCKED_NETWORKS = [
    ipaddress.ip_network(cidr)
    for cidr in (
        "100.64.0.0/10",  # carrier-grade NAT
        "192.0.0.0/24",  # IETF protocol assignments
        "192.0.2.0/24",  # TEST-NET-1
        "198.18.0.0/15",  # benchmarking
        "198.51.100.0/24",  # TEST-NET-2
        "203.0.113.0/24",  # TEST-NET-3
        "::ffff:0:0/96",  # IPv4-mapped IPv6
        "64:ff9b::/96",  # NAT64
        "100::/64",  # discard-only
    )
]


class UnsafeURLError(ValueError):
    """Raised when a submitted URL fails safety validation."""


def _is_blocked_ip(ip_str: str) -> bool:
    addr = ipaddress.ip_address(ip_str)
    if (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    ):
        return True
    return any(addr in network for network in _EXTRA_BLOCKED_NETWORKS)


def validate_public_url(raw_url: str) -> str:
    """
    Validate a user-submitted website address.

    Returns the normalized "scheme://host[:port]" on success.
    Raises UnsafeURLError with a beginner-friendly message on failure.
    """
    raw_url = (raw_url or "").strip()
    if not raw_url:
        raise UnsafeURLError("Please enter a website address.")
    if len(raw_url) > 2048:
        raise UnsafeURLError("That website address is too long.")

    # Allow "example.com" as well as "https://example.com".
    candidate = raw_url if "//" in raw_url else f"//{raw_url}"
    try:
        parsed = urlparse(candidate)
    except ValueError as exc:
        raise UnsafeURLError("That doesn't look like a valid website address.") from exc

    scheme = (parsed.scheme or "https").lower()
    if scheme not in ALLOWED_SCHEMES:
        raise UnsafeURLError("Only http:// and https:// website addresses are supported.")

    if parsed.username or parsed.password:
        raise UnsafeURLError("Web addresses with a username or password aren't supported.")

    hostname = parsed.hostname
    if not hostname:
        raise UnsafeURLError("That doesn't look like a valid website address.")

    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise UnsafeURLError("Local addresses can't be analyzed.")

    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise UnsafeURLError(
            "We couldn't find that website. Check the address and try again."
        ) from exc
    except UnicodeError as exc:
        raise UnsafeURLError("That doesn't look like a valid website address.") from exc

    resolved_ips = {info[4][0] for info in addr_infos}
    if not resolved_ips:
        raise UnsafeURLError("We couldn't find that website. Check the address and try again.")

    for ip_str in resolved_ips:
        if _is_blocked_ip(ip_str):
            raise UnsafeURLError(
                "That address points to a private or internal network and can't be analyzed."
            )

    port_part = f":{parsed.port}" if parsed.port else ""
    return f"{scheme}://{hostname}{port_part}"
