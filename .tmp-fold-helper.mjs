// Generic helper: reads a fold-content file + a target plan file, splices the
// fold immediately before the first '<tasks>' line, and writes the merged result.
// Idempotent: skips when '<ui_spec_fold>' already present in target.
import fs from 'node:fs';

const [, , planPath, foldPath] = process.argv;
if (!planPath || !foldPath) {
  console.error('usage: node .tmp-fold-helper.mjs <plan.md> <fold.txt>');
  process.exit(2);
}

let body = fs.readFileSync(planPath, 'utf8');
if (body.includes('<ui_spec_fold>')) {
  console.log('[skip] ' + planPath + ' already contains <ui_spec_fold>');
  process.exit(0);
}
const fold = fs.readFileSync(foldPath, 'utf8');

const anchor = '\n<tasks>\n';
const idx = body.indexOf(anchor);
if (idx === -1) {
  console.error('[ERR] ' + planPath + ' no <tasks> anchor');
  process.exit(1);
}
const before = body.slice(0, idx + 1);
const after = body.slice(idx + 1);
fs.writeFileSync(planPath, before + fold + '\n' + after, 'utf8');
console.log('[ok]   ' + planPath + ' fold inserted bytes=' + fold.length);
