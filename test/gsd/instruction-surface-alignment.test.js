const childProcess = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('64.2 instruction surfaces preserve the shared versus localized ownership split', async () => {
  const sharedFiles = [
    '.github/get-shit-done/workflows/new-project.md',
    '.github/get-shit-done/workflows/plan-phase.md',
    '.github/get-shit-done/workflows/profile-user.md',
    '.github/get-shit-done/workflows/quick.md',
    '.github/get-shit-done/workflows/execute-phase.md',
    '.github/get-shit-done/workflows/execute-plan.md',
    '.github/get-shit-done/workflows/ui-phase.md',
    '.github/get-shit-done/workflows/ui-review.md',
    '.github/get-shit-done/workflows/update.md',
    '.github/skills/gsd-profile-user/SKILL.md',
    '.github/agents/gsd-planner.agent.md',
    '.github/agents/gsd-phase-researcher.agent.md',
    '.github/agents/gsd-plan-checker.agent.md',
    '.github/agents/gsd-executor.agent.md',
    '.github/agents/gsd-verifier.agent.md',
    '.github/agents/gsd-doc-verifier.agent.md',
    '.github/agents/gsd-ui-researcher.agent.md',
    '.github/agents/gsd-ui-checker.agent.md',
    '.github/agents/gsd-ui-auditor.agent.md',
  ];

  for (const file of sharedFiles) {
    const text = read(file);
    assert.match(text, /copilot-instructions\.md/, `${file} should reference root copilot-instructions.md`);
    assert.doesNotMatch(text, /\.\/CLAUDE\.md/, `${file} should not use the localized ./CLAUDE.md contract`);
  }

  const localizedFiles = [
    '.claude/get-shit-done/workflows/new-project.md',
    '.claude/get-shit-done/workflows/plan-phase.md',
    '.claude/get-shit-done/workflows/profile-user.md',
    '.claude/get-shit-done/workflows/quick.md',
    '.claude/get-shit-done/workflows/execute-phase.md',
    '.claude/get-shit-done/workflows/execute-plan.md',
    '.claude/get-shit-done/workflows/ui-phase.md',
    '.claude/get-shit-done/workflows/ui-review.md',
    '.claude/get-shit-done/workflows/update.md',
    '.claude/skills/gsd-profile-user/SKILL.md',
    '.claude/agents/gsd-planner.md',
    '.claude/agents/gsd-phase-researcher.md',
    '.claude/agents/gsd-plan-checker.md',
    '.claude/agents/gsd-executor.md',
    '.claude/agents/gsd-verifier.md',
    '.claude/agents/gsd-doc-verifier.md',
    '.claude/agents/gsd-ui-researcher.md',
    '.claude/agents/gsd-ui-checker.md',
    '.claude/agents/gsd-ui-auditor.md',
  ];

  for (const file of localizedFiles) {
    const text = read(file);
    assert.match(text, /CLAUDE\.md/, `${file} should keep the localized CLAUDE.md contract`);
  }

  const localizedSkillFiles = [
    '.claude/skills/gsd-profile-user/SKILL.md',
    '.claude/skills/gsd-plan-phase/SKILL.md',
    '.claude/skills/gsd-execute-phase/SKILL.md',
  ];

  for (const file of localizedSkillFiles) {
    const text = read(file);
    assert.match(text, /@~\/.claude\/get-shit-done|\.claude\/get-shit-done/, `${file} should stay pointed at the localized runtime tree`);
    assert.doesNotMatch(text, /\.github\/get-shit-done/, `${file} should not repoint into the shared runtime tree`);
  }

  const boundaryDoc = read('.planning/codebase/GSD-CUSTOMIZATION-BOUNDARY.md');
  const filesDoc = read('.planning/codebase/FILES.md');
  const structureDoc = read('.planning/codebase/STRUCTURE.md');

  for (const needle of ['.github/**', '.claude/**', '.markos-local/**', 'copilot-instructions.md', 'CLAUDE.md', '.github/copilot-instructions.md']) {
    assert.match(boundaryDoc, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `boundary doc should include ${needle}`);
  }

  assert.match(filesDoc, /GSD-CUSTOMIZATION-BOUNDARY\.md/, 'FILES.md should point to the canonical boundary doc');
  assert.match(filesDoc, /copilot-instructions\.md/, 'FILES.md should list the shared root contract');
  assert.match(filesDoc, /CLAUDE\.md/, 'FILES.md should list the localized root contract');

  assert.match(structureDoc, /GSD-CUSTOMIZATION-BOUNDARY\.md/, 'STRUCTURE.md should point to the canonical boundary doc');
  assert.match(structureDoc, /\.github\//, 'STRUCTURE.md should name the shared framework directory');
  assert.match(structureDoc, /\.claude\//, 'STRUCTURE.md should name the localized runtime directory');
  assert.match(structureDoc, /\.markos-local\//, 'STRUCTURE.md should name the client override directory');
});

test('64.3 inserted decimal phases remain discoverable through roadmap get-phase', async () => {
  for (const phase of ['64.2', '64.3']) {
    const output = childProcess.execFileSync(
      process.execPath,
      ['.github/get-shit-done/bin/gsd-tools.cjs', 'roadmap', 'get-phase', phase],
      { cwd: repoRoot, encoding: 'utf8' }
    );
    const payload = JSON.parse(output);
    assert.equal(payload.found, true, `roadmap lookup should find ${phase}`);
    assert.equal(payload.phase_number, phase, `roadmap lookup should return the requested phase number for ${phase}`);
  }
});