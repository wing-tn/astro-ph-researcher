// astro-ph-researcher :: official NADC dictionary download + offline index
//
// The official zip is ~700 KB (r241020: 30,094 EN→ZH + 26,770 ZH→EN rows).
// Its licence allows integration and format conversion, but forbids modifying
// the content or republishing it merged into another dictionary product.
// Therefore we never bundle the zip or its rows with the plugin: this module
// downloads it only when the user explicitly asks, stores it under
// $DSH_HOME/astro-ph-researcher, and shows the attribution in the UI.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

import { DATA_DIR } from './store.js';
import { fetchText, fetchWithTimeout, log, normalizeTerm, unique, warn } from './util.js';

export const DICTIONARY_PATH = join(DATA_DIR, 'astrodict-dictionary.json');
export const FALLBACK_DICTIONARY_URL = 'https://nadc.china-vo.org/astrodict/s/2024/astrodict_241020.zip';
export const DICTIONARY_PAGE = 'https://nadc.china-vo.org/astrodict/article/download';
export const DICTIONARY_LICENSE =
  '“英汉天文学名词数据库”由中国天文学会天文学名词审定委员会提供。所有权归中国天文学会；未经授权不得用于以赢利为目的的商业产品和活动。允许集成、二次开发与格式转换，但不得修改内容，或与其他词库产品整合后二次发布。';

const MAX_ENTRY_BYTES = 20 * 1024 * 1024;
const MAX_ZIP_BYTES = 80 * 1024 * 1024;

let state = {
  loaded: false,
  loading: null,
  metadata: null,
  entries: [],
  byEn: new Map(),
  byZh: new Map(),
  byAbbr: new Map(),
};
let downloadPromise = null;

function emptyIndex() {
  return { byEn: new Map(), byZh: new Map(), byAbbr: new Map() };
}

function addToIndex(map, key, entry) {
  const normalized = normalizeTerm(key);
  if (!normalized) return;
  const list = map.get(normalized);
  if (!list) {
    map.set(normalized, [entry]);
    return;
  }
  if (!list.includes(entry)) list.push(entry);
}

function buildIndex(entries) {
  const index = emptyIndex();
  for (const entry of entries) {
    addToIndex(index.byEn, entry.en, entry);
    addToIndex(index.byEn, entry.fullName, entry);
    addToIndex(index.byEn, entry.abbr, entry);
    for (const alias of entry.aliases ?? []) addToIndex(index.byEn, alias, entry);
    addToIndex(index.byZh, entry.zh, entry);
    for (const alias of entry.zhAliases ?? []) addToIndex(index.byZh, alias, entry);
    if (entry.abbr) addToIndex(index.byAbbr, entry.abbr.toUpperCase(), entry);
  }
  return index;
}

export function dictionaryStatus() {
  return {
    installed: Boolean(state.metadata && state.entries.length),
    loaded: state.loaded,
    version: state.metadata?.version ?? '',
    downloadedAt: state.metadata?.downloadedAt ?? '',
    sourceUrl: state.metadata?.sourceUrl ?? FALLBACK_DICTIONARY_URL,
    license: DICTIONARY_LICENSE,
    page: DICTIONARY_PAGE,
    count: state.entries.length,
    path: DICTIONARY_PATH,
    error: state.metadata?.error ?? '',
  };
}

export async function initDictionary() {
  if (state.loading) return state.loading;
  state.loading = (async () => {
    try {
      const raw = await readFile(DICTIONARY_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
      state.metadata = parsed?.metadata ?? null;
      state.entries = entries;
      Object.assign(state, buildIndex(entries));
      state.loaded = true;
      log(`offline dictionary loaded: ${entries.length} entries (${state.metadata?.version ?? 'unknown'})`);
    } catch (error) {
      if (error?.code !== 'ENOENT') warn(`offline dictionary unavailable: ${error?.message ?? error}`);
      state.loaded = true;
      state.entries = [];
      state.metadata = null;
      Object.assign(state, emptyIndex());
    }
    return dictionaryStatus();
  })();
  return state.loading;
}

// ---------------------------------------------------------------------------
// ZIP reader (store + deflate; enough for the official NADC archive)
// ---------------------------------------------------------------------------
export function readZipEntries(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.length > MAX_ZIP_BYTES) throw new Error('zip too large');
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file (EOCD not found)');
  const count = buf.readUInt16LE(eocd + 10);
  const start = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  let p = start;
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip central directory');
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const uncompressedSize = buf.readUInt32LE(p + 24);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLength).toString('utf8');
    const localNameLength = buf.readUInt16LE(localOffset + 26);
    const localExtraLength = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buf.subarray(dataStart, dataStart + compressedSize);
    if (uncompressedSize > MAX_ENTRY_BYTES) throw new Error(`zip entry too large: ${name}`);
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES });
    else throw new Error(`unsupported zip compression method ${method} for ${name}`);
    entries.set(name, data);
    p += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

// ---------------------------------------------------------------------------
// TSV parser
// ---------------------------------------------------------------------------
function splitVariants(value) {
  return unique(String(value ?? '').split(/[;；]/).map((part) => part.trim()).filter(Boolean));
}

/**
 * NADC uses fields such as:
 *   全称：Two-degree-Field Galaxy Redshift Survey; 2dF Galaxy Redshift Survey。2度视场星系红移巡天
 *   缩写：2dFGRS。2度视场星系红移巡天
 * The decorated part is separated from the Chinese name by a full stop.
 */
export function parseDecoratedField(value) {
  let text = String(value ?? '').trim();
  const fullNames = [];
  const abbrs = [];
  for (;;) {
    const match = text.match(/^(全称|缩写)[：:]\s*([\s\S]*?)(?:。|$)/);
    if (!match) break;
    const values = splitVariants(match[2]);
    if (match[1] === '全称') fullNames.push(...values);
    else abbrs.push(...values);
    text = text.slice(match[0].length).replace(/^。\s*/, '').trim();
  }
  text = text.replace(/^。\s*/, '').trim();
  return { text, fullNames: unique(fullNames), abbrs: unique(abbrs) };
}

function looksLikeAbbreviation(value) {
  const text = String(value ?? '').trim();
  if (!text || text.length > 24 || /\s/.test(text)) return false;
  const uppercase = (text.match(/[A-Z]/g) ?? []).length;
  if (uppercase < 2) return false;
  return /^[A-Za-z0-9'’.\-]+$/.test(text) && !/^[A-Z][a-z]+$/.test(text);
}

function makeEntry(left, right, direction, lineNo) {
  const enField = direction === 'ec' ? left : right;
  const zhField = direction === 'ec' ? right : left;
  const enParsed = parseDecoratedField(enField);
  const zhParsed = parseDecoratedField(zhField);

  const enText = enParsed.text;
  const fullName = enParsed.fullNames[0] || zhParsed.fullNames[0] || '';
  const en = fullName || enText || enParsed.abbrs[0] || zhParsed.abbrs[0] || '';
  const abbr = enParsed.abbrs[0] || zhParsed.abbrs[0] || (looksLikeAbbreviation(enText) ? enText : '');
  const zhVariants = splitVariants(zhParsed.text);
  const zh = zhVariants[0] || '';
  if (!en || !zh) return null;

  const enAliases = unique([
    enText,
    ...enParsed.fullNames,
    ...zhParsed.fullNames,
    ...enParsed.abbrs,
    ...zhParsed.abbrs,
    abbr,
  ]).filter((value) => value && normalizeTerm(value) !== normalizeTerm(en));

  return {
    en,
    zh,
    abbr,
    fullName,
    aliases: enAliases,
    zhAliases: zhVariants.slice(1),
    source: 'NADC-dictionary',
    line: lineNo,
  };
}

export function parseDictionaryLines(ecText, ceText) {
  const byKey = new Map();
  let parsed = 0;
  let skipped = 0;
  const consume = (text, direction) => {
    const lines = String(text ?? '').split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.trim()) continue;
      const tab = line.indexOf('\t');
      if (tab <= 0) {
        skipped += 1;
        continue;
      }
      const entry = makeEntry(line.slice(0, tab), line.slice(tab + 1), direction, i + 1);
      if (!entry) {
        skipped += 1;
        continue;
      }
      parsed += 1;
      const key = `${normalizeTerm(entry.en)}\u0000${normalizeTerm(entry.zh)}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.aliases = unique([...existing.aliases, ...entry.aliases, entry.fullName]).filter(Boolean);
        existing.zhAliases = unique([...existing.zhAliases, ...entry.zhAliases]);
        if (!existing.abbr) existing.abbr = entry.abbr;
      } else {
        byKey.set(key, entry);
      }
    }
  };
  consume(ecText, 'ec');
  consume(ceText, 'ce');
  return { entries: [...byKey.values()], parsed, skipped };
}

// ---------------------------------------------------------------------------
// download
// ---------------------------------------------------------------------------
function versionFromUrl(url) {
  const match = String(url ?? '').match(/astrodict_(\d+)\.zip/i);
  if (!match) return 'unknown';
  const raw = match[1];
  return raw.length >= 6 ? `r${raw}` : `r${raw}`;
}

export async function discoverDictionaryUrl() {
  try {
    const html = await fetchText(DICTIONARY_PAGE, { timeoutMs: 12000, retries: 1 });
    const match = html.match(/https?:\/\/[^"'<>\s]+astrodict_\d+\.zip/i);
    if (match) return match[0];
    const relative = html.match(/\/astrodict\/s\/[^"'<>\s]+astrodict_\d+\.zip/i);
    if (relative) return `https://nadc.china-vo.org${relative[0]}`;
  } catch (error) {
    warn(`dictionary page unavailable: ${error?.message ?? error}`);
  }
  return FALLBACK_DICTIONARY_URL;
}

async function writeDictionaryAtomic(payload) {
  await mkdir(dirname(DICTIONARY_PATH), { recursive: true });
  const tmp = `${DICTIONARY_PATH}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, JSON.stringify(payload), 'utf8');
  await rename(tmp, DICTIONARY_PATH);
}

export function downloadDictionary() {
  if (downloadPromise) return downloadPromise;
  downloadPromise = (async () => {
    const sourceUrl = await discoverDictionaryUrl();
    log(`downloading NADC dictionary: ${sourceUrl}`);
    const response = await fetchWithTimeout(sourceUrl, {
      timeoutMs: 60000,
      retries: 1,
      headers: { accept: 'application/zip,application/octet-stream' },
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error('empty dictionary archive');
    const files = readZipEntries(buffer);
    const ecName = [...files.keys()].find((name) => /_ec\.txt$/i.test(name));
    const ceName = [...files.keys()].find((name) => /_ce\.txt$/i.test(name));
    if (!ecName || !ceName) throw new Error('dictionary archive does not contain _ec.txt / _ce.txt');
    const ecText = files.get(ecName).toString('utf8');
    const ceText = files.get(ceName).toString('utf8');
    const parsed = parseDictionaryLines(ecText, ceText);
    const metadata = {
      version: versionFromUrl(sourceUrl),
      sourceUrl,
      downloadedAt: new Date().toISOString(),
      license: DICTIONARY_LICENSE,
      page: DICTIONARY_PAGE,
      counts: {
        ec: ecText.split(/\r?\n/).filter(Boolean).length,
        ce: ceText.split(/\r?\n/).filter(Boolean).length,
        entries: parsed.entries.length,
        parsed: parsed.parsed,
        skipped: parsed.skipped,
      },
    };
    await writeDictionaryAtomic({ metadata, entries: parsed.entries });
    state.metadata = metadata;
    state.entries = parsed.entries;
    Object.assign(state, buildIndex(parsed.entries));
    state.loaded = true;
    log(`offline dictionary installed: ${parsed.entries.length} entries (${metadata.version})`);
    return dictionaryStatus();
  })().finally(() => {
    downloadPromise = null;
  });
  return downloadPromise;
}

// ---------------------------------------------------------------------------
// lookup
// ---------------------------------------------------------------------------
function toCandidate(entry, score, match) {
  return {
    en: entry.en,
    zh: entry.zh,
    abbr: entry.abbr || '',
    fullName: entry.fullName || '',
    score,
    match,
    source: 'offline-dictionary',
  };
}

export function offlineLookup(query, limit = 8) {
  if (!state.entries.length) return [];
  const q = normalizeTerm(query);
  if (!q) return [];
  const hits = new Map();
  const push = (entry, score, match) => {
    if (!entry) return;
    const key = `${normalizeTerm(entry.en)}\u0000${normalizeTerm(entry.zh)}`;
    const previous = hits.get(key);
    if (!previous || previous.score < score) hits.set(key, toCandidate(entry, score, match));
  };

  for (const entry of state.byEn.get(q) ?? []) push(entry, 1, 'exact');
  for (const entry of state.byZh.get(q) ?? []) push(entry, 1, 'exact');
  for (const entry of state.byAbbr.get(q.toUpperCase()) ?? []) push(entry, 0.99, 'abbr');

  if (!hits.size) {
    // Substring fallback: 30k keys is small enough for an interactive scan.
    for (const [key, list] of state.byEn) {
      if (key.includes(q) || q.includes(key)) {
        const lengthPenalty = Math.abs(key.length - q.length) / Math.max(key.length, q.length, 1);
        for (const entry of list) push(entry, 0.72 * (1 - lengthPenalty), 'contains');
      }
    }
    for (const [key, list] of state.byZh) {
      if (key.includes(q) || q.includes(key)) {
        const lengthPenalty = Math.abs(key.length - q.length) / Math.max(key.length, q.length, 1);
        for (const entry of list) push(entry, 0.7 * (1 - lengthPenalty), 'contains-zh');
      }
    }
  }

  return [...hits.values()].sort((a, b) => b.score - a.score || a.en.length - b.en.length).slice(0, limit);
}

export function dictionarySearchUrl(query) {
  return `https://nadc.china-vo.org/astrodict/fuzzy?word=${encodeURIComponent(String(query ?? ''))}`;
}
