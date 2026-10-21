// astro-ph-researcher :: offline smoke test (no network required)
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parseResultTable, parseTermDetail, scoreRow, formatTermLookup } from '../lib/astrodict.js';
import { buildAnalysisPrompt, cnkiLinks, rankItems } from '../lib/literature.js';

const RESULT_HTML = `
<table border="0" id="resulttbl" class="termTable2 listTable">
<tr><th>外文名</th><th>缩写</th><th>语种</th><th>中文名</th></tr>
<tr>
  <td><a href="/astrodict/termdetails?id=9952">redshift</a></td>
  <td></td><td>英语</td>
  <td><a href="/astrodict/termdetails?id=9952">红移</a></td>
</tr>
<tr>
  <td><a href="/astrodict/termdetails?id=7306">cosmic redshift</a></td>
  <td></td><td>英语</td>
  <td><a href="/astrodict/termdetails?id=7306">宇宙红移；宇宙学红移</a></td>
</tr>
<tr>
  <td><a href="/astrodict/termdetails?id=10224">gravitational lensing; gravitational lens effect</a></td>
  <td></td><td>英语</td>
  <td><a href="/astrodict/termdetails?id=10224">引力透镜效应</a></td>
</tr>
<tr>
  <td><a href="/astrodict/termdetails?id=21675">weak gravitational lensing</a></td>
  <td></td><td>英语</td>
  <td><a href="/astrodict/termdetails?id=21675">弱引力透镜</a></td>
</tr>
</table>`;

const DETAIL_HTML = `
<html><head><title>红移(redshift) | 天文学名词</title></head><body>
<div class="termDetailsBlock">
  <div class="titleLine"><strong>redshift</strong> 【英语】</div>
  <div> 红移 （台湾名：紅移） （<span style="color:#008080;">已出版</span>） <br/>
    <div style="font-size:12px;font-family:楷体;"> 依据：
      <ol><li>《英汉天文学名词》李竞、许邦信主编，上海科技教育出版社，2000</li>
      <li>《英汉天文学名词》，中国科学技术出版社，2015</li></ol>
      最后修订：2010-04-15
    </div>
  </div>
  <div class="titleLine"><div style="float:left;">词源</div>
    <a href="/astrodict/termEtymology?termid=9952">补充词源</a><div style="clear:both;"></div>
  </div>
  <div>
    <div class="titleLine">定义</div>
    (1) 天体谱线的观测波长向长波方向频移的现象。(2) 该现象引起的谱线波长的相对改变量。
  </div>
  <div class="titleLine">标签</div>
  &nbsp;<a href="/astrodict/dictbrowseresult?tag=天体物理">天体物理</a>&nbsp;
  <ol></ol>
</div>
<div class="commentBlock"><div class="titleLine">修订</div></div>
</body></html>`;

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test('parseResultTable extracts id/zh/en/abbr', () => {
  const rows = parseResultTable(RESULT_HTML);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, '9952');
  assert.equal(rows[0].en, 'redshift');
  assert.equal(rows[0].zh, '红移');
  assert.equal(rows[1].zh, '宇宙红移');
  assert.deepEqual(rows[1].aliases.includes('宇宙学红移'), true);
  assert.equal(rows[2].en, 'gravitational lensing');
  assert.deepEqual(rows[2].aliases.includes('gravitational lens effect'), true);
});

test('scoreRow does not let "weak gravitational lensing" beat the exact term', () => {
  const rows = parseResultTable(RESULT_HTML);
  const lensing = rows.find((row) => row.id === '10224');
  const weak = rows.find((row) => row.id === '21675');
  assert.equal(scoreRow('gravitational lensing', lensing), 1);
  assert.ok(scoreRow('gravitational lensing', weak) < 1);
  assert.ok(scoreRow('gravitational lensing', weak) < scoreRow('gravitational lensing', lensing));
});

test('parseTermDetail extracts audited fields', () => {
  const detail = parseTermDetail(DETAIL_HTML);
  assert.equal(detail.en, 'redshift');
  assert.equal(detail.zh, '红移');
  assert.equal(detail.zhTW, '紅移');
  assert.equal(detail.status, '已出版');
  assert.equal(detail.lastRevised, '2010-04-15');
  assert.equal(detail.sources.length, 2);
  assert.match(detail.definition, /天体谱线/);
  assert.equal(detail.definitionSource, 'NADC《天文学名词（定义版）》');
  assert.deepEqual(detail.nadcTags, ['天体物理']);
});

test('scoreRow prefers exact match', () => {
  const rows = parseResultTable(RESULT_HTML);
  assert.equal(scoreRow('redshift', rows[0]), 1);
  assert.equal(scoreRow('Redshift', rows[0]), 1);
  assert.equal(scoreRow('红移', rows[0]), 1);
  assert.ok(scoreRow('cosmic redshift', rows[1]) > scoreRow('redshift', rows[1]));
});

test('formatTermLookup marks NADC and explanation sources', () => {
  const text = formatTermLookup({
    found: true,
    matchedBy: 'exact',
    confidence: 1,
    term: {
      en: 'redshift',
      zh: '红移',
      status: '已出版',
      astrodictId: '9952',
      astrodictUrl: 'https://nadc.china-vo.org/astrodict/termdetails?id=9952',
      definition: '审定定义测试',
      definitionSource: 'NADC《天文学名词（定义版）》',
      explanation: '测试释义',
      sources: ['《英汉天文学名词》'],
    },
    related: [{ zh: '宇宙学红移', en: 'cosmological redshift', url: 'https://example.org', reason: '共享词根' }],
  });
  assert.match(text, /【审定译名】红移/);
  assert.match(text, /【NADC 审定定义】审定定义测试/);
  assert.match(text, /【DSH 释义（非名词委原文）】/);
  assert.match(text, /【相关术语】/);
});

test('rankItems: balanced beats old high-citation paper for a recent relevant one', () => {
  const items = [
    { title: 'old', year: 1995, citations: 9000, relevanceRaw: 100, type: 'article', links: [], authors: [] },
    { title: 'new', year: new Date().getFullYear(), citations: 30, relevanceRaw: 98, type: 'article', links: [], authors: [] },
  ];
  const ranked = rankItems(items, { sort: 'balanced', halfLifeYears: 8, limit: 2, query: 'test' });
  assert.equal(ranked[0].title, 'new');
  assert.ok(ranked[0].score > ranked[1].score);
});

test('rankItems: explicit sorts work', () => {
  const items = [
    { title: 'a', year: 2001, citations: 10, relevanceRaw: 1, type: 'article', links: [], authors: [] },
    { title: 'b', year: 2024, citations: 2, relevanceRaw: 3, type: 'article', links: [], authors: [] },
    { title: 'c', year: 2010, citations: 100, relevanceRaw: 2, type: 'article', links: [], authors: [] },
  ];
  assert.equal(rankItems(items, { sort: 'time', limit: 3, query: 'x' })[0].title, 'b');
  assert.equal(rankItems(items, { sort: 'citations', limit: 3, query: 'x' })[0].title, 'c');
  assert.equal(rankItems(items, { sort: 'relevance', limit: 3, query: 'x' })[0].title, 'b');
});

test('rankItems: strict priority keeps clearly more relevant paper first', () => {
  const items = [
    { title: 'relevant-old', year: 2000, citations: 10, relevanceRaw: 100, type: 'article', links: [], authors: [] },
    { title: 'new-high-cited', year: new Date().getFullYear(), citations: 1000, relevanceRaw: 50, type: 'article', links: [], authors: [] },
  ];
  const weighted = rankItems(items, { sort: 'balanced', limit: 2, query: 'x' });
  assert.equal(weighted[0].title, 'new-high-cited');
  const strict = rankItems(items, { sort: 'balanced', limit: 2, query: 'x', strictPriority: true });
  assert.equal(strict[0].title, 'relevant-old');
});

test('buildAnalysisPrompt carries DOI, role and anti-hallucination rules', () => {
  const prompt = buildAnalysisPrompt(
    [
      {
        title: 'A test paper',
        authors: ['A. Author'],
        year: 2024,
        venue: 'ApJ',
        doi: 'https://doi.org/10.1234/test',
        abstract: 'We test things.',
        citations: 5,
        links: [{ label: 'DOI', url: 'https://doi.org/10.1234/test' }],
      },
    ],
    { role: 'undergrad', focus: 'method', question: 'What is new?' },
  );
  assert.match(prompt, /本科生/);
  assert.match(prompt, /10\.1234\/test/);
  assert.match(prompt, /不得编造/);
  assert.match(prompt, /What is new/);
});

test('cnkiLinks encodes query and documents the limitation', () => {
  const links = cnkiLinks('引力透镜');
  assert.match(links.kns, /kns\.cnki\.net/);
  assert.match(links.search, /search\.cnki\.com\.cn/);
  assert.match(links.note, /没有公开 API/);
});

test('store saves, lists and exports terms', async () => {
  const home = await mkdtemp(join(tmpdir(), 'astro-ph-researcher-test-'));
  process.env.ASTRO_PH_RESEARCHER_HOME = home;
  try {
    const store = await import(`../lib/store.js?test=${Date.now()}`);
    await store.initStore();
    const saved = store.upsertSavedTerm({
      en: 'redshift',
      zh: '红移',
      astrodictId: '9952',
      explanation: '测试释义',
      tags: ['cosmology'],
    });
    assert.equal(saved.en, 'redshift');
    assert.equal(store.listSavedTerms('红移').length, 1);
    const md = store.exportTerms('md');
    assert.match(md, /天文术语本/);
    assert.match(md, /redshift/);
    assert.equal(store.deleteSavedTerm(saved.id), true);
    assert.equal(store.listSavedTerms('').length, 0);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
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
