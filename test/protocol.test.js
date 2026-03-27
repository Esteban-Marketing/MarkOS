const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const PROTOCOL_DIR = path.resolve(__dirname, '../.agent/marketing-get-shit-done');

test('Suite 4: Protocol Integrity Checks', async (t) => {
  await t.test('4.0 Package Identity & Version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    const rootVersion = fs.readFileSync(path.resolve(__dirname, '../VERSION'), 'utf8').trim();

    assert.equal(pkg.name, 'markos', 'Package name must be markos');
    assert.equal(pkg.version, rootVersion, 'Package version must match VERSION file');
    assert.equal(pkg.bin.markos, './bin/install.cjs', 'Primary CLI should be markos');
    const expectedBinPath = path.resolve(__dirname, '../bin/install.cjs');
    assert.ok(fs.existsSync(expectedBinPath), 'markos bin script must exist at ./bin/install.cjs');
    assert.equal(pkg.bin.mgsd, './bin/install.cjs', 'Legacy mgsd alias should be retained');
    assert.equal(pkg.bin['marketing-get-shit-done'], undefined, 'Legacy package-name bin should be removed');
    assert.ok(rootVersion.length > 0, 'Root VERSION file must contain a non-empty version string');
  });
  await t.test('4.1 Required Components Exist', () => {
    // Validate structural requirements
    const requiredFiles = [
      'MGSD-INDEX.md',
      'agents/mgsd-onboarder.md',
      'agents/mgsd-researcher.md',
      'VERSION'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(PROTOCOL_DIR, file);
      assert.ok(fs.existsSync(fullPath), `Missing required protocol file: ${file}`);
    }
  });

  await t.test('4.2 Documentation Linking (Relative Markdown Paths)', () => {
    function walkDir(dir, list = []) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walkDir(full, list);
        } else if (full.endsWith('.md')) {
          list.push(full);
        }
      }
      return list;
    }

    const mdFiles = walkDir(PROTOCOL_DIR);
    
    // Matches Markdown links like [Title](./path/to/thing.md) ignoring http/mailto/page hashes
    const linkRegex = /\]\((?!http|mailto|#)([^)]+)\)/g;

    let brokenLinks = 0;
    const errors = [];

    for (const filePath of mdFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const dir = path.dirname(filePath);
      
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        let linkPath = match[1];
        
        // Strip trailing hash anchors if present
        if (linkPath.includes('#')) {
          linkPath = linkPath.split('#')[0];
        }
        
        // If it was purely an anchor link or empty, skip
        if (!linkPath || linkPath.trim() === '') continue;

        let targetPath;
        if (linkPath.startsWith('/.agent/') || linkPath.startsWith('.agent/')) {
           // Resolve strictly against repo root instead of current file directory
           const repoRoot = path.resolve(__dirname, '..');
           const rel = linkPath.startsWith('/') ? linkPath.slice(1) : linkPath;
           targetPath = path.join(repoRoot, rel);
        } else if (linkPath.startsWith('/')) {
           const repoRoot = path.resolve(__dirname, '..');
           targetPath = path.join(repoRoot, linkPath.slice(1));
        } else {
           targetPath = path.resolve(dir, linkPath);
        }

        if (!fs.existsSync(targetPath)) {
           errors.push(`Broken link in ${path.relative(PROTOCOL_DIR, filePath)}: ${match[1]}`);
           brokenLinks++;
        }
      }
    }
    
    if (brokenLinks > 0) {
      console.error(errors.join('\n'));
    }
    assert.equal(brokenLinks, 0, `Found ${brokenLinks} broken relative links in MGSD routing documents`);
  });
});
