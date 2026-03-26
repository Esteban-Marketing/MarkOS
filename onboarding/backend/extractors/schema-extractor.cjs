'use strict';

const path = require('path');
const fs = require('fs');
const llm = require('../agents/llm-adapter.cjs');
const { getExtractionPrompt } = require('../prompts/extraction-prompt.js');

const SCHEMA_PATH = path.resolve(__dirname, '../../onboarding-seed.schema.json');

async function extractToSchema(rawText, attempt = 1) {
  try {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    const userPrompt = getExtractionPrompt(schemaContent, rawText);
    const systemPrompt = "You are a data mapper. Return ONLY valid JSON.";

    const res = await llm.call(systemPrompt, userPrompt, {
        max_tokens: 3000,
        temperature: 0.1 
    });

    if (!res.ok) {
        throw new Error(`LLM call failed: ${res.error}`);
    }

    let jsonStr = res.text.trim();
    // Clean markdown formatting if present
    if (jsonStr.startsWith('\`\`\`json')) {
        jsonStr = jsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (jsonStr.startsWith('\`\`\`')) {
        jsonStr = jsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    return JSON.parse(jsonStr);

  } catch (err) {
      if (attempt === 1) {
          console.warn(`Extraction JSON.parse failed. Retrying... (${err.message})`);
          return await extractToSchema(rawText, 2);
      }
      throw new Error(`Failed to parse LLM output into schema: ${err.message}`);
  }
}

module.exports = { extractToSchema };
