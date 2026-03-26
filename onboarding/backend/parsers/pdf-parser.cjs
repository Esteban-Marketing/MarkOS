'use strict';

const pdfParse = require('pdf-parse');

async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return `--- PDF DOCUMENT ---\n${data.text}\n---\n`;
  } catch (err) {
    console.error('Failed to parse PDF:', err);
    throw new Error('PDF parsing failed');
  }
}

module.exports = { parsePdf };
