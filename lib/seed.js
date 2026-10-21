// astro-ph-researcher :: local seed glossary (offline fallback + curated explanations)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeTerm, warn } from './util.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(HERE, '..', 'data', 'terms.seed.json');

let cache = null;

function readSeedFile() {
  try {
    const raw = readFileSync(SEED_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const terms = Array.isArray(parsed) ? parsed : parsed?.terms;
    if (!Array.isArray(terms)) throw new Error('terms array missing');
    return terms.filter((term) => term && (term.en || term.zh));
  } catch (error) {
    warn(`seed glossary unavailable at ${SEED_PATH}: ${error?.message ?? error}`);
    return [];
  }
}

function ensureIndex() {
  if (cache) return cache;
  const terms = readSeedFile();
  const byKey = new Map();
  const all = [];
  for (const term of terms) {
    const record = {
      ...term,
      key: String(term.key ?? term.en ?? term.zh ?? '').trim(),
      en: String(term.en ?? '').trim(),
      zh: String(term.zh ?? '').trim(),
      aliases: Array.isArray(term.aliases) ? term.aliases.filter(Boolean) : [],
      related: Array.isArray(term.related) ? term.related.filter(Boolean) : [],
      misconceptions: Array.isArray(term.misconceptions) ? term.misconceptions.filter(Boolean) : [],
      sources: Array.isArray(term.sources) ? term.sources.filter(Boolean) : [],
    };
    all.push(record);
    for (const value of [record.key, record.en, record.zh, record.abbr, ...record.aliases]) {
      const key = normalizeTerm(value);
      if (key && !byKey.has(key)) byKey.set(key, record);
    }
  }
  cache = { terms: all, byKey };
  return cache;
}

export function allSeedTerms() {
  return ensureIndex().terms.map((term) => ({ ...term }));
}

export function seedTermCount() {
  return ensureIndex().terms.length;
}

export function findSeedTerm(query) {
  const index = ensureIndex();
  const key = normalizeTerm(query);
  if (!key) return null;
  const exact = index.byKey.get(key);
  if (exact) return { ...exact, seedMatch: 'exact' };

  // Allow "redshift cosmology" -> "redshift" only when the seed term is a
  // whole-word prefix, never for arbitrary substring matches.
  for (const term of index.terms) {
    const en = normalizeTerm(term.en);
    const zh = normalizeTerm(term.zh);
    if (en && key.startsWith(`${en} `)) return { ...term, seedMatch: 'prefix' };
    if (zh && key.startsWith(zh)) return { ...term, seedMatch: 'prefix' };
  }
  return null;
}

export function mergeSeedIntoTerm(base, seed) {
  if (!seed) return base;
  const merged = { ...base };
  for (const field of [
    'en',
    'zh',
    'zhTW',
    'abbr',
    'astrodictId',
    'astrodictUrl',
    'status',
    'lastRevised',
    'definition',
    'definitionSource',
    'notes',
    'field',
    'level',
    'explanation',
    'formula',
    'formulaLatex',
    'units',
    'literatureQuery',
    'literatureQueryZh',
  ]) {
    if ((merged[field] === undefined || merged[field] === null || merged[field] === '') && seed[field] !== undefined) {
      merged[field] = seed[field];
    }
  }
  const flattenAliases = (values) =>
    (values ?? [])
      .flatMap((value) => String(value ?? '').split(/[;；]/))
      .map((value) => value.trim())
      .filter(Boolean);
  merged.aliases = [...new Set([...flattenAliases(seed.aliases), seed.en, seed.key, ...flattenAliases(base.aliases)].filter(Boolean))];
  merged.sources = base.sources?.length ? base.sources : seed.sources ?? [];
  merged.misconceptions = seed.misconceptions ?? [];
  merged.relatedSeed = seed.related ?? [];
  merged.examples = base.examples?.length ? base.examples : seed.examples ?? [];
  merged.nadcTags = base.nadcTags?.length ? base.nadcTags : seed.nadcTags ?? [];
  merged.seedKey = seed.key;
  merged.explanationSource = seed.explanation ? 'seed' : merged.explanationSource;
  return merged;
}
