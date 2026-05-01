'use strict';

const { lookup: dnsLookup } = require('node:dns').promises;
const https = require('node:https');
const http = require('node:http');
const { isIP } = require('node:net');

const BLOCKED_V4 = Object.freeze([
  Object.freeze({ cidr: '127.0.0.0/8', name: 'loopback' }),
  Object.freeze({ cidr: '10.0.0.0/8', name: 'private' }),
  Object.freeze({ cidr: '172.16.0.0/12', name: 'private' }),
  Object.freeze({ cidr: '192.168.0.0/16', name: 'private' }),
  // 169.254.169.254 is the best-known cloud metadata target inside this /16.
  Object.freeze({ cidr: '169.254.0.0/16', name: 'link-local' }),
  Object.freeze({ cidr: '0.0.0.0/8', name: 'unspecified' }),
]);

const BLOCKED_V6 = Object.freeze([
  Object.freeze({ cidr: '::1/128', name: 'loopback' }),
  Object.freeze({ cidr: 'fe80::/10', name: 'link-local' }),
  Object.freeze({ cidr: 'fc00::/7', name: 'unique-local' }),
  Object.freeze({ cidr: '::/128', name: 'unspecified' }),
  Object.freeze({ cidr: '::ffff:0:0/96', name: 'ipv4-mapped' }),
]);

const DENIED_PROTOCOLS = Object.freeze(['file:', 'gopher:', 'data:', 'ftp:', 'dict:']);
const DEFAULT_MAX_REDIRECTS = 3;

function stripIpv6Brackets(value) {
  return String(value || '').replace(/^\[/, '').replace(/\]$/, '');
}

function normalizeHost(value) {
  return stripIpv6Brackets(value).split('%')[0];
}

function ipv4ToInt(ip) {
  const parts = String(ip).split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (let i = 0; i < 4; i += 1) {
    const octet = Number(parts[i]);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return null;
    n = (n * 256) + octet;
  }
  return n >>> 0;
}

function ipv4CidrContains(cidr, ip) {
  const slash = cidr.indexOf('/');
  if (slash === -1) return false;
  const base = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const baseInt = ipv4ToInt(base);
  const ipInt = ipv4ToInt(ip);
  if (baseInt === null || ipInt === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (baseInt & mask) === (ipInt & mask);
}

function expandIpv6(ip) {
  let value = normalizeHost(ip).toLowerCase();
  if (!value) return null;

  if (value.includes('.')) {
    const lastColon = value.lastIndexOf(':');
    if (lastColon === -1) return null;
    const ipv4Part = value.slice(lastColon + 1);
    const ipv4Int = ipv4ToInt(ipv4Part);
    if (ipv4Int === null) return null;
    const high = ((ipv4Int >>> 16) & 0xffff).toString(16);
    const low = (ipv4Int & 0xffff).toString(16);
    value = `${value.slice(0, lastColon)}:${high}:${low}`;
  }

  const doubleColonIndex = value.indexOf('::');
  let head = [];
  let tail = [];
  if (doubleColonIndex !== -1) {
    const rawHead = value.slice(0, doubleColonIndex);
    const rawTail = value.slice(doubleColonIndex + 2);
    head = rawHead ? rawHead.split(':') : [];
    tail = rawTail ? rawTail.split(':') : [];
  } else {
    head = value.split(':');
  }

  if (doubleColonIndex === -1 && head.length !== 8) return null;
  const missing = 8 - (head.length + tail.length);
  if (missing < 0) return null;
  const segments = doubleColonIndex === -1
    ? head
    : [...head, ...new Array(missing).fill('0'), ...tail];
  if (segments.length !== 8) return null;
  return segments.map((segment) => {
    const normalized = segment || '0';
    const parsed = Number.parseInt(normalized, 16);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 0xffff) return null;
    return parsed.toString(16);
  });
}

function ipv6ToBigInt(ip) {
  const segments = expandIpv6(ip);
  if (!segments) return null;
  let value = 0n;
  for (const segment of segments) {
    if (segment === null) return null;
    value = (value << 16n) + BigInt(Number.parseInt(segment, 16));
  }
  return value;
}

function ipv6CidrContains(cidr, ip) {
  const slash = cidr.indexOf('/');
  if (slash === -1) return false;
  const base = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (!Number.isInteger(bits) || bits < 0 || bits > 128) return false;
  const baseValue = ipv6ToBigInt(base);
  const ipValue = ipv6ToBigInt(ip);
  if (baseValue === null || ipValue === null) return false;
  if (bits === 0) return true;
  const mask = ((1n << BigInt(bits)) - 1n) << BigInt(128 - bits);
  return (baseValue & mask) === (ipValue & mask);
}

function extractMappedIpv4(ip) {
  const segments = expandIpv6(ip);
  if (!segments) return null;
  const values = segments.map((segment) => Number.parseInt(segment, 16));
  const isMapped =
    values[0] === 0 &&
    values[1] === 0 &&
    values[2] === 0 &&
    values[3] === 0 &&
    values[4] === 0 &&
    values[5] === 0xffff;
  if (!isMapped) return null;
  const octet1 = (values[6] >> 8) & 0xff;
  const octet2 = values[6] & 0xff;
  const octet3 = (values[7] >> 8) & 0xff;
  const octet4 = values[7] & 0xff;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

function mapIpv4Reason(name, detail) {
  if (detail === '169.254.169.254') return 'cloud_metadata';
  if (name === 'private') return 'rfc1918';
  if (name === 'loopback') return 'loopback';
  if (name === 'link-local') return 'cloud_metadata';
  if (name === 'unspecified') return 'unspecified';
  return 'blocked_ipv4';
}

function mapIpv6Reason(name) {
  if (name === 'loopback') return 'ipv6_loopback';
  if (name === 'link-local') return 'ipv6_link_local';
  if (name === 'unique-local') return 'ipv6_unique_local';
  if (name === 'unspecified') return 'ipv6_unspecified';
  if (name === 'ipv4-mapped') return 'ipv4_mapped';
  return 'blocked_ipv6';
}

function isBlockedIp(address, family) {
  const normalized = normalizeHost(address);
  if (family === 4) {
    for (const entry of BLOCKED_V4) {
      if (ipv4CidrContains(entry.cidr, normalized)) {
        return { blocked: true, name: entry.name };
      }
    }
    return { blocked: false };
  }

  if (family === 6) {
    const mappedIpv4 = extractMappedIpv4(normalized);
    if (mappedIpv4) {
      const mapped = isBlockedIp(mappedIpv4, 4);
      if (mapped.blocked) {
        return { blocked: true, name: mapped.name, detail: mappedIpv4 };
      }
    }
    for (const entry of BLOCKED_V6) {
      if (ipv6CidrContains(entry.cidr, normalized)) {
        return { blocked: true, name: entry.name };
      }
    }
  }

  return { blocked: false };
}

function normalizeLookupResults(result) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && typeof result.address === 'string') {
    return [result];
  }
  return [];
}

function buildSuccess(hostname, resolvedIp, resolvedFamily, detail) {
  return {
    ok: true,
    hostname,
    resolvedIp,
    resolvedFamily,
    ...(detail ? { detail } : {}),
  };
}

async function validateWebhookUrl(url, opts = {}) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (DENIED_PROTOCOLS.includes(parsed.protocol)) {
    return { ok: false, reason: 'protocol_denied', detail: parsed.protocol };
  }

  const hostname = normalizeHost(parsed.hostname);
  if (!hostname) return { ok: false, reason: 'no_hostname' };

  if (parsed.protocol === 'http:') {
    const localhostAllowed =
      opts.allowLocalhostHttp === true &&
      (hostname === 'localhost' || hostname === '127.0.0.1');
    if (localhostAllowed) {
      return buildSuccess(parsed.hostname, '127.0.0.1', 'A', 'localhost-http-allowed');
    }
    return { ok: false, reason: 'protocol_http_denied' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'protocol_unsupported', detail: parsed.protocol };
  }

  const literalFamily = isIP(hostname);
  if (literalFamily) {
    const blocked = isBlockedIp(hostname, literalFamily);
    if (blocked.blocked) {
      return {
        ok: false,
        reason: literalFamily === 4
          ? mapIpv4Reason(blocked.name, hostname)
          : mapIpv6Reason(blocked.name),
        detail: blocked.detail || hostname,
      };
    }
    return buildSuccess(parsed.hostname, hostname, literalFamily === 4 ? 'A' : 'AAAA');
  }

  const lookupFn = opts.lookup || dnsLookup;
  let results;
  try {
    results = normalizeLookupResults(await lookupFn(hostname, { all: true, family: 0 }));
  } catch (error) {
    return {
      ok: false,
      reason: 'dns_lookup_failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  if (results.length === 0) {
    return { ok: false, reason: 'dns_no_results' };
  }

  for (const result of results) {
    const blocked = isBlockedIp(result.address, result.family);
    if (blocked.blocked) {
      return {
        ok: false,
        reason: result.family === 4
          ? mapIpv4Reason(blocked.name, result.address)
          : mapIpv6Reason(blocked.name),
        detail: blocked.detail || result.address,
      };
    }
  }

  const picked = results.find((result) => result.family === 4) || results[0];
  return buildSuccess(parsed.hostname, picked.address, picked.family === 4 ? 'A' : 'AAAA');
}

function resolvePinnedAgent(resolvedIp, family, hostname) {
  return new https.Agent({
    servername: hostname,
    lookup(_host, _options, callback) {
      callback(null, resolvedIp, family === 'AAAA' ? 6 : 4);
    },
  });
}

function resolvePinnedHttpAgent(resolvedIp, family) {
  return new http.Agent({
    lookup(_host, _options, callback) {
      callback(null, resolvedIp, family === 'AAAA' ? 6 : 4);
    },
  });
}

module.exports = {
  validateWebhookUrl,
  resolvePinnedAgent,
  resolvePinnedHttpAgent,
  DEFAULT_MAX_REDIRECTS,
  BLOCKED_V4,
  BLOCKED_V6,
  DENIED_PROTOCOLS,
};
