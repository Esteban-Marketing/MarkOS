const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const writeMIR = require('../onboarding/backend/write-mir.cjs');

test('Suite 5: Write-MIR Logic & Overrides', async (t) => {
  let tmpDir;
  let templateDir;
  let localDir;
  let profileTplPath = 'Core_Strategy/01_COMPANY/PROFILE.md';

  t.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mgsd-mir-test-'));
    templateDir = path.join(tmpDir, 'templates');
    localDir = path.join(tmpDir, 'local');

    // Setup templates
    fs.mkdirSync(path.join(templateDir, 'Core_Strategy', '01_COMPANY'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, profileTplPath), 'Original Template Content');
    fs.writeFileSync(path.join(templateDir, 'STATE.md'), `Original STATE\n| \`${profileTplPath}\` | \`empty\` | — |`);
  });

  t.afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5 }); } catch(e) {}
  });

  await t.test('5.1 JIT Cloning missing templates to LOCAL', async () => {
    const drafts = {
      company_profile: 'New Company Profile Data'
    };

    const result = writeMIR.applyDrafts(localDir, templateDir, drafts);
    
    assert.deepEqual(result.written, [profileTplPath]);
    assert.equal(result.stateUpdated, true);
    
    // It should have created the local profile and updated its contents
    const localProfile = fs.readFileSync(path.join(localDir, profileTplPath), 'utf8');
    assert.match(localProfile, /New Company Profile Data/);

    // It should have cloned STATE.md and marked it complete
    const localState = fs.readFileSync(path.join(localDir, 'STATE.md'), 'utf8');
    assert.match(localState, /`complete`/);
  });

  await t.test('5.2 Partial Overwrites on Existing Local', async () => {
    const drafts = { company_profile: 'Updated Profile' };

    // Prime the local directory manually
    fs.mkdirSync(path.join(localDir, 'Core_Strategy', '01_COMPANY'), { recursive: true });
    fs.writeFileSync(path.join(localDir, 'STATE.md'), `Pre-existing STATE\n| \`${profileTplPath}\` | \`complete\` | — |`);
    fs.writeFileSync(path.join(localDir, profileTplPath), 'Old Local Profile Data');

    const result = writeMIR.applyDrafts(localDir, templateDir, drafts);

    assert.equal(result.written.length, 1);
    
    // Content should be overridden
    const newProfile = fs.readFileSync(path.join(localDir, profileTplPath), 'utf8');
    assert.match(newProfile, /Updated Profile/);

    // Old STATE should be preserved but checked
    const state = fs.readFileSync(path.join(localDir, 'STATE.md'), 'utf8');
    assert.match(state, /Pre-existing STATE/);
  });
});
