const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const routePath = path.join(root, 'app/(markos)/crm/outbound/page.tsx');
const workspacePath = path.join(root, 'components/crm/outbound/outbound-workspace.tsx');
const composerPath = path.join(root, 'components/crm/outbound/outbound-composer.tsx');
const consentGatePath = path.join(root, 'components/crm/outbound/outbound-consent-gate.tsx');

test('CRM-05: outbound workspace reuses CRM queue, composer, and evidence regions inside the CRM shell', () => {
  [routePath, workspacePath, composerPath, consentGatePath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });

  const routeSource = fs.readFileSync(routePath, 'utf8');
  const workspaceSource = fs.readFileSync(workspacePath, 'utf8');
  const composerSource = fs.readFileSync(composerPath, 'utf8');
  const consentSource = fs.readFileSync(consentGatePath, 'utf8');

  assert.match(routeSource, /requireMarkosSession/);
  assert.match(routeSource, /getActiveTenantContext/);
  assert.match(routeSource, /OutboundWorkspace/);
  assert.match(routeSource, /buildOutboundWorkspaceSnapshot/);

  assert.match(workspaceSource, /Outbound Queue/);
  assert.match(workspaceSource, /Evidence Rail/);
  assert.match(workspaceSource, /OutboundComposer/);
  assert.match(workspaceSource, /template/i);
  assert.match(workspaceSource, /schedule/i);

  assert.match(composerSource, /channel/i);
  assert.match(composerSource, /template/i);
  assert.match(composerSource, /schedule/i);
  assert.match(composerSource, /approval/i);
  assert.match(consentSource, /consent/i);
  assert.match(consentSource, /approval/i);
});
