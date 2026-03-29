/**
 * Security — Input sanitization for MGSD
 */

/**
 * Sanitize text that may be injected into agent prompts.
 * Strips invisible chars and injection markers.
 */
function sanitizeForPrompt(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Strip control chars
    .replace(/\u200B/g, '')                                // Zero-width space
    .replace(/\u200C/g, '')                                // Zero-width non-joiner
    .replace(/\u200D/g, '')                                // Zero-width joiner
    .replace(/\uFEFF/g, '')                                // BOM
    .trim();
}

/**
 * Validate path does not contain traversal or null bytes.
 */
function validatePath(targetPath) {
  if (!targetPath) return false;
  if (targetPath.includes('\0')) return false;
  if (targetPath.includes('..')) return false;
  return true;
}

module.exports = { sanitizeForPrompt, validatePath };
