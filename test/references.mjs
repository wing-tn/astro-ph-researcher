// astro-ph-researcher :: reference library tests (local only)
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.ASTRO_PH_RESEARCHER_HOME = join(tmpdir(), 'astro-ph-researcher-reference-test');
const refs = await import('../lib/references.js');

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test('saves a paper with first three authors, affiliations, journal metadata and DOI', async () => {
  await refs.initReferences();
  const item = refs.upsertReference({
    title: 'A test paper on gravitational lensing',
    doi: 'https://doi.org/10.1234/test.2024',
    authors: ['Alice Smith', 'Bob Jones', 'Carol Lee', 'David Wu'],
    authorsDetailed: [
      { name: 'Alice Smith', orcid: 'https://orcid.org/0000-0001-1111-1111', affiliations: ['Test University'] },
      { name: 'Bob Jones', orcid: '', affiliations: ['Test Observatory'] },
      { name: 'Carol Lee', orcid: '', affiliations: ['Test University'] },
      { name: 'David Wu', orcid: '', affiliations: [] },
    ],
    journal: 'The Astrophysical Journal',
    volume: '970',
    issue: '2',
    pages: '123-135',
    year: 2024,
    abstract: 'We test lensing.',
    links: [{ label: 'SciX', url: 'https://scixplorer.org/search?q=doi:10.1234/test.2024', kind: 'scix' }],
  });
  assert.equal(item.firstThreeAuthors.length, 3);
  assert.equal(item.firstThreeAuthors[0].name, 'Alice Smith');
  assert.deepEqual(item.affiliations.includes('Test University'), true);
  assert.match(item.doi, /10\.1234\/test\.2024/);
  assert.match(item.journal, /Astrophysical/);
  assert.equal(item.volume, '970');
});

test('deduplicates by DOI and merges tags/summary', async () => {
  const before = refs.listReferences({}).length;
  const item = refs.upsertReference({
    title: 'A test paper on gravitational lensing',
    doi: '10.1234/test.2024',
    summary: 'A citable summary.',
    tags: { fields: ['cosmology'], keywords: ['lensing'], collections: ['project-a'] },
  });
  assert.equal(refs.listReferences({}).length, before);
  assert.match(item.summary, /citable/);
  assert.deepEqual(item.tags.fields.includes('cosmology'), true);
});

test('generates BibTeX/APA/GB7714 with consistent DOI', async () => {
  const item = refs.listReferences({ q: 'A test paper' })[0];
  const bib = refs.citeReference(item, 'bibtex');
  assert.match(bib, /@article\{/);
  assert.match(bib, /journal = \{The Astrophysical Journal\}/);
  assert.match(bib, /volume = \{970\}/);
  assert.match(bib, /doi = \{10\.1234\/test\.2024\}/);
  assert.match(refs.citeReference(item, 'apa'), /Smith, A/);
  assert.match(refs.citeReference(item, 'gb7714'), /\[J\]/);
  assert.match(refs.exportBibTeX(), /@article\{/);
});

test('updates classification and deletes item', async () => {
  const item = refs.listReferences({})[0];
  const updated = refs.updateReference(item.id, {
    tags: { fields: ['galaxies'], keywords: ['strong lensing'], collections: ['paper-1'] },
    notes: 'Read section 3.',
  });
  assert.deepEqual(updated.tags.fields, ['galaxies']);
  assert.equal(updated.notes, 'Read section 3.');
  assert.equal(refs.deleteReference(updated.id), true);
  assert.equal(refs.listReferences({}).length, 0);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL - ${name}`);
    console.error(error);
  }
}
if (failed) {
  console.error(`\n${failed}/${tests.length} tests failed`);
  process.exit(1);
}
console.log(`\n${tests.length}/${tests.length} tests passed`);
