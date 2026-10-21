// astro-ph-researcher :: NADC 天文学名词 (https://nadc.china-vo.org/astrodict/) client
import {
  clamp,
  containsAll,
  dice,
  fetchText,
  normalizeSpace,
  normalizeTerm,
  sharedTerms,
  sleep,
  stripTags,
  tokens,
  truncate,
  unique,
} from './util.js';
import { findSeedTerm, mergeSeedIntoTerm } from './seed.js';
import { dictionarySearchUrl, dictionaryStatus, offlineLookup } from './dictionary.js';

export const ASTRODICT_BASE = 'https://nadc.china-vo.org/astrodict';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const CACHE_MAX = 300;
const MIN_INTERVAL_MS = 1000;

const cache = new Map();
const inflight = new Map();

let rateChain = Promise.resolve();
let lastRequestAt = 0;

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
  while (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
}

function schedule(task) {
  const run = rateChain.then(async () => {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    return task();
  });
  rateChain = run.catch(() => {});
  return run;
}

async function fetchPage(path, query) {
  const url = `${ASTRODICT_BASE}${path}${query ? `?${query}` : ''}`;
  const key = `page:${url}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  if (inflight.has(key)) return inflight.get(key);

  const promise = schedule(async () => {
    const html = await fetchText(url, {
      timeoutMs: 9000,
      headers: { accept: 'text/html,application/xhtml+xml' },
      retries: 1,
    });
    cacheSet(key, html);
    return html;
  }).finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

/**
 * Parse the result table shared by /fuzzy and /precise.
 * Each row: id, English name, abbreviation, language, Chinese name(s).
 */
export function parseResultTable(html) {
  const source = String(html ?? '');
  const table = source.match(/<table[^>]*id=["']resulttbl["'][\s\S]*?<\/table>/i)?.[0];
  if (!table) return [];
  const rows = [];
  for (const rowMatch of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length < 4) continue;
    const link = cells[0].match(/termdetails\?id=(\d+)[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const id = link[1];
    const enRaw = stripTags(link[2]);
    const enParts = enRaw
      .split(/[;；]/)
      .map((part) => normalizeSpace(part))
      .filter(Boolean);
    const en = enParts[0] ?? '';
    const abbr = stripTags(cells[1]);
    const lang = stripTags(cells[2]);
    const zhRaw = stripTags(cells[3]);
    const zhParts = zhRaw
      .split(/[;；]/)
      .map((part) => normalizeSpace(part))
      .filter(Boolean);
    const zh = zhParts[0] ?? '';
    const aliases = unique([...enParts.slice(1), ...zhParts.slice(1), ...(abbr ? [abbr] : [])]);
    if (!en && !zh) continue;
    rows.push({
      id,
      en,
      enRaw,
      zh,
      zhRaw,
      aliases,
      abbr,
      lang,
      url: `${ASTRODICT_BASE}/termdetails?id=${id}`,
    });
  }
  return rows;
}

/**
 * Parse one term detail page. NADC publishes the audited Chinese name, status,
 * source dictionaries, revision date, and — for entries covered by the
 * "定义版" — an authoritative Chinese definition, plus optional notes,
 * examples and category tags.
 */
export function parseTermDetail(html) {
  const source = String(html ?? '');
  const block = source.match(/<div class=["']termDetailsBlock["']>([\s\S]*?)<div class=["']commentBlock["']/i)?.[1] ?? source;
  const text = stripTags(block);

  const enRaw = normalizeSpace(block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1]?.replace(/<[^>]+>/g, '') ?? '');
  const en = enRaw.split(/[;；]/)[0]?.trim() ?? '';
  const status =
    block.match(/（\s*<span[^>]*>\s*([^<]{1,12})\s*<\/span>\s*）/) ?.[1]?.trim() ??
    (text.includes('已出版') ? '已出版' : '');
  const zhTW = text.match(/台湾名[：:]\s*([^）)]+)/)?.[1]?.trim() ?? '';

  let zh = '';
  let zhRaw = '';
  const afterLang = text.match(/【[^】]{1,8}】\s*([^（(]+?)\s*(?:（|$)/);
  if (afterLang) {
    // Some entries print "缩写：BH" on the line before the Chinese name.
    zhRaw = normalizeSpace(afterLang[1]).replace(/^缩写[：:]\s*[^\n]*\n?/, '').trim();
    const zhParts = zhRaw
      .split(/[;；]/)
      .map((part) => normalizeSpace(part))
      .filter(Boolean);
    zh = zhParts[0] ?? '';
  }
  if (!zh) {
    const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
    const titleText = stripTags(title);
    zh = normalizeSpace(titleText.split(/[（(]/)[0]);
  }

  // The detail block contains two ordered lists: the authoritative source
  // dictionaries ("依据") and, when contributors supplied it, the etymology.
  const basisStart = block.indexOf('依据');
  const basisEnd = block.indexOf('最后修订');
  const basisBlock = basisStart >= 0 ? block.slice(basisStart, basisEnd > basisStart ? basisEnd : undefined) : block;
  const sources = [...basisBlock.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  const lastRevised = text.match(/最后修订[：:]\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/)?.[1] ?? '';
  const etymologyStart = block.indexOf('词源');
  const etymologyBlock = etymologyStart >= 0 ? block.slice(etymologyStart) : '';
  const etymology = [...etymologyBlock.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);

  const section = (label) => {
    const pattern = new RegExp(
      `<div[^>]*class=["']titleLine["'][^>]*>\\s*${label}\\s*</div>([\\s\\S]*?)(?=<div[^>]*class=["']titleLine["']|<div[^>]*class=["']commentBlock["']|$)`,
      'i',
    );
    return normalizeSpace(stripTags(block.match(pattern)?.[1] ?? ''));
  };

  const definition = section('定义');
  const notes = section('备注');
  const examples = section('范例') ? [section('范例')] : [];
  const tagSection =
    block.match(/<div[^>]*class=["']titleLine["'][^>]*>\s*标签\s*<\/div>([\s\S]*?)(?=<div[^>]*class=["']titleLine["']|$)/i)?.[1] ?? '';
  const nadcTags = unique(
    [...tagSection.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => stripTags(match[1])).filter(Boolean),
  );

  return {
    en,
    zh,
    zhRaw,
    zhAliases: zhRaw
      .split(/[;；]/)
      .map((part) => normalizeSpace(part))
      .filter((part) => part && part !== zh),
    zhTW,
    status,
    sources,
    lastRevised,
    etymology,
    definition,
    definitionSource: definition ? 'NADC《天文学名词（定义版）》' : '',
    notes,
    examples,
    nadcTags,
    rawText: truncate(text, 1600),
  };
}

function lengthRatio(a, b) {
  const left = Math.max(1, String(a ?? '').length);
  const right = Math.max(1, String(b ?? '').length);
  return Math.min(left, right) / Math.max(left, right);
}

/**
 * Score how well one NADC row matches the user query.
 * 1.00 = the audited English or Chinese name is an exact match.
 */
export function scoreRow(query, row) {
  const q = normalizeTerm(query);
  const en = normalizeTerm(row.en);
  const zh = normalizeTerm(row.zh);
  if (!q) return 0;
  if (q === en || q === zh) return 1;
  if (normalizeTerm(row.abbr) === q) return 0.97;
  if ((row.aliases ?? []).some((alias) => normalizeTerm(alias) === q)) return 0.97;

  const qTokens = tokens(query);
  const enTokens = tokens(row.en);
  let score = 0;

  if (qTokens.length && enTokens.length) {
    if (containsAll(enTokens, qTokens)) {
      score = Math.max(score, 0.84 + 0.1 * (qTokens.length / enTokens.length));
    } else if (containsAll(qTokens, enTokens)) {
      score = Math.max(score, 0.8 + 0.1 * (enTokens.length / qTokens.length));
    } else {
      score = Math.max(score, 0.55 * jaccardSafe(qTokens, enTokens) + 0.35 * dice(q, en));
    }
    if (en.startsWith(`${q} `) || en.startsWith(q)) score = Math.max(score, 0.9);
    if (en.endsWith(` ${q}`)) score = Math.max(score, 0.82);
  }

  if (/[\u4e00-\u9fff]/.test(q) && zh) {
    if (zh === q) score = Math.max(score, 1);
    else if (zh.includes(q) || q.includes(zh)) score = Math.max(score, 0.72 + 0.22 * lengthRatio(q, zh));
    else score = Math.max(score, 0.35 * charOverlap(q, zh));
  }

  return clamp(score, 0, 0.99);
}

function jaccardSafe(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function charOverlap(a, b) {
  const left = [...new Set(String(a).replace(/\s+/g, ''))];
  const right = new Set(String(b).replace(/\s+/g, ''));
  if (!left.length || !right.size) return 0;
  let hit = 0;
  for (const char of left) if (right.has(char)) hit += 1;
  return hit / left.length;
}

function relatedScore(base, row) {
  if (!base || !row) return 0;
  if (normalizeTerm(base.en) === normalizeTerm(row.en)) return 0;
  const baseTokens = tokens(base.en);
  const rowTokens = tokens(row.en);
  const shared = sharedTerms(base.en, row.en);
  let score = 0.5 * jaccardSafe(baseTokens, rowTokens);
  if (shared.length) score += 0.08 * Math.min(shared.length, 3);
  const baseHead = baseTokens[baseTokens.length - 1];
  const rowHead = rowTokens[rowTokens.length - 1];
  if (baseHead && baseHead === rowHead) score += 0.18;
  const zhOverlap = charOverlap(base.zh, row.zh);
  score += 0.18 * zhOverlap;
  if (row.en.toLowerCase().startsWith(`${base.en.toLowerCase()} `)) score += 0.12;
  if (row.en.toLowerCase().endsWith(base.en.toLowerCase())) score += 0.06;
  return score;
}

function relatedReason(base, row) {
  const shared = sharedTerms(base.en, row.en);
  if (shared.length) return `共享词根：${shared.join(', ')}`;
  if (charOverlap(base.zh, row.zh) >= 0.5) return '中文名高度重叠';
  return '同一检索族中的近邻词';
}

async function searchRows(word) {
  const query = String(word ?? '').trim();
  if (!query) return { rows: [], endpoint: null };

  // NADC's fuzzy search is noisy for abbreviations (AGN -> 100 rows of
  // "AB magnitude" etc.); precise is the correct endpoint for those.
  const looksLikeAbbreviation = /^[A-Z0-9][A-Z0-9-]{1,9}$/.test(query) && /[A-Z]{2}/.test(query) && !/[a-z]/.test(query);
  const endpoints = looksLikeAbbreviation ? ['precise', 'fuzzy'] : ['fuzzy', 'precise'];

  for (const endpoint of endpoints) {
    try {
      const html = await fetchPage(`/${endpoint}`, `word=${encodeURIComponent(query)}`);
      const rows = parseResultTable(html);
      if (rows.length) return { rows, endpoint };
    } catch {
      /* try the next endpoint */
    }
  }
  return { rows: [], endpoint: null };
}

async function detailFor(id) {
  const key = `detail:${id}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const html = await fetchPage('/termdetails', `id=${encodeURIComponent(id)}`);
  const parsed = parseTermDetail(html);
  cacheSet(key, parsed);
  return parsed;
}

function toPublicTerm(row, extra = {}) {
  return {
    en: row.en,
    zh: row.zh,
    zhTW: row.zhTW ?? '',
    abbr: row.abbr ?? '',
    aliases: unique([...(row.aliases ?? []), ...(row.zhRaw && row.zhRaw !== row.zh ? [row.zhRaw] : [])]),
    astrodictId: String(row.id ?? ''),
    astrodictUrl: row.url ?? (row.id ? `${ASTRODICT_BASE}/termdetails?id=${row.id}` : ''),
    status: row.status ?? '',
    sources: row.sources ?? [],
    lastRevised: row.lastRevised ?? '',
    etymology: row.etymology ?? [],
    definition: row.definition ?? '',
    definitionSource: row.definitionSource ?? '',
    notes: row.notes ?? '',
    examples: row.examples ?? [],
    nadcTags: row.nadcTags ?? [],
    ...extra,
  };
}

/**
 * Look up one term in NADC. Returns an audited translation plus related terms.
 * The explanation field is the curated local seed explanation when available;
 * it is explicitly marked as a DSH explanation, not NADC text.
 */
export async function lookupTerm(input, options = {}) {
  const query = String(input ?? '').trim();
  const includeRelated = options.includeRelated !== false;
  const relatedLimit = clamp(options.relatedLimit ?? 8, 1, 20);
  const requestedId = String(options.astrodictId ?? '').trim();
  const dictionary = dictionaryStatus();
  const dictionaryInfo = (used = false) => ({
    installed: dictionary.installed,
    version: dictionary.version,
    count: dictionary.count,
    used,
    license: dictionary.license,
    page: dictionary.page,
  });

  if (!query && !requestedId) {
    return { found: false, query, error: 'empty', candidates: [], related: [] };
  }

  // Explicit id selection (used by the sense switcher in the sidebar).
  if (requestedId) {
    try {
      const detail = await detailFor(requestedId);
      if (!detail?.en && !detail?.zh) throw new Error('empty detail');
      const seed = findSeedTerm(detail.en || detail.zh);
      const row = {
        id: requestedId,
        en: detail.en || seed?.en || '',
        zh: detail.zh || seed?.zh || '',
        zhTW: detail.zhTW,
        abbr: seed?.abbr ?? '',
        aliases: detail.zhAliases ?? [],
        url: `${ASTRODICT_BASE}/termdetails?id=${requestedId}`,
        status: detail.status || '已出版',
        sources: detail.sources ?? [],
        lastRevised: detail.lastRevised ?? '',
        etymology: detail.etymology ?? [],
        definition: detail.definition ?? '',
        definitionSource: detail.definitionSource ?? '',
        notes: detail.notes ?? '',
        examples: detail.examples ?? [],
        nadcTags: detail.nadcTags ?? [],
      };
      let term = toPublicTerm(row, {
        explanation: seed?.explanation ?? '',
        formula: seed?.formula ?? '',
        formulaLatex: seed?.formulaLatex ?? '',
        units: seed?.units ?? '',
        misconceptions: seed?.misconceptions ?? [],
        field: seed?.field ?? '',
        level: seed?.level ?? '',
        literatureQuery: seed?.literatureQuery ?? row.en,
        literatureQueryZh: seed?.literatureQueryZh ?? row.zh,
        relatedSeed: seed?.related ?? [],
        explanationSource: seed?.explanation ? 'seed' : '',
        seedKey: seed?.key ?? '',
      });
      if (seed) term = mergeSeedIntoTerm(term, seed);
      return {
        found: true,
        query: query || term.en,
        matchedBy: 'id',
        confidence: 1,
        verification: 'nadc-live',
        term,
        candidates: [],
        senses: [
          {
            en: term.en,
            zh: term.zh,
            abbr: term.abbr,
            id: term.astrodictId,
            url: term.astrodictUrl,
            score: 1,
            match: 'id',
            selected: true,
          },
        ],
        ambiguous: false,
        alternatives: [],
        related: [],
        dictionary: dictionaryInfo(false),
        fetchedAt: new Date().toISOString(),
        attribution: {
          name: '国家天文台 · 天文学名词（NADC）',
          url: `${ASTRODICT_BASE}/`,
          termUrl: term.astrodictUrl,
          translationVerified: true,
          explanationNote: '中文译名、定义与出版信息来自 NADC 审定词条；DSH 释义为插件生成的物理学解释，不是名词委原文。',
        },
      };
    } catch (error) {
      return {
        found: false,
        query: query || requestedId,
        error: 'detail_unavailable',
        note: `未能读取 NADC 词条 #${requestedId}：${error?.message ?? error}`,
        candidates: [],
        related: [],
        dictionary: dictionaryInfo(false),
      };
    }
  }

  const seed = findSeedTerm(query);
  const offline = dictionary.installed ? offlineLookup(query, 10) : [];
  let rows = [];
  let endpoint = null;
  let networkError = null;

  try {
    const result = await searchRows(query);
    rows = result.rows;
    endpoint = result.endpoint;
  } catch (error) {
    networkError = error?.message ?? String(error);
  }

  const candidates = rows
    .map((row) => ({ row, score: scoreRow(query, row) }))
    .sort((a, b) => b.score - a.score || a.row.en.length - b.row.en.length)
    .slice(0, 10)
    .map(({ row, score }) => ({
      en: row.en,
      zh: row.zh,
      abbr: row.abbr,
      id: row.id,
      url: row.url,
      score: Number(score.toFixed(3)),
      match: score >= 0.99 ? 'exact' : score >= 0.8 ? 'strong' : 'near',
    }));

  const best = candidates[0];
  const bestRow = best
    ? rows.find((row) => String(row.id) === String(best.id)) ?? {
        id: best.id,
        en: best.en,
        zh: best.zh,
        abbr: best.abbr,
        aliases: [],
        url: best.url,
      }
    : null;
  const seedFallback = seed && (!best || best.score < 0.55);
  const offlineFallback = !seedFallback && offline.length > 0 && (!best || best.score < 0.9);

  if (!best && !seed && !offline.length) {
    return {
      found: false,
      query,
      endpoint,
      networkError,
      candidates: [],
      related: [],
      dictionary: dictionaryInfo(false),
      note: networkError
        ? '未能连接 NADC 名词库，且本地词表没有该词。可稍后重试，或先用英文关键词查文献。'
        : 'NADC 名词库没有检索到匹配词条；请换用英文单数形式、全称或缩写重试。',
    };
  }

  let term;
  let matchedBy = best ? (best.score >= 0.99 ? 'exact' : 'near') : 'seed';
  let detailFetched = false;
  let senses = [];

  if (seedFallback) {
    term = toPublicTerm(
      {
        id: seed.astrodictId,
        en: seed.en,
        zh: seed.zh,
        zhTW: seed.zhTW,
        abbr: seed.abbr,
        aliases: seed.aliases,
        url: seed.astrodictUrl,
        status: seed.status,
        sources: seed.sources,
        lastRevised: seed.lastRevised,
        definition: seed.definition ?? '',
        definitionSource: seed.definitionSource ?? (seed.definition ? 'NADC《天文学名词（定义版）》' : ''),
        notes: seed.notes ?? '',
        examples: seed.examples ?? [],
        nadcTags: seed.nadcTags ?? [],
      },
      {
        explanation: seed.explanation ?? '',
        formula: seed.formula ?? '',
        formulaLatex: seed.formulaLatex ?? '',
        units: seed.units ?? '',
        misconceptions: seed.misconceptions ?? [],
        field: seed.field ?? '',
        level: seed.level ?? '',
        literatureQuery: seed.literatureQuery ?? seed.en,
        literatureQueryZh: seed.literatureQueryZh ?? seed.zh,
        relatedSeed: seed.related ?? [],
        explanationSource: seed.explanation ? 'seed' : '',
        seedKey: seed.key,
      },
    );
    matchedBy = seed.seedMatch === 'exact' ? 'seed-exact' : 'seed-prefix';
    senses = [
      {
        en: seed.en,
        zh: seed.zh,
        abbr: seed.abbr,
        id: seed.astrodictId,
        url: seed.astrodictUrl,
        score: 1,
        match: 'seed',
        selected: true,
      },
    ];
  } else if (offlineFallback) {
    const primary = offline[0];
    term = offlineToTerm(primary, seed);
    matchedBy = 'offline-dictionary';
    senses = offline.map((candidate, index) => ({
      ...candidate,
      id: '',
      url: dictionarySearchUrl(candidate.en),
      selected: index === 0,
    }));
  } else {
    let detail = null;
    try {
      detail = await detailFor(best.id);
      detailFetched = Boolean(detail?.en || detail?.sources?.length || detail?.lastRevised);
    } catch {
      /* the table row is already authoritative enough for the name */
    }
    const mergedRow = {
      ...bestRow,
      zh: detail?.zh && !/[\n]|^缩写/.test(detail.zh) ? detail.zh : bestRow.zh,
      zhTW: detail?.zhTW ?? '',
      en: detail?.en || bestRow.en,
      aliases: unique([...(bestRow.aliases ?? []), ...(detail?.zhAliases ?? [])]),
      status: detail?.status || '已出版',
      sources: detail?.sources ?? [],
      lastRevised: detail?.lastRevised ?? '',
      etymology: detail?.etymology ?? [],
      definition: detail?.definition ?? '',
      definitionSource: detail?.definitionSource ?? '',
      notes: detail?.notes ?? '',
      examples: detail?.examples ?? [],
      nadcTags: detail?.nadcTags ?? [],
    };
    term = toPublicTerm(mergedRow, {
      explanation: seed?.explanation ?? '',
      formula: seed?.formula ?? '',
        formulaLatex: seed?.formulaLatex ?? '',
      units: seed?.units ?? '',
      misconceptions: seed?.misconceptions ?? [],
      field: seed?.field ?? '',
      level: seed?.level ?? '',
      literatureQuery: seed?.literatureQuery ?? bestRow.en,
      literatureQueryZh: seed?.literatureQueryZh ?? bestRow.zh,
      relatedSeed: seed?.related ?? [],
      explanationSource: seed?.explanation ? 'seed' : '',
      seedKey: seed?.key ?? '',
    });
    if (seed) term = mergeSeedIntoTerm(term, seed);
    senses = candidates.slice(0, 8).map((candidate) => ({
      ...candidate,
      selected: String(candidate.id) === String(term.astrodictId),
    }));
    if (!senses.some((sense) => sense.selected) && term.astrodictId) {
      senses.unshift({
        en: term.en,
        zh: term.zh,
        abbr: term.abbr,
        id: term.astrodictId,
        url: term.astrodictUrl,
        score: Number((best?.score ?? 0.9).toFixed(3)),
        match: 'selected',
        selected: true,
      });
    }
  }

  const related = [];
  const seen = new Set([normalizeTerm(term.en), normalizeTerm(term.zh)]);
  if (includeRelated) {
    // Curated seed relations are pedagogically better than pure string
    // neighbours (e.g. "测光红移 / CMB / 引力透镜效应" for redshift), so they
    // come first and resolve to a live NADC link when possible.
    for (const label of term.relatedSeed ?? []) {
      const key = normalizeTerm(label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const live = rows.find((row) => normalizeTerm(row.zh) === key || normalizeTerm(row.en) === key);
      related.push({
        en: live?.en ?? '',
        zh: live?.zh ?? label,
        abbr: live?.abbr ?? '',
        id: live?.id ?? '',
        url: live?.url ?? '',
        score: 0.6,
        reason: '词表推荐关联词',
        recommended: true,
      });
    }
    for (const row of rows) {
      if (!row.en) continue;
      if (normalizeTerm(row.en) === normalizeTerm(term.en)) continue;
      if (normalizeTerm(row.zh) === normalizeTerm(term.zh)) continue;
      const score = relatedScore(term, row);
      if (score < 0.14) continue;
      const key = normalizeTerm(row.en);
      if (seen.has(key)) continue;
      seen.add(key);
      related.push({
        en: row.en,
        zh: row.zh,
        abbr: row.abbr,
        id: row.id,
        url: row.url,
        score: Number(score.toFixed(3)),
        reason: relatedReason(term, row),
      });
    }
    related.sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || b.score - a.score);
  }

  const offlineUsed = matchedBy === 'offline-dictionary';
  const verification = offlineUsed
    ? 'offline-dictionary'
    : networkError
      ? 'seed-offline'
      : matchedBy.startsWith('seed')
        ? 'seed-only'
        : detailFetched
          ? 'nadc-live'
          : 'nadc-table';
  const alternatives = senses.filter(
    (sense) => !sense.selected && (normalizeTerm(sense.zh) === normalizeTerm(term.zh) || sense.score >= 0.97),
  );
  const ambiguous = alternatives.length > 0;

  return {
    found: true,
    query,
    endpoint,
    networkError,
    matchedBy,
    confidence: best ? best.score : offlineUsed ? offline[0]?.score ?? 0.9 : 0.9,
    verification,
    ambiguous,
    term: {
      ...term,
      tags: [],
      note: '',
    },
    candidates: candidates.filter((candidate) => String(candidate.id) !== String(term.astrodictId)),
    senses,
    alternatives,
    related: related.slice(0, relatedLimit),
    note: offlineUsed
      ? '来自官方离线词表；离线词表不含词条 id/定义，“打开词条”会打开 NADC 检索页，联网后可补全定义与详情。'
      : '',
    dictionary: dictionaryInfo(offlineUsed),
    fetchedAt: new Date().toISOString(),
    attribution: {
      name: '国家天文台 · 天文学名词（NADC）',
      url: `${ASTRODICT_BASE}/`,
      termUrl: term.astrodictUrl,
      translationVerified: matchedBy !== 'seed' || Boolean(term.astrodictId),
      explanationNote: '中文译名、定义与出版信息来自 NADC 审定词条；DSH 释义为插件生成的物理学解释，不是名词委原文。',
    },
  };
}

function offlineToTerm(candidate, seed) {
  return toPublicTerm(
    {
      id: '',
      en: candidate.en,
      zh: candidate.zh,
      zhTW: '',
      abbr: candidate.abbr ?? '',
      aliases: [],
      url: dictionarySearchUrl(candidate.en),
      status: '',
      sources: [],
      lastRevised: '',
      definition: seed?.definition ?? '',
      definitionSource: seed?.definitionSource ?? '',
      notes: seed?.notes ?? '',
      examples: seed?.examples ?? [],
      nadcTags: seed?.nadcTags ?? [],
    },
    {
      explanation: seed?.explanation ?? '',
      formula: seed?.formula ?? '',
        formulaLatex: seed?.formulaLatex ?? '',
      units: seed?.units ?? '',
      misconceptions: seed?.misconceptions ?? [],
      field: seed?.field ?? '',
      level: seed?.level ?? '',
      literatureQuery: seed?.literatureQuery ?? candidate.en,
      literatureQueryZh: seed?.literatureQueryZh ?? candidate.zh,
      relatedSeed: seed?.related ?? [],
      explanationSource: seed?.explanation ? 'seed' : '',
      seedKey: seed?.key ?? '',
    },
  );
}


export function formatTermLookup(result, options = {}) {
  if (!result) return '没有结果。';
  if (!result.found) {
    const lines = [`未在 NADC 天文学名词库中找到「${result.query}」。`];
    if (result.note) lines.push(result.note);
    if (result.candidates?.length) {
      lines.push('', '可能的近邻词条：');
      for (const candidate of result.candidates) {
        lines.push(`- ${candidate.zh}（${candidate.en}） ${candidate.url}`);
      }
    }
    lines.push('', '建议：换用英文全称、单数或常见缩写重试；中文可先用已知英文名反查。');
    return lines.join('\n');
  }

  const term = result.term;
  const lines = [];
  lines.push(`【审定译名】${term.zh}（${term.en}）${term.abbr ? `  [${term.abbr}]` : ''}`);
  lines.push(
    `【核验】${term.status || 'NADC 词条'} · ${result.matchedBy === 'exact' || result.matchedBy === 'seed-exact' ? '精确匹配' : '近似匹配'} · 置信度 ${(result.confidence ?? 0).toFixed(2)}`,
  );
  if (term.astrodictUrl) lines.push(`【NADC 词条】${term.astrodictUrl}`);
  if (term.zhTW && term.zhTW !== term.zh) lines.push(`【台湾名】${term.zhTW}`);
  if (term.sources?.length) lines.push(`【依据】${term.sources.join('；')}`);
  if (term.lastRevised) lines.push(`【最后修订】${term.lastRevised}`);
  if (term.field) lines.push(`【领域】${term.field}`);
  if (term.nadcTags?.length) lines.push(`【NADC 标签】${term.nadcTags.join(' / ')}`);
  lines.push('');
  if (term.definition) {
    lines.push(`【NADC 审定定义】${term.definition}`);
    lines.push(`（来源：${term.definitionSource || 'NADC《天文学名词（定义版）》'}；这是名词委原文，不是 DSH 生成。）`);
  } else {
    lines.push('【NADC 审定定义】该词条详情页未提供“定义”字段（并非每条 NADC 词条都有定义版原文）。');
  }
  lines.push('');
  if (term.explanation) {
    lines.push(`【DSH 释义（非名词委原文）】${term.explanation}`);
    if (term.formula) lines.push(`【关键公式】${term.formula}`);
  if (term.formulaLatex) lines.push(`【LaTeX（可粘贴）】\`${term.formulaLatex}\``);
    if (term.units) lines.push(`【单位/量纲】${term.units}`);
    if (term.misconceptions?.length) {
      lines.push('【常见误解】');
      for (const item of term.misconceptions) lines.push(`- ${item}`);
    }
  } else {
    lines.push(
      '【DSH 释义（非名词委原文）】本地词表暂无该词释义。请按“定义 → 物理图像 → 关键公式/单位 → 观测意义 → 易混概念”讲解，并明确标注为 DSH 解释。',
    );
  }
  if (term.examples?.length) {
    lines.push('【NADC 范例】');
    for (const example of term.examples) lines.push(`- ${truncate(example, 500)}`);
  }
  if (term.notes) lines.push(`【NADC 备注】${truncate(term.notes, 300)}`);
  if (result.alternatives?.length) {
    lines.push('', '【同名词条/其他译名（请确认具体指哪一个）】');
    lines.push(`- 当前：${term.zh}（${term.en}）${term.astrodictId ? ` #${term.astrodictId}` : ''}`);
    for (const alternative of result.alternatives.slice(0, 6)) {
      lines.push(
        `- 其他：${alternative.zh}（${alternative.en}）${alternative.id ? ` #${alternative.id}` : ''}${alternative.url ? ` ${alternative.url}` : ''} — 匹配度 ${alternative.score}`,
      );
    }
    lines.push('保存或引用前请确认中文名对应的英文词条；需要切换时用 astrodictId 重新查询。');
  }
  if (result.related?.length) {
    lines.push('', '【相关术语】');
    for (const item of result.related.slice(0, options.relatedLimit ?? 8)) {
      lines.push(`- ${item.zh}${item.en ? `（${item.en}）` : ''}${item.url ? ` ${item.url}` : ''} — ${item.reason}`);
    }
  }
  lines.push('', '【下一步】可保存到术语本；或用英文名做文献检索（相关性优先，时间次之，引用数再次）。');
  return lines.join('\n');
}
