// astro-ph-researcher :: thesis format upload/parse tests (no network)
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testHome = join(tmpdir(), `astro-ph-researcher-thesis-format-${process.pid}-${Date.now()}`);
rmSync(testHome, { recursive: true, force: true });
process.env.ASTRO_PH_RESEARCHER_HOME = testHome;
const f = await import('../lib/thesis-fetcher.js');

assert.equal(f.isBlockedUrl('http://127.0.0.1/x'), true);
assert.equal(f.isBlockedUrl('http://localhost/x'), true);
assert.equal(f.isBlockedUrl('https://example.edu/format.pdf'), false);

const parsed = f.parseDocumentBuffer(Buffer.from('font 12pt\nline-height 1.5\nGB/T 7714-2015'), 'requirements.txt', 'text/plain');
assert.match(parsed.text, /GB\/T 7714/);
assert.equal(parsed.needsDsh, false);

const manifest = await f.uploadThesisFormat('test-upload', {
  name: 'requirements.txt',
  type: 'text/plain',
  content: 'font 12pt\nline-height 1.5\nreferences GB/T 7714-2015',
  encoding: 'utf8',
});
assert.equal(manifest.files.length, 1);
assert.match(manifest.text, /GB\/T 7714/);
const loaded = await f.getFormatWorkspace('test-upload');
assert.equal(loaded.files[0].name, 'requirements.txt');
assert.match(f.formatWorkspaceSummary(loaded), /requirements\.txt/);

const pdf = f.parseDocumentBuffer(Buffer.from('%PDF-1.4'), 'rules.pdf', 'application/pdf');
assert.equal(pdf.needsDsh, true);
console.log('thesis format parser ok');
