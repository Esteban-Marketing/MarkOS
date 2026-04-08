const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const ONBOARDING_EXTRACTION_FIXTURES = Object.freeze({
  urlOnly: {
    input: {
      webText: 'MarkOS helps marketing teams install an AI-native operating system with shared context and reusable workflows.',
      fileText: '',
      chatText: ''
    },
    expectedSchema: {
      company: {
        name: 'MarkOS',
        business_model: 'SaaS'
      },
      audience: {
        segment_name: 'Marketing teams'
      }
    }
  },
  fileOnlySparse: {
    input: {
      webText: '',
      fileText: 'Company: Acme\nBusiness Model: B2B\nAudience: SMB founders\nDifferentiator: Fast setup',
      chatText: ''
    },
    expectedSchema: {
      company: {
        name: 'Acme',
        business_model: 'B2B'
      },
      audience: {
        segment_name: 'SMB founders'
      },
      competitive: {
        differentiator: 'Fast setup'
      }
    }
  },
  mixedConflict: {
    input: {
      webText: 'Site copy says B2C productivity app for students.',
      fileText: 'Internal memo says B2B analytics platform for finance teams.',
      chatText: 'We recently pivoted to B2B for finance teams; keep that direction.'
    },
    expectedSchema: {
      company: {
        name: 'Pivot Analytics',
        business_model: 'B2B'
      },
      audience: {
        segment_name: 'Finance teams'
      }
    }
  }
});

function createJsonRequest(body, url = '/', method = 'POST') {
  return {
    method,
    url,
    headers: { 'content-type': 'application/json' },
    body,
  };
}

async function withMockedModule(modulePath, mockedExports, run) {
  const resolved = require.resolve(modulePath);
  const previous = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: mockedExports,
  };

  try {
    return await run();
  } finally {
    if (previous) {
      require.cache[resolved] = previous;
    } else {
      delete require.cache[resolved];
    }
  }
}

function createTestEnvironment() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markos-test-'));
  
  return {
    dir: tmpDir,
    cleanup: () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch (error) {
        if (error && !['ENOENT', 'EBUSY', 'EPERM'].includes(error.code)) {
          throw error;
        }
      }
    },
    seedGSD: () => {
      const gsdDir = path.join(tmpDir, '.agent', 'get-shit-done');
      fs.mkdirSync(gsdDir, { recursive: true });
      fs.writeFileSync(path.join(gsdDir, 'VERSION'), '1.0.0');
    },
    seedMarkOS: () => {
      const markosDir = path.join(tmpDir, '.agent', 'markos');
      fs.mkdirSync(markosDir, { recursive: true });
      fs.writeFileSync(path.join(markosDir, 'VERSION'), '0.9.0');
    },
    seedInstallForUpdate: () => {
      const markosDir = path.join(tmpDir, '.agent', 'markos');
      fs.mkdirSync(path.join(markosDir, 'agents'), { recursive: true });
      
      const file1 = path.join(markosDir, 'MARKOS-INDEX.md');
      const file2 = path.join(markosDir, 'agents', 'markos-researcher.md');
      
      fs.writeFileSync(file1, 'Old Index v0.9.0');
      fs.writeFileSync(file2, 'Old Researcher v0.9.0');
      fs.writeFileSync(path.join(markosDir, 'VERSION'), '0.9.0');
      
      const hash1 = crypto.createHash('sha256').update('Old Index v0.9.0').digest('hex');
      const hash2 = crypto.createHash('sha256').update('Old Researcher v0.9.0').digest('hex');
      
      const manifest = {
        version: '0.9.0',
        installed: new Date().toISOString(),
        location: 'project',
        project_name: 'Test Project',
        file_hashes: {
          'MARKOS-INDEX.md': hash1,
          'agents\\markos-researcher.md': hash2,
          'VERSION': crypto.createHash('sha256').update('0.9.0').digest('hex')
        }
      };
      
      // Fix paths for POSIX systems:
      manifest.file_hashes['agents/markos-researcher.md'] = hash2;
      
      fs.writeFileSync(path.join(tmpDir, '.markos-install-manifest.json'), JSON.stringify(manifest, null, 2));
    },
    seedOnboarding: () => {
      const srcDir = path.resolve(__dirname, '../onboarding');
      const destDir = path.join(tmpDir, 'onboarding');
      const apiSrcDir = path.resolve(__dirname, '../api');
      const apiDestDir = path.join(tmpDir, 'api');
      const libMarkosSrcDir = path.resolve(__dirname, '../lib/markos');
      const libMarkosDestDir = path.join(tmpDir, 'lib', 'markos');
      
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
      copyRecursiveSync(apiSrcDir, apiDestDir);
      copyRecursiveSync(libMarkosSrcDir, libMarkosDestDir);
      
      // Override config to prevent browser spawn during tests
      fs.writeFileSync(path.join(destDir, 'onboarding-config.json'), JSON.stringify({
        auto_open_browser: false,
        port: 4242,
        output_path: '../mock-onboarding-seed.json'
      }));
    }
  };
}

function runCLI(scriptPath, cwd, inputs = [], options = {}) {
  return new Promise((resolve, reject) => {
    const envOverrides = options.env ? { ...options.env } : undefined;

    // Execute the Node script in the specific tmp directory
    const child = spawn(process.execPath, [scriptPath, ...(options.args || [])], {
      cwd,
      env: {
        ...process.env,
        ...(inputs.length > 0 ? { MARKOS_FORCE_INTERACTIVE: '1' } : undefined),
        ...envOverrides,
      },
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      const txt = data.toString();
      output += txt;
      
      // Simple prompt detection to inject our predetermined answers automatically
      if (
        txt.includes('Choice') || 
        txt.includes('(y/n)') || 
        txt.includes('(Y/n)') ||
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
  const manifestPath = path.join(targetDir, '.markos-install-manifest.json');
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  return null;
}

module.exports = {
  createTestEnvironment,
  runCLI,
  readManifest,
  createJsonRequest,
  withMockedModule,
  ONBOARDING_EXTRACTION_FIXTURES,
};
