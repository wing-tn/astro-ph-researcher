// Pure citation formatters extracted from astro-ph-researcher 3.3.0 lib/references.js (MIT).
// Original author: 天外奇航. Keep this module inside the standalone Codex plugin package.
function normalizeDoi(value) {
  return String(value ?? '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
}
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
  return base || `ref${String(item.id || "unkeyed")}`;
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

