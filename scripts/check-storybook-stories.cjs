#!/usr/bin/env node
/**
 * Headless Playwright story-rendering check.
 * Iterates every story in `storybook-static/index.json` and loads
 * `iframe.html?viewMode=story&id={storyId}` in Chromium. Records any console
 * errors or page errors. Used to triangulate which 2 stories Chromatic flagged
 * as BROKEN without dashboard access.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const STATIC_DIR = path.resolve(__dirname, '..', 'storybook-static');
const INDEX = path.join(STATIC_DIR, 'index.json');

async function main() {
  const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  const stories = Object.values(idx.entries || {}).filter((e) => e.type === 'story');
  console.log(`Checking ${stories.length} stories...`);

  // Spin up an http server pointing at storybook-static
  const http = require('node:http');
  const url = require('node:url');
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
  };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(url.parse(req.url).pathname);
    const fp = path.join(STATIC_DIR, u === '/' ? 'index.html' : u);
    if (!fp.startsWith(STATIC_DIR)) {
      res.statusCode = 403;
      res.end('forbidden');
      return;
    }
    if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    const ext = path.extname(fp);
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  console.log(`Storybook served on http://127.0.0.1:${port}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const broken = [];

  for (let i = 0; i < stories.length; i++) {
    const s = stories[i];
    const page = await context.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errs.push('console.error: ' + msg.text().slice(0, 200));
    });
    try {
      await page.goto(`http://127.0.0.1:${port}/iframe.html?viewMode=story&id=${s.id}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      await page.waitForTimeout(500);
      // Storybook 8 uses <#storybook-error-message> + .sb-errordisplay for runtime errors
      const errMsg = await page.evaluate(() => {
        const sbErr = document.querySelector('#error-message, #error-stack, .sb-errordisplay, #storybook-error-message');
        if (sbErr) return sbErr.textContent.trim().slice(0, 300);
        return null;
      });
      if (errMsg) errs.push('SB error: ' + errMsg);
    } catch (e) {
      errs.push('navigation error: ' + e.message);
    }
    if (errs.length > 0) {
      broken.push({ id: s.id, name: s.name, importPath: s.importPath, errors: errs });
      console.log(`[BROKEN] ${s.id}: ${errs[0].slice(0, 150)}`);
    }
    await page.close();
    if ((i + 1) % 20 === 0) console.log(`  ... ${i + 1}/${stories.length}`);
  }

  await browser.close();
  server.close();

  console.log(`\n=== ${broken.length} broken stories ===`);
  for (const b of broken) {
    console.log(`\n${b.id} (${b.name}) — ${b.importPath}`);
    b.errors.forEach((e) => console.log(`  - ${e}`));
  }
  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
