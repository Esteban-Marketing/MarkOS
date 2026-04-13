require('../helpers/ts-register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const draftPath = path.join(root, 'lib/markos/outbound/drafts.ts');
const composerPath = path.join(root, 'components/crm/outbound/outbound-composer.tsx');
const viewerPath = path.join(root, 'components/crm/outbound/conversation-viewer.tsx');

require('../../lib/markos/crm/api.cjs');
const { buildOutboundDraftSuggestion } = require('../../lib/markos/outbound/drafts.ts');

test('CRM-06: assistive draft support stays suggestion-only with no autonomous send or sequence execution path', () => {
  [draftPath, composerPath, viewerPath].forEach((filePath) => {
    assert.equal(fs.existsSync(filePath), true, `${filePath} must exist`);
  });

  const composerSource = fs.readFileSync(composerPath, 'utf8');
  const viewerSource = fs.readFileSync(viewerPath, 'utf8');
  const draft = buildOutboundDraftSuggestion({
    channel: 'email',
    prompt: 'Summarize next steps politely.',
    record_id: 'contact-001',
  });

  assert.equal(draft.send_disabled, true);
  assert.equal(draft.sequence_disabled, true);
  assert.equal(draft.autonomous_execution, false);
  assert.match(composerSource, /assist/i);
  assert.match(composerSource, /operator-triggered/i);
  assert.match(viewerSource, /suggestion-only/i);
});
