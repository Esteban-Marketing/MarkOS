'use strict';

// Phase 201.1 D-104: per-instance Promise coalescing for slug->tenant lookups.
// Eliminates thundering-herd on cache miss within one warm Vercel function invocation.
// Each warm instance gets a module-scope default; callers can also createSingleFlight()
// for isolated instances in tests.

function createSingleFlight() {
  const inflight = new Map();
  return {
    async coalesce(key, fn) {
      if (inflight.has(key)) return inflight.get(key);
      const promise = Promise.resolve()
        .then(() => fn())
        .finally(() => { inflight.delete(key); });
      inflight.set(key, promise);
      return promise;
    },
    inflightSize() { return inflight.size; },
    clear() { inflight.clear(); },
  };
}

const _default = createSingleFlight();

module.exports = {
  createSingleFlight,
  singleFlight: _default,
};
