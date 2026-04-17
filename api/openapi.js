/**
 * api/openapi.js — Vercel Function
 *
 * Serves the merged MarkOS OpenAPI 3.1 document.
 *
 * Content negotiation:
 *   - Default (Accept: application/json, or no Accept header): returns JSON
 *   - Accept: application/yaml OR ?format=yaml: returns YAML
 *
 * Cache headers: public, max-age=300 (5 min)
 *
 * No auth required — this is a public API spec endpoint.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Resolve paths relative to repo root (the Vercel function root)
const REPO_ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(REPO_ROOT, 'contracts', 'openapi.json');
const YAML_PATH = path.join(REPO_ROOT, 'contracts', 'openapi.yaml');

const CACHE_MAX_AGE = 300; // 5 minutes

function setCacheHeaders(res) {
  res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`);
  res.setHeader('Vary', 'Accept');
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
}

function wantsYaml(req) {
  // ?format=yaml query parameter
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.searchParams.get('format') === 'yaml') return true;

  // Accept: application/yaml or text/yaml
  const accept = (req.headers && req.headers['accept']) || '';
  return (
    accept.includes('application/yaml') ||
    accept.includes('text/yaml') ||
    accept.includes('application/x-yaml')
  );
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Only GET allowed
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  setCacheHeaders(res);
  setCorsHeaders(res);

  const serveYaml = wantsYaml(req);

  try {
    if (serveYaml) {
      const yamlContent = fs.readFileSync(YAML_PATH, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/yaml; charset=utf-8',
      });
      res.end(yamlContent);
    } else {
      const jsonContent = fs.readFileSync(JSON_PATH, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
      });
      res.end(jsonContent);
    }
  } catch (err) {
    // If artifacts not yet built, fall back to error
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'OpenAPI document not available',
      hint: 'Run: npm run openapi:build to generate the artifacts',
      message: err.message
    }));
  }
};
