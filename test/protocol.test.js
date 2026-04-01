const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const PROTOCOL_DIR = path.resolve(__dirname, '../.agent/markos');
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
    assert.equal(pkg.bin.markos, './bin/install.cjs', 'Primary markos CLI should be present');
    assert.deepEqual(Object.keys(pkg.bin), ['markos'], 'package.json bin must only expose the primary markos CLI');
    assert.ok(rootVersion.length > 0, 'Root VERSION file must contain a non-empty version string');
  });
  await t.test('4.1 Required Components Exist', () => {
    // Validate structural requirements
    const requiredFiles = [
      'MARKOS-INDEX.md',
      'agents/markos-onboarder.md',
      'agents/markos-researcher.md',
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

    assert.match(readme, /```bash\s*npx markos\s*```/m, 'README must use bare `npx markos` as the primary install path');
    assert.match(readme, /npx markos update/, 'README must document the update command');
    assert.match(readme, /Compatibility Surfaces/, 'README must document the remaining compatibility-only surfaces');

    assert.match(changelog, /Identity Normalization/, 'CHANGELOG must record the Phase 23 identity normalization work');

    assert.match(installScript, /MarkOS protocol files installed/, 'Installer output must stay MarkOS-first');
    assert.match(updateScript, /MarkOS Update Engine/, 'Updater output must stay MarkOS-first');

    assert.match(onboardingHtml, /MarkOS Onboarding/, 'Onboarding HTML title must use MarkOS');
    assert.match(onboardingHtml, /MarkOS Intelligence Onboarding/, 'Onboarding heading must use MarkOS');
    assert.match(onboardingJs, /markos-onboarding-draft/, 'Onboarding must use the MarkOS draft storage key');
    assert.match(onboardingJs, /markos-onboarding-draft/, 'Onboarding must use the new MarkOS draft storage key');

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

  await t.test('4.6 Execution prompts require local-state injection and winners anchors', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');

    const paidMedia = read('.agent/prompts/paid_media_creator.md');
    const emailLifecycle = read('.agent/prompts/email_lifecycle_strategist.md');
    const seo = read('.agent/prompts/seo_content_architect.md');
    const social = read('.agent/prompts/social_community_manager.md');
    const cro = read('.agent/prompts/cro_landing_page_builder.md');
    const conventions = read('.protocol-lore/CONVENTIONS.md');

    assert.doesNotMatch(paidMedia, /\.agent\/markos\/templates\/MIR/, 'Paid media prompt should not point to template MIR paths');
    assert.doesNotMatch(emailLifecycle, /\.agent\/markos\/templates\/MIR/, 'Email lifecycle prompt should not point to template MIR paths');
    assert.match(paidMedia, /\.markos-local\/MSP\/Paid_Media\/WINNERS\/_CATALOG\.md/, 'Paid media prompt must anchor to Paid_Media winners catalog');
    assert.match(emailLifecycle, /\.markos-local\/MSP\/Lifecycle_Email\/WINNERS\/_CATALOG\.md/, 'Email lifecycle prompt must anchor to Lifecycle_Email winners catalog');
    assert.match(seo, /\.markos-local\/MSP\/Content_SEO\/WINNERS\/_CATALOG\.md/, 'SEO prompt must anchor to Content_SEO winners catalog');
    assert.match(social, /\.markos-local\/MSP\/Social\/WINNERS\/_CATALOG\.md/, 'Social prompt must anchor to Social winners catalog');
    assert.match(cro, /\.markos-local\/MSP\/Landing_Pages\/WINNERS\/_CATALOG\.md/, 'CRO prompt must anchor to Landing_Pages winners catalog');

    for (const prompt of [paidMedia, emailLifecycle, seo, social, cro]) {
      assert.match(prompt, /BOOT REQUIREMENTS/i, 'Execution prompts must define boot requirements');
      assert.match(prompt, /execution is blocked/i, 'Execution prompts must specify blocked behavior for missing winners anchors');
    }

    assert.match(conventions, /anchor_validation_contract/, 'Conventions must define winner anchor validation behavior');
  });

  await t.test('4.7 Compatibility retirement ledger exists with required schema', () => {
    const ledgerPath = path.join(REPO_ROOT, '.planning/phases/31-rollout-hardening/31-COMPATIBILITY-DECISIONS.json');
    assert.ok(fs.existsSync(ledgerPath), 'Compatibility decision ledger must exist');

    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    assert.equal(typeof ledger.version, 'string');
    assert.ok(Array.isArray(ledger.decisions), 'Ledger decisions must be an array');
    assert.ok(ledger.decisions.length > 0, 'Ledger must include a seeded draft decision');

    const sample = ledger.decisions[0];
    const required = ['surface_id', 'decision', 'owner', 'decided_at', 'rationale', 'rollback_path', 'status', 'evidence_refs'];
    for (const key of required) {
      assert.ok(Object.prototype.hasOwnProperty.call(sample, key), `Ledger decision missing key: ${key}`);
    }
    assert.ok(Array.isArray(sample.evidence_refs), 'evidence_refs must be an array (can be empty)');
  });

  await t.test('4.8 Compatibility policy stays manual-discretion across docs', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');

    const readme = read('README.md');
    const techMap = read('TECH-MAP.md');
    const project = read('.planning/PROJECT.md');
    const roadmap = read('.planning/ROADMAP.md');
    const phaseUat = read('.planning/phases/31-rollout-hardening/31-UAT.md');

    for (const content of [readme, techMap, project, roadmap, phaseUat]) {
      assert.match(content, /operator decision|operator-driven|manual operator discretion|manual-discretion/i, 'Compatibility policy must explicitly remain operator controlled');
    }

    assert.doesNotMatch(techMap, /all of the following are true/i, 'TECH-MAP must not require all-gates-must-pass retirement wording');
    assert.doesNotMatch(phaseUat, /all of the following are true/i, '31-UAT must not drift back to hard-gate retirement wording');
  });

  await t.test('4.9 Canonical codebase map exists and summary docs delegate to it', () => {
    const requiredDocs = [
      '.planning/codebase/README.md',
      '.planning/codebase/ROUTES.md',
      '.planning/codebase/ENTRYPOINTS.md',
      '.planning/codebase/FOLDERS.md',
      '.planning/codebase/FILES.md',
      '.planning/codebase/COVERAGE-MATRIX.md'
    ];

    for (const relPath of requiredDocs) {
      assert.ok(fs.existsSync(path.join(REPO_ROOT, relPath)), `Missing canonical codebase doc: ${relPath}`);
    }

    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    const readme = read('README.md');
    const techMap = read('TECH-MAP.md');
    const protocolMap = read('.protocol-lore/CODEBASE-MAP.md');

    assert.match(readme, /\.planning\/codebase\//, 'README must reference canonical .planning/codebase docs');
    assert.match(techMap, /\.planning\/codebase\//, 'TECH-MAP must reference canonical .planning/codebase docs');
    assert.match(protocolMap, /\.planning\/codebase\//, 'CODEBASE-MAP must reference canonical .planning/codebase docs');
  });

  await t.test('4.10 Route and wrapper documentation parity checks', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    const routesDoc = read('.planning/codebase/ROUTES.md');
    const concernsDoc = read('.planning/codebase/CONCERNS.md');

    // Core local routes that must always be represented.
    for (const route of ['/config', '/status', '/submit', '/approve', '/linear/sync']) {
      assert.match(routesDoc, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `ROUTES.md must include ${route}`);
    }

    // Hosted wrappers that must stay represented in the wrapper table.
    for (const wrapperFile of [
      'api/config.js',
      'api/status.js',
      'api/submit.js',
      'api/approve.js',
      'api/regenerate.js',
      'api/migrate.js',
      'api/campaign/result.js',
      'api/linear/sync.js'
    ]) {
      assert.match(routesDoc, new RegExp(wrapperFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `ROUTES.md must include wrapper ${wrapperFile}`);
    }

    // Auth variance must remain explicitly documented.
    assert.match(concernsDoc, /auth variance/i, 'CONCERNS.md must explicitly mention auth variance');
  });

  await t.test('4.11 Entrypoint documentation covers command surfaces', () => {
    const read = (relPath) => fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    const entrypointsDoc = read('.planning/codebase/ENTRYPOINTS.md');

    const requiredEntrypoints = [
      'bin/install.cjs',
      'bin/update.cjs',
      'bin/ensure-vector.cjs',
      'bin/ingest-literacy.cjs',
      'bin/literacy-admin.cjs',
      '.agent/get-shit-done/bin/gsd-tools.cjs',
      '.agent/markos/bin/markos-tools.cjs'
    ];

    for (const relPath of requiredEntrypoints) {
      assert.ok(fs.existsSync(path.join(REPO_ROOT, relPath)), `Entrypoint file missing from repository: ${relPath}`);
      assert.match(entrypointsDoc, new RegExp(relPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `ENTRYPOINTS.md must include ${relPath}`);
    }
  });
});
