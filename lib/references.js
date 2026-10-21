// astro-ph-researcher :: personal reference library (local JSON, no cloud)
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { DATA_DIR } from './store.js';
import { hashId, log, normalizeDoi, normalizeTerm, unique, warn } from './util.js';

export const REFERENCES_PATH = join(DATA_DIR, 'references.json');

let loaded = false;
let items = [];
let saving = null;
let saveTimer = null;

const DEFAULT_TAGS = { fields: [], keywords: [], collections: [] };

function normalizeTags(input) {
  const tags = input && typeof input === 'object' ? input : {};
  return {
    fields: unique(Array.isArray(tags.fields) ? tags.fields.map(String) : []),
    keywords: unique(Array.isArray(tags.keywords) ? tags.keywords.map(String) : []),
    collections: unique(Array.isArray(tags.collections) ? tags.collections.map(String) : []),
  };
}

function normalizeAuthor(author) {
  if (typeof author === 'string') return { name: author, orcid: '', affiliations: [] };
  return {
    name: String(author?.name ?? '').trim(),
    orcid: String(author?.orcid ?? '').trim(),
    affiliations: unique(Array.isArray(author?.affiliations) ? author.affiliations.map(String) : []),
  };
}

function pickUrl(links, kind) {
  return (Array.isArray(links) ? links : []).find((link) => link?.kind === kind)?.url ?? '';
}

function referenceKey(input) {
  const doi = normalizeDoi(input.doi ?? '');
  if (doi) return `doi:${doi}`;
  if (input.arxivUrl) return `arxiv:${String(input.arxivUrl).replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, '').replace(/\.pdf$/, '')}`;
  return `title:${normalizeTerm(input.title ?? '')}:${input.year ?? ''}`;
}

function normalizeReference(input) {
  const authorsDetailed = (Array.isArray(input.authorsDetailed) ? input.authorsDetailed : Array.isArray(input.authors) ? input.authors : [])
    .map(normalizeAuthor)
    .filter((author) => author.name);
  const authors = unique(input.authors?.length ? input.authors.map(String) : authorsDetailed.map((author) => author.name));
  const links = Array.isArray(input.links) ? input.links.filter((link) => link?.url) : [];
  const doi = input.doi ? `https://doi.org/${normalizeDoi(input.doi)}` : '';
  const id = String(input.id ?? '').trim() || `ref_${hashId(referenceKey({ ...input, doi }), 12)}`;
  const tags = normalizeTags(input.tags);
  return {
    id,
    title: String(input.title ?? '').replace(/\s+/g, ' ').trim(),
    authors,
    authorsDetailed,
    firstThreeAuthors: authorsDetailed.slice(0, 3),
    affiliations: unique([
      ...(Array.isArray(input.affiliations) ? input.affiliations.map(String) : []),
      ...authorsDetailed.flatMap((author) => author.affiliations),
    ]),
    year: Number(input.year) || null,
    date: String(input.date ?? ''),
    journal: String(input.journal ?? input.venue ?? '').trim(),
    journalAbbrev: String(input.journalAbbrev ?? '').trim(),
    volume: String(input.volume ?? '').trim(),
    issue: String(input.issue ?? '').trim(),
    pages: String(input.pages ?? '').trim(),
    doi,
    adsUrl: String(input.adsUrl ?? pickUrl(links, 'ads')).trim(),
    arxivUrl: String(input.arxivUrl ?? pickUrl(links, 'arxiv')).trim(),
    scixUrl: String(input.scixUrl ?? pickUrl(links, 'scix')).trim(),
    publisherUrl: String(input.publisherUrl ?? pickUrl(links, 'landing')).trim(),
    links,
    abstract: String(input.abstract ?? '').trim(),
    summary: String(input.summary ?? input.analysis ?? '').trim(),
    keyResults: unique(Array.isArray(input.keyResults) ? input.keyResults.map(String) : []),
    notes: String(input.notes ?? '').trim(),
    tags,
    citations: Number(input.citations ?? 0),
    source: String(input.source ?? ''),
    addedAt: String(input.addedAt ?? '') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function writeAtomic(payload) {
  await mkdir(dirname(REFERENCES_PATH), { recursive: true });
  const tmp = `${REFERENCES_PATH}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await rename(tmp, REFERENCES_PATH);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow().catch((error) => warn('reference save failed:', error?.message ?? error));
  }, 250);
  saveTimer.unref?.();
}

export async function saveNow() {
  if (saving) return saving;
  saving = (async () => {
    await writeAtomic({ version: 1, updatedAt: new Date().toISOString(), items });
  })().finally(() => {
    saving = null;
  });
  return saving;
}

export async function initReferences() {
  if (loaded) return;
  try {
    const raw = await readFile(REFERENCES_PATH, 'utf8');
    const data = JSON.parse(raw);
    items = Array.isArray(data?.items) ? data.items.map(normalizeReference) : [];
  } catch (error) {
    if (error?.code !== 'ENOENT') warn(`reference library unavailable: ${error?.message ?? error}`);
    items = [];
  }
  loaded = true;
  log(`reference library ready: ${items.length} items`);
}

function matches(item, query) {
  const q = normalizeTerm(query);
  if (!q) return true;
  const haystack = normalizeTerm(
    [
      item.title,
      item.journal,
      item.summary,
      item.notes,
      item.doi,
      ...(item.authors ?? []),
      ...(item.tags?.fields ?? []),
      ...(item.tags?.keywords ?? []),
      ...(item.tags?.collections ?? []),
    ].join(' '),
  );
  return haystack.includes(q);
}

export function listReferences(filter = {}) {
  const q = filter.q ?? filter.query ?? '';
  const field = String(filter.field ?? '').trim();
  const keyword = String(filter.keyword ?? '').trim();
  const tag = String(filter.tag ?? '').trim();
  const collection = String(filter.collection ?? '').trim();
  const limit = Math.max(1, Math.min(500, Number(filter.limit) || 200));
  return items
    .filter((item) => matches(item, q))
    .filter((item) => !field || (item.tags?.fields ?? []).includes(field))
    .filter((item) => !keyword || (item.tags?.keywords ?? []).includes(keyword))
    .filter((item) => !tag || [...(item.tags?.fields ?? []), ...(item.tags?.keywords ?? []), ...(item.tags?.collections ?? [])].includes(tag))
    .filter((item) => !collection || (item.tags?.collections ?? []).includes(collection))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

export function getReference(id) {
  return items.find((item) => item.id === id) ?? null;
}

export function upsertReference(input) {
  const next = normalizeReference(input);
  if (!next.title) throw new Error('reference title is required');
  const doi = normalizeDoi(next.doi);
  const index = items.findIndex((item) => item.id === next.id || (doi && normalizeDoi(item.doi) === doi));
  if (index >= 0) {
    const previous = items[index];
    next.id = previous.id;
    next.addedAt = previous.addedAt;
    next.title = next.title || previous.title;
    next.authors = next.authors?.length ? next.authors : previous.authors;
    next.authorsDetailed = next.authorsDetailed?.length ? next.authorsDetailed : previous.authorsDetailed;
    next.firstThreeAuthors = next.firstThreeAuthors?.length ? next.firstThreeAuthors : previous.firstThreeAuthors;
    next.affiliations = unique([...(previous.affiliations ?? []), ...(next.affiliations ?? [])]);
    next.year = next.year ?? previous.year;
    next.date = next.date || previous.date;
    next.journal = next.journal || previous.journal;
    next.journalAbbrev = next.journalAbbrev || previous.journalAbbrev;
    next.volume = next.volume || previous.volume;
    next.issue = next.issue || previous.issue;
    next.pages = next.pages || previous.pages;
    next.doi = next.doi || previous.doi;
    next.adsUrl = next.adsUrl || previous.adsUrl;
    next.arxivUrl = next.arxivUrl || previous.arxivUrl;
    next.scixUrl = next.scixUrl || previous.scixUrl;
    next.publisherUrl = next.publisherUrl || previous.publisherUrl;
    next.links = next.links?.length ? next.links : previous.links;
    next.abstract = next.abstract || previous.abstract;
    next.tags = normalizeTags({
      fields: [...(previous.tags?.fields ?? []), ...(next.tags?.fields ?? [])],
      keywords: [...(previous.tags?.keywords ?? []), ...(next.tags?.keywords ?? [])],
      collections: [...(previous.tags?.collections ?? []), ...(next.tags?.collections ?? [])],
    });
    next.summary = next.summary || previous.summary;
    next.notes = next.notes || previous.notes;
    next.keyResults = unique([...(previous.keyResults ?? []), ...(next.keyResults ?? [])]);
    items[index] = next;
  } else {
    items.push(next);
  }
  scheduleSave();
  return next;
}

export function updateReference(id, patch = {}) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const previous = items[index];
  const next = normalizeReference({ ...previous, ...patch, id, addedAt: previous.addedAt });
  next.tags = normalizeTags({
    fields: patch.tags?.fields ?? previous.tags?.fields,
    keywords: patch.tags?.keywords ?? previous.tags?.keywords,
    collections: patch.tags?.collections ?? previous.tags?.collections,
  });
  items[index] = next;
  scheduleSave();
  return next;
}

export function deleteReference(id) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return false;
  items.splice(index, 1);
  scheduleSave();
  return true;
}

export function referenceStats() {
  return {
    count: items.length,
    fields: unique(items.flatMap((item) => item.tags?.fields ?? [])),
    keywords: unique(items.flatMap((item) => item.tags?.keywords ?? [])),
    collections: unique(items.flatMap((item) => item.tags?.collections ?? [])),
  };
}

// ---------------------------------------------------------------------------
// citation formats
// ---------------------------------------------------------------------------
function lastName(name) {
  const text = String(name ?? '').trim();
  if (!text) return '';
  if (text.includes(',')) return text.split(',')[0].trim();
  return text.split(/\s+/).pop() ?? text;
}

function firstNameInitials(name) {
  const text = String(name ?? '').trim();
  if (!text) return '';
  if (text.includes(',')) {
    return text
      .split(',')
      .slice(1)
      .join(',')
      .trim()
      .split(/\s+/)
      .map((part) => `${part[0] ?? ''}.`)
      .join(' ');
  }
  return text
    .split(/\s+/)
    .slice(0, -1)
    .map((part) => `${part[0] ?? ''}.`)
    .join(' ');
}

function bibAuthor(name) {
  const text = String(name ?? '').trim();
  if (!text) return '';
  if (text.includes(',')) {
    const [last, ...rest] = text.split(',');
    return `${last.trim()}, ${rest.join(',').trim()}`;
  }
  const parts = text.split(/\s+/);
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`.trim();
}

function apaAuthor(name) {
  const last = lastName(name);
  const initials = firstNameInitials(name).replace(/\./g, '').split(/\s+/).filter(Boolean).map((part) => `${part[0]}.`).join(' ');
  return `${last}, ${initials}`.trim();
}

function gbAuthor(name) {
  const text = String(name ?? '').trim();
  if (!text) return '';
  if (/[\u4e00-\u9fff]/.test(text)) return text;
  if (text.includes(',')) {
    const [last, ...rest] = text.split(',');
    const initials = rest.join(' ').split(/\s+/).map((part) => part[0] ?? '').join('');
    return `${last.trim().toUpperCase()} ${initials.toUpperCase()}`.trim();
  }
  const parts = text.split(/\s+/);
  const last = parts.pop();
  const initials = parts.map((part) => part[0] ?? '').join('');
  return `${last.toUpperCase()} ${initials.toUpperCase()}`.trim();
}

export function citationKey(item) {
  const first = lastName(item.firstThreeAuthors?.[0]?.name ?? item.authors?.[0] ?? '');
  const year = item.year ?? 'n.d.';
  const word = String(item.title ?? '').toLowerCase().match(/[a-z0-9]{4,}/)?.[0] ?? 'paper';
  const base = `${first}${year}${word}`.replace(/[^A-Za-z0-9]/g, '');
  return base || `ref${items.indexOf(item) + 1}`;
}

export function formatBibTeX(item) {
  const key = citationKey(item);
  const authors = (item.authors ?? []).map(bibAuthor).filter(Boolean).join(' and ');
  const fields = [];
  if (authors) fields.push(`  author = {${authors}}`);
  if (item.title) fields.push(`  title = {{${String(item.title).replace(/[{}]/g, '')}}}`);
  if (item.journal) fields.push(`  journal = {${item.journal}}`);
  if (item.volume) fields.push(`  volume = {${item.volume}}`);
  if (item.issue) fields.push(`  number = {${item.issue}}`);
  if (item.pages) fields.push(`  pages = {${item.pages}}`);
  if (item.year) fields.push(`  year = {${item.year}}`);
  if (item.doi) fields.push(`  doi = {${normalizeDoi(item.doi)}}`);
  if (item.arxivUrl) {
    const arxiv = String(item.arxivUrl).replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//, '').replace(/\.pdf$/, '');
    fields.push(`  eprint = {${arxiv}}`);
    fields.push('  archivePrefix = {arXiv}');
  }
  if (item.adsUrl) fields.push(`  adsurl = {${item.adsUrl}}`);
  if (item.publisherUrl) fields.push(`  url = {${item.publisherUrl}}`);
  return `@article{${key},\n${fields.join(',\n')}\n}`;
}

export function formatApa(item) {
  const authors = (item.authors ?? []).map(apaAuthor).filter(Boolean);
  const authorText = authors.length > 1 ? `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}` : authors[0] ?? '';
  const year = item.year ? `(${item.year}).` : '(n.d.).';
  const title = String(item.title ?? '').replace(/\.$/, '');
  const journal = item.journal || '';
  const volume = item.volume ? `*${item.volume}*` : '';
  const issue = item.issue ? `(${item.issue})` : '';
  const pages = item.pages ? `, ${item.pages}` : '';
  const doi = item.doi ? ` https://doi.org/${normalizeDoi(item.doi)}` : '';
  return `${authorText} ${year} ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue}${pages}.${doi}`.replace(/\s+/g, ' ').trim();
}

export function formatGb7714(item) {
  const authors = (item.authors ?? []).map(gbAuthor).filter(Boolean);
  const authorText = authors.length > 3 ? `${authors.slice(0, 3).join(', ')}, 等` : authors.join(', ');
  const journal = item.journal || '';
  const volumeIssue = [item.volume, item.issue ? `(${item.issue})` : ''].filter(Boolean).join('');
  const pages = item.pages ? `: ${item.pages}` : '';
  const doi = item.doi ? `. DOI: ${normalizeDoi(item.doi)}` : '';
  return `${authorText}. ${item.title}[J]. ${journal}, ${item.year ?? ''}${volumeIssue ? `, ${volumeIssue}` : ''}${pages}${doi}.`.replace(/\s+/g, ' ').trim();
}

export function formatMla(item) {
  const authors = (item.authors ?? []).map((name) => `${lastName(name)}, ${firstNameInitials(name)}`).filter(Boolean);
  const authorText = authors.length > 2 ? `${authors[0]}, et al` : authors.join(', and ');
  const journal = item.journal || '';
  return `${authorText}. "${item.title}." ${journal}${item.volume ? `, vol. ${item.volume}` : ''}${item.issue ? `, no. ${item.issue}` : ''}, ${item.year ?? ''}${item.pages ? `, pp. ${item.pages}` : ''}${item.doi ? `, https://doi.org/${normalizeDoi(item.doi)}` : ''}.`;
}

export function citeReference(item, style = 'bibtex') {
  if (!item) return '';
  const normalized = String(style).toLowerCase();
  if (normalized === 'bibtex' || normalized === 'bib') return formatBibTeX(item);
  if (normalized === 'apa') return formatApa(item);
  if (normalized === 'gb7714' || normalized === 'gb/t 7714' || normalized === 'gb') return formatGb7714(item);
  if (normalized === 'mla') return formatMla(item);
  return formatBibTeX(item);
}

export function exportBibTeX(ids = []) {
  const selected = Array.isArray(ids) && ids.length ? items.filter((item) => ids.includes(item.id)) : items;
  return `${selected.map(formatBibTeX).join('\n\n')}\n`;
}

export function formatReferenceList(rows) {
  if (!rows.length) return '文献库还是空的。先检索文献并点「保存到文献库」。';
  const lines = [`文献库共 ${rows.length} 条：`];
  rows.forEach((item, index) => {
    const authors = (item.firstThreeAuthors ?? []).map((author) => author.name).join(', ') || (item.authors ?? []).slice(0, 3).join(', ');
    const journal = [item.journal, item.year, item.volume, item.issue, item.pages].filter(Boolean).join(', ');
    lines.push(`${index + 1}. ${item.title}`);
    lines.push(`   作者：${authors}${(item.authors?.length ?? 0) > 3 ? ' et al.' : ''}`);
    if (item.affiliations?.length) lines.push(`   单位：${item.affiliations.slice(0, 2).join('; ')}`);
    if (journal) lines.push(`   期刊：${journal}`);
    if (item.doi) lines.push(`   DOI：${item.doi}`);
    if (item.tags?.fields?.length || item.tags?.keywords?.length) {
      lines.push(`   标签：${[...(item.tags.fields ?? []), ...(item.tags.keywords ?? [])].join(' / ')}`);
    }
    if (item.summary) lines.push(`   总结：${item.summary.slice(0, 240)}`);
  });
  return lines.join('\n');
}
