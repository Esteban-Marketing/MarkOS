#!/usr/bin/env node
// mgsd-onboarding-server: v1.0.0
// Serves the MGSD web onboarding app locally during mgsd-new-project init

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ONBOARDING_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ONBOARDING_DIR, 'onboarding-config.json');

// Load config
let config = { port: 4242, auto_open_browser: true, output_path: '../onboarding-seed.json' };
try {
  config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
} catch (e) {}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  // Handle seed submission (POST /submit)
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const seed = JSON.parse(body);
        const outputPath = path.resolve(ONBOARDING_DIR, config.output_path);
        fs.writeFileSync(outputPath, JSON.stringify(seed, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: outputPath }));
        console.log(`\n✓ onboarding-seed.json written to: ${outputPath}`);
        console.log('  Server will shut down in 3 seconds...');
        setTimeout(() => { server.close(); process.exit(0); }, 3000);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Handle GET /config to serve current config to the browser
  if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(ONBOARDING_DIR, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Try preferred port, fall back if occupied
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const fallbackPort = config.port + 1;
    console.log(`Port ${config.port} in use, trying ${fallbackPort}...`);
    server.listen(fallbackPort);
  }
});

server.listen(config.port, '127.0.0.1', () => {
  const addr = server.address();
  const url = `http://127.0.0.1:${addr.port}`;
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(` MGSD Onboarding → ${url}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(' Complete the form and click Submit.');
  console.log(' Server stops automatically on submit.\n');

  if (config.auto_open_browser) {
    const openCmd = process.platform === 'win32' ? `start ${url}` :
                    process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(openCmd, (err) => { if (err) console.log(`Open manually: ${url}`); });
  }
});
