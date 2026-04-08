const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function createStaticServer(rootDir, port) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    const normalizedPath = path.normalize(path.join(rootDir, pathname));

    if (!normalizedPath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(normalizedPath, (error, contents) => {
      if (error) {
        response.writeHead(error.code === "ENOENT" ? 404 : 500);
        response.end(error.code === "ENOENT" ? "Not Found" : "Internal Server Error");
        return;
      }

      response.writeHead(200, { "Content-Type": getMimeType(normalizedPath) });
      response.end(contents);
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function readStoryIds(rootDir) {
  const indexPath = path.join(rootDir, "index.json");
  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  return Object.values(parsed.entries)
    .filter((entry) => entry.type === "story")
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      name: entry.name,
    }));
}

function normalizeConsoleMessage(message) {
  return message
    .replace(/\s+/g, " ")
    .replace(/^Error:\s*/, "")
    .trim();
}

async function crawlStories() {
  const { chromium } = require("playwright");
  const repoRoot = path.resolve(__dirname, "..");
  const staticRoot = path.join(repoRoot, "storybook-static");
  const port = Number(process.env.STORYBOOK_CRAWL_PORT ?? 6006);
  const server = await createStaticServer(staticRoot, port);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const stories = readStoryIds(staticRoot);
  const failures = [];

  try {
    for (const story of stories) {
      const page = await context.newPage();
      const storyErrors = [];
      const seenMessages = new Set();

      const recordError = (kind, message) => {
        const normalized = normalizeConsoleMessage(message);
        if (!normalized) {
          return;
        }

        const key = `${kind}:${normalized}`;
        if (seenMessages.has(key)) {
          return;
        }

        seenMessages.add(key);
        storyErrors.push({ kind, message: normalized });
      };

      page.on("pageerror", (error) => {
        recordError("pageerror", error.message);
      });

      page.on("console", async (message) => {
        if (message.type() !== "error") {
          return;
        }

        recordError("console", message.text());
      });

      const url = `http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1200);
      } catch (error) {
        recordError("navigation", error.message);
      }

      if (storyErrors.length > 0) {
        failures.push({ story, errors: storyErrors });
      }

      await page.close();
    }
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  const report = {
    storyCount: stories.length,
    failureCount: failures.length,
    failures,
  };

  const outputPath = path.join(repoRoot, "tmp", "storybook-runtime-report.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`Scanned ${stories.length} stories`);
  console.log(`Runtime failures: ${failures.length}`);
  console.log(`Report: ${outputPath}`);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.log(`- ${failure.story.id}`);
      for (const error of failure.errors) {
        console.log(`  [${error.kind}] ${error.message}`);
      }
    }
    process.exitCode = 1;
  }
}

crawlStories().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});