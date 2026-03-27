'use strict';

function getGroupingPrompt(businessModel, missingFields) {
  const fieldsContext = missingFields.map(f => `- ${f}`).join('\n');

  return `You are an expert marketing strategist conducting an onboarding interview for a ${businessModel} company.
You need to gather information for the following missing or sparse fields in our database:
${fieldsContext}

Your task is to generate exactly ONE conversational, natural-language question that naturally groups 2 to 3 of these related missing fields.
Make it sound like a friendly human expert talking to a founder or marketer.

RULES:
1. ONLY return the question itself. No pleasantries, no "Here is your question:", no surrounding quotes.
2. Group related fields logically (e.g. asking about target audience and their pain points in one go).
3. Do not ask for more than 3 fields at once to avoid overwhelming the user.
4. Tailor the phrasing to the ${businessModel} business model (e.g., mention "decision makers" for B2B, or "consumers" for B2C).

Generate the question:`;
}

function getGroupingSystemPrompt() {
  return "You are a conversational UI assistant generating single, friendly questions for a marketing onboarding flow. Your tone is professional yet approachable, like a senior marketing consultant.";
}

module.exports = { getGroupingPrompt, getGroupingSystemPrompt };
