const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createTestEnvironment } = require('../setup.js');
const sharedPolicy = require('../../.github/get-shit-done/bin/lib/root-instruction-policy.cjs');
const localPolicy = require('../../.claude/get-shit-done/bin/lib/root-instruction-policy.cjs');
const sharedProfileOutput = require('../../.github/get-shit-done/bin/lib/profile-output.cjs');
const localProfileOutput = require('../../.claude/get-shit-done/bin/lib/profile-output.cjs');

test('64.2 dual-root instruction generation keeps both root artifacts intentional', async () => {
  const env = createTestEnvironment();
  try {
    const sharedTargets = sharedPolicy.getProjectInstructionTargets({ cwd: env.dir, global: false });
    const localTargets = localPolicy.getProjectInstructionTargets({ cwd: env.dir, global: false });

    assert.equal(path.basename(sharedTargets[0].path), 'copilot-instructions.md');
    assert.equal(path.basename(localTargets[0].path), 'CLAUDE.md');

    for (const label of ['CLAUDE.md', 'copilot-instructions.md']) {
      assert.ok(sharedTargets.some((entry) => entry.path.endsWith(label)), `shared policy should expose ${label}`);
      assert.ok(localTargets.some((entry) => entry.path.endsWith(label)), `localized policy should expose ${label}`);
    }

    const hiddenSharedArtifact = path.join(env.dir, '.github', 'copilot-instructions.md');
  const staleCopilotPath = path.join(env.dir, 'copilot-instructions.md');
  const staleClaudePath = path.join(env.dir, 'CLAUDE.md');
    fs.mkdirSync(path.dirname(hiddenSharedArtifact), { recursive: true });
    fs.writeFileSync(hiddenSharedArtifact, '# Hidden shared artifact\n');
  fs.writeFileSync(staleCopilotPath, '# stale shared root\n');
  fs.writeFileSync(staleClaudePath, '# stale localized root\n');

    sharedProfileOutput.cmdGenerateClaudeMd(env.dir, {}, true);
    localProfileOutput.cmdGenerateClaudeMd(env.dir, {}, true);

    const projectCopilotPath = path.join(env.dir, 'copilot-instructions.md');
    const projectClaudePath = path.join(env.dir, 'CLAUDE.md');

    assert.ok(fs.existsSync(projectCopilotPath), 'shared generator should create root copilot-instructions.md');
    assert.ok(fs.existsSync(projectClaudePath), 'localized generator should create root CLAUDE.md');

    const projectCopilot = fs.readFileSync(projectCopilotPath, 'utf8');
    const projectClaude = fs.readFileSync(projectClaudePath, 'utf8');
    const hiddenShared = fs.readFileSync(hiddenSharedArtifact, 'utf8');

    assert.match(projectCopilot, /## Project/);
    assert.match(projectClaude, /## Project/);
    assert.notEqual(projectCopilot, '# stale shared root\n', 'shared generator should refresh the root copilot artifact beyond the stale placeholder');
    assert.notEqual(projectClaude, '# stale localized root\n', 'localized generator should refresh the root CLAUDE artifact beyond the stale placeholder');
    assert.doesNotMatch(projectCopilot, /\.github\/copilot-instructions\.md/);
    assert.equal(hiddenShared, '# Hidden shared artifact\n', 'hidden shared artifact should remain a separate file');
  } finally {
    env.cleanup();
  }
});