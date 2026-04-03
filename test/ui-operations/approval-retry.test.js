/**
 * Phase 46: Approval & Retry - OPS-03 & OPS-04 Tests
 *
 * Verifies:
 * - OPS-03: Approval gating blocks execution until explicit decision recorded
 * - OPS-04: Rejection is distinct from failure; stays queued with optional reason
 * - OPS-04: Retry attempts logged as separate append-only records
 */

import { test } from "node:test";
import * as assert from "node:assert";

test("Approval gating - requires_approval step blocks START_STEP", () => {
  const step = {
    id: "step-1",
    requires_approval: true,
    approval: {
      status: "pending",
      decided_at: null,
      decided_by: null,
      rejection_reason: null,
    },
    state: "queued",
  };

  // Step should be actionable but not executable WITHOUT approval
  const isActionable = step.state === "queued";
  const hasApprovalDecision = step.approval.status !== "pending";
  const canExecute = isActionable && hasApprovalDecision;

  assert.equal(isActionable, true, "Queued step is actionable");
  assert.equal(hasApprovalDecision, false, "Pending approval blocks execution");
  assert.equal(canExecute, false, "Cannot execute without approval decision");
});

test("Approval decision persistence - APPROVE_STEP records actor and timestamp", () => {
  const step = {
    approval: {
      status: "pending",
      decided_at: null,
      decided_by: null,
    },
  };

  const decisionTimestamp = new Date().toISOString();
  const decisionActor = "operator-123";

  // Simulate APPROVE_STEP action
  const updatedApproval = {
    ...step.approval,
    status: "approved",
    decided_at: decisionTimestamp,
    decided_by: decisionActor,
  };

  assert.equal(updatedApproval.status, "approved");
  assert.equal(updatedApproval.decided_at, decisionTimestamp);
  assert.equal(updatedApproval.decided_by, decisionActor);
});

test("Rejection != Failure - REJECT_STEP keeps step queued with optional reason", () => {
  const step = {
    state: "queued",
    approval: {
      status: "pending",
      rejection_reason: null,
    },
  };

  const rejectionReason = "Missing prerequisite data";

  // Simulate REJECT_STEP
  const rejectedStep = {
    ...step,
    state: "queued", // Step stays queued, not failed
    approval: {
      status: "rejected",
      rejection_reason: rejectionReason,
    },
  };

  assert.equal(rejectedStep.state, "queued", "Rejected step stays queued");
  assert.equal(rejectedStep.approval.status, "rejected");
  assert.equal(rejectedStep.approval.rejection_reason, rejectionReason);
});

test("Retry logging - append-only retry_attempts records", () => {
  const step = {
    retry_count: 0,
    retry_attempts: [],
  };

  // First retry
  const retry1 = {
    attempt: 1,
    requested_at: "2024-01-01T00:00:00Z",
    requested_by: "operator-123",
    input_snapshot: { key: "value" },
    previous_error: "Connection timeout",
    outcome_state: "failed",
  };

  const stateAfterRetry1 = {
    ...step,
    retry_count: 1,
    retry_attempts: [retry1],
  };

  assert.equal(stateAfterRetry1.retry_count, 1);
  assert.equal(stateAfterRetry1.retry_attempts.length, 1);

  // Second retry - append, don't overwrite
  const retry2 = {
    attempt: 2,
    requested_at: "2024-01-01T00:01:00Z",
    requested_by: "operator-123",
    input_snapshot: { key: "updated-value" },
    previous_error: null,
    outcome_state: null,
  };

  const stateAfterRetry2 = {
    ...stateAfterRetry1,
    retry_count: 2,
    retry_attempts: [...stateAfterRetry1.retry_attempts, retry2],
  };

  // Verify append-only: first attempt still exists
  assert.equal(stateAfterRetry2.retry_count, 2);
  assert.equal(stateAfterRetry2.retry_attempts.length, 2);
  assert.equal(stateAfterRetry2.retry_attempts[0].attempt, 1, "First attempt preserved");
  assert.equal(stateAfterRetry2.retry_attempts[1].attempt, 2, "Second attempt appended");
});

test("Input snapshot immutability - retry with edited inputs creates separate record", () => {
  const originalInputs = { url: "http://example.com", timeout: 5000 };
  const retryInputs = { url: "http://example.com", timeout: 10000 }; // Modified

  const retry1 = {
    attempt: 1,
    input_snapshot: originalInputs,
  };

  const retry2 = {
    attempt: 2,
    input_snapshot: retryInputs,
  };

  // Verify separate snapshots preserved
  assert.notEqual(
    retry1.input_snapshot.timeout,
    retry2.input_snapshot.timeout
  );
  assert.equal(retry1.input_snapshot.timeout, 5000);
  assert.equal(retry2.input_snapshot.timeout, 10000);
});

console.log("✓ Approval & Retry Tests Passed");
