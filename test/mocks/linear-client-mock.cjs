/**
 * linear-client-mock.cjs — Mock Linear API client for testing
 * 
 * Usage:
 *   const mock = mockLinearClient({ returnSuccess: true, delay: 100 });
 *   // make requests...
 *   assert.equal(mock.callCount, 1);
 */

let callCount = 0;
let lastCall = null;
let lastResponse = null;

/**
 * Create a mock Linear API client
 * @param {Object} opts - Configuration
 * @param {boolean} opts.returnSuccess - Whether to return successful response (default: true)
 * @param {number} opts.delay - Response delay in ms (default: 0)
 * @param {string} opts.errorCode - HTTP error code if returnSuccess is false (default: 503)
 * @returns {Object} Mock client with intercept capabilities
 */
function mockLinearClient(opts = {}) {
  const {
    returnSuccess = true,
    delay = 0,
    errorCode = 503
  } = opts;

  return {
    async post(path, body) {
      callCount++;
      lastCall = { path, body, timestamp: Date.now() };

      // Simulate delay
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (!returnSuccess) {
        const response = {
          status: errorCode,
          error: `Linear API returned ${errorCode}`,
          code: errorCode
        };
        lastResponse = response;
        throw new Error(`Linear API error: ${errorCode}`);
      }

      // Success response: generate ticket IDs from request
      const { tasks = [] } = body;
      const tickets = tasks
        .filter(t => ['MARKOS-ITM-OPS-03', 'MARKOS-ITM-INT-01'].includes(t.token))
        .map((t, idx) => ({
          token: t.token,
          identifier: `ENG-${(1000 + callCount * 100 + idx).toString()}`,
          url: `https://linear.app/markos/issue/ENG-${(1000 + callCount * 100 + idx).toString()}/intake-${body.slug || 'unknown'}`
        }));

      const response = { tickets };
      lastResponse = response;
      return response;
    },

    getCallCount() {
      return callCount;
    },

    getLastCall() {
      return lastCall;
    },

    getLastResponse() {
      return lastResponse;
    },

    reset() {
      callCount = 0;
      lastCall = null;
      lastResponse = null;
    }
  };
}

/**
 * Mock fetch for POST /linear/sync endpoint
 * Wraps the Linear client mock in a fetch-like interface
 */
function mockLinearFetch(linearMock) {
  return async function fetch(url, options = {}) {
    if (url !== '/linear/sync') {
      throw new Error(`Unexpected fetch URL: ${url}`);
    }

    if (options.method !== 'POST') {
      throw new Error(`Expected POST, got ${options.method}`);
    }

    let body;
    try {
      body = JSON.parse(options.body);
    } catch (e) {
      throw new Error(`Invalid JSON body: ${e.message}`);
    }

    try {
      const response = await linearMock.post('/linear/sync', body);
      return {
        ok: true,
        status: 200,
        json: async () => response
      };
    } catch (err) {
      return {
        ok: false,
        status: 503,
        json: async () => ({ error: err.message })
      };
    }
  };
}

module.exports = {
  mockLinearClient,
  mockLinearFetch
};
