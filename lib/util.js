// astro-ph-researcher :: small, dependency-free helpers
import { createHash } from 'node:crypto';

export const PLUGIN_NAME = 'astro-ph-researcher';
export const UA = 'astro-ph-researcher/0.1 (astronomy terminology + literature assistant)';

export function log(...args) {
  try {
    console.log('[astro-ph-researcher]', ...args);
  } catch {
    /* noop */
  }
}

export function warn(...args) {
  try {
    console.warn('[astro-ph-researcher]', ...args);
  } catch {
    /* noop */
  }
}

export function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

export function unique(values) {
  const out = [];
  const seen = new Set();
  for (const value of values ?? []) {
    const key = String(value ?? '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
  times: '×',
  deg: '°',
  plusmn: '±',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  mu: 'μ',
  sigma: 'σ',
  lambda: 'λ',
  omega: 'ω',
  sup2: '²',
  sup3: '³',
  sub2: '₂',
};

export function decodeEntities(input) {
  return String(input ?? '').replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const hex = code[1]?.toLowerCase() === 'x';
      const raw = code.slice(hex ? 2 : 1);
      const value = Number.parseInt(raw, hex ? 16 : 10);
      if (Number.isFinite(value) && value > 0 && value <= 0x10ffff) {
        try {
          return String.fromCodePoint(value);
        } catch {
          return match;
        }
      }
      return match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function stripTags(html) {
  const text = String(html ?? '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|ol|ul|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return normalizeSpace(decodeEntities(text));
}

export function normalizeSpace(input) {
  return String(input ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeTerm(input) {
  return String(input ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(input) {
  const stop = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'for', 'and', 'with', 'to', 'from', 'at', 'by', 'as', 'is', 'are', 'be']);
  return normalizeTerm(input)
    .split(' ')
    .filter((token) => token && !stop.has(token));
}

export function jaccard(a, b) {
  const left = new Set(a ?? []);
  const right = new Set(b ?? []);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export function containsAll(haystack, needles) {
  const set = new Set(haystack ?? []);
  return (needles ?? []).every((needle) => set.has(needle));
}

export function dice(a, b) {
  const left = normalizeTerm(a).replace(/\s+/g, '');
  const right = normalizeTerm(b).replace(/\s+/g, '');
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 2 || right.length < 2) return 0;
  const bigrams = new Map();
  for (let i = 0; i < left.length - 1; i += 1) {
    const gram = left.slice(i, i + 2);
    bigrams.set(gram, (bigrams.get(gram) ?? 0) + 1);
  }
  let overlap = 0;
  for (let i = 0; i < right.length - 1; i += 1) {
    const gram = right.slice(i, i + 2);
    const count = bigrams.get(gram) ?? 0;
    if (count > 0) {
      overlap += 1;
      bigrams.set(gram, count - 1);
    }
  }
  return (2 * overlap) / (left.length - 1 + right.length - 1);
}

export function sharedTerms(a, b) {
  const right = new Set(tokens(b));
  return tokens(a).filter((token) => right.has(token));
}

export function truncate(input, maxLength = 600) {
  const text = String(input ?? '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function stripDoi(input) {
  return String(input ?? '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/[.,;]+$/, '');
}

export function normalizeDoi(input) {
  return stripDoi(input).toLowerCase();
}

export function yearOf(value) {
  const match = String(value ?? '').match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function formatAuthors(authors, max = 5) {
  const list = (authors ?? []).map((author) => (typeof author === 'string' ? author : author?.name ?? '')).filter(Boolean);
  if (!list.length) return '';
  if (list.length <= max) return list.join(', ');
  return `${list.slice(0, max).join(', ')}, et al.`;
}

export function hashId(input, length = 12) {
  return createHash('sha1').update(String(input)).digest('hex').slice(0, length);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function pickNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export async function fetchWithTimeout(url, options = {}) {
  const {
    timeoutMs = 15000,
    headers = {},
    retries = 0,
    retryDelayMs = 400,
    ...rest
  } = options;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    timer.unref?.();
    try {
      const response = await fetch(url, {
        ...rest,
        headers: {
          'user-agent': UA,
          accept: 'application/json, text/html;q=0.9, */*;q=0.8',
          ...headers,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const error = new Error(`HTTP ${response.status} ${response.statusText}${body ? `: ${truncate(body, 180)}` : ''}`);
        error.status = response.status;
        error.body = body;
        throw error;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(retryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error('request failed');
}

export async function fetchJson(url, options = {}) {
  const response = await fetchWithTimeout(url, options);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid JSON from ${url}: ${truncate(text, 160)}`);
  }
}

export async function fetchText(url, options = {}) {
  const response = await fetchWithTimeout(url, options);
  return response.text();
}

export function escapeRegExp(input) {
  return String(input ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeMarkdown(input) {
  return String(input ?? '').replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1');
}
