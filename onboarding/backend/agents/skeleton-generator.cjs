'use strict';

const fs = require('fs');
const path = require('path');

const { MARKOS_LOCAL_DIR, TEMPLATES_DIR } = require('../path-constants.cjs');
const { resolveSkeleton, getModelSlug } = require('./example-resolver.cjs');
const { resolveBusinessModelFamily } = require('../research/template-family-map.cjs');

const DISCIPLINES = ['Paid_Media','Content_SEO','Lifecycle_Email','Social','Landing_Pages'];

function buildFrontmatter(discipline, businessModel, painPoints, generatedAt) {
	const safePainPoints = Array.isArray(painPoints) ? painPoints : [];
	const painPointLines = safePainPoints
		.map((painPoint) => `  - "${String(painPoint).replace(/"/g, '\\"')}"`)
		.join('\n');
	const family = resolveBusinessModelFamily(businessModel);

	return [
		'---',
		`discipline: ${discipline}`,
		`business_model: ${businessModel}`,
		family ? `business_model_family: ${family.slug}` : null,
		`generated_at: ${generatedAt}`,
		'pain_points:',
		painPointLines,
		'---',
		'',
	].filter(Boolean).join('\n');
}

function interpolatePainPoints(content, painPoints) {
	let result = content;
	painPoints.forEach((pp, i) => { result = result.replace(`{{pain_point_${i + 1}}}`, pp); });
	result = result.split('\n').filter(line => !line.match(/{{pain_point_\d+}}/)).join('\n');
	return result;
}

async function generateSkeletons(seed, approvedDrafts, outputBasePath = MARKOS_LOCAL_DIR, templatesBasePath = TEMPLATES_DIR, packSelection = null) {
  void approvedDrafts;

  const businessModel = seed?.company?.business_model;
  const painPoints = Array.isArray(seed?.audience?.pain_points) ? seed.audience.pain_points : [];
  const generatedAt = new Date().toISOString();
  const slug = getModelSlug(businessModel);
  const overlaySlug = (packSelection && packSelection.overlayPack) || null; // Phase 109

  return DISCIPLINES.map((discipline) => {
    const baseContent = resolveSkeleton(discipline, businessModel, templatesBasePath, overlaySlug); // Phase 109
    if (!baseContent || !slug) {
      return { discipline, files: [], error: 'template_not_found' };
    }

    try {
      const outputDir = path.join(outputBasePath, 'MSP', discipline, 'SKELETONS');
      fs.mkdirSync(outputDir, { recursive: true });
      const fileName = `_SKELETON-${slug}.md`;
      const filePath = path.join(outputDir, fileName);
      const frontmatter = buildFrontmatter(discipline, businessModel, painPoints, generatedAt);
      const body = interpolatePainPoints(baseContent, painPoints);
      fs.writeFileSync(filePath, frontmatter + body, 'utf8');
      return { discipline, files: [filePath], error: null };
    } catch (error) {
      return { discipline, files: [], error: error.message };
    }
  });
}

module.exports = {
  generateSkeletons,
  interpolatePainPoints,
  buildFrontmatter,
};
