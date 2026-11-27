import ipaddr from "ipaddr.js";

// Used when Express has no usable client address, so such requests still
// share one limit rather than each getting their own.
const UNKNOWN_IP_KEY = "unknown";

// An IPv6 host is usually given a whole /64, so it could rotate addresses
// within it to dodge a per-address limit.
const IPV6_PREFIX_HEXTETS = 4;

// The rate-limit key for a client IP: an IPv4 address as-is (unwrapping
// IPv4-mapped IPv6 such as "::ffff:1.2.3.4"), or an IPv6 address's /64.
function toIpKey(ip: string | undefined): string {
  if (ip === undefined || !ipaddr.isValid(ip)) {
    return UNKNOWN_IP_KEY;
  }

  const address = ipaddr.process(ip);
  if (address.kind() === "ipv4") {
    return address.toString();
  }

  const prefix = address
    .toNormalizedString()
    .split(":")
    .slice(0, IPV6_PREFIX_HEXTETS)
    .join(":");
  return `${prefix}::/64`;
}

// Lowercased so "JohnDoe01" and "johndoe01" share failure counts. That only
// groups attempts more tightly; the user lookup itself is unchanged.
function toUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}

export { toIpKey, toUsernameKey };
