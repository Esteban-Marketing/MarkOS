'use strict';

const GATE_STATUS = Object.freeze(['pass', 'blocked']);
const CHECK_STATUS = Object.freeze(['pass', 'fail']);

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateAccessibilityGateReport(report) {
  const errors = [];

  if (!isObject(report)) {
    return {
      valid: false,
      errors: ['accessibility_gate_report must be an object'],
    };
  }

  if (!GATE_STATUS.includes(report.gate_status)) {
    errors.push(`gate_status must be one of: ${GATE_STATUS.join(', ')}`);
  }

  if (!Array.isArray(report.checks) || report.checks.length === 0) {
    errors.push('checks must be a non-empty array');
  } else {
    report.checks.forEach((check, index) => {
      const prefix = `checks[${index}]`;
      if (!isObject(check)) {
        errors.push(`${prefix} must be an object`);
        return;
      }

      if (!isNonEmptyString(check.id)) {
        errors.push(`${prefix}.id must be a non-empty string`);
      }

      if (typeof check.required_ratio !== 'number' || Number.isNaN(check.required_ratio)) {
        errors.push(`${prefix}.required_ratio must be a number`);
      }

      if (typeof check.observed_ratio !== 'number' || Number.isNaN(check.observed_ratio)) {
        errors.push(`${prefix}.observed_ratio must be a number`);
      }

      if (!CHECK_STATUS.includes(check.status)) {
        errors.push(`${prefix}.status must be one of: ${CHECK_STATUS.join(', ')}`);
      }

      if (typeof check.blocking !== 'boolean') {
        errors.push(`${prefix}.blocking must be a boolean`);
      }
    });
  }

  if (!Array.isArray(report.diagnostics)) {
    errors.push('diagnostics must be an array');
  } else {
    report.diagnostics.forEach((diagnostic, index) => {
      const prefix = `diagnostics[${index}]`;
      if (!isObject(diagnostic)) {
        errors.push(`${prefix} must be an object`);
        return;
      }

      if (!isNonEmptyString(diagnostic.check_id)) {
        errors.push(`${prefix}.check_id must be a non-empty string`);
      }

      if (typeof diagnostic.required_ratio !== 'number' || Number.isNaN(diagnostic.required_ratio)) {
        errors.push(`${prefix}.required_ratio must be a number`);
      }

      if (typeof diagnostic.observed_ratio !== 'number' || Number.isNaN(diagnostic.observed_ratio)) {
        errors.push(`${prefix}.observed_ratio must be a number`);
      }

      if (typeof diagnostic.blocking !== 'boolean') {
        errors.push(`${prefix}.blocking must be a boolean`);
      }

      if (!isNonEmptyString(diagnostic.message)) {
        errors.push(`${prefix}.message must be a non-empty string`);
      }
    });
  }

  if (Array.isArray(report.checks)) {
    const hasBlockingFailure = report.checks.some((check) => isObject(check) && check.status === 'fail' && check.blocking === true);
    if (hasBlockingFailure && report.gate_status !== 'blocked') {
      errors.push('gate_status must be blocked when a blocking check fails');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  GATE_STATUS,
  CHECK_STATUS,
  validateAccessibilityGateReport,
};
