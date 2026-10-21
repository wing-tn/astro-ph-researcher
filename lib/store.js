// astro-ph-researcher :: local term book + config persistence (no database, no network)
import { cpSync, existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  clamp,
  hashId,
  log,
  normalizeTerm,
  safeJsonParse,
  truncate,
  unique,
  warn,
} from './util.js';
import { allSeedTerms, seedTermCount } from './seed.js';

const DEFAULT_HOME = process.env.ASTRO_PH_RESEARCHER_HOME || process.env.DSH_HOME || join(homedir(), '.dsh');
export const DATA_DIR = join(DEFAULT_HOME, 'astro-ph-researcher');
const LEGACY_DATA_DIR = join(DEFAULT_HOME, 'astro-words');
const TERMS_PATH = join(DATA_DIR, 'terms.json');
const CONFIG_PATH = join(DATA_DIR, 'config.json');

export const DEFAULT_CONFIG = {
  version: 1,
  literature: {
    source: 'auto',
    mailto: '',
    halfLifeYears: 8,
    defaultSort: 'balanced',
    includePreprints: true,
    maxResults: 8,
    strictPriority: false,
    useAds: true,
  },
  astrodict: {
    timeoutMs: 9000,
  },
  ui: {
    language: 'zh',
    panelWidth: 460,
    fontScale: 1,
    role: 'grad',
  },
};

let loaded = false;
let terms = [];
let config = structuredClone(DEFAULT_CONFIG);
let saveTimer = null;
let saving = null;

function deepMerge(base, patch) {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, 'utf8');
    return safeJsonParse(raw, fallback);
  } catch {
    return fallback;
  }
}

export async function initStore() {
  if (loaded) return;
  // Rebrand migration: keep the old local library, terms and format workspaces.
  if (!existsSync(DATA_DIR) && existsSync(LEGACY_DATA_DIR)) {
    try {
      cpSync(LEGACY_DATA_DIR, DATA_DIR, { recursive: true });
      log(`migrated legacy data: ${LEGACY_DATA_DIR} -> ${DATA_DIR}`);
    } catch (error) {
      warn(`legacy data migration failed: ${error?.message ?? error}`);
    }
  }
  await mkdir(DATA_DIR, { recursive: true });
  const termData = await readJson(TERMS_PATH, { version: 1, terms: [] });
  const list = Array.isArray(termData) ? termData : termData?.terms;
  terms = Array.isArray(list)
    ? list.filter((term) => term && typeof term === 'object' && (term.en || term.zh)).map(normalizeSavedTerm)
    : [];
  const savedConfig = await readJson(CONFIG_PATH, {});
  config = deepMerge(DEFAULT_CONFIG, savedConfig ?? {});
  loaded = true;
  log(`store ready: ${terms.length} saved terms, ${seedTermCount()} seed terms, home=${DATA_DIR}`);
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, path);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow().catch((error) => warn('save failed:', error?.message ?? error));
  }, 250);
  saveTimer.unref?.();
}

export async function saveNow() {
  if (saving) return saving;
  saving = (async () => {
    await writeJsonAtomic(TERMS_PATH, { version: 1, updatedAt: new Date().toISOString(), terms });
    await writeJsonAtomic(CONFIG_PATH, config);
  })().finally(() => {
    saving = null;
  });
  return saving;
}

function normalizeSavedTerm(input) {
  const en = String(input.en ?? '').trim();
  const zh = String(input.zh ?? '').trim();
  const astrodictId = String(input.astrodictId ?? '').trim();
  const id = String(input.id ?? '').trim() || `term_${hashId(`${astrodictId || normalizeTerm(en) || normalizeTerm(zh)}`, 10)}`;
  return {
    id,
    en,
    zh,
    zhTW: String(input.zhTW ?? '').trim(),
    abbr: String(input.abbr ?? '').trim(),
    aliases: unique(Array.isArray(input.aliases) ? input.aliases.map(String) : []),
    astrodictId,
    astrodictUrl: String(input.astrodictUrl ?? (astrodictId ? `https://nadc.china-vo.org/astrodict/termdetails?id=${astrodictId}` : '')).trim(),
    status: String(input.status ?? '').trim(),
    sources: unique(Array.isArray(input.sources) ? input.sources.map(String) : []),
    lastRevised: String(input.lastRevised ?? '').trim(),
    definition: String(input.definition ?? '').trim(),
    definitionSource: String(input.definitionSource ?? (input.definition ? 'NADC《天文学名词（定义版）》' : '')).trim(),
    notes: String(input.notes ?? '').trim(),
    examples: unique(Array.isArray(input.examples) ? input.examples.map(String) : []),
    nadcTags: unique(Array.isArray(input.nadcTags) ? input.nadcTags.map(String) : []),
    field: String(input.field ?? '').trim(),
    level: String(input.level ?? '').trim(),
    explanation: String(input.explanation ?? '').trim(),
    formula: String(input.formula ?? '').trim(),
    formulaLatex: String(input.formulaLatex ?? '').trim(),
    units: String(input.units ?? '').trim(),
    misconceptions: unique(Array.isArray(input.misconceptions) ? input.misconceptions.map(String) : []),
    related: unique(Array.isArray(input.related) ? input.related.map(String) : []),
    literatureQuery: String(input.literatureQuery ?? en).trim(),
    literatureQueryZh: String(input.literatureQueryZh ?? zh).trim(),
    tags: unique(Array.isArray(input.tags) ? input.tags.map(String) : []),
    note: String(input.note ?? '').trim(),
    verified: input.verified !== false && Boolean(astrodictId),
    translationSource: input.translationSource === 'user' ? 'user' : astrodictId ? 'NADC' : 'user',
    explanationSource: input.explanationSource === 'seed' ? 'seed' : input.explanation ? 'DSH' : '',
    createdAt: String(input.createdAt ?? '') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function sameTerm(a, b) {
  if (a.astrodictId && b.astrodictId) return a.astrodictId === b.astrodictId;
  const enA = normalizeTerm(a.en);
  const enB = normalizeTerm(b.en);
  if (enA && enB) return enA === enB;
  return normalizeTerm(a.zh) === normalizeTerm(b.zh);
}

export function listSavedTerms(query = '', options = {}) {
  const q = normalizeTerm(query);
  const tag = String(options.tag ?? '').trim();
  const limit = clamp(options.limit ?? 200, 1, 500);
  let rows = terms;
  if (q) {
    rows = rows.filter((term) => {
      const haystack = normalizeTerm(
        [term.en, term.zh, term.zhTW, term.abbr, term.explanation, term.note, ...(term.aliases ?? []), ...(term.tags ?? [])].join(' '),
      );
      return haystack.includes(q);
    });
  }
  if (tag) rows = rows.filter((term) => (term.tags ?? []).includes(tag));
  return rows
    .slice()
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

export function getSavedTerm(id) {
  return terms.find((term) => term.id === id) ?? null;
}

export function upsertSavedTerm(input) {
  const next = normalizeSavedTerm(input);
  const index = terms.findIndex((term) => sameTerm(term, next));
  if (index >= 0) {
    const previous = terms[index];
    next.id = previous.id;
    next.createdAt = previous.createdAt;
    next.tags = unique([...(previous.tags ?? []), ...(next.tags ?? [])]);
    next.related = unique([...(previous.related ?? []), ...(next.related ?? [])]);
    if (!next.note) next.note = previous.note ?? '';
    if (!next.explanation) {
      next.explanation = previous.explanation ?? '';
      next.explanationSource = previous.explanationSource ?? '';
    }
    if (!next.formula) next.formula = previous.formula ?? '';
    if (!next.formulaLatex) next.formulaLatex = previous.formulaLatex ?? '';
    terms[index] = next;
  } else {
    terms.push(next);
  }
  scheduleSave();
  return next;
}

export function deleteSavedTerm(id) {
  const index = terms.findIndex((term) => term.id === id);
  if (index < 0) return false;
  terms.splice(index, 1);
  scheduleSave();
  return true;
}

export function getConfig() {
  return structuredClone(config);
}

export function updateConfig(patch) {
  config = deepMerge(config, patch ?? {});
  scheduleSave();
  return getConfig();
}

export function stats() {
  return {
    savedTerms: terms.length,
    seedTerms: seedTermCount(),
    dataDir: DATA_DIR,
    tags: unique(terms.flatMap((term) => term.tags ?? [])),
  };
}

export function seedCatalog() {
  return allSeedTerms().map((term) => ({
    key: term.key,
    en: term.en,
    zh: term.zh,
    field: term.field ?? '',
    level: term.level ?? '',
    explanation: truncate(term.explanation ?? '', 160),
  }));
}

export function exportTerms(format = 'md') {
  const list = listSavedTerms('', { limit: 500 });
  if (format === 'json') {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), terms: list }, null, 2);
  }
  if (format === 'csv') {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['en', 'zh', 'abbr', 'field', 'status', 'astrodictUrl', 'definition', 'explanation', 'formula', 'formulaLatex', 'tags', 'note'];
    const rows = list.map((term) =>
      [term.en, term.zh, term.abbr, term.field, term.status, term.astrodictUrl, term.definition, term.explanation, term.formula, term.formulaLatex, (term.tags ?? []).join(';'), term.note]
        .map(escape)
        .join(','),
    );
    return `\ufeff${[header.join(','), ...rows].join('\n')}\n`;
  }
  if (format === 'anki') {
    // Anki's "basic" import format is front<TAB>back.
    const rows = list.map((term) => {
      const front = `${term.en}${term.abbr ? ` (${term.abbr})` : ''}`;
      const back = [
        term.zh,
        term.definition ? `NADC 定义：${term.definition}` : '',
        term.explanation,
        term.formula ? `公式：${term.formula}` : '',
        term.formulaLatex ? `LaTeX：${term.formulaLatex}` : '',
        term.astrodictUrl ? `NADC：${term.astrodictUrl}` : '',
      ]
        .filter(Boolean)
        .join('<br>');
      return `${front}\t${back}`;
    });
    return `${rows.join('\n')}\n`;
  }
  const lines = [
    '# 天文术语本',
    '',
    `> 导出时间：${new Date().toISOString()}`,
    '> 中文译名核验：国家天文台天文学名词（NADC）https://nadc.china-vo.org/astrodict/',
    '> 释义为 DSH 生成的物理学解释，不是名词委原文。',
    '',
  ];
  for (const term of list) {
    lines.push(`## ${term.zh || term.en}（${term.en}）`);
    if (term.abbr) lines.push(`- 缩写：${term.abbr}`);
    if (term.status) lines.push(`- 审定状态：${term.status}`);
    if (term.astrodictUrl) lines.push(`- NADC：${term.astrodictUrl}`);
    if (term.field) lines.push(`- 领域：${term.field}`);
    if (term.tags?.length) lines.push(`- 标签：${term.tags.join(' / ')}`);
    if (term.definition) lines.push(`- NADC 审定定义（名词委原文）：${term.definition}`);
    if (term.explanation) lines.push(`- DSH 释义（非名词委原文）：${term.explanation}`);
    if (term.formula) lines.push(`- 公式：${term.formula}`);
    if (term.formulaLatex) lines.push(`- LaTeX：\`${term.formulaLatex}\``);
    if (term.units) lines.push(`- 单位/量纲：${term.units}`);
    if (term.note) lines.push(`- 笔记：${term.note}`);
    lines.push('');
  }
  return lines.join('\n');
}
