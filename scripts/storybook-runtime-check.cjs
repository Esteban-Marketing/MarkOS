const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'storybook-static', 'index.json');
const BASE_URL = process.env.STORYBOOK_BASE_URL || 'http://127.0.0.1:6006';

async function loadStories() {
  const raw = await fs.readFile(INDEX_PATH, 'utf8');
  const index = JSON.parse(raw);

  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      name: entry.name,
      url: `${BASE_URL}/iframe.html?id=${entry.id}&viewMode=story`,
    }));
}

function formatError(prefix, value) {
  if (!value) {
    return prefix;
  }

  if (typeof value === 'string') {
    return `${prefix}: ${value}`;
  }

  if (value.message) {
    return `${prefix}: ${value.message}`;
  }

  return `${prefix}: ${String(value)}`;
}

async function main() {
  const stories = await loadStories();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];

  for (const story of stories) {
    const errors = [];
    const pushConsoleError = (message) => {
      const text = message.text();
      if (text && !text.includes('favicon')) {
        errors.push(formatError('console', text));
      }
    };
    const pushPageError = (error) => {
      errors.push(formatError('pageerror', error));
    };

    page.on('console', pushConsoleError);
    page.on('pageerror', pushPageError);

    try {
      const response = await page.goto(story.url, { waitUntil: 'networkidle', timeout: 30000 });
      if (!response || !response.ok()) {
        errors.push(formatError('http', response ? `${response.status()} ${response.statusText()}` : 'no response'));
      }

      await page.waitForTimeout(750);

      const rootText = await page.locator('#storybook-root').textContent().catch(() => '');
      const bodyText = await page.locator('body').textContent().catch(() => '');
      const combinedText = `${rootText || ''}\n${bodyText || ''}`;

      const runtimeMarkers = [
        'Cannot read properties',
        'Cannot set properties',
        'Error rendering story',
        'Unexpected error while rendering',
        'No Preview',
        'ReferenceError:',
        'TypeError:',
      ];

      for (const marker of runtimeMarkers) {
        if (combinedText.includes(marker)) {
          errors.push(formatError('render', marker));
        }
      }
    } catch (error) {
      errors.push(formatError('goto', error));
    } finally {
      page.off('console', pushConsoleError);
      page.off('pageerror', pushPageError);
    }

    if (errors.length > 0) {
      failures.push({
        id: story.id,
        title: story.title,
        name: story.name,
        errors: Array.from(new Set(errors)),
      });
    }
  }

  await browser.close();

  const report = {
    checked: stories.length,
    failed: failures.length,
    failures,
  };

  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});