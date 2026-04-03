const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileLlmModules } = require('./llm-build-helper.cjs');

test('Phase 47-06: calculateCostUsd returns expected provider cost', () => {
  const build = compileLlmModules();
  const calculator = require(path.join(build.outDir, 'cost-calculator.js'));

  try {
    const cost = calculator.calculateCostUsd('anthropic', {
      inputTokens: 1000000,
      outputTokens: 500000,
    });

    assert.equal(cost, 2.8);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-06: aggregateCostByProvider groups calls and token usage', () => {
  const build = compileLlmModules();
  const calculator = require(path.join(build.outDir, 'cost-calculator.js'));

  try {
    const aggregate = calculator.aggregateCostByProvider([
      { provider: 'anthropic', inputTokens: 100, outputTokens: 40, estimatedCostUsd: 0.001 },
      { provider: 'anthropic', inputTokens: 80, outputTokens: 20 },
      { provider: 'openai', inputTokens: 50, outputTokens: 25, estimatedCostUsd: 0.0002 },
    ]);

    assert.equal(aggregate.anthropic.calls, 2);
    assert.equal(aggregate.anthropic.inputTokens, 180);
    assert.equal(aggregate.openai.calls, 1);
  } finally {
    build.cleanup();
  }
});

test('Phase 47-06: calculateMonthlyBudgetUsage computes totals and percentage', () => {
  const build = compileLlmModules();
  const calculator = require(path.join(build.outDir, 'cost-calculator.js'));

  try {
    const summary = calculator.calculateMonthlyBudgetUsage(
      [
        { provider: 'anthropic', inputTokens: 1000, outputTokens: 1000, estimatedCostUsd: 1.5 },
        { provider: 'openai', inputTokens: 1000, outputTokens: 1000, estimatedCostUsd: 1.0 },
      ],
      10,
    );

    assert.equal(summary.usedUsd, 2.5);
    assert.equal(summary.remainingUsd, 7.5);
    assert.equal(summary.percentUsed, 25);
  } finally {
    build.cleanup();
  }
});
