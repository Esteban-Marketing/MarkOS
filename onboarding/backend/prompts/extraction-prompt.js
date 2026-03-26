'use strict';

function getExtractionPrompt(schema, text) {
  return `You are a strict data extraction AI.
Your task is to take the provided raw company information, and map it perfectly into the JSON schema provided.

Output ONLY valid JSON matching this schema:
${schema}

RULES:
1. Do NOT add keys that are not in the schema.
2. If a field's information is completely unknown or not present in the text, output null or an empty string/array according to its type.
3. Do not formulate full paragraphs if short phrases suffice, but capture all meaningful details.
4. Never explain yourself, never wrap output in markdown code blocks if you can avoid it, but if you do, ONLY output the JSON block itself. Output MUST be parseable by JSON.parse.

RAW TEXT TO MAP:
${text}`;
}

module.exports = { getExtractionPrompt };
