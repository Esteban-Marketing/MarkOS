const { getEnrichmentPrompt } = require('../prompts/enrichment-prompt.js');
const llm = require('../agents/llm-adapter.cjs');
const path = require('path');

async function discoverCompetitors(companyName, industry) {
  let tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    // Attempt loading from config if env is not populated directly
    try {
      require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });
      tavilyKey = process.env.TAVILY_API_KEY;
    } catch(e) {}
  }

  if (!tavilyKey) {
    return { success: false, reason: "No TAVILY_API_KEY provided" };
  }

  try {
    // Basic search on Tavily
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${companyName || ''} ${industry || ''} top competitors and market trends`,
        search_depth: "basic",
        include_answers: false,
        max_results: 5
      })
    });

    if (!searchRes.ok) {
      throw new Error('Tavily search failed');
    }

    const tData = await searchRes.json();
    const searchDataString = tData.results.map(r => `[${r.title}] ${r.content}`).join('\n\n');

    const prompt = getEnrichmentPrompt(companyName, industry, searchDataString);
    const llmRes = await llm.call(
      "You are a helpful AI that strictly outputs JSON matching the requested structure.",
      prompt,
      { max_tokens: 600, temperature: 0.3 }
    );

    if (!llmRes.ok) throw new Error(llmRes.error);

    let parsed = null;
    try {
      const startIdx = llmRes.text.indexOf('{');
      const endIdx = llmRes.text.lastIndexOf('}');
      parsed = JSON.parse(llmRes.text.substring(startIdx, endIdx + 1));
    } catch (e) {
      throw new Error('Invalid JSON from LLM: ' + llmRes.text);
    }

    return { success: true, enrichedData: parsed };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

module.exports = { discoverCompetitors };
