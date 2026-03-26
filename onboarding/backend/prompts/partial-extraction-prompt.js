'use strict';

function getPartialExtractionPrompt(schema, existingData, userAnswer) {
  return `You are a strict data extraction AI processing an answer from a conversational onboarding form.
Your task is to take the user's new answer and merge it into the existing data JSON.

Output ONLY valid JSON matching this schema:
${schema}

EXISTING DATA:
${JSON.stringify(existingData, null, 2)}

USER ANSWER:
${userAnswer}

RULES:
1. Update or fill in fields in the EXISTING DATA that are answered by the USER ANSWER.
2. If a field in EXISTING DATA already has a good value and the USER ANSWER doesn't change it, keep the existing value.
3. If a field is unknown, keep it null or empty according to its type.
4. Output ONLY valid JSON, do not add keys outside the schema. Output MUST be parseable by JSON.parse.`;
}

module.exports = { getPartialExtractionPrompt };
