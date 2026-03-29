const { handleLinearSync, handleCorsPreflight } = require('../../onboarding/backend/handlers.cjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);
  await handleLinearSync(req, res);
};
