'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { createJsonRequest, withMockedModule } = require('./setup.js');
const { resolveSkeleton } = require('../onboarding/backend/agents/example-resolver.cjs');
const {
	generateSkeletons,
	interpolatePainPoints,
} = require('../onboarding/backend/agents/skeleton-generator.cjs');

function makeTmpDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'markos-skeleton-test-'));
}

function createMockResponse() {
	return {
		statusCode: null,
		headers: null,
		body: '',
		writeHead(statusCode, headers) {
			this.statusCode = statusCode;
			this.headers = headers;
		},
		end(chunk = '') {
			this.body += chunk || '';
		},
	};
}

function loadFreshModule(modulePath) {
	delete require.cache[require.resolve(modulePath)];
	return require(modulePath);
}

const DISCIPLINES = ['Paid_Media', 'Content_SEO', 'Lifecycle_Email', 'Social', 'Landing_Pages'];

function createBaseSkeleton(contentLabel) {
	return [
		`# ${contentLabel}`,
		'',
		'## Strategy Section',
		'',
		'Write the strategic plan for this section.',
		'',
		'## Execution Plan',
		'',
		'Describe execution details and timeline.',
		'',
		'## Measurement',
		'',
		'Define success metrics and feedback loops.',
		'',
		'## Your Priority Challenges',
		'',
		'Use this section to address your top declared pain points.',
		'',
		'### {{pain_point_1}}',
		'',
		'### {{pain_point_2}}',
		'',
		'### {{pain_point_3}}',
		'',
	].join('\n');
}

function createRuntimeContextMock(outputRoot) {
	const config = {
		mir_output_path: path.join(outputRoot, 'mir-output'),
		project_slug: 'acme',
	};

	return {
		assertRolloutPromotionAllowed: () => ({ ok: true }),
		createRuntimeContext: () => ({ mode: 'local', canWriteLocalFiles: true, config }),
		getRolloutMode: () => 'local',
		getMarkosdbAccessMatrix: () => ({}),
		loadMigrationCheckpoints: () => ({}),
		redactSensitive: (value) => value,
		RETENTION_POLICY: {},
		resolveMirOutputPath: () => config.mir_output_path,
		resolveProjectSlug: (_runtime, slug) => slug || 'acme',
		resolveRequestedProjectSlug: () => 'acme',
		resolveSeedOutputPath: () => path.join(outputRoot, 'seed-output.json'),
		validateRequiredSecrets: () => ({ ok: true, missing: [] }),
	};
}

const handlersPath = path.join(__dirname, '..', 'onboarding', 'backend', 'handlers.cjs');
const vaultWriterPath = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'vault-writer.cjs');
const runReportPath = path.join(__dirname, '..', 'onboarding', 'backend', 'vault', 'run-report.cjs');
const vectorStorePath = path.join(__dirname, '..', 'onboarding', 'backend', 'vector-store-client.cjs');
const telemetryPath = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'telemetry.cjs');
const runtimeContextPath = path.join(__dirname, '..', 'onboarding', 'backend', 'runtime-context.cjs');
const skeletonGeneratorPath = path.join(__dirname, '..', 'onboarding', 'backend', 'agents', 'skeleton-generator.cjs');

test('resolveSkeleton resolves correct base template for known discipline + model', () => {
	const dir = makeTmpDir();
	try {
		const filePath = path.join(dir, 'SKELETONS', 'Paid_Media', '_SKELETON-b2b.md');
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, createBaseSkeleton('Paid Media B2B'), 'utf8');

		const result = resolveSkeleton('Paid_Media', 'B2B', dir);
		assert.ok(result.includes('# Paid Media B2B'));
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test('resolveSkeleton returns empty string for unknown business model', () => {
	const dir = makeTmpDir();
	try {
		const result = resolveSkeleton('Paid_Media', 'UNKNOWN_MODEL', dir);
		assert.equal(result, '');
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test('resolveSkeleton returns empty string for missing template file', () => {
	const dir = makeTmpDir();
	try {
		const result = resolveSkeleton('Paid_Media', 'B2B', dir);
		assert.equal(result, '');
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test('resolveSkeleton resolves Agents-aaS slug (agents-aas)', () => {
	const dir = makeTmpDir();
	try {
		const filePath = path.join(dir, 'SKELETONS', 'Social', '_SKELETON-agents-aas.md');
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, createBaseSkeleton('Social Agents-aaS'), 'utf8');

		const result = resolveSkeleton('Social', 'Agents-aaS', dir);
		assert.ok(result.includes('# Social Agents-aaS'));
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test('generateSkeletons writes 5 output files for a valid seed', async () => {
	const templatesDir = makeTmpDir();
	const outputDir = makeTmpDir();
	try {
		for (const discipline of DISCIPLINES) {
			const templatePath = path.join(templatesDir, 'SKELETONS', discipline, '_SKELETON-saas.md');
			fs.mkdirSync(path.dirname(templatePath), { recursive: true });
			fs.writeFileSync(templatePath, createBaseSkeleton(`${discipline} SaaS`), 'utf8');
		}

		const seed = {
			company: { business_model: 'SaaS' },
			audience: { pain_points: ['Low activation', 'Poor retention'] },
		};

		const results = await generateSkeletons(seed, {}, outputDir, templatesDir);
		assert.equal(results.length, 5);
		const generatedCount = results.reduce((count, item) => count + item.files.length, 0);
		assert.equal(generatedCount, 5);

		for (const result of results) {
			assert.equal(result.error, null);
			const generatedFile = result.files[0];
			const content = fs.readFileSync(generatedFile, 'utf8');
			assert.ok(content.includes('discipline:'));
			assert.ok(content.includes('business_model:'));
			assert.ok(content.includes('generated_at:'));
			assert.ok(content.includes('pain_points:'));
			assert.ok(!/{{pain_point_\d+}}/.test(content));
		}
	} finally {
		fs.rmSync(templatesDir, { recursive: true, force: true });
		fs.rmSync(outputDir, { recursive: true, force: true });
	}
});

test('interpolatePainPoints replaces all slots and removes orphans', () => {
	const template = [
		'### {{pain_point_1}}',
		'### {{pain_point_2}}',
		'### {{pain_point_3}}',
	].join('\n');
	const output = interpolatePainPoints(template, ['High CAC', 'Low MQL quality']);

	assert.ok(output.includes('### High CAC'));
	assert.ok(output.includes('### Low MQL quality'));
	assert.ok(!output.includes('{{pain_point_3}}'));
	assert.ok(!/{{pain_point_\d+}}/.test(output));
});

test('handleApprove response includes skeletons block', async () => {
	const dir = makeTmpDir();
	try {
		const runtimeMock = createRuntimeContextMock(dir);

		await withMockedModule(runtimeContextPath, runtimeMock, async () => {
			await withMockedModule(vaultWriterPath, {
				writeApprovedDrafts: () => ({
					written: ['MarkOS-Vault/Strategy/company.md'],
					items: [{ source_key: 'company_profile', outcome: 'imported', destination_path: 'MarkOS-Vault/Strategy/company.md', warnings: [], errors: [] }],
					errors: [],
				}),
			}, async () => {
				await withMockedModule(runReportPath, {
					writeRunReport: () => ({ report_note_path: 'MarkOS-Vault/Memory/Migration Reports/mock.md' }),
				}, async () => {
					await withMockedModule(vectorStorePath, {
						configure: () => {},
						storeDraft: async () => ({ ok: true }),
					}, async () => {
						await withMockedModule(telemetryPath, {
							captureExecutionCheckpoint: () => {},
							captureRolloutEndpointEvent: () => {},
						}, async () => {
							await withMockedModule(skeletonGeneratorPath, {
								generateSkeletons: async () => ([
									{ discipline: 'Paid_Media', files: ['.markos-local/MSP/Paid_Media/SKELETONS/_SKELETON-saas.md'], error: null },
								]),
							}, async () => {
								const handlers = loadFreshModule(handlersPath);
								const req = createJsonRequest({
									slug: 'acme',
									approvedDrafts: { company_profile: 'ok' },
								}, '/approve');
								const res = createMockResponse();

								await handlers.handleApprove(req, res);
								assert.equal(res.statusCode, 200);
								const payload = JSON.parse(res.body);
								assert.ok(payload.skeletons);
								assert.ok(Array.isArray(payload.skeletons.generated));
								assert.ok(Array.isArray(payload.skeletons.failed));
								assert.equal(payload.skeletons.failed.length, 0);
							});
						});
					});
				});
			});
		});
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test('skeleton generation failure does not affect HTTP 200 response', async () => {
	const dir = makeTmpDir();
	try {
		const runtimeMock = createRuntimeContextMock(dir);

		await withMockedModule(runtimeContextPath, runtimeMock, async () => {
			await withMockedModule(vaultWriterPath, {
				writeApprovedDrafts: () => ({
					written: ['MarkOS-Vault/Strategy/company.md'],
					items: [{ source_key: 'company_profile', outcome: 'imported', destination_path: 'MarkOS-Vault/Strategy/company.md', warnings: [], errors: [] }],
					errors: [],
				}),
			}, async () => {
				await withMockedModule(runReportPath, {
					writeRunReport: () => ({ report_note_path: 'MarkOS-Vault/Memory/Migration Reports/mock.md' }),
				}, async () => {
					await withMockedModule(vectorStorePath, {
						configure: () => {},
						storeDraft: async () => ({ ok: true }),
					}, async () => {
						await withMockedModule(telemetryPath, {
							captureExecutionCheckpoint: () => {},
							captureRolloutEndpointEvent: () => {},
						}, async () => {
							await withMockedModule(skeletonGeneratorPath, {
								generateSkeletons: async () => {
									throw new Error('forced failure');
								},
							}, async () => {
								const handlers = loadFreshModule(handlersPath);
								const req = createJsonRequest({
									slug: 'acme',
									approvedDrafts: { company_profile: 'ok' },
								}, '/approve');
								const res = createMockResponse();

								await handlers.handleApprove(req, res);
								assert.equal(res.statusCode, 200);
								const payload = JSON.parse(res.body);
								assert.deepEqual(payload.skeletons.failed, ['all']);
								assert.ok(Array.isArray(payload.skeletons.generated));
							});
						});
					});
				});
			});
		});
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});
