'use strict';

const mammoth = require('mammoth');

async function parseDocx(buffer) {
  try {
    const data = await mammoth.extractRawText({ buffer: buffer });
    return `--- DOCX DOCUMENT ---\n${data.value}\n---\n`;
  } catch (err) {
    console.error('Failed to parse DOCX:', err);
    throw new Error('DOCX parsing failed');
  }
}

module.exports = { parseDocx };
