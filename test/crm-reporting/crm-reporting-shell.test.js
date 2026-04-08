const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const pagePath = path.join(root, 'app/(markos)/crm/reporting/page.tsx');
const storePath = path.join(root, 'app/(markos)/crm/reporting/reporting-store.tsx');
const navPath = path.join(root, 'components/markos/crm/reporting-nav.tsx');
const dashboardPath = path.join(root, 'components/markos/crm/reporting-dashboard.tsx');
const evidenceRailPath = path.join(root, 'components/markos/crm/reporting-evidence-rail.tsx');
const executiveSummaryPath = path.join(root, 'components/markos/crm/reporting-executive-summary.tsx');
const centralRollupPath = path.join(root, 'components/markos/crm/reporting-central-rollup.tsx');

test('REP-01: CRM reporting cockpit route lives in the MarkOS shell with one coherent reporting surface', () => {
  assert.equal(fs.existsSync(pagePath), true, 'crm reporting page must exist');
  const source = fs.readFileSync(pagePath, 'utf8');

  assert.match(source, /ReportingStoreProvider/);
  assert.match(source, /ReportingNav/);
  assert.match(source, /ReportingDashboard/);
  assert.match(source, /ReportingEvidenceRail/);
  assert.match(source, /ReportingExecutiveSummary/);
  assert.match(source, /ReportingCentralRollup/);
  assert.match(source, /CRM Reporting Cockpit/i);
  assert.match(source, /Pipeline health/i);
  assert.match(source, /Attribution/i);
  assert.match(source, /Risk/i);
  assert.match(source, /Productivity/i);
  assert.match(source, /Readiness/i);
  assert.match(source, /Verification/i);
});

test('REP-01: reporting store tracks one truth layer across role, time range, pipeline, drilldown, and evidence context', () => {
  assert.equal(fs.existsSync(storePath), true, 'reporting store must exist');
  const source = fs.readFileSync(storePath, 'utf8');

  assert.match(source, /currentView/);
  assert.match(source, /roleLayer/);
  assert.match(source, /timeRange/);
  assert.match(source, /selectedPipelineKey/);
  assert.match(source, /selectedAttributionRecordId/);
  assert.match(source, /selectedEvidenceKey/);
  assert.match(source, /setCurrentView/);
  assert.match(source, /useReportingStore/);
});

test('REP-01: reporting cockpit components expose dashboard, evidence rail, executive summary, and governed rollups', () => {
  for (const filePath of [navPath, dashboardPath, evidenceRailPath, executiveSummaryPath, centralRollupPath]) {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  }

  const navSource = fs.readFileSync(navPath, 'utf8');
  const dashboardSource = fs.readFileSync(dashboardPath, 'utf8');
  const evidenceSource = fs.readFileSync(evidenceRailPath, 'utf8');
  const executiveSource = fs.readFileSync(executiveSummaryPath, 'utf8');
  const rollupSource = fs.readFileSync(centralRollupPath, 'utf8');

  assert.match(navSource, /pipeline/i);
  assert.match(navSource, /attribution/i);
  assert.match(navSource, /verification/i);
  assert.match(dashboardSource, /pipeline health/i);
  assert.match(dashboardSource, /SLA risk/i);
  assert.match(dashboardSource, /productivity/i);
  assert.match(evidenceSource, /evidence rail/i);
  assert.match(evidenceSource, /readiness/i);
  assert.match(evidenceSource, /attribution lineage/i);
  assert.match(executiveSource, /executive summary/i);
  assert.match(executiveSource, /same reporting truth/i);
  assert.match(rollupSource, /central rollup/i);
  assert.match(rollupSource, /governed drill-down/i);
});