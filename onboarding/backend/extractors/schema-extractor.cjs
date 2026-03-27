'use strict';

const path = require('path');
const fs = require('fs');
const llm = require('../agents/llm-adapter.cjs');
const { getExtractionPrompt } = require('../prompts/extraction-prompt.js');
const { getPartialExtractionPrompt } = require('../prompts/partial-extraction-prompt.js');

const SCHEMA_PATH = path.resolve(__dirname, '../../onboarding-seed.schema.json');

async function extractToSchema(webText, fileText, chatText, attempt = 1) {
  try {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    const userPrompt = getExtractionPrompt(schemaContent, webText, fileText, chatText);
    const systemPrompt = "You are a data mapper. Return ONLY valid JSON.";

    const res = await llm.call(systemPrompt, userPrompt, {
        max_tokens: 3000,
        temperature: 0.1 
    });


    if (res.isFallback) {
        return {};
    }

    let jsonStr = res.text.trim();
    // Clean markdown formatting if present
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(jsonStr);

  } catch (err) {
      if (attempt === 1) {
          console.warn(`Extraction JSON.parse failed. Retrying... (${err.message})`);
          return await extractToSchema(webText, fileText, chatText, 2);
      }
      throw new Error(`Failed to parse LLM output into schema: ${err.message}`);
  }
}

async function extractPartialToSchema(existingData, userAnswer, attempt = 1) {
  try {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    const userPrompt = getPartialExtractionPrompt(schemaContent, existingData, userAnswer);
    const systemPrompt = "You are a data mapper processing conversational inputs. Return ONLY valid JSON matching the schema structure exactly.";

    const res = await llm.call(systemPrompt, userPrompt, {
        max_tokens: 3000,
        temperature: 0.1 
    });

    if (res.isFallback) {
        return existingData;
    }

    let jsonStr = res.text.trim();
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(jsonStr);

  } catch (err) {
      if (attempt === 1) {
          console.warn(`Extraction JSON.parse failed. Retrying partial... (${err.message})`);
          return await extractPartialToSchema(existingData, userAnswer, 2);
      }
      return existingData; // On final error, just return identity to keep moving
  }
}

module.exports = { extractToSchema, extractPartialToSchema };
