#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const PROVIDERS = Object.freeze(['anthropic', 'openai', 'gemini']);

function normalizeProvider(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'claude') return 'anthropic';
  if (normalized === 'google') return 'gemini';
  return PROVIDERS.includes(normalized) ? normalized : null;
}

function parseConfigArgs(cli = {}) {
  const provider = normalizeProvider(cli.provider);
  return {
    provider,
    test: Boolean(cli.test),
  };
}

function readProjectSlug(cwd) {
  try {
    const configPath = path.join(cwd, '.markos-project.json');
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return typeof parsed.project_slug === 'string' && parsed.project_slug.trim()
      ? parsed.project_slug.trim()
      : 'default-workspace';
  } catch {
    return 'default-workspace';
  }
}

function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return {
    ask(question) {
      return new Promise((resolve) => rl.question(question, resolve));
    },
    close() {
      rl.close();
    },
  };
}

function createSupabaseClient(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseProviderSelection(raw) {
  const selected = String(raw || '')
    .split(',')
    .map((entry) => normalizeProvider(entry))
    .filter(Boolean);

  return [...new Set(selected)];
}

function parseBudget(raw) {
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error('Budget must be a non-negative number.');
  }
  return Number(numeric.toFixed(2));
}

function parseYesNo(raw, defaultValue = true) {
  const normalized = String(raw || '').trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['y', 'yes', 'true', '1'].includes(normalized)) return true;
  if (['n', 'no', 'false', '0'].includes(normalized)) return false;
  return defaultValue;
}

function deriveKey(secret) {
  return crypto.createHash('sha256').update(secret).digest();
}

async function encryptOperatorKey(plaintextKey, operatorId, env = process.env) {
  const secret = env.MARKOS_VAULT_SECRET;
  if (!secret) {
    throw new Error('Missing MARKOS_VAULT_SECRET.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret), iv, { authTagLength: 16 });
  cipher.setAAD(Buffer.from(`markos-operator:${operatorId}`, 'utf8'));

  const encrypted = Buffer.concat([cipher.update(plaintextKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const keyHash = crypto.createHash('sha256').update(plaintextKey).digest('hex');
  const payload = [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');

  return {
    encryptedKey: `v1:${payload}`,
    keyHash,
  };
}

async function storeLLMConfiguration({
  supabase,
  workspaceId,
  operatorId,
  updatedBy,
  providers,
  keys,
  budget,
  primaryProvider,
  allowFallback,
  env,
}) {
  const keyRows = [];
  for (const provider of providers) {
    const encrypted = await encryptOperatorKey(keys[provider], operatorId, env);
    keyRows.push({
      workspace_id: workspaceId,
      operator_id: operatorId,
      provider,
      encrypted_key: encrypted.encryptedKey,
      key_hash: encrypted.keyHash,
      updated_by: updatedBy,
    });
  }

  const { error: keysError } = await supabase
    .from('markos_operator_api_keys')
    .upsert(keyRows, { onConflict: 'workspace_id,operator_id,provider' });

  if (keysError) {
    throw new Error(`Failed to store API keys: ${keysError.message}`);
  }

  const preferenceRow = {
    workspace_id: workspaceId,
    operator_id: operatorId,
    available_providers: providers,
    primary_provider: primaryProvider,
    cost_budget_monthly_usd: budget,
    allow_fallback: allowFallback,
    fallback_template: 'cost_optimized',
    updated_by: updatedBy,
  };

  const { error: prefError } = await supabase
    .from('markos_operator_llm_preferences')
    .upsert(preferenceRow, { onConflict: 'workspace_id,operator_id' });

  if (prefError) {
    throw new Error(`Failed to store preferences: ${prefError.message}`);
  }
}

async function defaultProviderSmokeTest(provider, apiKey) {
  const prompt = 'Hello, please respond with test_success';

  if (provider === 'anthropic') {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 16,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = Array.isArray(response.content)
      ? response.content.map((chunk) => (chunk && chunk.type === 'text' ? chunk.text : '')).join('')
      : '';
    return {
      provider,
      ok: true,
      text,
      usage: {
        inputTokens: Number(response.usage?.input_tokens || 0),
        outputTokens: Number(response.usage?.output_tokens || 0),
      },
    };
  }

  if (provider === 'openai') {
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      max_output_tokens: 32,
    });
    const text = Array.isArray(response.output_text) ? response.output_text.join('') : String(response.output_text || '');
    return {
      provider,
      ok: true,
      text,
      usage: {
        inputTokens: Number(response.usage?.input_tokens || 0),
        outputTokens: Number(response.usage?.output_tokens || 0),
      },
    };
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  const usageMetadata = result.response?.usageMetadata || {};
  return {
    provider,
    ok: true,
    text: result.response?.text?.() || '',
    usage: {
      inputTokens: Number(usageMetadata.promptTokenCount || 0),
      outputTokens: Number(usageMetadata.candidatesTokenCount || 0),
    },
  };
}

function estimateCost(provider, usage) {
  const rates = {
    anthropic: { input: 0.8, output: 4 },
    openai: { input: 0.15, output: 0.6 },
    gemini: { input: 0.075, output: 0.3 },
  };
  const selected = rates[provider] || rates.anthropic;
  const input = Number(usage.inputTokens || 0);
  const output = Number(usage.outputTokens || 0);
  const cost = (input * selected.input) / 1_000_000 + (output * selected.output) / 1_000_000;
  return Number(cost.toFixed(6));
}

async function runLLMConfigCLI(options = {}) {
  const cli = options.cli || {};
  const output = options.output || console.log;
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();
  const prompt = options.prompt || createPrompt();
  const smokeTest = options.providerSmokeTest || defaultProviderSmokeTest;
  const args = parseConfigArgs(cli);
  const interactive = options.interactive !== false;

  const workspaceId = env.MARKOS_WORKSPACE_ID || readProjectSlug(cwd);
  const operatorId = env.MARKOS_OPERATOR_ID || 'operator-local';
  const updatedBy = env.MARKOS_UPDATED_BY || 'markos-cli';

  try {
    const providers = [];
    if (args.provider) {
      providers.push(args.provider);
    } else if (!interactive) {
      throw new Error('Provide --provider in non-interactive mode.');
    } else {
      output('\nLLM Config Wizard');
      output('Available providers: anthropic, openai, gemini');
      const selection = await prompt.ask('Which providers do you have keys for? (comma-separated): ');
      providers.push(...parseProviderSelection(selection));
    }

    if (providers.length === 0) {
      throw new Error('Select at least one provider.');
    }

    const uniqueProviders = [...new Set(providers)];
    const keys = {};

    for (const provider of uniqueProviders) {
      const answer = interactive
        ? await prompt.ask(`API key for ${provider}: `)
        : env[`MARKOS_${provider.toUpperCase()}_API_KEY`] || '';
      const key = String(answer || '').trim();
      if (!key) {
        throw new Error(`API key is required for ${provider}.`);
      }
      keys[provider] = key;
    }

    const budgetAnswer = interactive
      ? await prompt.ask('Monthly budget in USD [100]: ')
      : env.MARKOS_LLM_MONTHLY_BUDGET || '100';
    const budget = parseBudget(String(budgetAnswer || '100') || '100');

    const primaryAnswer = interactive
      ? await prompt.ask(`Primary provider [${uniqueProviders[0]}]: `)
      : env.MARKOS_LLM_PRIMARY_PROVIDER || uniqueProviders[0];
    const primaryProvider = normalizeProvider(primaryAnswer) || uniqueProviders[0];

    if (!uniqueProviders.includes(primaryProvider)) {
      throw new Error('Primary provider must be one of the configured providers.');
    }

    const fallbackAnswer = interactive
      ? await prompt.ask('Allow automatic fallback if primary fails? (Y/n): ')
      : env.MARKOS_LLM_ALLOW_FALLBACK || 'yes';
    const allowFallback = parseYesNo(fallbackAnswer, true);

    const supabase = options.supabase || createSupabaseClient(env);

    await storeLLMConfiguration({
      supabase,
      workspaceId,
      operatorId,
      updatedBy,
      providers: uniqueProviders,
      keys,
      budget,
      primaryProvider,
      allowFallback,
      env,
    });

    output('✓ LLM configuration saved successfully');

    const shouldRunTest = args.test || (interactive ? parseYesNo(await prompt.ask('Would you like to test the primary provider? (y/n): '), false) : false);
    if (shouldRunTest) {
      const result = await smokeTest(primaryProvider, keys[primaryProvider]);
      const cost = estimateCost(primaryProvider, result.usage || {});
      output(`✓ Test call successful; ${primaryProvider} is working`);
      output(`  Response: ${String(result.text || '').trim() || '[empty]'}`);
      output(`  Tokens: in=${result.usage?.inputTokens || 0}, out=${result.usage?.outputTokens || 0}`);
      output(`  Estimated cost: $${cost.toFixed(6)}`);
    }

    return {
      ok: true,
      workspaceId,
      operatorId,
      providers: uniqueProviders,
      primaryProvider,
      budget,
      allowFallback,
    };
  } finally {
    if (prompt && typeof prompt.close === 'function' && !options.prompt) {
      prompt.close();
    }
  }
}

if (require.main === module) {
  runLLMConfigCLI()
    .then((result) => {
      if (!result.ok) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(`✗ ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  PROVIDERS,
  parseConfigArgs,
  parseProviderSelection,
  parseBudget,
  parseYesNo,
  encryptOperatorKey,
  defaultProviderSmokeTest,
  estimateCost,
  storeLLMConfiguration,
  runLLMConfigCLI,
};
