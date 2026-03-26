'use strict';

/**
 * tavily-scraper.cjs
 * Scrapes a domain using the Tavily API to gather initial company context.
 * Focuses on max depth 2 (e.g. homepage, /about, /pricing).
 */

const fs = require('fs');
const path = require('path');

// Will be loaded via process.env or config manually passed in
async function scrapeDomain(url, apiKey) {
  if (!apiKey) {
    throw new Error('Tavily API key is missing. Ensure tavily_api_key is set in config or process.env.TAVILY_API_KEY.');
  }

  const query = `What does the company at ${url} do? Include their target audience, features, pricing, and mission.`;

  const payload = {
    api_key: apiKey,
    query: query,
    search_depth: "advanced",
    include_raw_content: true,
    max_results: 15,
    include_domains: [new URL(url).hostname]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Tavily API responded with status: ${res.status}`);
    }

    const data = await res.json();
    
    // Aggregate raw content
    let aggregatedText = `--- TAVILY SCRAPE FOR ${url} ---\n\n`;
    (data.results || []).forEach(r => {
      aggregatedText += `[Source: ${r.url}]\n${r.raw_content || r.content}\n\n`;
    });

    return aggregatedText;

  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`Scrape warning for ${url}:`, err.message);
    throw new Error(`Scraping failed: ${err.message}`);
  }
}

module.exports = { scrapeDomain };
