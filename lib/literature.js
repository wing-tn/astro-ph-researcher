// astro-ph-researcher :: literature discovery + transparent ranking
import {
  clamp,
  formatAuthors,
  normalizeDoi,
  normalizeTerm,
  tokens,
  truncate,
  unique,
  yearOf,
} from './util.js';

const OPENALEX_URL = 'https://api.openalex.org/works';
const CROSSREF_URL = 'https://api.crossref.org/works';
const ADS_URL = 'https://api.adsabs.harvard.edu/v1/search/query';
const ARXIV_URL = 'https://export.arxiv.org/api/query';

const OPENALEX_SELECT = [
  'id',
  'doi',
  'title',
  'display_name',
  'publication_year',
  'publication_date',
  'cited_by_count',
  'type',
  'primary_location',
  'authorships',
  'abstract_inverted_index',
  'open_access',
  'best_oa_location',
  'locations',
  'biblio',
  'relevance_score',
  'is_retracted',
  'language',
].join(',');

const TYPE_LABELS = {
  article: '期刊论文',
  review: '综述',
  preprint: '预印本',
  book: '专著',
  'book-chapter': '专著章节',
  dissertation: '学位论文',
  paratext: '其他',
  dataset: '数据集',
  letter: '快报',
};

const SORT_LABELS = {
  balanced: '综合（相关性为主，时间次之，引用数再次）',
  relevance: '相关性优先',
  time: '时间优先（最新）',
  citations: '引用数优先',
};

export const ROLE_LABELS = {
  undergrad: '本科生',
  grad: '研究生',
  researcher: '研究员',
  professor: '教授/教师',
};

export const FOCUS_LABELS = {
  overview: '速读与定位',
  method: '方法与数据',
  critique: '批判性评估',
  reproduce: '复现与代码',
  teaching: '教学与讲解',
};

function sanitizeFilterValue(value) {
  return String(value ?? '')
    .replace(/[,|:"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function reconstructAbstract(invertedIndex, maxLength = 1400) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return '';
  const positions = [];
  for (const [word, list] of Object.entries(invertedIndex)) {
    if (!Array.isArray(list)) continue;
    for (const position of list) {
      if (Number.isFinite(position)) positions.push([position, word]);
    }
  }
  positions.sort((a, b) => a[0] - b[0]);
  return truncate(
    positions
      .map(([, word]) => word)
      .join(' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim(),
    maxLength,
  );
}

function cleanJatsAbstract(value, maxLength = 1400) {
  if (!value) return '';
  const text = String(value)
    .replace(/<jats:title[^>]*>[\s\S]*?<\/jats:title>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCodePoint(Number.parseInt(hex, 16));
      } catch {
        return ' ';
      }
    })
    .replace(/\s+/g, ' ')
    .trim();
  return truncate(text, maxLength);
}

function openAlexWorkToItem(work) {
  const doi = work.doi ? `https://doi.org/${normalizeDoi(work.doi)}` : '';
  const source = work.primary_location?.source ?? {};
  const detailedAuthors = (work.authorships ?? []).map((entry) => ({
    name: entry?.author?.display_name ?? entry?.raw_author_name ?? '',
    orcid: entry?.author?.orcid ?? entry?.raw_orcid ?? '',
    affiliations: unique((entry?.institutions ?? []).map((institution) => institution?.display_name ?? '')),
  })).filter((entry) => entry.name);
  const authors = detailedAuthors.map((entry) => entry.name);
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const oaUrl = work.best_oa_location?.pdf_url || work.best_oa_location?.landing_page_url || work.open_access?.oa_url || '';
  const arxiv = (work.locations ?? [])
    .map((location) => location?.landing_page_url ?? location?.pdf_url ?? '')
    .find((url) => /arxiv\.org\/(abs|pdf)\//i.test(url ?? ''));
  const year = work.publication_year ?? yearOf(work.publication_date) ?? null;
  // OpenAlex's primary_location can be a repository (e.g. LA Referencia)
  // rather than the journal; do not present a repository as the venue.
  const venue = source.type === 'repository' ? '' : source.display_name || '';
  const biblio = work.biblio ?? {};
  const pages = [biblio.first_page, biblio.last_page].filter(Boolean).join('-');
  return makeItem({
    source: 'openalex',
    sourceId: work.id?.replace('https://openalex.org/', '') ?? '',
    title: work.title || work.display_name || '',
    authors,
    authorsDetailed: detailedAuthors,
    year,
    date: work.publication_date || (year ? `${year}-01-01` : ''),
    venue,
    volume: biblio.volume || '',
    issue: biblio.issue || '',
    pages,
    publisherUrl: work.primary_location?.landing_page_url || doi || '',
    type: work.type || '',
    doi,
    citations: Number(work.cited_by_count ?? 0),
    relevanceRaw: Number(work.relevance_score ?? 0),
    abstract,
    isOA: Boolean(work.open_access?.is_oa || oaUrl),
    pdfUrl: work.best_oa_location?.pdf_url || '',
    landingUrl: work.best_oa_location?.landing_page_url || doi || '',
    arxivUrl: arxiv || '',
    openAlexUrl: work.id || '',
  });
}

function crossrefWorkToItem(work) {
  const doi = work.DOI ? `https://doi.org/${normalizeDoi(work.DOI)}` : '';
  const detailedAuthors = (work.author ?? []).map((author) => ({
    name: [author.given, author.family].filter(Boolean).join(' '),
    orcid: author.ORCID ? `https://orcid.org/${String(author.ORCID).replace(/^https?:\/\/orcid\.org\//, '')}` : '',
    affiliations: unique((author.affiliation ?? []).map((affiliation) => affiliation?.name ?? '')),
  })).filter((entry) => entry.name);
  const authors = detailedAuthors.map((entry) => entry.name);
  const dateParts = work.published?.['date-parts']?.[0] ?? work.issued?.['date-parts']?.[0] ?? [];
  const year = Number(dateParts[0]) || yearOf(work.published?.['date-parts']?.[0]?.[0]) || null;
  const pdf = (work.link ?? []).find((link) => /pdf/i.test(link?.['content-type'] ?? ''))?.URL ?? '';
  return makeItem({
    source: 'crossref',
    sourceId: work.DOI ?? '',
    title: Array.isArray(work.title) ? work.title[0] : work.title || '',
    authors,
    authorsDetailed: detailedAuthors,
    year,
    date: dateParts.length ? dateParts.map((part, index) => (index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0'))).join('-') : '',
    venue: Array.isArray(work['container-title']) ? work['container-title'][0] : work['container-title'] || '',
    volume: work.volume || '',
    issue: work.issue || '',
    pages: work.page || '',
    publisherUrl: doi || work.URL || '',
    type: work.type || '',
    doi,
    citations: Number(work['is-referenced-by-count'] ?? 0),
    relevanceRaw: Number(work.score ?? 0),
    abstract: cleanJatsAbstract(work.abstract),
    isOA: Boolean(pdf),
    pdfUrl: pdf,
    landingUrl: doi || work.URL || '',
  });
}

function adsDocToItem(doc) {
  const doi = (doc.doi ?? [])[0] ?? '';
  const identifiers = doc.identifier ?? [];
  const arxiv = identifiers.find((value) => /^arxiv:/i.test(value) || /arxiv/i.test(value)) ?? '';
  const bibcode = doc.bibcode ?? '';
  const authors = doc.author ?? [];
  const affiliations = unique(Array.isArray(doc.aff) ? doc.aff : [doc.aff].filter(Boolean));
  const detailedAuthors = authors.map((name) => ({ name, orcid: '', affiliations }));
  return makeItem({
    source: 'ads',
    sourceId: bibcode,
    title: (doc.title ?? [])[0] ?? '',
    authors,
    authorsDetailed: detailedAuthors,
    year: Number(doc.year) || yearOf(doc.pubdate) || null,
    date: doc.pubdate ?? '',
    venue: doc.pub ?? '',
    volume: doc.volume ?? '',
    issue: doc.issue ?? '',
    pages: doc.page ?? '',
    type: (doc.doctype ?? '') === 'review' ? 'review' : 'article',
    doi: doi ? `https://doi.org/${normalizeDoi(doi)}` : '',
    citations: Number(doc.citation_count ?? 0),
    relevanceRaw: Number(doc.score ?? 0),
    abstract: truncate(doc.abstract ?? '', 1400),
    isOA: (doc.links_data ?? []).some((link) => /eprint|pdf/i.test(link?.link_type ?? '')),
    pdfUrl: '',
    landingUrl: bibcode ? `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract` : '',
    adsUrl: bibcode ? `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract` : '',
    arxivUrl: arxiv,
  });
}

function makeItem(input) {
  const doi = input.doi ? `https://doi.org/${normalizeDoi(input.doi)}` : '';
  const title = String(input.title ?? '').replace(/\s+/g, ' ').trim();
  const year = Number(input.year) || yearOf(input.date) || null;
  const authorsDetailed = (input.authorsDetailed ?? []).map((author) => ({
    name: typeof author === 'string' ? author : String(author?.name ?? ''),
    orcid: String(author?.orcid ?? ''),
    affiliations: unique(Array.isArray(author?.affiliations) ? author.affiliations : []),
  })).filter((author) => author.name);
  const authors = unique(input.authors ?? authorsDetailed.map((author) => author.name));
  const affiliations = unique(authorsDetailed.flatMap((author) => author.affiliations));
  const scixQuery = normalizeDoi(doi) ? `doi:${normalizeDoi(doi)}` : title;
  const scixUrl = `https://scixplorer.org/search?q=${encodeURIComponent(scixQuery)}`;
  const adsSearchUrl = !input.adsUrl && normalizeDoi(doi)
    ? `https://ui.adsabs.harvard.edu/search/q=${encodeURIComponent(`doi:${normalizeDoi(doi)}`)}`
    : '';
  const links = [];
  const pushLink = (label, url, kind) => {
    const clean = String(url ?? '').trim();
    if (!clean) return;
    if (links.some((link) => link.url === clean)) return;
    links.push({ label, url: clean, kind });
  };
  pushLink('DOI', doi, 'doi');
  pushLink('ADS', input.adsUrl || adsSearchUrl, 'ads');
  pushLink('SciX', scixUrl, 'scix');
  pushLink('开放PDF', input.pdfUrl, 'pdf');
  pushLink('arXiv', input.arxivUrl, 'arxiv');
  pushLink('OpenAlex', input.openAlexUrl, 'openalex');
  pushLink('Scholar', `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`, 'scholar');
  pushLink('原文', input.publisherUrl || input.landingUrl, 'landing');
  return {
    id: `${input.source}:${input.sourceId || normalizeDoi(doi) || normalizeTerm(title)}`,
    source: input.source,
    title,
    authors,
    authorsDetailed,
    affiliations,
    firstThreeAuthors: authorsDetailed.slice(0, 3),
    year,
    date: String(input.date ?? ''),
    venue: String(input.venue ?? ''),
    volume: String(input.volume ?? ''),
    issue: String(input.issue ?? ''),
    pages: String(input.pages ?? ''),
    journalAbbrev: String(input.journalAbbrev ?? ''),
    publisherUrl: String(input.publisherUrl ?? input.landingUrl ?? ''),
    type: String(input.type ?? ''),
    typeLabel: TYPE_LABELS[input.type] ?? (input.type ? input.type : '文献'),
    doi,
    citations: Number(input.citations ?? 0),
    relevanceRaw: Number(input.relevanceRaw ?? 0),
    abstract: String(input.abstract ?? ''),
    isOA: Boolean(input.isOA),
    links,
    scixUrl,
    openAlexUrl: input.openAlexUrl ?? '',
    adsUrl: input.adsUrl || adsSearchUrl,
    arxivUrl: input.arxivUrl ?? '',
    pdfUrl: input.pdfUrl ?? '',
    score: 0,
    scoreParts: { relevance: 0, recency: 0, citations: 0 },
    why: [],
    badges: [],
  };
}

async function fetchOpenAlex(params) {
  const { fetchJson } = await import('./util.js');
  const filters = [`title_and_abstract.search:${sanitizeFilterValue(params.query)}`, 'is_retracted:false'];
  if (params.yearFrom) filters.push(`from_publication_date:${params.yearFrom}-01-01`);
  if (params.yearTo) filters.push(`to_publication_date:${params.yearTo}-12-31`);
  if (params.minCitations > 0) filters.push(`cited_by_count:>${params.minCitations}`);
  if (params.openAccess) filters.push('is_oa:true');
  const types = params.includePreprints === false ? 'article|review' : 'article|review|preprint';
  filters.push(`type:${types}`);

  const sortMap = {
    balanced: 'relevance_score:desc',
    relevance: 'relevance_score:desc',
    time: 'publication_date:desc',
    citations: 'cited_by_count:desc',
  };
  const perPage = clamp(params.fetchCount ?? 40, 5, 50);
  const url = new URL(OPENALEX_URL);
  url.searchParams.set('filter', filters.join(','));
  url.searchParams.set('per-page', String(perPage));
  url.searchParams.set('sort', sortMap[params.sort] ?? sortMap.balanced);
  url.searchParams.set('select', OPENALEX_SELECT);
  if (params.mailto) url.searchParams.set('mailto', params.mailto);
  if (params.apiKey) url.searchParams.set('api_key', params.apiKey);

  const data = await fetchJson(url.toString(), { timeoutMs: 20000, retries: 1 });
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map(openAlexWorkToItem).filter((item) => item.title);
}

async function fetchCrossref(params) {
  const { fetchJson } = await import('./util.js');
  const url = new URL(CROSSREF_URL);
  url.searchParams.set('query.bibliographic', params.query);
  url.searchParams.set('rows', String(clamp(params.fetchCount ?? 30, 5, 50)));
  url.searchParams.set(
    'select',
    'DOI,title,author,issued,published,container-title,is-referenced-by-count,abstract,URL,type,link,score,volume,issue,page',
  );
  if (params.yearFrom) url.searchParams.set('filter', `from-pub-date:${params.yearFrom}-01-01`);
  if (params.mailto) url.searchParams.set('mailto', params.mailto);
  // Crossref's default query order is relevance; do not pass `sort` for it.
  if (params.sort === 'time') url.searchParams.set('sort', 'published');
  if (params.sort === 'citations') url.searchParams.set('sort', 'is-referenced-by-count');
  if (params.sort === 'time' || params.sort === 'citations') url.searchParams.set('order', 'desc');

  const data = await fetchJson(url.toString(), { timeoutMs: 20000, retries: 1 });
  const items = data?.message?.items;
  return (Array.isArray(items) ? items : []).map(crossrefWorkToItem).filter((item) => item.title);
}

async function fetchAds(params, token) {
  const { fetchJson } = await import('./util.js');
  const sortMap = {
    balanced: 'score desc',
    relevance: 'score desc',
    time: 'date desc',
    citations: 'citation_count desc',
  };
  const url = new URL(ADS_URL);
  url.searchParams.set('q', params.query);
  url.searchParams.set('fl', 'title,author,year,pubdate,doi,citation_count,abstract,identifier,bibcode,doctype,pub,keyword,links_data,score,volume,issue,page,aff');
  url.searchParams.set('rows', String(clamp(params.fetchCount ?? 30, 5, 50)));
  url.searchParams.set('sort', sortMap[params.sort] ?? sortMap.balanced);
  const data = await fetchJson(url.toString(), {
    timeoutMs: 20000,
    headers: { authorization: `Bearer ${token}` },
    retries: 0,
  });
  const docs = data?.response?.docs;
  return (Array.isArray(docs) ? docs : []).map(adsDocToItem).filter((item) => item.title);
}

async function fetchArxiv(params) {
  const { fetchText } = await import('./util.js');
  const url = new URL(ARXIV_URL);
  url.searchParams.set('search_query', `all:${params.query.replace(/\s+/g, ' AND ')}`);
  url.searchParams.set('start', '0');
  url.searchParams.set('max_results', String(clamp(params.limit ?? 8, 1, 20)));
  url.searchParams.set('sortBy', params.sort === 'time' ? 'submittedDate' : 'relevance');
  url.searchParams.set('sortOrder', 'descending');
  const xml = await fetchText(url.toString(), { timeoutMs: 20000, retries: 1, headers: { accept: 'application/atom+xml' } });
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, params.limit ?? 8);
  return entries.map((match) => {
    const entry = match[1];
    const get = (tag) => {
      const value = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '';
      return value.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    };
    const id = get('id');
    const published = get('published');
    const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)].map((m) => m[1].trim());
    return makeItem({
      source: 'arxiv',
      sourceId: id,
      title: get('title'),
      authors,
      year: yearOf(published),
      date: published,
      venue: 'arXiv',
      type: 'preprint',
      citations: 0,
      relevanceRaw: 0,
      abstract: get('summary'),
      isOA: true,
      pdfUrl: id.replace('/abs/', '/pdf/'),
      landingUrl: id,
      arxivUrl: id,
    });
  });
}

function normalizeTitleKey(title) {
  return normalizeTerm(title).replace(/\s+/g, '');
}

function dedupeLinks(links) {
  const preferredOrder = ['doi', 'ads', 'scix', 'pdf', 'arxiv', 'openalex', 'landing', 'scholar'];
  const byKind = new Map();
  for (const link of links ?? []) {
    if (!link?.url) continue;
    const kind = link.kind ?? 'other';
    if (!byKind.has(kind)) byKind.set(kind, link);
  }
  return [...byKind.values()].sort((a, b) => {
    const ai = preferredOrder.indexOf(a.kind);
    const bi = preferredOrder.indexOf(b.kind);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

function dedupe(items) {
  const map = new Map();
  for (const item of items) {
    const key = normalizeDoi(item.doi) || normalizeTitleKey(item.title);
    if (!key) continue;
    const previous = map.get(key);
    if (!previous) {
      map.set(key, { ...item, links: dedupeLinks(item.links) });
      continue;
    }
    // Same DOI or exactly the same normalized title: keep the version with a
    // venue + more citations, but preserve useful links and the longer abstract.
    const better = previous.citations >= item.citations ? previous : item;
    const other = better === previous ? item : previous;
    better.citations = Math.max(previous.citations, item.citations);
    better.isOA = previous.isOA || item.isOA;
    better.pdfUrl = better.pdfUrl || other.pdfUrl;
    better.arxivUrl = better.arxivUrl || other.arxivUrl;
    better.openAlexUrl = better.openAlexUrl || other.openAlexUrl;
    better.adsUrl = better.adsUrl || other.adsUrl;
    better.volume = better.volume || other.volume;
    better.issue = better.issue || other.issue;
    better.pages = better.pages || other.pages;
    better.venue = better.venue || other.venue;
    if ((other.authorsDetailed?.length ?? 0) > (better.authorsDetailed?.length ?? 0)) {
      better.authorsDetailed = other.authorsDetailed;
      better.firstThreeAuthors = other.firstThreeAuthors;
      better.authors = other.authors;
    }
    better.affiliations = unique([...(better.affiliations ?? []), ...(other.affiliations ?? [])]);
    better.abstract = better.abstract.length >= other.abstract.length ? better.abstract : other.abstract;
    better.links = dedupeLinks([...(better.links ?? []), ...(other.links ?? [])]);
    map.set(key, better);
  }
  return [...map.values()];
}

function addWhyAndBadges(item, query, currentYear) {
  const queryTokens = unique(tokens(query).filter((token) => token.length > 2));
  const haystack = normalizeTerm(`${item.title} ${item.abstract}`);
  const hits = queryTokens.filter((token) => haystack.includes(token)).slice(0, 5);
  item.why = hits.length ? hits.map((token) => `命中「${token}」`) : ['主题与检索式相关'];
  const badges = [];
  if (item.type === 'review') badges.push('综述');
  if (item.citations >= 500) badges.push('高引');
  if (item.year && currentYear - item.year <= 2) badges.push('近3年');
  if (item.isOA) badges.push('开放获取');
  if (item.type === 'preprint') badges.push('预印本');
  item.badges = badges;
  return item;
}

export function rankItems(items, { sort = 'balanced', halfLifeYears = 8, limit = 8, query = '', strictPriority = false } = {}) {
  const currentYear = new Date().getFullYear();
  const maxRel = Math.max(...items.map((item) => item.relevanceRaw || 0), 1e-9);
  const maxCites = Math.max(...items.map((item) => item.citations || 0), 1);
  const scored = items.map((item) => {
    const age = item.year ? Math.max(0, currentYear - item.year) : 20;
    const relNorm = clamp((item.relevanceRaw || 0) / maxRel, 0, 1);
    const recencyNorm = Math.pow(0.5, age / Math.max(1, halfLifeYears));
    const citeNorm = Math.log1p(Math.max(0, item.citations)) / Math.log1p(maxCites);
    const score = 0.6 * relNorm + 0.25 * recencyNorm + 0.15 * citeNorm;
    return addWhyAndBadges(
      {
        ...item,
        score: Number(score.toFixed(4)),
        scoreParts: {
          relevance: Number(relNorm.toFixed(3)),
          recency: Number(recencyNorm.toFixed(3)),
          citations: Number(citeNorm.toFixed(3)),
        },
      },
      query,
      currentYear,
    );
  });

  const compare = {
    balanced: (a, b) => {
      if (strictPriority) {
        // Literal "relevance first, then time, then citations": a 5% relevance
        // bucket is treated as a tie so small score noise cannot let an old
        // highly cited paper jump over a clearly more relevant one.
        const bucketA = Math.round((a.scoreParts?.relevance ?? 0) / 0.05);
        const bucketB = Math.round((b.scoreParts?.relevance ?? 0) / 0.05);
        if (bucketA !== bucketB) return bucketB - bucketA;
        if (b.scoreParts?.recency !== a.scoreParts?.recency) return (b.scoreParts?.recency ?? 0) - (a.scoreParts?.recency ?? 0);
        return b.citations - a.citations;
      }
      return b.score - a.score || b.citations - a.citations;
    },
    relevance: (a, b) => b.relevanceRaw - a.relevanceRaw || b.citations - a.citations,
    time: (a, b) => String(b.date ?? b.year ?? '').localeCompare(String(a.date ?? a.year ?? '')),
    citations: (a, b) => b.citations - a.citations || b.relevanceRaw - a.relevanceRaw,
  }[sort] ?? ((a, b) => b.score - a.score);

  return scored.sort(compare).slice(0, clamp(limit, 1, 20));
}

function passesFilters(item, params) {
  if (params.yearFrom && item.year && item.year < params.yearFrom) return false;
  if (params.yearTo && item.year && item.year > params.yearTo) return false;
  if (params.minCitations && item.citations < params.minCitations) return false;
  if (params.openAccess && !item.isOA) return false;
  if (params.includePreprints === false && item.type === 'preprint') return false;
  return true;
}

export async function searchLiterature(params = {}) {
  const query = String(params.query ?? '').trim();
  if (!query) {
    return { error: 'empty_query', message: '请提供英文检索式，例如 "gravitational lensing galaxy clusters"。' };
  }
  if (/[\u4e00-\u9fff]/.test(query)) {
    return {
      error: 'need_english',
      message:
        'OpenAlex / ADS 的检索式以英文为主。请先用 astro_term_lookup 取得英文术语，或直接输入英文关键词。中文知网检索链接仍可在面板中打开。',
      cnki: cnkiLinks(query),
    };
  }

  const sort = SORT_LABELS[params.sort] ? params.sort : 'balanced';
  const limit = clamp(params.limit ?? 8, 1, 20);
  const fetchCount = clamp(Math.max(limit * 5, 30), 10, 50);
  const mailto = String(params.mailto ?? '').trim();
  const includePreprints = params.includePreprints !== false;
  const source = ['auto', 'openalex', 'crossref', 'ads', 'arxiv'].includes(params.source) ? params.source : 'auto';
  const adsToken = String(params.adsToken ?? process.env.ADS_API_TOKEN ?? '').trim();
  const openAlexKey = String(params.openAlexKey ?? process.env.OPENALEX_API_KEY ?? '').trim();
  const strictPriority = Boolean(params.strictPriority);

  const normalizedParams = {
    query,
    sort,
    limit,
    fetchCount,
    mailto,
    includePreprints,
    apiKey: openAlexKey,
    yearFrom: Number(params.yearFrom) || null,
    yearTo: Number(params.yearTo) || null,
    minCitations: Number(params.minCitations) || 0,
    openAccess: Boolean(params.openAccess),
  };

  const notes = [];
  const sourcesTried = [];
  let items = [];
  let sourceUsed = '';

  if ((source === 'auto' || source === 'ads') && adsToken) {
    try {
      items = await fetchAds(normalizedParams, adsToken);
      sourceUsed = 'ads';
      sourcesTried.push('ADS');
    } catch (error) {
      notes.push(`ADS 检索失败（${error?.status ?? 'network'}），已回退。`);
    }
  } else if (source === 'ads' && !adsToken) {
    notes.push('未配置 NASA ADS token（环境变量 ADS_API_TOKEN），无法使用 ADS。');
  }

  if (!items.length && (source === 'auto' || source === 'openalex')) {
    try {
      items = await fetchOpenAlex(normalizedParams);
      sourceUsed = 'openalex';
      sourcesTried.push('OpenAlex');
    } catch (error) {
      if (error?.status === 401) {
        notes.push('OpenAlex 今日免费额度可能已用完（HTTP 401）。可配置 OPENALEX_API_KEY，或改用 Crossref。');
      } else {
        notes.push(`OpenAlex 检索失败：${truncate(error?.message ?? error, 160)}`);
      }
    }
  }

  if (!items.length && (source === 'auto' || source === 'crossref')) {
    try {
      items = await fetchCrossref(normalizedParams);
      sourceUsed = 'crossref';
      sourcesTried.push('Crossref');
    } catch (error) {
      notes.push(`Crossref 检索失败：${truncate(error?.message ?? error, 160)}`);
    }
  }

  if (!items.length && source === 'arxiv') {
    try {
      items = await fetchArxiv(normalizedParams);
      sourceUsed = 'arxiv';
      sourcesTried.push('arXiv');
    } catch (error) {
      notes.push(`arXiv 检索失败：${truncate(error?.message ?? error, 160)}`);
    }
  }

  if (!sourcesTried.length) {
    return {
      error: 'all_sources_failed',
      message: '所有文献源均不可用，请检查网络后重试。',
      notes,
      cnki: cnkiLinks(params.queryZh || query),
    };
  }

  items = dedupe(items).filter((item) => passesFilters(item, normalizedParams));
  const results = rankItems(items, {
    sort,
    halfLifeYears: Number(params.halfLifeYears) || 8,
    limit,
    query,
    strictPriority,
  });

  if (sourceUsed === 'openalex' && includePreprints) {
    notes.push('OpenAlex 已包含预印本类型；如需只保留正式发表版本，可在设置中关闭预印本。');
  }
  if (!adsToken) {
    notes.push('提示：NASA ADS 是天文学最完整的引文库。配置 ADS_API_TOKEN 后可获得更可靠的引用数与收录。');
  }
  if (!openAlexKey && sourceUsed === 'openalex') {
    notes.push('提示：OpenAlex 免费额度按 IP 共享（约 $0.10/天）；配置 OPENALEX_API_KEY 可提高到 $1/天。');
  }

  return {
    query,
    queryZh: String(params.queryZh ?? '').trim(),
    sort,
    sortLabel: strictPriority && sort === 'balanced' ? `${SORT_LABELS[sort]}（严格优先级）` : SORT_LABELS[sort],
    sourceUsed,
    sourcesTried,
    totalFetched: items.length,
    count: results.length,
    results,
    notes,
    cnki: cnkiLinks(params.queryZh || query),
    ranking: {
      formula: 'score = 0.60 × 相关性 + 0.25 × 时间衰减 + 0.15 × log(引用数)',
      halfLifeYears: Number(params.halfLifeYears) || 8,
      strictPriority,
      note:
        '相关性来自 OpenAlex relevance_score 或 Crossref score；时间按半衰期指数衰减；引用数取 log1p 后归一化。严格优先级模式下，相关性 5% 一档，档内先比时间再比引用。',
    },
    fetchedAt: new Date().toISOString(),
  };
}

export function cnkiLinks(query) {
  const q = String(query ?? '').trim();
  if (!q) return null;
  const encoded = encodeURIComponent(q);
  return {
    query: q,
    // The no-captcha landing page is the better default for a human click.
    search: `https://search.cnki.com.cn/Search/Result?content=${encoded}`,
    // The main library (KNS) is the right place for theses but often shows a
    // slider captcha; it is offered as a second button, never fetched by us.
    kns: `https://kns.cnki.net/kns8s/defaultresult/index?kw=${encoded}&korder=SU`,
    thesis: `https://search.cnki.com.cn/Search/Result?content=${encoded}`,
    note: '知网没有公开 API；kns.cnki.net 常触发滑块验证码，search.cnki.com.cn 可直接打开但结果为前端渲染。这里只提供人工检索深链，不抓取、不绕过登录/付费墙；学位论文筛选参数未验证。',
  };
}

export function formatLiteratureSearch(result) {
  if (!result) return '没有结果。';
  if (result.error) {
    const lines = [`文献检索未完成：${result.message ?? result.error}`];
    if (result.notes?.length) for (const note of result.notes) lines.push(`- ${note}`);
    if (result.cnki) lines.push(`- 知网人工检索：${result.cnki.thesis}`);
    return lines.join('\n');
  }
  const lines = [];
  lines.push(`【检索】${result.query}${result.queryZh ? `（中文：${result.queryZh}）` : ''}`);
  lines.push(`【排序】${result.sortLabel}`);
  lines.push(`【来源】${result.sourceUsed} · 拉取 ${result.totalFetched} 条 · 返回 ${result.count} 条`);
  lines.push(`【评分】${result.ranking.formula}`);
  lines.push('');
  result.results.forEach((item, index) => {
    const bits = [
      item.title,
      item.year ? `(${item.year})` : '',
      item.venue || '',
      `被引 ${item.citations}`,
      item.typeLabel,
    ].filter(Boolean);
    lines.push(`${index + 1}. ${bits.join(' · ')}`);
    if (item.authors.length) lines.push(`   作者：${formatAuthors(item.authors, 6)}`);
    const linkLabels = item.links.map((link) => `[${link.label}](${link.url})`);
    if (linkLabels.length) lines.push(`   链接：${linkLabels.join(' · ')}`);
    if (item.badges.length) lines.push(`   标记：${item.badges.join(' / ')}`);
    if (item.why.length) lines.push(`   为什么相关：${item.why.join('；')}`);
    lines.push(`   评分：${item.score.toFixed(2)}（相关性 ${item.scoreParts.relevance.toFixed(2)} / 时间 ${item.scoreParts.recency.toFixed(2)} / 引用 ${item.scoreParts.citations.toFixed(2)}）`);
    if (item.abstract) lines.push(`   摘要：${truncate(item.abstract, 420)}`);
    lines.push('');
  });
  if (result.notes?.length) {
    lines.push('【提示】');
    for (const note of result.notes) lines.push(`- ${note}`);
    lines.push('');
  }
  if (result.cnki) {
    lines.push('【知网学位论文（人工检索）】');
    lines.push(`- 知网搜索（通常无验证码）：${result.cnki.search}`);
    lines.push(`- 知网总库（学位论文；可能触发滑块）：${result.cnki.kns}`);
    lines.push(`- ${result.cnki.note}`);
    lines.push('');
  }
  lines.push('【下一步】把需要的条目交给 DSH 分析时，请只引用上面给出的 DOI/链接，不要补充未返回的文献。');
  return lines.join('\n');
}

export function buildAnalysisPrompt(items, options = {}) {
  const list = (Array.isArray(items) ? items : []).slice(0, 6);
  const role = ROLE_LABELS[options.role] ?? ROLE_LABELS.grad;
  const focus = FOCUS_LABELS[options.focus] ?? FOCUS_LABELS.overview;
  const question = String(options.question ?? '').trim();

  const header = [
    `你是天文学研究助手。请面向「${role}」，对下列文献做「${focus}」分析。`,
    '硬性要求：',
    '1. 只能使用下面给出的题录、摘要与链接；摘要没写到的数据、样本量、结果，必须明确说“摘要未提供”，不得编造。',
    '2. 区分“论文原文陈述”与“你的推断”。推断处标注【推断】。',
    '3. 每个关键结论后用 [DOI: ...] 或 [链接: ...] 标注出处。',
    '4. 涉及公式时给出符号定义、单位与适用条件；不确定就说明不确定。',
    '5. 最后给出可复现性检查清单与下一步检索词（英文）。',
    '',
    '输出结构：',
    '1) 一句话结论（这批文献共同回答了什么）',
    '2) 研究问题与天体物理背景',
    '3) 数据/样本/仪器与观测波段',
    '4) 方法与关键假设（含必要公式）',
    '5) 主要结果、误差来源与不确定性',
    '6) 与教科书/综述/其他文献的一致或冲突之处',
    '7) 可复现性清单（数据、代码、参数、随机种子、软件版本）',
    `8) 对${role}的行动建议（读什么、先学什么、能做什么小项目）`,
    '9) 下一步英文检索词 3-5 个',
    '',
  ];

  const body = list.map((item, index) => {
    const lines = [
      `### 文献 ${index + 1}`,
      `- 标题：${item.title ?? ''}`,
      `- 作者：${formatAuthors(item.authors ?? [], 8)}`,
      `- 年份：${item.year ?? ''}`,
      `- 期刊/来源：${item.venue ?? ''}`,
      `- 类型：${item.typeLabel ?? item.type ?? ''}`,
      `- 被引：${item.citations ?? 0}`,
      `- DOI：${item.doi || '未提供'}`,
      `- 链接：${(item.links ?? []).map((link) => `${link.label}=${link.url}`).join(' | ') || '未提供'}`,
      `- 摘要：${truncate(item.abstract ?? '（摘要未提供）', 1800)}`,
      '',
    ];
    return lines.join('\n');
  });

  const footer = [];
  if (question) footer.push(`用户额外问题：${question}`, '');
  footer.push('如果这批文献不足以回答问题，请明确说明缺口，并给出下一步检索建议。');
  return [...header, ...body, ...footer].join('\n');
}

export function formatAnalysisBrief(items, options = {}) {
  const prompt = buildAnalysisPrompt(items, options);
  return [
    '【已准备文献分析包】',
    `- 文献数：${Math.min((items ?? []).length, 6)}`,
    `- 角色：${ROLE_LABELS[options.role] ?? ROLE_LABELS.grad}`,
    `- 重点：${FOCUS_LABELS[options.focus] ?? FOCUS_LABELS.overview}`,
    '',
    '请直接在对话中按以下分析包执行；如果用户需要，可先确认是否继续：',
    '',
    prompt,
  ].join('\n');
}

export function summaryForTool(result) {
  if (!result || result.error) return result;
  return {
    query: result.query,
    sort: result.sort,
    sourceUsed: result.sourceUsed,
    count: result.count,
    results: result.results,
    notes: result.notes,
    cnki: result.cnki,
  };
}

export { TYPE_LABELS, SORT_LABELS };
