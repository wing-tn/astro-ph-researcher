// astro-ph-researcher :: offline dictionary parser / zip reader tests (no network)
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

process.env.ASTRO_PH_RESEARCHER_HOME = join(tmpdir(), 'astro-ph-researcher-dictionary-test');
const { parseDecoratedField, parseDictionaryLines, readZipEntries } = await import('../lib/dictionary.js');

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test('parseDecoratedField handles 全称/缩写 prefixes and semicolon variants', () => {
  const full = parseDecoratedField('全称：Two-degree-Field Galaxy Redshift Survey; 2dF Galaxy Redshift Survey。2度视场星系红移巡天');
  assert.equal(full.text, '2度视场星系红移巡天');
  assert.deepEqual(full.fullNames, ['Two-degree-Field Galaxy Redshift Survey', '2dF Galaxy Redshift Survey']);
  const abbr = parseDecoratedField('缩写：2dFGRS。2度视场星系红移巡天');
  assert.equal(abbr.text, '2度视场星系红移巡天');
  assert.deepEqual(abbr.abbrs, ['2dFGRS']);
  const both = parseDecoratedField('全称：21 Centimeter Array。缩写：21CMA');
  assert.equal(both.text, '');
  assert.deepEqual(both.fullNames, ['21 Centimeter Array']);
  assert.deepEqual(both.abbrs, ['21CMA']);
});

test('parseDictionaryLines merges ec/ce and keeps full name + abbreviation', () => {
  const ec = [
    'redshift\t红移',
    '2dFGRS\t全称：Two-degree-Field Galaxy Redshift Survey; 2dF Galaxy Redshift Survey。2度视场星系红移巡天',
    '21CMA\t全称：21 Centimeter Array。21厘米[射电望远镜]阵',
  ].join('\n');
  const ce = [
    '红移\tredshift',
    '2度视场星系红移巡天\t全称：Two-degree-Field Galaxy Redshift Survey; 2dF Galaxy Redshift Survey。缩写：2dFGRS',
  ].join('\n');
  const { entries, skipped } = parseDictionaryLines(ec, ce);
  assert.equal(skipped, 0);
  const redshift = entries.find((entry) => entry.en === 'redshift');
  assert.equal(redshift.zh, '红移');
  const survey = entries.find((entry) => entry.abbr === '2dFGRS');
  assert.ok(survey);
  assert.equal(survey.zh, '2度视场星系红移巡天');
  assert.match(survey.en, /Redshift Survey/);
  const array = entries.find((entry) => entry.abbr === '21CMA');
  assert.equal(array.zh, '21厘米[射电望远镜]阵');
  assert.equal(array.en, '21 Centimeter Array');
});

function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const raw = Buffer.from(entry.data, 'utf8');
    const method = entry.deflate ? 8 : 0;
    const data = entry.deflate ? deflateRawSync(raw) : raw;
    const crc = crc32(raw) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const localRecord = Buffer.concat([local, name, data]);
    locals.push(localRecord);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += localRecord.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

test('readZipEntries reads stored and deflated entries', () => {
  const zip = makeZip([
    { name: 'a_ec.txt', data: 'redshift\t红移\n', deflate: false },
    { name: 'b_ce.txt', data: '红移\tredshift\n', deflate: true },
  ]);
  const files = readZipEntries(zip);
  assert.deepEqual([...files.keys()], ['a_ec.txt', 'b_ce.txt']);
  assert.equal(files.get('a_ec.txt').toString('utf8'), 'redshift\t红移\n');
  assert.equal(files.get('b_ce.txt').toString('utf8'), '红移\tredshift\n');
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
