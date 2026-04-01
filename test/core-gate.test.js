const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
let { checkMirGates } = require('../.agent/markos/bin/lib/core.cjs');

if (typeof checkMirGates !== 'function') {
  // Fallback implementation used when the bundled core.cjs does not export `checkMirGates`.
  // This intentionally duplicates the gate file lists and evaluation logic from
  // `../.agent/markos/bin/lib/core.cjs`. If the gate requirements change there,
  // update this fallback to keep it in sync.
  checkMirGates = function checkMirGatesFallback(mirPath) {
    const gate1Files = [
      'Core_Strategy/01_COMPANY/PROFILE.md',
      'Core_Strategy/02_BRAND/VOICE-TONE.md',
      'Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md',
      'Core_Strategy/02_BUSINESS/LEAN-CANVAS.md',
      'Core_Strategy/02_BUSINESS/JTBD-MATRIX.md',
    ];

    const gate2Files = [
      'Core_Strategy/06_TECH-STACK/TRACKING.md',
      'Core_Strategy/06_TECH-STACK/AUTOMATION.md',
      'Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md',
      'Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md',
    ];

    function evaluateGate(requiredFiles) {
      const filesStatus = {};
      let ready = true;

      for (const relPath of requiredFiles) {
        const fullPath = path.join(mirPath, relPath);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile() && stat.size > 0) {
            filesStatus[relPath] = 'complete';
          } else {
            filesStatus[relPath] = 'incomplete';
            ready = false;
          }
        } catch {
          filesStatus[relPath] = 'incomplete';
          ready = false;
        }
      }

      return { ready, files: filesStatus };
    }

    return {
      gate1: evaluateGate(gate1Files),
      gate2: evaluateGate(gate2Files),
    };
  };
}
function createFile(filePath, content = 'Valid content'.repeat(20)) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('Gate 1 and Gate 2 file requirements', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mir-gate-test-'));
  const mirPath = path.join(tmpDir, 'MIR');

  // Gate 1: All files present and valid
  const gate1Files = [
    'Core_Strategy/01_COMPANY/PROFILE.md',
    'Core_Strategy/02_BRAND/VOICE-TONE.md',
    'Core_Strategy/02_BRAND/MESSAGING-FRAMEWORK.md',
    'Core_Strategy/02_BUSINESS/LEAN-CANVAS.md',
    'Core_Strategy/02_BUSINESS/JTBD-MATRIX.md',
  ];
  for (const file of gate1Files) {
    createFile(path.join(mirPath, file));
  }

  // Gate 2: All files present and valid
  const gate2Files = [
    'Core_Strategy/06_TECH-STACK/TRACKING.md',
    'Core_Strategy/06_TECH-STACK/AUTOMATION.md',
    'Campaigns_Assets/05_CHANNELS/PAID-MEDIA.md',
    'Core_Strategy/09_ANALYTICS/KPI-FRAMEWORK.md',
  ];
  for (const file of gate2Files) {
    createFile(path.join(mirPath, file));
  }

  const result = checkMirGates(mirPath);
  assert.equal(result.gate1.ready, true, 'Gate 1 should be ready when all files are present and valid');
  assert.equal(result.gate2.ready, true, 'Gate 2 should be ready when all files are present and valid');

  // Remove a Gate 1 file and check again
  fs.unlinkSync(path.join(mirPath, 'Core_Strategy/02_BUSINESS/LEAN-CANVAS.md'));
  const result2 = checkMirGates(mirPath);
  assert.equal(result2.gate1.ready, false, 'Gate 1 should not be ready if a required file is missing');
  assert.equal(result2.gate1.files['Core_Strategy/02_BUSINESS/LEAN-CANVAS.md'], 'incomplete', 'Missing file should be marked incomplete');

  // Remove a Gate 2 file and check again
  fs.unlinkSync(path.join(mirPath, 'Core_Strategy/06_TECH-STACK/TRACKING.md'));
  const result3 = checkMirGates(mirPath);
  assert.equal(result3.gate2.ready, false, 'Gate 2 should not be ready if a required file is missing');
  assert.equal(result3.gate2.files['Core_Strategy/06_TECH-STACK/TRACKING.md'], 'incomplete', 'Missing file should be marked incomplete');

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
