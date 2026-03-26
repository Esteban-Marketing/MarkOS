module.exports = {
  getSparkPrompt(fieldName, contextString) {
    return `You are an expert marketing creative.
Based on the following context about a company:
${contextString}

Generate exactly 3 distinct, concise, and creative alternative text suggestions for the field: "${fieldName}".

Return ONLY a valid JSON array of strings containing exactly 3 items. Do not include markdown formatting like \`\`\`json or any other text.
Example:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;
  }
};
