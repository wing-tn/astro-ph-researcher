import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { Literature, Library, parseArxiv, crossrefRecord, dedupe, exportLibrary } from '../core.mjs';
import { createApp } from '../server.mjs';

const work = {DOI: '10.1234/real-test', title: ['A test of lensing'], author: [{given: 'Ada', family: 'Lovelace', ORCID: 'https://orcid.org/test', affiliation: [{name: 'Test Institute'}]}], published: {'date-parts': [[2023, 1, 2]]}, type: 'journal-article', 'container-title': ['Test Journal'], 'is-referenced-by-count': 5};
const atom = (id = '2301.12345v2', doi = work.DOI) => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom"><entry><id>http://arxiv.org/abs/${id}</id><title>A test of lensing</title><published>2023-01-02T00:00:00Z</published><updated>2023-02-02T00:00:00Z</updated><summary>Abstract with &amp; and &lt;symbols&gt;</summary><author><name>Ada Lovelace</name></author><arxiv:doi>${doi}</arxiv:doi><category term="astro-ph.CO"/></entry></feed>`;
const response = data => new Response(typeof data === 'string' ? data : JSON.stringify(data), {status: 200});

test('Crossref preserves provided author identifiers and does not infer peer review', () => {
  const item = crossrefRecord(work, 'https://api.crossref.org/works');
  assert.equal(item.authorsDetailed[0].affiliations[0], 'Test Institute'); assert.equal(item.evidence, 'C'); assert.deepEqual(item.verification, {}); assert.equal(item.citationSource, 'Crossref');
});
test('Atom parses DOI, version, categories, namespace fields and rejects unsafe XML', () => {
  const item = parseArxiv(atom(), 'test')[0]; assert.equal(item.arxivId, '2301.12345v2'); assert.equal(item.doi, '10.1234/real-test'); assert.equal(item.categories[0], 'astro-ph.CO'); assert.match(item.abstract, /& and <symbols>/); assert.equal(item.citations, null);
  assert.throws(() => parseArxiv('<!DOCTYPE feed><feed/>', 'test'));
  assert.throws(() => parseArxiv('<html>blocked</html>', 'test'));
});
test('dedup merges preprint and publication by DOI but retains both sources and does not conflate different DOIs', () => {
  const a = parseArxiv(atom(), 'arxiv')[0], b = crossrefRecord(work, 'crossref');
  const rows = dedupe([a, b]); assert.equal(rows.length, 1); assert.equal(rows[0].arxivId, '2301.12345v2'); assert.equal(rows[0].provenance.length, 2); assert.equal(rows[0].journal, 'Test Journal');
  const reverse = dedupe([b, a])[0]; assert.equal(reverse.type, 'journal-article'); assert.equal(reverse.journal, 'Test Journal'); assert.equal(reverse.citationSource, 'Crossref');
  assert.equal(dedupe([b, {...b, doi: '10.5678/other'}]).length, 2);
  assert.equal(dedupe([{...a, doi: ''}, {...a, doi: '', arxivId: '2301.12345v3'}]).length, 1);
});
test('search keeps both date filters, advanced arXiv syntax, and explicit partial failure snapshots', async () => {
  const urls = [];
  const service = new Literature(async url => { urls.push(new URL(url)); if (String(url).includes('arxiv')) throw new Error('offline'); return response({message: {items: [work], 'total-results': 1}}); });
  const result = await service.search({query: 'cat:astro-ph.CO AND abs:redshift', yearFrom: 2020, yearTo: 2025});
  assert.equal(result.results.length, 1); assert.equal(result.snapshots.length, 2); assert.equal(result.warnings.length, 1);
  assert.equal(urls[0].searchParams.get('filter'), 'from-pub-date:2020-01-01,until-pub-date:2025-12-31');
  assert.match(urls[1].searchParams.get('search_query'), /cat:astro-ph.CO AND abs:redshift/);
  assert.match(urls[1].searchParams.get('search_query'), /submittedDate/);
  await assert.rejects(service.search({query: 'lensing', yearFrom: 2025, yearTo: 2020}));
});
test('verification distinguishes found, missing, upstream failure, malformed and mismatched IDs', async () => {
  const good = await new Literature(async () => response({message: work})).verify('https://doi.org/10.1234/REAL-TEST'); assert.equal(good.status, 'verified'); assert.equal(good.item.evidence, 'C');
  const missing = await new Literature(async () => new Response('', {status: 404})).verify(work.DOI); assert.equal(missing.status, 'not_found');
  const limited = await new Literature(async () => new Response('', {status: 429})).verify(work.DOI); assert.equal(limited.status, 'unavailable');
  const offline = await new Literature(async () => {throw new Error('offline');}).verify(work.DOI); assert.equal(offline.status, 'unavailable');
  const mismatch = await new Literature(async () => response({message: {...work, DOI: '10.1234/wrong'}})).verify(work.DOI); assert.equal(mismatch.status, 'unavailable');
  const old = await new Literature(async () => response(atom('astro-ph/9901234v1', ''))).verify('astro-ph/9901234'); assert.equal(old.status, 'verified');
  await assert.rejects(new Literature().verify('http://localhost/private'));
});
test('saved records survive reload; concurrent saves do not lose records; metadata refresh preserves reading notes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'astro-ui-test-')); try {
    const path = join(dir, 'library.json'), store = new Library(path); await store.load();
    await Promise.all(Array.from({length: 12}, (_, i) => store.save(crossrefRecord({...work, DOI: `10.1234/test-${i}`}, 'test')))); assert.equal(store.state.items.length, 12);
    const id = store.state.items[0].id; await store.patch(id, {notes: '页码 3；我的推断单列', evidence: 'B', tags: 'lensing, 阅读'});
    await store.save({...store.state.items[0], notes: '', evidence: 'C'});
    const restored = new Library(path); await restored.load(); assert.equal(restored.state.items[0].notes, '页码 3；我的推断单列'); assert.equal(restored.state.items[0].evidence, 'B');
    assert.equal(JSON.parse(await readFile(path)).items.length, 12);
    await writeFile(path, '{broken'); await assert.rejects(new Library(path).load());
  } finally { await rm(dir, {recursive: true, force: true}); }
});
test('exports preserve audit trail and generate distinct citation keys without fabricated fields', () => {
  const a = {...crossrefRecord(work, 'test'), id: '1234567890abcdef'}, b = {...parseArxiv(atom('2301.12345v2', ''), 'test')[0], id: 'fedcba0987654321'};
  const state = {version: 1, items: [a, b], searches: [{query: 'lensing', searchedAt: '2026-10-22'}]};
  const bib = exportLibrary(state, 'bibtex'); assert.match(bib, /@misc/); assert.match(bib, /_12345678,/); assert.match(bib, /_fedcba09,/); assert.match(bib, /eprint = \{2301.12345\}/); assert.doesNotMatch(bib, /undefined/);
  assert.match(exportLibrary(state, 'markdown'), /检索快照/); assert.equal(JSON.parse(exportLibrary(state, 'json', [a.id])).items.length, 1);
  const chapter = exportLibrary({...state, items: [{...a, type: 'book-chapter'}]}, 'bibtex'); assert.match(chapter, /@incollection/); assert.match(chapter, /booktitle =/);
});
test('HTTP workflow: rejects cross-origin writes and forged metadata; saves, patches, exports and removes trusted results', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'astro-ui-http-'));
  const {server} = await createApp({dataPath: join(dir, 'library.json'), literature: new Literature(async () => response({message: {items: [work]}}))});
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, value, extra = {}) => fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json', ...extra}, body: JSON.stringify(value)});
  try {
    assert.equal((await post('/api/library', {title: 'fake', doi: work.DOI})).status, 400);
    assert.equal((await post('/api/search', {query: 'lensing'}, {Origin: 'https://attacker.test'})).status, 403);
    const badHost = await new Promise((resolve, reject) => {
      const req = http.request(base + '/api/health', {headers: {Host: 'attacker.test'}}, res => {res.resume(); resolve(res.statusCode);});
      req.on('error', reject); req.end();
    });
    assert.equal(badHost, 403);
    const result = await (await post('/api/search', {query: 'lensing', source: 'crossref'})).json();
    const saved = await (await post('/api/library', {id: result.results[0].id})).json();
    const patched = await (await fetch(base + `/api/library/${saved.id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({notes: 'read', readingStatus: '已读'})})).json(); assert.equal(patched.notes, 'read');
    const bib = await (await fetch(base + '/api/export?format=bibtex')).text(); assert.match(bib, /A test of lensing/);
    const terms = await (await fetch(base + '/api/terms?q=redshift')).json(); assert.equal(terms.terms[0].zh, '红移');
    const html = await fetch(base); assert.equal(html.status, 200); assert.match(html.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal((await fetch(base + '/api/export?format=bad')).status, 400);
    await fetch(base + `/api/library/${saved.id}`, {method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: '{}'});
    assert.equal((await (await fetch(base + '/api/library')).json()).items.length, 0);
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); await rm(dir, {recursive: true, force: true}); }
});
