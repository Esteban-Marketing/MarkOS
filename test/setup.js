const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function createTestEnvironment() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mgsd-test-'));
  
  return {
    dir: tmpDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch(e) {}
    },
    seedGSD: () => {
      const gsdDir = path.join(tmpDir, '.agent', 'get-shit-done');
      fs.mkdirSync(gsdDir, { recursive: true });
      fs.writeFileSync(path.join(gsdDir, 'VERSION'), '1.0.0');
    },
    seedMGSD: () => {
      const mgsdDir = path.join(tmpDir, '.agent', 'marketing-get-shit-done');
      fs.mkdirSync(mgsdDir, { recursive: true });
      fs.writeFileSync(path.join(mgsdDir, 'VERSION'), '0.9.0');
    },
    seedInstallForUpdate: () => {
      const crypto = require('crypto');
      const mgsdDir = path.join(tmpDir, '.agent', 'marketing-get-shit-done');
      fs.mkdirSync(path.join(mgsdDir, 'agents'), { recursive: true });
      
      const file1 = path.join(mgsdDir, 'MGSD-INDEX.md');
      const file2 = path.join(mgsdDir, 'agents', 'mgsd-researcher.md');
      
      fs.writeFileSync(file1, 'Old Index v0.9.0');
      fs.writeFileSync(file2, 'Old Researcher v0.9.0');
      fs.writeFileSync(path.join(mgsdDir, 'VERSION'), '0.9.0');
      
      const hash1 = crypto.createHash('sha256').update('Old Index v0.9.0').digest('hex');
      const hash2 = crypto.createHash('sha256').update('Old Researcher v0.9.0').digest('hex');
      
      const manifest = {
        version: '0.9.0',
        installed: new Date().toISOString(),
        location: 'project',
        project_name: 'Test Project',
        file_hashes: {
          'MGSD-INDEX.md': hash1,
          'agents\\mgsd-researcher.md': hash2,
          'VERSION': crypto.createHash('sha256').update('0.9.0').digest('hex')
        }
      };
      
      // Fix paths for POSIX systems:
      manifest.file_hashes['agents/mgsd-researcher.md'] = hash2;
      
      fs.writeFileSync(path.join(tmpDir, '.mgsd-install-manifest.json'), JSON.stringify(manifest, null, 2));
    },
    seedOnboarding: () => {
      const srcDir = path.resolve(__dirname, '../onboarding');
      const destDir = path.join(tmpDir, 'onboarding');
      
      const copyRecursiveSync = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);
          if (fs.statSync(srcPath).isDirectory()) {
            copyRecursiveSync(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      copyRecursiveSync(srcDir, destDir);
      
      // Override config to prevent browser spawn during tests
      fs.writeFileSync(path.join(destDir, 'onboarding-config.json'), JSON.stringify({
        auto_open_browser: false,
        port: 4242,
        output_path: '../mock-onboarding-seed.json'
      }));
    }
  };
}

function runCLI(scriptPath, cwd, inputs = []) {
  return new Promise((resolve, reject) => {
    // Execute the Node script in the specific tmp directory
    const child = spawn(process.execPath, [scriptPath], { cwd });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      const txt = data.toString();
      output += txt;
      
      // Simple prompt detection to inject our predetermined answers automatically
      if (
        txt.includes('Choice') || 
        txt.includes('(y/n)') || 
        txt.includes('Project/client name') ||
        txt.includes('Proceed') ||
        txt.includes('[K]eep mine')
      ) {
        if (inputs.length > 0) {
          const nextInput = inputs.shift();
          child.stdin.write(nextInput + '\n');
        }
      }
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, output });
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

function readManifest(targetDir) {
  const manifestPath = path.join(targetDir, '.mgsd-install-manifest.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return null;
}

module.exports = { createTestEnvironment, runCLI, readManifest };
