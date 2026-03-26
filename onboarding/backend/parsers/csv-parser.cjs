'use strict';

const { parse } = require('csv-parse/sync');

function parseCsv(buffer) {
  try {
    const csvString = buffer.toString('utf8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Dump it as pseudo-json/text for the LLM
    let out = `--- CSV DATA ---\n`;
    for (const record of records) {
      out += JSON.stringify(record) + '\n';
    }
    out += `---\n`;
    return out;
  } catch (err) {
    console.error('Failed to parse CSV:', err);
    throw new Error('CSV parsing failed');
  }
}

module.exports = { parseCsv };
