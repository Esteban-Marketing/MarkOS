'use strict';

function parseText(buffer) {
  const text = buffer.toString('utf8');
  // Simple extraction for TXT or MD files
  return `--- TEXT DOCUMENT ---\n${text}\n---\n`;
}

module.exports = { parseText };
