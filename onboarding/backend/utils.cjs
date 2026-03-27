'use strict';

/**
 * Shared Utilities for MGSD Onboarding Backend
 */

function readBody(req) {
  return new Promise((resolve, reject) => {
    // Vercel/Express-like pre-parsing check
    if (req.body) return resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function json(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data, null, 2));
}

module.exports = {
  readBody,
  json
};
