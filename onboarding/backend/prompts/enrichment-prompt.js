module.exports = {
  getEnrichmentPrompt(companyName, industry, searchData) {
    return `You are a marketing intelligence agent. Given the following company name, industry, and web search results, identify exactly 3 likely competitors and 1 major market trend.

Company Name: ${companyName || 'Unknown'}
Industry: ${industry || 'General Business'}
Search Results:
${searchData}

Return strictly a valid JSON object matching the following structure. No markdown wrappers.
{
  "competitors": [
    { "name": "Competitor A", "differentiator": "Their unique value prop" },
    { "name": "Competitor B", "differentiator": "Their unique value prop" },
    { "name": "Competitor C", "differentiator": "Their unique value prop" }
  ],
  "biggest_trend": "The most significant macroeconomic or industry trend from the data."
}`;
  }
};
