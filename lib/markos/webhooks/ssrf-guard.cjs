'use strict';

// Phase 203 Plan 02 Task 1: SSRF guard for webhook subscriber URLs.
// Called at BOTH subscribe-time (api/webhooks/subscribe.js) and dispatch-time
// (lib/markos/webhooks/delivery.cjs) — the dispatch-time re-check is the
// DNS-rebinding mitigation (RESEARCH §Pitfall 4).

const { lookup: dnsLookup } = require('node:dns').promises;

// Frozen blocklist of IPv4 CIDR ranges we refuse to deliver to.
// - 127.0.0.0/8   loopback
// - 10.0.0.0/8    RFC 1918 private
// - 172.16.0.0/12 RFC 1918 private
// - 192.168.0.0/16 RFC 1918 private
// - 169.254.0.0/16 link-local (hosts cloud IMDS, including AWS 169.254.169.254)
// - 0.0.0.0/8     unspecified / "this network"
const BLOCKED_V4 = Object.freeze([
  Object.freeze({ cidr: '127.0.0.0/8', name: 'loopback' }),
  Object.freeze({ cidr: '10.0.0.0/8', name: 'private' }),
  Object.freeze({ cidr: '172.16.0.0/12', name: 'private' }),
  Object.freeze({ cidr: '192.168.0.0/16', name: 'private' }),
  Object.freeze({ cidr: '169.254.0.0/16', name: 'link-local (cloud IMDS)' }),
  Object.freeze({ cidr: '0.0.0.0/8', name: 'unspecified' }),
]);

function ipToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (let i = 0; i < 4; i += 1) {
    const octet = Number(parts[i]);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    n = (n * 256) + octet;
  }
  // Keep as unsigned 32-bit.
  return n >>> 0;
}

function cidrContains(cidr, ip) {
  const slash = cidr.indexOf('/');
  if (slash === -1) return false;
  const base = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const baseInt = ipToInt(base);
  const ipInt = ipToInt(ip);
  if (baseInt === null || ipInt === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (baseInt & mask) === (ipInt & mask);
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1') return true;
  // fc00::/7 ULA — first byte 0xfc or 0xfd → hex prefix "fc" or "fd".
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  // fe80::/10 link-local — we use the "fe80" textual prefix (any ip starting
  // with fe80 is inside fe80::/10 for all practical URL-derived addresses).
  if (lower.startsWith('fe80')) return true;
  return false;
}

async function assertUrlIsPublic(urlString, deps) {
  const opts = deps || {};
  let url;
  try {
    url = new URL(urlString);
  } catch (parseErr) {
    // Wrap parse error as invalid_scheme — upstream callers strip the :suffix.
    const wrapped = new Error('invalid_scheme');
    wrapped.cause = parseErr;
    throw wrapped;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('invalid_scheme');
  }
  if (url.protocol !== 'https:') {
    throw new Error('https_required');
  }

  // Short-circuit the "localhost" family before DNS (some resolvers won't
  // resolve `localhost` in offline test envs). Literal IP addresses fall
  // through so they pick up the proper CIDR-name suffix (e.g. `:loopback`).
  const host = url.hostname;
  if (!host) throw new Error('private_ip');
  const lowerHost = host.toLowerCase();
  if (lowerHost === 'localhost' || lowerHost.endsWith('.localhost')) {
    throw new Error('private_ip');
  }

  const lookupFn = opts.lookup || dnsLookup;
  const { address: ip, family } = await lookupFn(host, { family: 0 });

  if (family === 4) {
    for (const { cidr, name } of BLOCKED_V4) {
      if (cidrContains(cidr, ip)) {
        throw new Error(`private_ip:${name}`);
      }
    }
  } else if (family === 6) {
    if (isPrivateIPv6(ip)) {
      throw new Error('private_ip:v6');
    }
  }

  return { ip, family };
}

module.exports = { assertUrlIsPublic, cidrContains, BLOCKED_V4 };
