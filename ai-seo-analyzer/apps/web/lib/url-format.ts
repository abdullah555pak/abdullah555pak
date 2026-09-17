/**
 * A light client-side format check only, for fast feedback on obviously
 * broken input (empty, no dot, stray characters). It is NOT a security
 * boundary - the backend's validate_public_url is the real authority and
 * re-checks everything, including cases this regex would let through
 * (e.g. "127.0.0.1" has dots and passes here, then is correctly rejected
 * server-side as a private address).
 */
const LOOKS_LIKE_A_DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export function looksLikeWebsiteAddress(value: string): boolean {
  const host = value.replace(/^https?:\/\//i, "").split(/[/?#\s]/)[0];
  return LOOKS_LIKE_A_DOMAIN.test(host);
}
