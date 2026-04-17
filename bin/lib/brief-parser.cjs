'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_FIELDS = ['channel', 'audience', 'pain', 'promise', 'brand'];

function parseYamlBrief(text) {
  const lines = text.split(/\r?\n/);
  const obj = {};
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    obj[key] = value;
  }
  return obj;
}

function parseBriefText(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('brief is empty');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      throw new Error(`invalid JSON brief: ${error.message}`);
    }
  }
  return parseYamlBrief(text);
}

function parseBrief(source) {
  if (typeof source === 'object' && source !== null) return { ...source };
  if (typeof source !== 'string') throw new Error('parseBrief: source must be a file path or string');

  if (source.length < 200 && fs.existsSync(source)) {
    const abs = path.resolve(source);
    const text = fs.readFileSync(abs, 'utf8');
    return parseBriefText(text);
  }
  return parseBriefText(source);
}

function validateBrief(brief) {
  const errors = [];
  if (!brief || typeof brief !== 'object') {
    return { ok: false, errors: ['brief must be an object'] };
  }
  for (const field of REQUIRED_FIELDS) {
    const value = brief[field];
    if (value === undefined || value === null || String(value).trim() === '') {
      errors.push(`missing required field: ${field}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function normalizeBrief(brief) {
  const normalized = {};
  for (const field of REQUIRED_FIELDS) {
    normalized[field] = brief[field] ? String(brief[field]).trim() : '';
  }
  for (const [k, v] of Object.entries(brief)) {
    if (!(k in normalized)) normalized[k] = v;
  }
  return normalized;
}

module.exports = {
  REQUIRED_FIELDS,
  parseBrief,
  parseBriefText,
  validateBrief,
  normalizeBrief,
};
