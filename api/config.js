const { handleConfig, handleCorsPreflight } = require('../onboarding/backend/handlers.cjs');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleCorsPreflight(req, res);
  await handleConfig(req, res);
};
