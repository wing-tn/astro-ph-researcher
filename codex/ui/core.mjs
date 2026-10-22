import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { citeReference } from './citation-formatters.mjs';

export const now = () => new Date().toISOString();
const hash = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
export const clean = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export const doiOf = s => String(s ?? '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
export const arxivOf = s => String(s ?? '').trim().replace(/^https?:\/\/(?:export\.)?arxiv\.org\/(?:abs|pdf)\//i, '').replace(/^arxiv:\s*/i, '').replace(/\.pdf$/i, '');
const validDoi = s => /^10\.\d{4,9}\/\S+$/i.test(s) && !/[<>"{}]/.test(s);
const validArxiv = s => /^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/i.test(s);
const bareArxiv = s => arxivOf(s).replace(/v\d+$/, '');
const titleKey = s => clean(s).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function sameWork(a, b) {
  if (a.doi && b.doi) return doiOf(a.doi) === doiOf(b.doi);
  if (a.arxivId && b.arxivId) return bareArxiv(a.arxivId) === bareArxiv(b.arxivId);
  return !!a.title && titleKey(a.title) === titleKey(b.title) && a.year === b.year;
}
export function mergeWork(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) if (v !== '' && v != null && (!Array.isArray(v) || v.length)) out[k] = v;
  // Retain the publication's bibliographic fields when a later arXiv check adds a preprint link.
  if (a.type !== 'preprint' && b.type === 'preprint') {
    for (const k of ['title', 'authors', 'authorsDetailed', 'year', 'journal', 'volume', 'issue', 'pages', 'abstract', 'type', 'version', 'citations', 'citationSource', 'citationDate']) {
      if (a[k] !== '' && a[k] != null && (!Array.isArray(a[k]) || a[k].length)) out[k] = a[k];
    }
  }
  out.id = a.id;
  out.provenance = [...new Map([...(a.provenance || []), ...(b.provenance || [])].map(p => [JSON.stringify(p), p])).values()];
  out.tags = [...new Set([...(a.tags || []), ...(b.tags || [])])];
  out.notes = a.notes || b.notes || '';
  out.readingStatus = a.readingStatus || b.readingStatus || '待阅读';
  out.evidence = a.evidence || b.evidence || 'C';
  if (a.verification || b.verification) out.verification = {...a.verification, ...b.verification};
  return out;
}
export function dedupe(rows) {
  const result = [];
  for (const row of rows) {
    const i = result.findIndex(x => sameWork(x, row));
    if (i < 0) result.push(row); else result[i] = mergeWork(result[i], row);
  }
  return result;
}
function record(data, source, sourceUrl) {
  return { ...data, id: hash(data.doi || data.arxivId || `${data.title}:${data.year}`),
    evidence: 'C', evidenceNote: '仅题录/摘要；结论与同行评议状态未经人工核对',
    readingStatus: '待阅读', notes: '', tags: [], verification: {},
    provenance: [{ source, url: sourceUrl, fetchedAt: now() }] };
}
export function crossrefRecord(w, url) {
  const authorsDetailed = (w.author || []).map(a => ({name: clean(a.name || [a.given, a.family].filter(Boolean).join(' ')), orcid: a.ORCID || '', affiliations: (a.affiliation || []).map(x => x.name).filter(Boolean)}));
  const date = w.published?.['date-parts']?.[0] || w.issued?.['date-parts']?.[0] || [];
  return record({ title: clean(w.title?.[0]), authors: authorsDetailed.map(a => a.name), authorsDetailed,
    doi: doiOf(w.DOI), arxivId: '', year: date[0] || null, journal: clean(w['container-title']?.[0]),
    volume: w.volume || '', issue: w.issue || '', pages: w.page || w['article-number'] || '',
    abstract: clean(w.abstract), type: w.type || '', version: w.type === 'posted-content' ? '预印本（未经同行评议）' : '出版题录（评议状态待核对）',
    citations: w['is-referenced-by-count'] ?? null, citationSource: 'Crossref', citationDate: now(),
    updates: w['update-to'] || [], relation: w.relation || {},
  }, 'Crossref', url);
}
function xmlText(s) {
  return clean(String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n) => {
    const value = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
    return value <= 0x10ffff ? String.fromCodePoint(value) : '';
  }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
export function parseArxiv(xml, url) {
  if (!/<(?:\w+:)?feed\b/.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('arXiv 返回非预期 Atom 数据');
  const entries = [...xml.matchAll(/<(?:\w+:)?entry\b[^>]*>([\s\S]*?)<\/(?:\w+:)?entry>/g)];
  return entries.map(([, e]) => {
    const tag = name => xmlText(e.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`))?.[1]);
    if (/\/api\/errors/.test(tag('id'))) throw new Error(`arXiv: ${tag('summary')}`);
    const id = arxivOf(tag('id'));
    if (!validArxiv(id)) throw new Error('arXiv 返回无效标识符');
    return record({title: tag('title'), authors: [...e.matchAll(/<author\b[^>]*>([\s\S]*?)<\/author>/g)].map(([, a]) => xmlText(a.match(/<name>([\s\S]*?)<\/name>/)?.[1])),
      authorsDetailed: [], doi: doiOf(tag('arxiv:doi')), arxivId: id, year: Number(tag('published').slice(0, 4)) || null,
      journal: tag('arxiv:journal_ref'), volume: '', issue: '', pages: '', abstract: tag('summary'), type: 'preprint',
      version: '预印本（未经同行评议）；正式版关联待核对', citations: null,
      updated: tag('updated'), categories: [...e.matchAll(/<category\b[^>]*term=["']([^"']+)["']/g)].map(m => m[1]),
    }, 'arXiv', url);
  });
}
export class Literature {
  constructor(fetcher = fetch) { this.fetcher = fetcher; this.arxivQueue = Promise.resolve(); this.lastArxiv = 0; }
  async request(url, atom = false) {
    const run = async () => {
      if (atom) { await new Promise(r => setTimeout(r, Math.max(0, 3100 - (Date.now() - this.lastArxiv)))); this.lastArxiv = Date.now(); }
      const res = await this.fetcher(url, {signal: AbortSignal.timeout(20000), headers: {'User-Agent': 'astro-ph-researcher-codex-ui/0.1', Accept: atom ? 'application/atom+xml' : 'application/json'}});
      if (!res.ok) { const error = new Error(`上游 HTTP ${res.status}${res.status === 429 ? '：请求过频，请稍后重试' : ''}`); error.upstreamStatus = res.status; throw error; }
      const body = await res.text();
      if (body.length > 8000000) throw new Error('上游响应超出大小限制');
      return atom ? body : JSON.parse(body);
    };
    if (!atom) return run();
    const task = this.arxivQueue.then(run); this.arxivQueue = task.catch(() => {}); return task;
  }
  async search(input) {
    const query = String(input.query || '').trim();
    if (!query || query.length > 500) throw new Error('请输入 1–500 字符检索式');
    const from = Number(input.yearFrom) || null, to = Number(input.yearTo) || null;
    if ([from, to].some(x => x && (!Number.isInteger(x) || x < 1000 || x > 2200)) || (from && to && from > to)) throw new Error('年份范围无效');
    const source = input.source || 'both', sort = input.sort || 'relevance';
    if (!['both', 'crossref', 'arxiv'].includes(source) || !['relevance', 'time'].includes(sort)) throw new Error('来源或排序无效');
    const count = Math.min(50, Math.max(1, Number(input.limit) || 20));
    const sources = source === 'both' ? ['crossref', 'arxiv'] : [source];
    const snapshots = [], warnings = [];
    const batches = await Promise.all(sources.map(async src => {
      let url;
      if (src === 'crossref') {
        url = new URL('https://api.crossref.org/works');
        url.searchParams.set('query.bibliographic', query); url.searchParams.set('rows', String(count));
        const filters = [from && `from-pub-date:${from}-01-01`, to && `until-pub-date:${to}-12-31`].filter(Boolean);
        if (filters.length) url.searchParams.set('filter', filters.join(','));
        if (sort === 'time') { url.searchParams.set('sort', 'published'); url.searchParams.set('order', 'desc'); }
      } else {
        url = new URL('https://export.arxiv.org/api/query');
        const q = /\b(?:all|ti|au|abs|cat|id):/.test(query) ? query : `all:"${query.replace(/["\\]/g, ' ')}"`;
        const dates = (from || to) ? ` AND submittedDate:[${from || 1000}01010000 TO ${to || 2200}12312359]` : '';
        url.searchParams.set('search_query', `(${q})${dates}`); url.searchParams.set('start', '0'); url.searchParams.set('max_results', String(count));
        url.searchParams.set('sortBy', sort === 'time' ? 'submittedDate' : 'relevance'); url.searchParams.set('sortOrder', 'descending');
      }
      const snapshot = {source: src, query, sort, filters: {yearFrom: from, yearTo: to}, limit: count, url: String(url), searchedAt: now()};
      try {
        const raw = await this.request(url, src === 'arxiv');
        const rows = src === 'arxiv' ? parseArxiv(raw, String(url)) : (raw.message?.items || []).map(w => crossrefRecord(w, String(url)));
        Object.assign(snapshot, {status: 'ok', returned: rows.length, total: src === 'crossref' ? raw.message?.['total-results'] : null});
        return rows.filter(x => x.title);
      } catch (e) { Object.assign(snapshot, {status: 'error', error: e.message}); warnings.push(`${src}: ${e.message}`); return []; }
      finally { snapshots.push(snapshot); }
    }));
    const interleaved = [];
    for (let i = 0; i < Math.max(0, ...batches.map(b => b.length)); i++) for (const batch of batches) if (batch[i]) interleaved.push(batch[i]);
    const results = dedupe(interleaved).filter(x => (!from || x.year >= from) && (!to || x.year <= to));
    if (sort === 'time') results.sort((a, b) => (b.year || 0) - (a.year || 0));
    return {results, snapshots, warnings, count: results.length, note: '相关性沿用各来源排序；双源按来源交错展示，不比较跨库引用数。仅检索题录/摘要。'};
  }
  async verify(input) {
    const raw = String(input || '').trim();
    const doi = doiOf(raw), arxiv = arxivOf(raw);
    const isDoi = validDoi(doi);
    if (!isDoi && !validArxiv(arxiv)) throw new Error('请输入有效 DOI、arXiv ID 或对应链接');
    const url = isDoi ? `https://api.crossref.org/works/${encodeURIComponent(doi)}` : `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxiv)}`;
    const timestamp = now(), kind = isDoi ? 'doi' : 'arxiv';
    try {
      const rawResult = await this.request(url, !isDoi);
      const item = isDoi ? crossrefRecord(rawResult.message, url) : parseArxiv(rawResult, url)[0];
      if (!item) return {status: 'not_found', kind, checkedAt: timestamp, url};
      if (isDoi ? item.doi !== doi : bareArxiv(item.arxivId) !== bareArxiv(arxiv)) throw new Error('返回标识符与请求不匹配');
      const verification = {status: 'verified', identifier: isDoi ? doi : arxiv, checkedAt: timestamp, url, title: item.title};
      item.verification[kind] = verification;
      return {status: 'verified', kind, item, ...verification, note: '标识符与注册题录一致；不等于论文结论、同行评议或未撤稿已核验。'};
    } catch (e) {
      return {status: e.upstreamStatus === 404 ? 'not_found' : 'unavailable', kind, checkedAt: timestamp, url, message: e.message,
        note: isDoi ? 'Crossref 未查到不代表 DOI 无效；可能属于其他注册机构。' : '网络或上游故障时不判定标识符无效。'};
    }
  }
}

export class Library {
  constructor(path) { this.path = path; this.state = {version: 1, items: [], searches: []}; this.queue = Promise.resolve(); }
  async load() {
    try {
      const state = JSON.parse(await readFile(this.path, 'utf8'));
      if (state.version !== 1 || !Array.isArray(state.items) || !Array.isArray(state.searches)) throw new Error('文献库格式不支持');
      this.state = state;
    } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  change(fn) {
    const task = this.queue.then(async () => {
      const next = structuredClone(this.state), result = fn(next);
      await mkdir(dirname(this.path), {recursive: true});
      const temp = `${this.path}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(next, null, 2) + '\n', 'utf8'); await rename(temp, this.path);
      this.state = next; return result;
    }); this.queue = task.catch(() => {}); return task;
  }
  save(item) {
    return this.change(state => {
      const i = state.items.findIndex(x => sameWork(x, item));
      if (i >= 0) { state.items[i] = mergeWork(state.items[i], item); return state.items[i]; }
      const row = {...item, id: hash(`${item.doi || ''}|${item.arxivId || ''}|${item.title}|${item.year}`), addedAt: now()};
      state.items.push(row); return row;
    });
  }
  patch(id, patch) {
    return this.change(state => {
      const item = state.items.find(x => x.id === id); if (!item) throw new Error('文献不存在');
      if (patch.notes !== undefined) item.notes = String(patch.notes).slice(0, 30000);
      if (patch.tags !== undefined) item.tags = String(patch.tags).split(/[,，]/).map(x => x.trim()).filter(Boolean).slice(0, 30);
      if (patch.readingStatus !== undefined && ['待阅读', '阅读中', '已读'].includes(patch.readingStatus)) item.readingStatus = patch.readingStatus;
      if (patch.evidence !== undefined && ['A', 'B', 'C'].includes(patch.evidence)) { item.evidence = patch.evidence; item.evidenceNote = '用户手动评定；请在笔记中记录全文证据与依据'; }
      item.updatedAt = now(); return item;
    });
  }
}
export function exportLibrary(state, format = 'json', ids) {
  const items = ids?.length ? state.items.filter(x => ids.includes(x.id)) : state.items;
  if (format === 'json') return JSON.stringify({...state, items, exportedAt: now()}, null, 2);
  if (format === 'bibtex') return items.map(x => {
    const item = {...x, firstThreeAuthors: (x.authorsDetailed || []).slice(0, 3), arxivUrl: x.arxivId ? `https://arxiv.org/abs/${bareArxiv(x.arxivId)}` : ''};
    const entryType = ({'journal-article': 'article', article: 'article', review: 'article', book: 'book', monograph: 'book', 'edited-book': 'book', 'book-chapter': 'incollection', 'proceedings-article': 'inproceedings'})[x.type] || 'misc';
    let bib = citeReference(item, 'bibtex').replace(/^@article\{([^,]+),/, (_, key) => `@${entryType}{${key}_${x.id.slice(0, 8)},`);
    if (['incollection', 'inproceedings'].includes(entryType)) bib = bib.replace(/\n  journal = /, '\n  booktitle = ');
    if (x.type === 'preprint') bib = bib.replace(/\n}$/, ',\n  note = {Preprint; peer review not verified}\n}');
    return bib;
  }).join('\n\n') + '\n';
  if (format !== 'markdown') throw new Error('导出格式不支持');
  const safe = s => String(s || '').replace(/[\[\]<>`]/g, '').replace(/\n/g, ' ');
  return `# 天文学阅读清单\n\n导出时间：${now()}\n\n题录核验不等于结论核验。A/B/C 由用户按原始证据评定。\n\n` + items.map(x => `## ${safe(x.title)}\n\n${safe(x.authors?.join(', '))} · ${x.year || '年份未知'} · ${safe(x.journal)}\n\n${safe(x.version)} · 证据 ${x.evidence} · ${x.readingStatus}\n\n${x.doi ? `DOI: https://doi.org/${encodeURI(x.doi)}\n\n` : ''}${x.arxivId ? `arXiv: https://arxiv.org/abs/${x.arxivId}\n\n` : ''}摘要：${safe(x.abstract) || '摘要未提供'}\n\n笔记：\n\n${x.notes || '未填写'}\n\n核验记录：${safe(JSON.stringify(x.verification))}\n\n来源：${safe(JSON.stringify(x.provenance))}\n`).join('\n') + '\n## 检索快照\n\n```json\n' + JSON.stringify(state.searches, null, 2) + '\n```\n';
}
