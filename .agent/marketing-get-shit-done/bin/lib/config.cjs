/**
 * Config — Planning config CRUD operations for MGSD
 */

const fs = require('fs');
const path = require('path');
const { output, error } = require('./core.cjs');

const VALID_CONFIG_KEYS = new Set([
  'mode', 'granularity', 'parallelization', 'commit_docs', 'model_profile',
  'mir_gate_enforcement', 'campaign_approval_flow', 'linear_sync',
  'workflow.research', 'workflow.plan_check', 'workflow.verifier',
  'workflow.auto_advance', 'workflow.text_mode',
  'workflow._auto_chain_active',
  'discipline_activation',
]);

function cmdConfigNewProject(cwd, choicesJson, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const planningDirPath = path.join(cwd, '.planning');

  if (fs.existsSync(configPath)) {
    output({ created: false, reason: 'already_exists' }, raw, 'exists');
    return;
  }

  let userChoices = {};
  if (choicesJson && choicesJson.trim() !== '') {
    try {
      userChoices = JSON.parse(choicesJson);
    } catch (err) {
      error('Invalid JSON for config-new-project: ' + err.message);
    }
  }

  try {
    if (!fs.existsSync(planningDirPath)) {
      fs.mkdirSync(planningDirPath, { recursive: true });
    }
  } catch (err) {
    error('Failed to create .planning directory: ' + err.message);
  }

  const config = {
    model_profile: 'balanced',
    commit_docs: true,
    parallelization: true,
    mir_gate_enforcement: true,
    campaign_approval_flow: true,
    linear_sync: true,
    workflow: {
      research: true,
      plan_check: true,
      verifier: true,
      auto_advance: false,
      text_mode: false,
    },
    discipline_activation: {},
    ...userChoices,
  };

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    output({ created: true, path: '.planning/config.json' }, raw, 'created');
  } catch (err) {
    error('Failed to write config.json: ' + err.message);
  }
}

function cmdConfigSet(cwd, keyPath, value, raw) {
  if (!keyPath) error('Usage: config-set <key.path> <value>');

  const configPath = path.join(cwd, '.planning', 'config.json');
  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    error('Failed to read config.json: ' + err.message);
  }

  let parsedValue = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (!isNaN(value) && value !== '') parsedValue = Number(value);

  const keys = keyPath.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] === undefined || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = parsedValue;

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    output({ updated: true, key: keyPath, value: parsedValue }, raw, `${keyPath}=${parsedValue}`);
  } catch (err) {
    error('Failed to write config.json: ' + err.message);
  }
}

function cmdConfigGet(cwd, keyPath, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!keyPath) error('Usage: config-get <key.path>');

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      error('No config.json found at ' + configPath);
    }
  } catch (err) {
    if (err.message.startsWith('No config.json')) throw err;
    error('Failed to read config.json: ' + err.message);
  }

  const keys = keyPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      error(`Key not found: ${keyPath}`);
    }
    current = current[key];
  }

  if (current === undefined) error(`Key not found: ${keyPath}`);
  output(current, raw, String(current));
}

module.exports = { cmdConfigNewProject, cmdConfigSet, cmdConfigGet };
