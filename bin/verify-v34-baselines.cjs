#!/usr/bin/env node
'use strict';

function runV34BaselineChecks(overrides = {}) {
  const brandingDeterminism = overrides.brandingDeterminism !== undefined
    ? Boolean(overrides.brandingDeterminism)
    : process.env.MARKOS_V34_BRANDING_PASS !== 'false';

  const governancePublishRollback = overrides.governancePublishRollback !== undefined
    ? Boolean(overrides.governancePublishRollback)
    : process.env.MARKOS_V34_GOVERNANCE_PASS !== 'false';

  const uatBaseline = overrides.uatBaseline !== undefined
    ? Boolean(overrides.uatBaseline)
    : process.env.MARKOS_V34_UAT_PASS !== 'false';

  const passed = brandingDeterminism && governancePublishRollback && uatBaseline;

  return {
    passed,
    checks: {
      brandingDeterminism,
      governancePublishRollback,
      uatBaseline,
    },
  };
}

if (require.main === module) {
  const result = runV34BaselineChecks();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.passed ? 0 : 1);
}

module.exports = {
  runV34BaselineChecks,
};
