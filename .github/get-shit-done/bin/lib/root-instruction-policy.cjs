const path = require('path');
const os = require('os');

const ROOT_INSTRUCTION_FILES = Object.freeze({
  claude: 'CLAUDE.md',
  copilot: 'copilot-instructions.md',
});

function getInstructionRootDir({ cwd, global }) {
  return global ? path.join(os.homedir(), '.claude') : cwd;
}

function getProjectInstructionTargets(options = {}) {
  const cwd = options.cwd || process.cwd();
  const global = !!options.global;
  const preferredRoot = options.preferredRoot === 'claude' ? 'claude' : 'copilot';
  const rootDir = getInstructionRootDir({ cwd, global });
  const order = preferredRoot === 'claude'
    ? ['claude', 'copilot']
    : ['copilot', 'claude'];

  return order.map((kind) => {
    const file = ROOT_INSTRUCTION_FILES[kind];
    const targetPath = path.join(rootDir, file);
    return {
      kind,
      file,
      path: targetPath,
      targetPath,
      outputPath: targetPath,
      is_primary: kind === preferredRoot,
      global,
    };
  });
}

function getPrimaryProjectInstructionTarget(options = {}) {
  return getProjectInstructionTargets(options)[0];
}

module.exports = {
  ROOT_INSTRUCTION_FILES,
  getProjectInstructionTargets,
  getPrimaryProjectInstructionTarget,
};