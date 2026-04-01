# Concern Assessment Template

Date: YYYY-MM-DD
Assessor: <name>
Scope: <weekly light audit | monthly full reconciliation | milestone-close review>

## Summary

- Overall concern posture: <Stable | Elevated | Critical>
- Concerns assessed: <count>
- Open high-priority concerns (score >= 40): <count>

## Scored Table

| Concern | I | L | D | Priority | Evidence Reviewed | Status |
|---|---|---|---|---|---|---|
| <concern-name> | <1-5> | <1-5> | <1-5> | <I x L x D> | <files/docs/tests> | <Open/Mitigated/Closed> |

## Detailed Assessment

### 1. <Concern Name>

- Current score: I=<n>, L=<n>, D=<n>, Priority=<n>
- Evidence reviewed:
  - <path>
  - <path>
- Gaps found:
  - <gap>
- Remediation tasks:
  - <task>
- Owner: <owner>
- Due date: <date>
- Re-test result: <not-run | pass | fail>

## Execution Notes

- Checks run:
  - `node --test test/protocol.test.js`
- Output summary:
  - <summary>

## Decision Log

- Concern status changes:
  - <concern>: <from> -> <to> (reason)
- Deferred actions:
  - <action>
