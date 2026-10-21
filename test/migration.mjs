// astro-ph-researcher :: legacy data migration test
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'astro-ph-researcher-migration-'));
const legacy = join(root, 'astro-words');
mkdirSync(legacy, { recursive: true });
writeFileSync(
  join(legacy, 'terms.json'),
  JSON.stringify({ version: 1, terms: [{ en: 'redshift', zh: '红移', astrodictId: 'test-redshift' }] }),
  'utf8',
);
process.env.ASTRO_PH_RESEARCHER_HOME = root;

const store = await import('../lib/store.js');
await store.initStore();
const newDir = join(root, 'astro-ph-researcher');
assert.equal(existsSync(join(newDir, 'terms.json')), true, 'legacy terms.json should be copied');
assert.equal(store.listSavedTerms().some((term) => term.en === 'redshift'), true, 'legacy term should load');
rmSync(root, { recursive: true, force: true });
console.log('legacy migration ok');
