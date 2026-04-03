# MarkOS v3 Readiness Checklist

## Strategy and scope

- [ ] PROJECT, REQUIREMENTS, ROADMAP, and ARCHITECTURE are internally consistent.
- [ ] Every v3 requirement maps to a phase and verification approach.
- [ ] Deferred scope is explicitly separated from v3 scope.

## Architecture and security

- [ ] Tenant isolation strategy is implemented and tested.
- [ ] Authorization matrix is implemented and validated.
- [ ] Approval gate controls are active for high-impact AI outcomes.
- [ ] Audit trail coverage exists for privileged actions.

## Product and experience

- [ ] White-label branding and custom domain controls are stable.
- [ ] Tenant UX is role-aware and safe under failure states.
- [ ] Plan and approval workflows provide clear status visibility.

## Operations and monetization

- [ ] Metering events map to invoices and reconciliation output.
- [ ] SLO dashboards and alerting are active.
- [ ] Incident runbooks are current and rehearsed.
- [ ] Privacy workflows are documented and testable.

## Final release gates

- [ ] Critical tests pass (security, isolation, billing, approvals).
- [ ] Rollback plans exist for schema and workflow changes.
- [ ] Open high-severity issues are zero at release cutoff.
