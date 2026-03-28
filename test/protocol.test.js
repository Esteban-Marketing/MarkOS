const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const PROTOCOL_DIR = path.resolve(__dirname, '../.agent/marketing-get-shit-done');
const REPO_ROOT = path.resolve(__dirname, '..');

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
    assert.equal(brokenLinks, 0, `Found ${brokenLinks} broken relative links in protocol routing documents`);
  });

  await t.test('4.3 Phase 23 Identity Artifacts Exist', () => {
    const requiredArtifacts = [
      '.planning/phases/23-identity-normalization/23-IDENTITY-AUDIT.md',
      '.planning/phases/23-identity-normalization/23-COMPATIBILITY-CONTRACT.md'
    ];

    for (const relPath of requiredArtifacts) {
      assert.ok(fs.existsSync(path.join(REPO_ROOT, relPath)), `Missing Phase 23 artifact: ${relPath}`);
    }
  });

  await t.test('4.4 Public Identity Stays MarkOS-First', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');

    const readme = read('README.md');
    const changelog = read('CHANGELOG.md');
    const installScript = read('bin/install.cjs');
    const updateScript = read('bin/update.cjs');
    const onboardingHtml = read('onboarding/index.html');
    const onboardingJs = read('onboarding/onboarding.js');
    const runtimeContext = read('onboarding/backend/runtime-context.cjs');
    const telemetry = read('onboarding/backend/agents/telemetry.cjs');

    assert.match(readme, /npx markos install/, 'README must use the MarkOS install command');
    assert.doesNotMatch(readme, /npx marketing-get-shit-done\b/, 'README must not use the legacy package command as the primary install path');
    assert.match(readme, /Compatibility Surfaces/, 'README must document the remaining compatibility-only surfaces');

    assert.match(changelog, /Identity Normalization/, 'CHANGELOG must record the Phase 23 identity normalization work');

    assert.match(installScript, /MarkOS protocol files installed/, 'Installer output must stay MarkOS-first');
    assert.match(updateScript, /MarkOS Update Engine/, 'Updater output must stay MarkOS-first');

    assert.match(onboardingHtml, /MarkOS Onboarding/, 'Onboarding HTML title must use MarkOS');
    assert.match(onboardingHtml, /MarkOS Intelligence Onboarding/, 'Onboarding heading must use MarkOS');
    assert.match(onboardingJs, /markos-onboarding-draft/, 'Onboarding must use the MarkOS draft storage key');
    assert.match(onboardingJs, /mgsd-onboarding-draft/, 'Onboarding must retain the legacy draft storage fallback');

    assert.match(runtimeContext, /MARKOS_TELEMETRY/, 'Runtime config must support the canonical MARKOS_TELEMETRY env var');
    assert.match(telemetry, /markos-backend-telemetry/, 'Telemetry library id must be MarkOS-first');
  });

  await t.test('4.5 Residual onboarding fallback behavior is documented', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');

    const readme = read('README.md');
    const project = read('.planning/PROJECT.md');
    const roadmap = read('.planning/ROADMAP.md');

    assert.match(readme, /Residual Onboarding Warning Behavior/, 'README should document residual onboarding warning behavior');
    assert.match(project, /Residual Onboarding Warning Behavior/, 'PROJECT should document residual onboarding warning behavior');
    assert.match(roadmap, /Residual Onboarding Warning Behavior/, 'ROADMAP should document residual onboarding warning behavior');
  });
});
