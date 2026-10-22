// astro-ph-researcher :: host half
// - agent tools: term lookup/save/list, literature search, analysis handoff
// - loopback HTTP API consumed by the sidebar client
// - local term book in $DSH_HOME/astro-ph-researcher
import { lookupTerm, formatTermLookup, ASTRODICT_BASE } from './astrodict.js';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { registerSkills } from './skill-files.js';
import {
  buildAnalysisPrompt,
  cnkiLinks,
  FOCUS_LABELS,
  formatLiteratureSearch,
  ROLE_LABELS,
  searchLiterature,
} from './literature.js';
import {
  dictionaryStatus,
  downloadDictionary,
  initDictionary,
  DICTIONARY_LICENSE,
  DICTIONARY_PAGE,
} from './dictionary.js';
import {
  citeReference,
  deleteReference,
  exportBibTeX,
  formatReferenceList,
  getReference,
  initReferences,
  listReferences,
  referenceStats,
  updateReference,
  upsertReference,
} from './references.js';
import {
  addCustomThesisFormat,
  addProjectFiles,
  buildProjectPrompt,
  createProject,
  deleteProject,
  exportFormatPack,
  getJournal,
  getProject,
  getThesisFormat,
  importFormatPack,
  initWriting,
  listJournals,
  listProjects,
  listThesisFormats,
  updateProject,
} from './writing.js';
import {
  fetchThesisFormat,
  formatWorkspaceSummary,
  getFormatWorkspace,
  uploadThesisFormat,
} from './thesis-fetcher.js';
import { formatWritingGoal, getWritingGoal, listWritingGoals, writingGoalStats } from './writing-goals.js';
import { buildConfirmation, createSections, scoreSection, SECTION_DEFS, setSection } from './sections.js';
import { formatCatalog, formatFileFormat, formatPhysicsBook, formatRecommendedBook, formatResearchTool, getFileFormat, getPhysicsBook, listCatalogs, listFileFormats, listPhysicsBooks, listRecommendedBooks, listResearchTools, recommendedBooksNotice, scoreLiterature } from './v2-library.js';
import {
  buildInstrumentPrompt,
  dataStats,
  deleteWorkflow,
  formatInstrument,
  formatMethod,
  getInstrument,
  getMethod,
  initDataLibrary,
  listInstruments,
  listMethods,
  listStatistics,
  listWorkflows,
  saveWorkflow,
} from './data-library.js';
import {
  deleteSavedTerm,
  exportTerms,
  getConfig,
  getSavedTerm,
  initStore,
  listSavedTerms,
  saveNow,
  seedCatalog,
  stats,
  updateConfig,
  upsertSavedTerm,
} from './store.js';
import { clamp, log, truncate, warn } from './util.js';
import { deleteNode, exportPlan, getPlan, patchPlan, summarizePlan, upsertNode } from './plans.js';
import { deepMeta, formatDeepDomain, formatDeepScan, getDeepDomain, listDeepDomains, listDeepPrompts, scanBlindspots } from './deep-library.js';

export const name = 'astro-ph-researcher';
export const inject = ['webServer', 'tools', 'systemPrompt', 'skills'];
export const VERSION = '3.1.0';
const SKILLS_DIR = fileURLToPath(new URL('../skills/', import.meta.url));
const KATEX_DIR = fileURLToPath(new URL('../assets/katex/', import.meta.url));

const PREFIX = '/api/astro-ph-researcher';
let lastSessionId = null;
let registeredSkills = [];

function textOutput() {
  return {
    schema: { type: 'string' },
    render: (_args, value) => [{ type: 'text', text: String(value ?? '') }],
  };
}

function errorText(error) {
  return `操作失败：${error?.message ?? String(error)}`;
}

function normalizeRole(role) {
  return ROLE_LABELS[role] ? role : 'grad';
}

function normalizeFocus(focus) {
  return FOCUS_LABELS[focus] ? focus : 'overview';
}

function toSavedTerm(result) {
  const term = result?.term ?? {};
  const related = (result?.related ?? []).map((item) => item.zh || item.en).filter(Boolean).slice(0, 10);
  return {
    ...term,
    related,
    verified: !result?.matchedBy?.startsWith('seed') && Boolean(term.astrodictId),
    translationSource: result?.matchedBy?.startsWith('seed') ? 'seed' : term.astrodictId ? 'NADC' : 'user',
    explanationSource: term.explanation ? 'seed' : '',
    tags: term.tags ?? [],
    note: term.note ?? '',
  };
}

async function resolveQuery(query, queryZh) {
  const raw = String(query ?? '').trim();
  if (!raw) return { error: 'empty_query' };
  if (!/[\u4e00-\u9fff]/.test(raw)) return { query: raw, queryZh: String(queryZh ?? '').trim() };
  const lookup = await lookupTerm(raw, { includeRelated: false });
  if (lookup.found && lookup.term?.en) {
    return { query: lookup.term.en, queryZh: raw, term: lookup.term };
  }
  return {
    error: 'need_english',
    message:
      '这个中文词条没有在 NADC 词库中找到对应英文名。请先查词并确认英文术语，或直接输入英文关键词；知网中文检索链接仍可用。',
    candidates: lookup.candidates ?? [],
    cnki: cnkiLinks(raw),
  };
}

async function runLiteratureSearch(args = {}) {
  const config = getConfig();
  const resolved = await resolveQuery(args.query, args.queryZh);
  if (resolved.error) return resolved;
  return searchLiterature({
    query: resolved.query,
    queryZh: resolved.queryZh,
    sort: args.sort ?? config.literature?.defaultSort ?? 'balanced',
    limit: args.limit ?? config.literature?.maxResults ?? 8,
    yearFrom: args.yearFrom,
    yearTo: args.yearTo,
    minCitations: args.minCitations,
    openAccess: args.openAccess,
    includePreprints: args.includePreprints ?? config.literature?.includePreprints ?? true,
    source: args.source ?? config.literature?.source ?? 'auto',
    mailto: args.mailto ?? config.literature?.mailto ?? process.env.ASTRO_WORDS_MAILTO ?? '',
    halfLifeYears: config.literature?.halfLifeYears ?? 8,
    strictPriority: args.strictPriority ?? config.literature?.strictPriority ?? false,
    adsToken: process.env.ADS_API_TOKEN ?? '',
    openAlexKey: process.env.OPENALEX_API_KEY ?? '',
  });
}

function formatTermList(rows) {
  if (!rows.length) return '术语本还是空的。可以用 astro_term_lookup(term, save=true) 或 astro_term_save 添加。';
  const lines = [`术语本共 ${rows.length} 条：`];
  rows.forEach((term, index) => {
    lines.push(
      `${index + 1}. ${term.zh || term.en}（${term.en}）${term.abbr ? ` [${term.abbr}]` : ''}${term.verified ? ' · NADC 已核验' : ' · 自建/未核验'}`,
    );
    if (term.astrodictUrl) lines.push(`   ${term.astrodictUrl}`);
    if (term.tags?.length) lines.push(`   标签：${term.tags.join(' / ')}`);
  });
  return lines.join('\n');
}

function registry() {
  return {
    astro_term_lookup: {
      name: 'astro_term_lookup',
      description:
        '查询天文英文/中文术语：用国家天文台天文学名词库（NADC）核验权威中文译名、出版状态、依据书目与词条链接，并返回相关术语。需要区分“审定译名”和“DSH 释义”时优先使用。可同时保存到本地术语本。',
      parameters: {
        type: 'object',
        properties: {
          term: { type: 'string', description: '英文或中文术语，例如 redshift、gravitational lensing、红移、活动星系核' },
          save: { type: 'boolean', description: '是否把核验后的词条保存到本地术语本，默认 false' },
          includeRelated: { type: 'boolean', description: '是否返回相关术语，默认 true' },
          relatedLimit: { type: 'number', description: '相关术语数量，1-20，默认 8' },
          astrodictId: { type: 'string', description: '可选：直接打开某个 NADC 词条 id（用于同名词条切换）' },
        },
        required: ['term'],
      },
      output: textOutput(),
      timeoutMs: 60000,
      async execute(args) {
        try {
          const result = await lookupTerm(args?.term, {
            includeRelated: args?.includeRelated !== false,
            relatedLimit: clamp(args?.relatedLimit ?? 8, 1, 20),
            astrodictId: args?.astrodictId,
          });
          let text = formatTermLookup(result, { relatedLimit: clamp(args?.relatedLimit ?? 8, 1, 20) });
          if (args?.save && result.found) {
            const saved = upsertSavedTerm(toSavedTerm(result));
            text += `\n\n【已保存】${saved.zh}（${saved.en}）已写入本地术语本。`;
          }
          if (result.networkError) text += `\n\n【网络提示】NADC 连接异常：${truncate(result.networkError, 180)}`;
          if (result.dictionary) {
            text += result.dictionary.installed
              ? `\n\n【离线词表】已安装 ${result.dictionary.version}，${result.dictionary.count} 条${result.dictionary.used ? '（本次命中离线词表）' : ''}。`
              : '\n\n【离线词表】未安装；可在侧边栏设置中下载官方词表，断网时也能查。';
          }
          return text;
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_term_save: {
      name: 'astro_term_save',
      description:
        '把一条天文术语保存到本地术语本（$DSH_HOME/astro-ph-researcher/terms.json）。如果提供了英文/中文名但没有 NADC id，会先尝试用 NADC 核验；核验不到时标记为“用户自建/未核验”。',
      parameters: {
        type: 'object',
        properties: {
          en: { type: 'string', description: '英文术语' },
          zh: { type: 'string', description: '中文术语' },
          astrodictId: { type: 'string', description: 'NADC 词条 id（可选）' },
          explanation: { type: 'string', description: 'DSH 释义（可选）' },
          formula: { type: 'string', description: '关键公式（人类可读，可选）' },
          formulaLatex: { type: 'string', description: '关键公式的 LaTeX 源码（可选，优先用于渲染/复制）' },
          units: { type: 'string', description: '单位/量纲（可选）' },
          note: { type: 'string', description: '个人笔记（可选）' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签（可选）' },
          related: { type: 'array', items: { type: 'string' }, description: '相关术语（可选）' },
          literatureQuery: { type: 'string', description: '该词对应的英文文献检索式（可选）' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 45000,
      async execute(args = {}) {
        try {
          let term = {
            en: String(args.en ?? '').trim(),
            zh: String(args.zh ?? '').trim(),
            astrodictId: String(args.astrodictId ?? '').trim(),
            explanation: String(args.explanation ?? '').trim(),
            formula: String(args.formula ?? '').trim(),
            formulaLatex: String(args.formulaLatex ?? '').trim(),
            units: String(args.units ?? '').trim(),
            note: String(args.note ?? '').trim(),
            tags: Array.isArray(args.tags) ? args.tags : [],
            related: Array.isArray(args.related) ? args.related : [],
            literatureQuery: String(args.literatureQuery ?? '').trim(),
          };
          if (!term.en && !term.zh) return '请至少提供英文 en 或中文 zh。';

          if (!term.astrodictId) {
            const lookup = await lookupTerm(term.en || term.zh, { includeRelated: false }).catch(() => null);
            if (lookup?.found) {
              term = {
                ...toSavedTerm(lookup),
                ...Object.fromEntries(Object.entries(term).filter(([, value]) => value !== '' && !(Array.isArray(value) && !value.length))),
              };
            }
          }
          const saved = upsertSavedTerm(term);
          return [
            `已保存：${saved.zh || saved.en}（${saved.en}）`,
            saved.astrodictUrl ? `NADC：${saved.astrodictUrl}` : '未关联 NADC 词条（用户自建/未核验）',
            saved.tags?.length ? `标签：${saved.tags.join(' / ')}` : '',
            saved.note ? `笔记：${saved.note}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_reference_save: {
      name: 'astro_reference_save',
      description:
        '把一篇已核验的文献保存到本地参考文献库（前三位作者/单位/期刊卷期页/DOI/SciX/ADS/arXiv/摘要/总结/关键结果/领域与关键词标签）。通常把 astro_literature_search 返回的 result 直接作为 paper 传入；同一 DOI 自动去重并合并标签。',
      parameters: {
        type: 'object',
        properties: {
          paper: {
            type: 'object',
            description: '文献对象，建议直接传 astro_literature_search 的 results 元素',
            properties: {
              title: { type: 'string' },
              doi: { type: 'string' },
              authors: { type: 'array', items: { type: 'string' } },
              authorsDetailed: { type: 'array', items: { type: 'object' } },
              affiliations: { type: 'array', items: { type: 'string' } },
              venue: { type: 'string' },
              journal: { type: 'string' },
              volume: { type: 'string' },
              issue: { type: 'string' },
              pages: { type: 'string' },
              year: { type: 'number' },
              abstract: { type: 'string' },
              links: { type: 'array', items: { type: 'object' } },
              scixUrl: { type: 'string' },
              adsUrl: { type: 'string' },
              arxivUrl: { type: 'string' },
              publisherUrl: { type: 'string' },
              citations: { type: 'number' },
              source: { type: 'string' },
            },
            required: ['title'],
          },
          summary: { type: 'string', description: '分析总结归纳后的摘要成果（可引用）' },
          keyResults: { type: 'array', items: { type: 'string' }, description: '关键结果/可引用句子' },
          fields: { type: 'array', items: { type: 'string' }, description: '领域分类，如 星系、宇宙学、多信使天文学' },
          keywords: { type: 'array', items: { type: 'string' }, description: '关键词/源/方法/望远镜' },
          collections: { type: 'array', items: { type: 'string' }, description: '专题/项目分类' },
          notes: { type: 'string', description: '个人笔记' },
        },
        required: ['paper'],
      },
      output: textOutput(),
      timeoutMs: 20000,
      async execute(args = {}) {
        try {
          const paper = args.paper ?? {};
          if (!paper.title) return 'paper.title 不能为空。';
          const reference = upsertReference({
            ...paper,
            summary: args.summary,
            keyResults: args.keyResults,
            notes: args.notes,
            tags: {
              fields: args.fields ?? [],
              keywords: args.keywords ?? [],
              collections: args.collections ?? [],
            },
          });
          return [
            `已保存：${reference.title}`,
            `id：${reference.id}`,
            `作者：${(reference.firstThreeAuthors ?? []).map((author) => author.name).join(', ')}${(reference.authors?.length ?? 0) > 3 ? ' et al.' : ''}`,
            reference.journal ? `期刊：${reference.journal}${reference.volume ? `, ${reference.volume}` : ''}${reference.issue ? `(${reference.issue})` : ''}${reference.pages ? `, ${reference.pages}` : ''}` : '',
            reference.doi ? `DOI：${reference.doi}` : '',
            reference.tags?.fields?.length || reference.tags?.keywords?.length
              ? `标签：${[...(reference.tags.fields ?? []), ...(reference.tags.keywords ?? [])].join(' / ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_reference_list: {
      name: 'astro_reference_list',
      description: '列出/搜索本地参考文献库，可按领域、关键词、专题标签过滤；返回前三位作者、单位、期刊卷期页、DOI、总结与可引用内容。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '按标题/作者/期刊/摘要/标签搜索' },
          field: { type: 'string', description: '按领域标签过滤' },
          keyword: { type: 'string', description: '按关键词过滤' },
          tag: { type: 'string', description: '按任意标签过滤' },
          collection: { type: 'string', description: '按专题过滤' },
          limit: { type: 'number', description: '返回条数，默认 50' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const rows = listReferences({ ...args, limit: args.limit ?? 50 });
          return `${formatReferenceList(rows)}\n\n统计：${JSON.stringify(referenceStats())}`;
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_reference_update: {
      name: 'astro_reference_update',
      description: '修改文献库条目的总结、关键结果、领域/关键词/专题标签、个人笔记；用于研究者自己修正归类。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '参考文献 id' },
          summary: { type: 'string' },
          notes: { type: 'string' },
          keyResults: { type: 'array', items: { type: 'string' } },
          fields: { type: 'array', items: { type: 'string' } },
          keywords: { type: 'array', items: { type: 'string' } },
          collections: { type: 'array', items: { type: 'string' } },
        },
        required: ['id'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const reference = updateReference(String(args.id ?? ''), {
            summary: args.summary,
            notes: args.notes,
            keyResults: args.keyResults,
            tags: {
              fields: args.fields,
              keywords: args.keywords,
              collections: args.collections,
            },
          });
          if (!reference) return `找不到文献 id：${args.id}`;
          return `已更新：${reference.title}\n标签：${JSON.stringify(reference.tags)}`;
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_reference_cite: {
      name: 'astro_reference_cite',
      description: '为参考文献库中的条目生成引用文本。支持 BibTeX（Overleaf/LaTeX）、APA、GB/T 7714（中文学位论文）、MLA。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '参考文献 id' },
          style: { type: 'string', enum: ['bibtex', 'apa', 'gb7714', 'mla'], description: '引用格式，默认 bibtex' },
        },
        required: ['id'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const reference = getReference(String(args.id ?? ''));
          if (!reference) return `找不到文献 id：${args.id}`;
          return citeReference(reference, args.style ?? 'bibtex');
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_reference_export: {
      name: 'astro_reference_export',
      description: '导出本地参考文献库为 BibTeX（可直接导入 Overleaf / JabRef / Zotero）。可传 ids 只导出选中条目。',
      parameters: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'string' }, description: '可选：只导出这些文献 id' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const bib = exportBibTeX(Array.isArray(args.ids) ? args.ids : []);
          return bib || '文献库为空。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_writing_goal: {
      name: 'astro_writing_goal',
      description:
        '查询论文写作目标/叙述风格：首次发现、独立确认、批判反驳、跟进增量、零结果上限、方法软件、巡天星表、理论模型、多信使、综述观点。返回核心姿态、证据门槛、标题/摘要动作、期刊匹配与风格提示词。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'stats'], description: '操作' },
          id: { type: 'string', description: '目标 id，如 discovery/refutation' },
          query: { type: 'string', description: '按名称/别名搜索' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.action === 'stats') return JSON.stringify(writingGoalStats());
          if (args.action === 'get') return formatWritingGoal(getWritingGoal(String(args.id ?? '')));
          const goals = listWritingGoals(args.query ?? '');
          return goals.length
            ? goals.map((goal) => `${goal.id} | ${goal.nameZh} | ${goal.nameEn} | 期刊：${goal.journalFit.join('/')}`).join('\n')
            : '没有匹配的写作目标。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_file_format: {
      name: 'astro_file_format',
      description: '文件格式百科：FITS/图像/BINTABLE/事件表/PHA/RMF/ARF/IRF/Fermi XML/VOTable/ECSV/WCS/HDF5/ASDF/NetCDF。像术语一样查格式、关键头、工具和常见错误。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get'], description: '操作' },
          id: { type: 'string', description: '格式 id，如 fits/fermi-xml/pha' },
          query: { type: 'string', description: '按名称/别名/工具搜索' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.action === 'get') return formatFileFormat(getFileFormat(String(args.id ?? '')));
          const rows = listFileFormats(args.query ?? '');
          return rows.length ? rows.map((item) => `${item.id} | ${item.name} | ${item.kind} | ${(item.extensions ?? []).join('/') || '无扩展名'}`).join('\n') : '没有匹配的文件格式。';
        } catch (error) { return errorText(error); }
      },
    },

    astro_physics_reference: {
      name: 'astro_physics_reference',
      description: '物理/天文权威书目索引：Landau 十卷、相对论/黑洞/中子星/致密天体/辐射转移/恒星/AGN/GRB/中微子/引力波/粒子物理。只返回书目与用途，不含全文；版次/章节需核验。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'recommended'], description: '操作' },
          id: { type: 'string', description: '书目 id，如 landau-fields/zhang-grb' },
          query: { type: 'string', description: '按标题/作者/领域搜索' },
          domain: { type: 'string', description: '领域过滤，如 relativity/grb/radiation' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.action === 'get') return formatPhysicsBook(getPhysicsBook(String(args.id ?? '')));
          if (args.action === 'recommended') {
            const books = listRecommendedBooks(args.query ?? '');
            return [recommendedBooksNotice(), '', ...books.map(formatRecommendedBook)].join('\n\n');
          }
          const rows = listPhysicsBooks(args.query ?? '', args.domain ?? '');
          return rows.length ? rows.map((item) => `${item.id} | ${item.title} | ${item.year} | ${(item.domains ?? []).join('/')} | tier ${item.tier}`).join('\n') : '没有匹配的书目。';
        } catch (error) { return errorText(error); }
      },
    },

    astro_research_guide: {
      name: 'astro_research_guide',
      description: '第三方分析/数据工具引导：3ML time-energy、AM³、SSDC SED、DS9、Geant4，以及 Fermi 4FGL/3FHL、Swift/XRT、Chandra、XMM、Gaia、VizieR 等公开源表。只给安装/输入/输出/检查/引用，不自动运行重型程序。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['tools', 'tool', 'catalogs'], description: '操作' },
          id: { type: 'string', description: '工具 id 或目录 id，如 3ml/am3/ds9/4fgl' },
          query: { type: 'string', description: '搜索' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.action === 'catalogs') {
            const rows = listCatalogs(args.query ?? '');
            return rows.length ? rows.map((item) => formatCatalog(item)).join('\n\n') : '没有匹配的公开源表。';
          }
          if (args.action === 'tool') {
            const tool = listResearchTools('').find((item) => item.id === String(args.id ?? ''));
            return formatResearchTool(tool);
          }
          const rows = listResearchTools(args.query ?? '');
          return rows.length ? rows.map((item) => `${item.id} | ${item.name} | ${item.kind} | ${item.url}`).join('\n') : '没有匹配的工具。';
        } catch (error) { return errorText(error); }
      },
    },

    astro_literature_score: {
      name: 'astro_literature_score',
      description: '给参考文献库中的文献做 6 维启发式评分（相关性/证据/方法/可复现/发表可信度/时效），返回理由和 flags。只是辅助，不是论文质量判决；作者可覆盖。',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '参考文献 id' },
        },
        required: ['id'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const ref = getReference(String(args.id ?? ''));
          if (!ref) return '未找到该参考文献。';
          const score = scoreLiterature(ref);
          return JSON.stringify(score, null, 2);
        } catch (error) { return errorText(error); }
      },
    },

    astro_section_workflow: {
      name: 'astro_section_workflow',
      description: 'v2 逐节写作：列出项目的章节状态，或对某一节做启发式评分。作者确认只能通过客户端确认按钮，工具不能代替作者确认。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'get', 'score'], description: '操作' },
          projectId: { type: 'string' },
          section: { type: 'string', description: 'title/abstract/introduction/methods/results/discussion/conclusion/figures/references/formatting' },
          content: { type: 'string', description: 'score 时可直接给文本；省略则用项目已保存内容' },
        },
        required: ['action', 'projectId'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const project = getProject(String(args.projectId ?? ''));
          if (!project) return '未找到项目。';
          const sections = createSections(project.sections ?? {});
          if (args.action === 'list') return Object.values(sections).map((sec) => `${sec.id} | ${sec.nameZh} | ${sec.status} | score ${sec.score?.overall ?? '-'} | confirmed ${sec.confirmation ? 'yes' : 'no'}`).join('\n');
          const sec = sections[String(args.section ?? '')];
          if (!sec) return '未找到该章节。';
          if (args.action === 'get') return JSON.stringify(sec, null, 2);
          const content = args.content !== undefined ? String(args.content) : sec.content;
          return JSON.stringify(scoreSection({ content, sectionId: sec.id, goalId: project.goalId }), null, 2);
        } catch (error) { return errorText(error); }
      },
    },

    astro_author_status: {
      name: 'astro_author_status',
      description: '只读查看作者确认状态：项目各章节的 contentHash、评分、作者确认记录/时间。AI 不能写确认，只有客户端“作者确认”按钮能记录。',
      parameters: {
        type: 'object',
        properties: { projectId: { type: 'string' } },
        required: ['projectId'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const project = getProject(String(args.projectId ?? ''));
          if (!project) return '未找到项目。';
          const sections = createSections(project.sections ?? {});
          return Object.values(sections).map((sec) => `${sec.nameZh} | ${sec.status} | hash ${sec.contentHash.slice(0, 12)}… | ${sec.confirmation?.confirmedBy ?? '未确认'} ${sec.confirmation?.confirmedAt ?? ''}`).join('\n');
        } catch (error) { return errorText(error); }
      },
    },

    astro_writing_project: {
      name: 'astro_writing_project',
      description:
        '管理写作项目：创建/列出/读取/更新期刊论文或学位论文项目，上传研究结果文件（文本或 base64），绑定目标期刊或高校格式，设置参考文献 id。通常是第三步写论文的入口。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'create', 'get', 'update', 'upload_files'], description: '操作类型' },
          projectId: { type: 'string', description: '项目 id（get/update/upload_files 必填）' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['journal', 'thesis'] },
          language: { type: 'string', enum: ['en', 'zh', 'bilingual'] },
          goalId: { type: 'string', description: '写作目标/风格 id：discovery/confirmation/refutation/incremental/null-limit/method-software/survey-catalog/theory-model/multimessenger/review-perspective' },
          targetId: { type: 'string', description: '期刊 id 或高校格式 id' },
          styleNotes: { type: 'string', description: '目标语言风格/期刊/学校额外要求' },
          outline: { type: 'string', description: '已确认的大纲' },
          referenceIds: { type: 'array', items: { type: 'string' }, description: '关联的文献库 id' },
          files: {
            type: 'array',
            description: 'upload_files 用；每项 {name,type,content,encoding}，文本用 encoding=utf8，二进制用 base64',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                content: { type: 'string' },
                encoding: { type: 'string', enum: ['utf8', 'base64'] },
              },
              required: ['name', 'content'],
            },
          },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 30000,
      async execute(args = {}) {
        try {
          if (args.action === 'list') {
            const projects = listProjects();
            return projects.length
              ? projects.map((project) => `${project.id} | ${project.title} | ${project.type} | goal=${project.goalId || '未选'} | ${project.targetId || '未选目标'} | ${project.files?.length ?? 0} files`).join('\n')
              : '还没有写作项目。';
          }
          if (args.action === 'create') {
            const project = createProject(args);
            return `已创建项目：${project.id}\n${project.title}（${project.type}）`;
          }
          if (args.action === 'get') {
            const project = getProject(String(args.projectId ?? ''));
            if (!project) return `找不到项目：${args.projectId}`;
            return JSON.stringify({ project, target: project.type === 'journal' ? getJournal(project.targetId) : getThesisFormat(project.targetId) }, null, 2);
          }
          if (args.action === 'update') {
            const project = updateProject(String(args.projectId ?? ''), args);
            if (!project) return `找不到项目：${args.projectId}`;
            return `已更新项目：${project.id}\n${project.title}`;
          }
          if (args.action === 'upload_files') {
            const result = await addProjectFiles(String(args.projectId ?? ''), args.files ?? []);
            return `已上传 ${result.added.length} 个文件到 ${result.project.id}：\n${result.added.map((file) => `- ${file.name} (${file.size} bytes)`).join('\n')}`;
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_writing_handoff: {
      name: 'astro_writing_handoff',
      description:
        '把写作项目整理成可直接交给 DSH 写作的结构化提示词，包括目标期刊/学校格式、上传文件预览、文献库引用和本次任务（分析结果/生成大纲/逐节起草/格式检查）。只基于项目文件与文献库，不编造数据。',
      parameters: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
          mode: { type: 'string', enum: ['analyze', 'outline', 'draft', 'format', 'audit'], description: '本次任务' },
        },
        required: ['projectId'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const project = getProject(String(args.projectId ?? ''));
          if (!project) return `找不到项目：${args.projectId}`;
          const references = project.referenceIds?.length
            ? project.referenceIds.map((id) => getReference(id)).filter(Boolean)
            : listReferences({ limit: 40 });
          const formatWorkspace = await getFormatWorkspace(project.targetId);
          return buildProjectPrompt(project, { mode: args.mode ?? 'outline', references, formatWorkspace });
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_thesis_format: {
      name: 'astro_thesis_format',
      description:
        '学位论文格式工作台：选择高校/中科院院所后，抓取其官方格式页/模板到本地 $DSH_HOME/astro-ph-researcher/formats，解析 DOCX/文本/ZIP，PDF/DOC 标记为需 DSH 解析；也支持作者上传自己的格式文件。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['status', 'fetch', 'upload'], description: '操作' },
          formatId: { type: 'string', description: 'thesis-formats.seed.json 中的 id，如 gxu-physics/pmo-astronomy' },
          force: { type: 'boolean', description: 'fetch 时强制重新下载' },
          file: {
            type: 'object',
            description: 'upload 用：{name,type,content,encoding}；文本用 utf8，二进制用 base64',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              encoding: { type: 'string', enum: ['utf8', 'base64'] },
            },
            required: ['name', 'content'],
          },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 90000,
      async execute(args = {}) {
        try {
          const formatId = String(args.formatId ?? '');
          if (args.action === 'status') {
            return formatWorkspaceSummary(await getFormatWorkspace(formatId));
          }
          if (args.action === 'fetch') {
            return formatWorkspaceSummary(await fetchThesisFormat(formatId, { force: Boolean(args.force) }));
          }
          if (args.action === 'upload') {
            return formatWorkspaceSummary(await uploadThesisFormat(formatId, args.file ?? {}));
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_format_library: {
      name: 'astro_format_library',
      description:
        '查询/扩展写作目标格式库：天文 SCI 期刊（官网/作者指南/Overleaf 模板/引用风格）或中国高校学位论文格式（版本年份/规范链接/引用标准）；可添加用户上传的学校格式（标注 custom）。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['journals', 'thesis', 'add_thesis'], description: '操作类型' },
          query: { type: 'string', description: '按名称/缩写过滤' },
          university: { type: 'string' },
          department: { type: 'string' },
          yearVersion: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          citationStandard: { type: 'string' },
          formatNotes: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const q = String(args.query ?? '').toLowerCase();
          if (args.action === 'journals') {
            const rows = listJournals().filter((journal) => !q || `${journal.name} ${journal.abbrev}`.toLowerCase().includes(q));
            return rows.map((journal) => `${journal.abbrev} | ${journal.name} | ${journal.authorGuidelines || '无作者指南链接'} | ${journal.overleafTemplate || '无 Overleaf 模板'} | ${journal.citationStyle || ''}`).join('\n');
          }
          if (args.action === 'thesis') {
            const rows = listThesisFormats().filter((format) => !q || `${format.university} ${format.department} ${format.yearVersion}`.toLowerCase().includes(q));
            return rows.map((format) => `${format.university} | ${format.degree} | ${format.yearVersion} | ${format.url || '无链接'} | ${format.citationStandard || ''}`).join('\n');
          }
          if (args.action === 'add_thesis') {
            const format = addCustomThesisFormat(args);
            return `已添加自定义格式：${format.university} ${format.yearVersion}（${format.id}）\n请提醒用户在本地保存并导出格式包共享。`;
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_data_method: {
      name: 'astro_data_method',
      description:
        '查询天文数据处理方法与统计学原理：图像处理、概率分布/KS 检验、误差传递、最小二乘/拟合、周期分析、最大似然、贝叶斯/MCMC、机器学习、虚拟天文台。附独立编写的 Python 示例；不包含书籍/章节信息。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '方法名/关键词，如 最小二乘、Lomb-Scargle、KS、MCMC、PCA' },
          id: { type: 'string', description: '方法 id（可选）' },
          category: { type: 'string', description: '类别：图像|统计|拟合|时间序列|贝叶斯|机器学习|VO' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.id) return formatMethod(getMethod(String(args.id)));
          const methods = listMethods({ ...args, limit: 20 });
          if (!methods.length) return '没有找到匹配的方法。';
          return methods.map((method) => formatMethod(method)).join('\n\n---\n\n');
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_data_instrument: {
      name: 'astro_data_instrument',
      description:
        '查询全球天文望远镜/观测卫星/地面探测器/引力波与中微子设施的数据获取、官方分析工具与建议工作流；区分运行中/在建/规划中与开放/受限/闭源（如 FAST/LHAASO/IXPE）。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '设施名/关键词，如 Chandra、Fermi、IceCube、LIGO、FAST' },
          id: { type: 'string', description: '设施 id（可选）' },
          status: { type: 'string', enum: ['running', 'commissioning', 'under_construction', 'planned', 'proposed', 'ended'], description: '状态过滤' },
          openPolicy: { type: 'string', enum: ['open', 'restricted', 'proprietary', 'closed'], description: '数据政策过滤' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.id) return formatInstrument(getInstrument(String(args.id)));
          const items = listInstruments({ ...args, limit: 30 });
          if (!items.length) return '没有找到匹配的观测设备。';
          return items.map((item) => formatInstrument(item)).join('\n\n---\n\n');
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_data_workflow: {
      name: 'astro_data_workflow',
      description: '保存/列出/删除个人研究数据工作流（设施、步骤、笔记、链接），用于把官方数据获取与开源分析流程固定下来。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'save', 'delete'], description: '操作' },
          id: { type: 'string', description: 'delete 用工作流 id' },
          instrumentId: { type: 'string', description: '设施 id，如 chandra/fermi-lat/icecube' },
          name: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (args.action === 'list') {
            const rows = listWorkflows();
            return rows.length
              ? rows.map((row) => `${row.id} | ${row.name} | ${row.instrumentName} | ${row.steps.length} steps | ${row.updatedAt}`).join('\n')
              : '还没有保存的工作流。';
          }
          if (args.action === 'save') {
            const workflow = saveWorkflow(args);
            return `已保存工作流：${workflow.name}（${workflow.id}）\n${workflow.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;
          }
          if (args.action === 'delete') {
            const ok = deleteWorkflow(String(args.id ?? ''));
            return ok ? '已删除工作流。' : '找不到该工作流。';
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_research_plan: {
      name: 'astro_research_plan',
      description:
        '本地研究计划树：记录问答中值得保留的正确信息，整理为阶段/节点，保存并可导出 Markdown/JSON。action=get/add/update/delete/export/summarize。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get', 'add', 'update', 'delete', 'export', 'summarize'], description: '操作' },
          id: { type: 'string', description: '节点 id（update/delete）' },
          parentId: { type: 'string', description: '父节点 id；省略为根节点' },
          title: { type: 'string', description: '节点标题' },
          note: { type: 'string', description: '节点正文/证据/待办' },
          status: { type: 'string', enum: ['todo', 'doing', 'done', 'blocked'], description: '状态' },
          phase: { type: 'string', description: '阶段，如 文献/数据/分析/写作' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签' },
          source: { type: 'string', description: '来源（对话/论文/链接）' },
          format: { type: 'string', enum: ['md', 'json'], description: 'export 格式' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 10000,
      async execute(args = {}) {
        try {
          if (args.action === 'get') return summarizePlan(await getPlan());
          if (args.action === 'summarize') return summarizePlan(await getPlan());
          if (args.action === 'export') {
            const out = await exportPlan(args.format === 'json' ? 'json' : 'md');
            return out.body;
          }
          if (args.action === 'delete') {
            await deleteNode(String(args.id ?? ''));
            return summarizePlan(await getPlan());
          }
          if (args.action === 'add' || args.action === 'update') {
            const result = await upsertNode({
              id: args.id,
              parentId: args.parentId,
              title: args.title,
              note: args.note,
              status: args.status,
              phase: args.phase,
              source: args.source,
              tags: args.tags,
            });
            return summarizePlan(result.plan);
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_deep_scan: {
      name: 'astro_deep_scan',
      description:
        '天文研究盲点/交叉学科扫描：天体化学、ML/神经网络、核天体物理、多信使、宇宙学、行星/天体生物、仪器、统计因果与开放科学；返回检查问题与可粘贴的深度提示词，不把问题当结论。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['domains', 'prompts', 'scan'], description: '操作' },
          phase: { type: 'string', enum: ['问题', '数据', '分析', '交叉', '写作'], description: '研究阶段' },
          domain: { type: 'string', description: '交叉学科 id，如 astrochemistry/ml-neural；可逗号分隔' },
          level: { type: 'string', enum: ['foundation', 'depth', 'breadth', 'cross'], description: '提示词层级' },
          query: { type: 'string', description: '关键词过滤' },
          limit: { type: 'number', description: '返回提示词数，默认 12' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 10000,
      async execute(args = {}) {
        try {
          if (args.action === 'domains') {
            return listDeepDomains(args.query ?? '', args.domain ?? '').map((d) => formatDeepDomain(d)).join('\n\n---\n\n');
          }
          if (args.action === 'prompts') {
            return listDeepPrompts({ phase: args.phase ?? '', level: args.level ?? '', query: args.query ?? '' })
              .map((p) => `- [${p.phase}/${p.level}] ${p.title}\n  ${p.prompt}\n  为什么：${p.why}`)
              .join('\n');
          }
          if (args.action === 'scan') {
            return formatDeepScan(scanBlindspots({
              phase: args.phase ?? '',
              domains: args.domain ?? '',
              query: args.query ?? '',
              limit: args.limit ?? 12,
            }));
          }
          return '未知 action。';
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_dictionary: {
      name: 'astro_dictionary',
      description:
        '管理官方 NADC 全量离线词表（约 700 KB，r241020，3 万条 EN↔ZH）。action=status 查看是否安装；action=download 从国家天文台官方 zip 下载并建立本地索引（不随插件分发，遵守 NADC 许可）。安装后查词会先用离线词表兜底，断网也能查。',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['status', 'download'], description: 'status 或 download' },
        },
        required: ['action'],
      },
      output: textOutput(),
      timeoutMs: 120000,
      async execute(args = {}) {
        try {
          if (args.action === 'download') {
            const status = await downloadDictionary();
            return [
              `离线词表已安装：${status.version}，${status.count} 条。`,
              `来源：${status.sourceUrl}`,
              `许可：${status.license}`,
              `页面：${status.page}`,
            ].join('\n');
          }
          const status = dictionaryStatus();
          return status.installed
            ? `离线词表：已安装 ${status.version}，${status.count} 条；来源 ${status.sourceUrl}；许可：${status.license}`
            : `离线词表：未安装。可在侧边栏“设置 → 离线词表”下载，或调用 astro_dictionary(action="download")。官方页面：${DICTIONARY_PAGE}`;
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_term_list: {
      name: 'astro_term_list',
      description: '列出或搜索本地天文术语本中的词条（按最近更新排序）。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '可选：按中英文、释义、标签过滤' },
          tag: { type: 'string', description: '可选：按标签过滤' },
          limit: { type: 'number', description: '返回条数，默认 50' },
        },
        required: [],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          const rows = listSavedTerms(args.query ?? '', { tag: args.tag, limit: clamp(args.limit ?? 50, 1, 200) });
          return formatTermList(rows);
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_literature_search: {
      name: 'astro_literature_search',
      description:
        '检索英文天文/物理文献并给出可点击链接。默认按“相关性为主、时间次之、引用数再次”的综合评分排序，也可显式按 relevance/time/citations 排序。返回题录、摘要、DOI/ADS/arXiv/Scholar 链接与评分分解，并附知网学位论文人工检索链接。中文检索词会先用 NADC 转成英文。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '英文检索式（也可传中文，插件会尝试用 NADC 译名转英文）' },
          sort: { type: 'string', enum: ['balanced', 'relevance', 'time', 'citations'], description: '排序方式，默认 balanced' },
          limit: { type: 'number', description: '返回条数，1-20，默认 8' },
          yearFrom: { type: 'number', description: '起始年份（可选）' },
          yearTo: { type: 'number', description: '截止年份（可选）' },
          minCitations: { type: 'number', description: '最低被引次数（可选）' },
          openAccess: { type: 'boolean', description: '只看开放获取（可选）' },
          includePreprints: { type: 'boolean', description: '是否包含预印本，默认 true' },
          strictPriority: {
            type: 'boolean',
            description: '严格优先级：相关性 5% 一档，档内先比时间再比引用；默认 false（加权分）',
          },
          source: { type: 'string', enum: ['auto', 'openalex', 'crossref', 'ads', 'arxiv'], description: '文献源，默认 auto' },
        },
        required: ['query'],
      },
      output: textOutput(),
      timeoutMs: 90000,
      async execute(args = {}) {
        try {
          const result = await runLiteratureSearch(args);
          if (result.error) {
            const lines = [`检索未完成：${result.message ?? result.error}`];
            if (result.candidates?.length) {
              lines.push('', '可先确认英文术语：');
              for (const candidate of result.candidates) lines.push(`- ${candidate.zh}（${candidate.en}） ${candidate.url}`);
            }
            if (result.cnki) lines.push('', `知网人工检索：${result.cnki.thesis}`);
            return lines.join('\n');
          }
          return formatLiteratureSearch(result);
        } catch (error) {
          return errorText(error);
        }
      },
    },

    astro_literature_analyze: {
      name: 'astro_literature_analyze',
      description:
        '把一篇或多篇文献整理成结构化的 DSH 分析包：研究问题、数据、方法/公式、结果与不确定性、可复现性、对特定角色的建议。只会使用调用者提供的题录与摘要，不抓取付费全文，也不编造数据。通常在 astro_literature_search 之后使用。',
      parameters: {
        type: 'object',
        properties: {
          papers: {
            type: 'array',
            description: '文献数组，建议直接传 astro_literature_search 返回的 results 子集',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                authors: { type: 'array', items: { type: 'string' } },
                year: { type: 'number' },
                venue: { type: 'string' },
                doi: { type: 'string' },
                abstract: { type: 'string' },
                citations: { type: 'number' },
                typeLabel: { type: 'string' },
                links: { type: 'array', items: { type: 'object' } },
              },
              required: ['title'],
            },
          },
          role: { type: 'string', enum: ['undergrad', 'grad', 'researcher', 'professor'], description: '面向人群，默认 grad' },
          focus: {
            type: 'string',
            enum: ['overview', 'method', 'critique', 'reproduce', 'teaching'],
            description: '分析重点，默认 overview',
          },
          question: { type: 'string', description: '用户额外关心的问题（可选）' },
        },
        required: ['papers'],
      },
      output: textOutput(),
      timeoutMs: 15000,
      async execute(args = {}) {
        try {
          if (!Array.isArray(args.papers) || !args.papers.length) return '请提供至少一篇文献（papers 数组）。';
          return buildAnalysisPrompt(args.papers, {
            role: normalizeRole(args.role),
            focus: normalizeFocus(args.focus),
            question: args.question,
          });
        } catch (error) {
          return errorText(error);
        }
      },
    },
  };
}

function registerTools(ctx) {
  const defs = registry();
  const disposers = [];
  for (const [toolName, definition] of Object.entries(defs)) {
    try {
      disposers.push(ctx.tools.register(definition));
      log(`tool registered: ${toolName}`);
    } catch (error) {
      warn(`tool registration failed: ${toolName}: ${error?.message ?? error}`);
    }
  }
  return disposers;
}

function isLoopbackRequest(req) {
  const remote = req.socket?.remoteAddress ?? '';
  return remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1';
}


const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
};

async function serveKatex(req, res, rel) {
  try {
    if (!rel || rel.includes('..')) return json(res, 404, { error: 'not found', code: 'notFound' });
    const file = resolve(KATEX_DIR, rel);
    if (!file.startsWith(KATEX_DIR)) return json(res, 404, { error: 'not found', code: 'notFound' });
    const data = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'public, max-age=86400',
      'content-length': data.length,
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    json(res, 404, { error: 'not found', code: 'notFound' });
  }
}

function json(res, status, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': payload.length,
    'cache-control': 'no-store',
  });
  res.end(payload);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8', headers = {}) {
  const payload = Buffer.from(String(body ?? ''), 'utf8');
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': payload.length,
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('request body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function methodOk(req, ...allowed) {
  return allowed.includes(req.method);
}

function getAgent(ctx, sessionId) {
  const sid = sessionId || lastSessionId;
  if (!sid) return { sid: null, agent: null };
  let agent = null;
  try {
    agent = ctx.agents?.get?.(sid) ?? null;
  } catch {
    agent = null;
  }
  return { sid, agent };
}

async function steerPrompt(ctx, sessionId, prompt) {
  const { sid, agent } = getAgent(ctx, sessionId);
  if (!sid) {
    throw Object.assign(new Error('当前没有活跃对话。请先在主窗口打开或新建一个对话。'), { code: 'no_session' });
  }
  if (!agent || typeof agent.steer !== 'function') {
    throw Object.assign(new Error('当前对话不可用，请刷新页面后重试。'), { code: 'no_session' });
  }
  let message;
  try {
    const { createUserMessage } = await import('@deepseek-ai/dsh-llm');
    message = createUserMessage({ content: [{ type: 'text', text: prompt }], source: { kind: 'user' } });
  } catch {
    message = {
      role: 'user',
      id: `astro_words_${Date.now()}`,
      content: [{ type: 'text', text: prompt }],
      source: { kind: 'user' },
    };
  }
  agent.steer(message);
  return sid;
}

function termAnalysisPrompt(term, options = {}) {
  const role = ROLE_LABELS[normalizeRole(options.role)] ?? '研究生';
  const t = term ?? {};
  return [
    `请面向「${role}」讲解天文术语「${t.zh || t.en}（${t.en || ''}）」${t.abbr ? ` [${t.abbr}]` : ''}。`,
    '',
    `审定译名：${t.zh || '未提供'}；NADC 词条：${t.astrodictUrl || ASTRODICT_BASE}；审定状态：${t.status || '未知'}。`,
    t.definition ? `NADC 审定定义（名词委原文，必须以此为准）：${t.definition}` : 'NADC 审定定义：该词条无定义版原文（不要声称有）。',
    t.sources?.length ? `依据：${t.sources.join('；')}` : '',
    '',
    '请按以下结构讲解：',
    '1. 一句话定义（中文），先说物理量/对象是什么。',
    '2. 物理图像：它为什么存在、在什么尺度/波段出现。',
    '3. 关键公式与单位；逐符号解释，写清适用条件。',
    '4. 观测意义：天文学家如何测量它，典型量级与常见误差。',
    '5. 易混概念与常见误解（至少 2 条）。',
    '6. 与相邻术语的关系（各一句话）。',
    '7. 面向该角色的学习建议与 1 个可动手的小练习。',
    '',
    '纪律：中文译名与 NADC 定义必须与上述词条一致；若存在审定定义，你的解释不得与之冲突。释义是你生成的物理学解释，需明确写“以下为 DSH 释义，非名词委原文”；不确定的地方标注“不确定”，不要编造公式或数值。',
  ]
    .filter(Boolean)
    .join('\n');
}

function sessionSearchPrompt(term) {
  const name = term?.zh || term?.en || String(term ?? '');
  return [
    `请在本机已有对话中搜索与「${name}」相关的内容（使用 session_search 工具），然后汇总：`,
    '1. 哪些会话讨论过它，各自的时间与上下文；',
    '2. 已得出的结论、仍未解决的问题；',
    '3. 如果找到相关对话，给出会话标题/时间线索；如果没找到，明确说“没有找到”，不要编造。',
    '不要修改任何文件。',
  ].join('\n');
}

async function handleRequest(req, res, ctx) {
  if (!isLoopbackRequest(req)) {
    json(res, 403, { error: 'forbidden: loopback-only', code: 'forbidden' });
    return;
  }
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;
  if (!path.startsWith(PREFIX)) {
    json(res, 404, { error: 'not found', code: 'notFound' });
    return;
  }
  const rest = path.slice(PREFIX.length).replace(/^\/+/, '');
  const parts = rest.split('/').filter(Boolean);
  const head = parts[0] ?? '';

  if (head === 'assets' && parts[1] === 'katex' && methodOk(req, 'GET', 'HEAD')) {
    await serveKatex(req, res, parts.slice(2).join('/'));
    return;
  }

  if (head === 'health' && methodOk(req, 'GET')) {
    json(res, 200, {
      ok: true,
      version: VERSION,
      ...stats(),
      adsConfigured: Boolean(process.env.ADS_API_TOKEN),
      openAlexKeyConfigured: Boolean(process.env.OPENALEX_API_KEY),
      dictionary: dictionaryStatus(),
      references: referenceStats(),
      writing: { projects: listProjects().length, journals: listJournals().length, thesisFormats: listThesisFormats().length },
      dataLibrary: dataStats(),
      assets: {
        katex: existsSync(join(KATEX_DIR, 'katex.min.js')) && existsSync(join(KATEX_DIR, 'katex.min.css')),
        version: '0.16.22',
      },
      astrodict: ASTRODICT_BASE,
      time: new Date().toISOString(),
    });
    return;
  }

  if (head === 'file-formats' && methodOk(req, 'GET')) {
    if (parts[1]) json(res, 200, { format: getFileFormat(decodeURIComponent(parts[1])) });
    else json(res, 200, { formats: listFileFormats(url.searchParams.get('q') ?? '') });
    return;
  }

  if (head === 'physics' && parts[1] === 'recommended' && methodOk(req, 'GET')) {
    json(res, 200, { books: listRecommendedBooks(url.searchParams.get('q') ?? ''), notice: recommendedBooksNotice() });
    return;
  }

  if (head === 'physics' && parts[1] === 'books' && methodOk(req, 'GET')) {
    if (parts[2]) json(res, 200, { book: getPhysicsBook(decodeURIComponent(parts[2])) });
    else json(res, 200, { books: listPhysicsBooks(url.searchParams.get('q') ?? '', url.searchParams.get('domain') ?? '') });
    return;
  }

  if (head === 'research' && parts[1] === 'tools' && methodOk(req, 'GET')) {
    json(res, 200, { tools: listResearchTools(url.searchParams.get('q') ?? '') });
    return;
  }

  if (head === 'catalogs' && methodOk(req, 'GET')) {
    json(res, 200, { catalogs: listCatalogs(url.searchParams.get('q') ?? '') });
    return;
  }

  if (head === 'dictionary' && parts[1] === 'status' && methodOk(req, 'GET')) {
    json(res, 200, { dictionary: dictionaryStatus() });
    return;
  }

  if (head === 'skills' && methodOk(req, 'GET')) {
    json(res, 200, { skills: registeredSkills });
    return;
  }

  if (head === 'dictionary' && parts[1] === 'download' && methodOk(req, 'POST')) {
    try {
      const status = await downloadDictionary();
      json(res, 200, { ok: true, dictionary: status });
    } catch (error) {
      json(res, 502, {
        error: error?.message ?? 'dictionary download failed',
        code: 'dictionaryDownloadFailed',
        dictionary: dictionaryStatus(),
      });
    }
    return;
  }

  if (head === 'references' && methodOk(req, 'GET')) {
    if (parts[1] === 'export') {
      const format = url.searchParams.get('format') || 'bibtex';
      if (format !== 'bibtex') {
        json(res, 400, { error: 'only bibtex export is supported', code: 'unsupportedFormat' });
        return;
      }
      text(res, 200, exportBibTeX(), 'application/x-bibtex; charset=utf-8', {
        'content-disposition': `attachment; filename="astro-references-${new Date().toISOString().slice(0, 10)}.bib"`,
      });
      return;
    }
    if (parts[1] === 'stats') {
      json(res, 200, { references: referenceStats() });
      return;
    }
    json(res, 200, {
      references: listReferences({
        q: url.searchParams.get('q') ?? '',
        field: url.searchParams.get('field') ?? '',
        keyword: url.searchParams.get('keyword') ?? '',
        tag: url.searchParams.get('tag') ?? '',
        collection: url.searchParams.get('collection') ?? '',
        limit: Number(url.searchParams.get('limit') ?? 200),
      }),
      stats: referenceStats(),
    });
    return;
  }

  if (head === 'references' && parts[1] && parts[2] === 'score' && methodOk(req, 'GET')) {
    const ref = getReference(decodeURIComponent(parts[1]));
    if (!ref) { json(res, 404, { error: 'reference not found', code: 'notFound' }); return; }
    json(res, 200, { score: scoreLiterature(ref) });
    return;
  }

  if (head === 'references' && !parts[1] && methodOk(req, 'POST')) {
    const body = await readBody(req);
    try {
      const reference = upsertReference(body?.item ?? body);
      json(res, 200, { reference, stats: referenceStats() });
    } catch (error) {
      json(res, 400, { error: error?.message ?? 'invalid reference', code: 'invalidReference' });
    }
    return;
  }

  if (head === 'references' && parts[1] === 'cite' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const reference = getReference(String(body?.id ?? '')) ?? body?.item ?? null;
    if (!reference) {
      json(res, 404, { error: 'reference not found', code: 'notFound' });
      return;
    }
    json(res, 200, { text: citeReference(reference, body?.style ?? 'bibtex'), style: body?.style ?? 'bibtex' });
    return;
  }

  if (head === 'references' && parts[1] && methodOk(req, 'PATCH')) {
    const id = decodeURIComponent(parts[1]);
    const body = await readBody(req);
    const reference = updateReference(id, body?.patch ?? body);
    if (!reference) {
      json(res, 404, { error: 'reference not found', code: 'notFound' });
      return;
    }
    json(res, 200, { reference, stats: referenceStats() });
    return;
  }

  if (head === 'references' && parts[1] && methodOk(req, 'DELETE')) {
    const id = decodeURIComponent(parts[1]);
    const ok = deleteReference(id);
    json(res, ok ? 200 : 404, ok ? { ok: true, stats: referenceStats() } : { error: 'reference not found', code: 'notFound' });
    return;
  }

  if (head === 'writing') {
    const section = parts[1] ?? '';
    if (section === 'meta' && methodOk(req, 'GET')) {
      json(res, 200, { journals: listJournals(), thesisFormats: listThesisFormats(), goals: listWritingGoals() });
      return;
    }
    if (section === 'formats' && parts[2] === 'export' && methodOk(req, 'GET')) {
      json(res, 200, exportFormatPack());
      return;
    }
    if (section === 'formats' && parts[2] === 'import' && methodOk(req, 'POST')) {
      const body = await readBody(req);
      const result = importFormatPack(body?.pack ?? body ?? {});
      json(res, 200, { ok: true, ...result });
      return;
    }
    if (section === 'thesis-formats' && parts[2] === 'custom' && methodOk(req, 'POST')) {
      const body = await readBody(req);
      try {
        const format = addCustomThesisFormat(body ?? {});
        json(res, 200, { format, thesisFormats: listThesisFormats() });
      } catch (error) {
        json(res, 400, { error: error?.message ?? 'invalid format', code: 'invalidFormat' });
      }
      return;
    }
    if (section === 'thesis-formats' && parts[2] && parts[3] === 'workspace' && methodOk(req, 'GET')) {
      const workspace = await getFormatWorkspace(decodeURIComponent(parts[2]));
      json(res, 200, { workspace, summary: formatWorkspaceSummary(workspace) });
      return;
    }
    if (section === 'thesis-formats' && parts[2] && parts[3] === 'fetch' && methodOk(req, 'POST')) {
      const body = await readBody(req);
      try {
        const workspace = await fetchThesisFormat(decodeURIComponent(parts[2]), { force: Boolean(body?.force) });
        json(res, 200, { workspace, summary: formatWorkspaceSummary(workspace) });
      } catch (error) {
        json(res, 400, { error: error?.message ?? 'fetch failed', code: 'fetchFailed' });
      }
      return;
    }
    if (section === 'thesis-formats' && parts[2] && parts[3] === 'upload' && methodOk(req, 'POST')) {
      const body = await readBody(req, 40 * 1024 * 1024);
      try {
        const workspace = await uploadThesisFormat(decodeURIComponent(parts[2]), body?.file ?? body ?? {});
        json(res, 200, { workspace, summary: formatWorkspaceSummary(workspace) });
      } catch (error) {
        json(res, 400, { error: error?.message ?? 'upload failed', code: 'uploadFailed' });
      }
      return;
    }
    if (section === 'handoff' && methodOk(req, 'POST')) {
      const body = await readBody(req);
      const project = getProject(String(body?.projectId ?? ''));
      if (!project) {
        json(res, 404, { error: 'project not found', code: 'notFound' });
        return;
      }
      const references = project.referenceIds?.length
        ? project.referenceIds.map((id) => getReference(id)).filter(Boolean)
        : listReferences({ limit: 40 });
      const formatWorkspace = await getFormatWorkspace(project.targetId);
      const prompt = buildProjectPrompt(project, {
        mode: body?.mode ?? 'outline',
        references,
        formatWorkspace,
      });
      if (body?.dryRun) { json(res, 200, { prompt }); return; }
      try {
        const sessionId = await steerPrompt(ctx, body?.sessionId, prompt);
        json(res, 200, { ok: true, sessionId, projectId: project.id, mode: body?.mode ?? 'outline' });
      } catch (error) {
        json(res, 409, { error: error?.message ?? 'no active session', code: error?.code ?? 'no_session', prompt });
      }
      return;
    }
    if (section === 'projects' && parts[2] && parts[3] === 'sections' && methodOk(req, 'GET') && !parts[4]) {
      const project = getProject(decodeURIComponent(parts[2]));
      if (!project) { json(res, 404, { error: 'project not found', code: 'notFound' }); return; }
      json(res, 200, { projectId: project.id, sections: project.sections ?? createSections(), defs: SECTION_DEFS });
      return;
    }
    if (section === 'projects' && parts[2] && parts[3] === 'sections' && parts[4] && !parts[5] && methodOk(req, 'PATCH')) {
      const project = getProject(decodeURIComponent(parts[2]));
      if (!project) { json(res, 404, { error: 'project not found', code: 'notFound' }); return; }
      const body = await readBody(req);
      try {
        const sections = setSection(project.sections ?? createSections(), decodeURIComponent(parts[4]), body ?? {});
        const updated = updateProject(project.id, { sections });
        json(res, 200, { projectId: project.id, sections: updated.sections });
      } catch (error) {
        json(res, 400, { error: error?.message ?? 'invalid section update', code: 'invalidSection' });
      }
      return;
    }
    if (section === 'projects' && parts[2] && parts[3] === 'sections' && parts[4] && parts[5] === 'score' && methodOk(req, 'POST')) {
      const project = getProject(decodeURIComponent(parts[2]));
      if (!project) { json(res, 404, { error: 'project not found', code: 'notFound' }); return; }
      const sid = decodeURIComponent(parts[4]);
      const current = createSections(project.sections ?? {})[sid];
      if (!current) { json(res, 404, { error: 'unknown section', code: 'notFound' }); return; }
      const body = await readBody(req);
      const content = body?.content !== undefined ? String(body.content) : current.content;
      const score = scoreSection({ content, sectionId: sid, goalId: project.goalId });
      const next = createSections(project.sections ?? {});
      next[sid].content = content;
      next[sid].contentHash = score.contentHash ?? next[sid].contentHash;
      next[sid].score = score;
      next[sid].updatedAt = new Date().toISOString();
      const updated = updateProject(project.id, { sections: next });
      json(res, 200, { projectId: project.id, section: updated.sections[sid], score });
      return;
    }
    if (section === 'projects' && parts[2] && parts[3] === 'sections' && parts[4] && parts[5] === 'confirm' && methodOk(req, 'POST')) {
      const project = getProject(decodeURIComponent(parts[2]));
      if (!project) { json(res, 404, { error: 'project not found', code: 'notFound' }); return; }
      const sid = decodeURIComponent(parts[4]);
      const sections = createSections(project.sections ?? {});
      const current = sections[sid];
      if (!current) { json(res, 404, { error: 'unknown section', code: 'notFound' }); return; }
      const body = await readBody(req);
      try {
        const confirmation = buildConfirmation({ projectId: project.id, section: current, checklist: body?.checklist, note: body?.note, content: current.content });
        current.confirmation = confirmation;
        current.status = 'author_confirmed';
        current.updatedAt = new Date().toISOString();
        const updated = updateProject(project.id, { sections });
        json(res, 200, { projectId: project.id, section: updated.sections[sid], confirmation });
      } catch (error) {
        json(res, 409, { error: error?.message ?? 'confirmation rejected', code: 'confirmationRejected' });
      }
      return;
    }
    if (section === 'projects' && methodOk(req, 'GET') && !parts[2]) {
      json(res, 200, { projects: listProjects(), journals: listJournals(), thesisFormats: listThesisFormats(), goals: listWritingGoals() });
      return;
    }
    if (section === 'projects' && methodOk(req, 'POST') && !parts[2]) {
      const body = await readBody(req);
      const project = createProject(body ?? {});
      json(res, 200, { project });
      return;
    }
    if (section === 'projects' && parts[2] && methodOk(req, 'GET')) {
      const project = getProject(decodeURIComponent(parts[2]));
      if (!project) {
        json(res, 404, { error: 'project not found', code: 'notFound' });
        return;
      }
      const references = listReferences({ limit: 200 });
      json(res, 200, {
        project,
        target: project.type === 'journal' ? getJournal(project.targetId) : getThesisFormat(project.targetId),
        references,
      });
      return;
    }
    if (section === 'projects' && parts[2] && methodOk(req, 'PATCH')) {
      const body = await readBody(req);
      const project = updateProject(decodeURIComponent(parts[2]), body?.patch ?? body ?? {});
      if (!project) {
        json(res, 404, { error: 'project not found', code: 'notFound' });
        return;
      }
      json(res, 200, { project });
      return;
    }
    if (section === 'projects' && parts[2] && methodOk(req, 'DELETE')) {
      const ok = deleteProject(decodeURIComponent(parts[2]));
      json(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'project not found', code: 'notFound' });
      return;
    }
    if (section === 'projects' && parts[2] && parts[3] === 'files' && methodOk(req, 'POST')) {
      const body = await readBody(req, 40 * 1024 * 1024);
      try {
        const result = await addProjectFiles(decodeURIComponent(parts[2]), body?.files ?? []);
        json(res, 200, { project: result.project, added: result.added });
      } catch (error) {
        json(res, 400, { error: error?.message ?? 'file upload failed', code: 'uploadFailed' });
      }
      return;
    }
    json(res, 404, { error: 'unknown writing route', code: 'notFound', path });
    return;
  }

  if (head === 'data') {
    const section = parts[1] ?? '';
    if (section === 'meta' && methodOk(req, 'GET')) {
      json(res, 200, {
        methods: listMethods({ limit: 200 }),
        statistics: listStatistics({}),
        instruments: listInstruments({ limit: 300 }),
        workflows: listWorkflows(),
        stats: dataStats(),
      });
      return;
    }
    if (section === 'methods' && !parts[2] && methodOk(req, 'GET')) {
      json(res, 200, {
        methods: listMethods({
          q: url.searchParams.get('q') ?? '',
          category: url.searchParams.get('category') ?? '',
          limit: url.searchParams.get('limit') ?? undefined,
        }),
        stats: dataStats(),
      });
      return;
    }
    if (section === 'methods' && parts[2] && methodOk(req, 'GET')) {
      const method = getMethod(decodeURIComponent(parts[2]));
      if (!method) {
        json(res, 404, { error: 'method not found', code: 'notFound' });
        return;
      }
      json(res, 200, { method });
      return;
    }
    if (section === 'statistics' && methodOk(req, 'GET')) {
      json(res, 200, { statistics: listStatistics({ q: url.searchParams.get('q') ?? '' }) });
      return;
    }
    if (section === 'instruments' && !parts[2] && methodOk(req, 'GET')) {
      json(res, 200, {
        instruments: listInstruments({
          q: url.searchParams.get('q') ?? '',
          status: url.searchParams.get('status') ?? '',
          openPolicy: url.searchParams.get('openPolicy') ?? '',
          type: url.searchParams.get('type') ?? '',
        }),
        stats: dataStats(),
      });
      return;
    }
    if (section === 'instruments' && parts[2] && methodOk(req, 'GET')) {
      const instrument = getInstrument(decodeURIComponent(parts[2]));
      if (!instrument) {
        json(res, 404, { error: 'instrument not found', code: 'notFound' });
        return;
      }
      json(res, 200, { instrument });
      return;
    }
    if (section === 'workflows' && !parts[2] && methodOk(req, 'GET')) {
      json(res, 200, { workflows: listWorkflows() });
      return;
    }
    if (section === 'workflows' && !parts[2] && methodOk(req, 'POST')) {
      const body = await readBody(req);
      const workflow = saveWorkflow(body?.workflow ?? body ?? {});
      json(res, 200, { workflow, workflows: listWorkflows() });
      return;
    }
    if (section === 'workflows' && parts[2] && methodOk(req, 'DELETE')) {
      const ok = deleteWorkflow(decodeURIComponent(parts[2]));
      json(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'workflow not found', code: 'notFound' });
      return;
    }
    if (section === 'handoff' && methodOk(req, 'POST')) {
      const body = await readBody(req);
      const instrument = getInstrument(String(body?.instrumentId ?? ''));
      if (!instrument) {
        json(res, 404, { error: 'instrument not found', code: 'notFound' });
        return;
      }
      const method = body?.methodId ? getMethod(String(body.methodId)) : null;
      const prompt = buildInstrumentPrompt(instrument, { method });
      if (body?.dryRun) { json(res, 200, { prompt }); return; }
      try {
        const sessionId = await steerPrompt(ctx, body?.sessionId, prompt);
        json(res, 200, { ok: true, sessionId, instrumentId: instrument.id });
      } catch (error) {
        json(res, 409, { error: error?.message ?? 'no active session', code: error?.code ?? 'no_session', prompt });
      }
      return;
    }
    json(res, 404, { error: 'unknown data route', code: 'notFound', path });
    return;
  }

  if (head === 'seed' && methodOk(req, 'GET')) {
    json(res, 200, { terms: seedCatalog() });
    return;
  }

  if (head === 'terms' && methodOk(req, 'GET')) {
    const q = url.searchParams.get('q') ?? '';
    const tag = url.searchParams.get('tag') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? 200);
    json(res, 200, { terms: listSavedTerms(q, { tag, limit }) });
    return;
  }

  if (head === 'terms' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const input = body?.term ?? body;
    if (!input || (!input.en && !input.zh)) {
      json(res, 400, { error: 'en or zh is required', code: 'invalidTerm' });
      return;
    }
    const saved = upsertSavedTerm(input);
    json(res, 200, { term: saved });
    return;
  }

  if (head === 'terms' && parts[1] && methodOk(req, 'PATCH')) {
    const id = decodeURIComponent(parts[1]);
    const existing = getSavedTerm(id);
    if (!existing) {
      json(res, 404, { error: 'term not found', code: 'notFound' });
      return;
    }
    const patch = await readBody(req);
    const saved = upsertSavedTerm({ ...existing, ...(patch?.term ?? patch), id });
    json(res, 200, { term: saved });
    return;
  }

  if (head === 'terms' && parts[1] && methodOk(req, 'DELETE')) {
    const id = decodeURIComponent(parts[1]);
    const ok = deleteSavedTerm(id);
    json(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'term not found', code: 'notFound' });
    return;
  }

  if (head === 'export' && methodOk(req, 'GET')) {
    const format = ['md', 'json', 'csv', 'anki'].includes(url.searchParams.get('format')) ? url.searchParams.get('format') : 'md';
    const content = exportTerms(format);
    const types = {
      md: 'text/markdown; charset=utf-8',
      json: 'application/json; charset=utf-8',
      csv: 'text/csv; charset=utf-8',
      anki: 'text/tab-separated-values; charset=utf-8',
    };
    const ext = { md: 'md', json: 'json', csv: 'csv', anki: 'txt' }[format];
    text(res, 200, content, types[format], {
      'content-disposition': `attachment; filename="astro-terms-${new Date().toISOString().slice(0, 10)}.${ext}"`,
    });
    return;
  }

  if (head === 'config' && methodOk(req, 'GET')) {
    json(res, 200, { config: getConfig() });
    return;
  }

  if (head === 'config' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const config = updateConfig(body?.config ?? body ?? {});
    json(res, 200, { config });
    return;
  }

  if (head === 'lookup' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const term = String(body?.term ?? '').trim();
    if (!term && !body?.astrodictId) {
      json(res, 400, { error: 'term is required', code: 'invalidTerm' });
      return;
    }
    const result = await lookupTerm(term, {
      includeRelated: body?.includeRelated !== false,
      relatedLimit: clamp(body?.relatedLimit ?? 8, 1, 20),
      astrodictId: body?.astrodictId,
    });
    if (body?.save && result.found) {
      const saved = upsertSavedTerm(toSavedTerm(result));
      result.savedTerm = saved;
    }
    json(res, 200, result);
    return;
  }

  if (head === 'search' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const result = await runLiteratureSearch(body ?? {});
    json(res, 200, result);
    return;
  }

  if (head === 'session' && methodOk(req, 'GET')) {
    json(res, 200, { sessionId: lastSessionId });
    return;
  }

  if (head === 'cnki' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    json(res, 200, { cnki: cnkiLinks(body?.query ?? '') });
    return;
  }

  if (head === 'deep' && parts[1] === 'meta' && methodOk(req, 'GET')) {
    json(res, 200, deepMeta());
    return;
  }

  if (head === 'deep' && parts[1] === 'domains' && methodOk(req, 'GET')) {
    json(res, 200, { domains: listDeepDomains(url.searchParams.get('q') ?? '', url.searchParams.get('kind') ?? '') });
    return;
  }

  if (head === 'deep' && parts[1] === 'domain' && parts[2] && methodOk(req, 'GET')) {
    const domain = getDeepDomain(decodeURIComponent(parts[2]));
    json(res, domain ? 200 : 404, domain ? { domain } : { error: 'deep domain not found', code: 'notFound' });
    return;
  }

  if (head === 'deep' && parts[1] === 'scan' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    json(res, 200, scanBlindspots(body ?? {}));
    return;
  }

  if (head === 'deep' && parts[1] === 'prompts' && methodOk(req, 'GET')) {
    json(res, 200, {
      prompts: listDeepPrompts({
        phase: url.searchParams.get('phase') ?? '',
        level: url.searchParams.get('level') ?? '',
        query: url.searchParams.get('q') ?? '',
      }),
      notice: deepMeta().notice,
    });
    return;
  }

  if (head === 'plan' && !parts[1] && methodOk(req, 'GET')) {
    json(res, 200, { plan: await getPlan(), summary: summarizePlan(await getPlan()) });
    return;
  }

  if (head === 'plan' && !parts[1] && methodOk(req, 'POST')) {
    const body = await readBody(req);
    json(res, 200, { plan: await patchPlan(body ?? {}), summary: summarizePlan(await getPlan()) });
    return;
  }

  if (head === 'plan' && parts[1] === 'nodes' && parts[2] && methodOk(req, 'PATCH')) {
    const body = await readBody(req);
    const result = await upsertNode({ ...(body ?? {}), id: decodeURIComponent(parts[2]) });
    json(res, 200, { plan: result.plan, node: result.node });
    return;
  }

  if (head === 'plan' && parts[1] === 'nodes' && parts[2] && methodOk(req, 'DELETE')) {
    const result = await deleteNode(decodeURIComponent(parts[2]));
    json(res, 200, { plan: result.plan, removed: result.removed });
    return;
  }

  if (head === 'plan' && parts[1] === 'nodes' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const result = await upsertNode(body ?? {});
    json(res, 200, { plan: result.plan, node: result.node });
    return;
  }

  if (head === 'plan' && parts[1] === 'export' && methodOk(req, 'GET')) {
    const out = await exportPlan(url.searchParams.get('format') === 'json' ? 'json' : 'md');
    res.statusCode = 200;
    res.setHeader('content-type', `${out.mime}; charset=utf-8`);
    res.setHeader('content-disposition', `attachment; filename="${out.filename}"`);
    res.end(out.body);
    return;
  }

  if (head === 'analyze' && methodOk(req, 'POST')) {
    const body = await readBody(req);
    const type = String(body?.type ?? '');
    const config = getConfig();
    const role = normalizeRole(body?.role ?? config.ui?.role);
    let prompt = '';
    if (type === 'term') {
      prompt = termAnalysisPrompt(body?.term ?? body?.payload ?? {}, { role });
    } else if (type === 'literature') {
      const papers = body?.papers ?? body?.payload?.papers ?? body?.payload?.results ?? body?.payload ?? [];
      prompt = buildAnalysisPrompt(Array.isArray(papers) ? papers : [papers], {
        role,
        focus: normalizeFocus(body?.focus),
        question: body?.question,
      });
    } else if (type === 'session-search') {
      prompt = sessionSearchPrompt(body?.term ?? body?.payload ?? {});
    } else {
      json(res, 400, { error: 'unknown analyze type', code: 'invalidType' });
      return;
    }
    if (body?.dryRun) { json(res, 200, { prompt }); return; }
    try {
      const sessionId = await steerPrompt(ctx, body?.sessionId, prompt);
      json(res, 200, { ok: true, sessionId });
    } catch (error) {
      json(res, 409, {
        error: error?.message ?? 'no active session',
        code: error?.code ?? 'no_session',
        prompt,
      });
    }
    return;
  }

  json(res, 404, { error: 'unknown route', code: 'notFound', path });
}

function registerRoutes(ctx) {
  try {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: PREFIX,
      handler: async (req, res) => {
        try {
          await handleRequest(req, res, ctx);
        } catch (error) {
          warn('route failed:', error?.stack ?? error);
          if (!res.headersSent) json(res, error?.status ?? 500, { error: error?.message ?? 'internal error' });
          else res.end();
        }
      },
    });
    log(`routes mounted at ${PREFIX}`);
    return dispose;
  } catch (error) {
    warn('route registration failed:', error?.message ?? error);
    return null;
  }
}

export function apply(ctx) {
  const disposers = [];
  let disposed = false;

  const ready = (async () => {
    await initStore();
    await initDictionary();
    await initReferences();
    await initWriting();
    await initDataLibrary();
    if (disposed) return;
    for (const dispose of registerTools(ctx)) disposers.push(dispose);
    try {
      const skillResult = registerSkills(ctx, SKILLS_DIR);
      for (const item of skillResult.registered) {
        if (typeof item.dispose === 'function') disposers.push(item.dispose);
      }
      registeredSkills = skillResult.registered.map((item) => item.name);
      if (skillResult.registered.length) log(`skills registered: ${skillResult.registered.map((item) => item.name).join(', ')}`);
      else if (skillResult.skipped) warn(`skills not registered: ${skillResult.skipped}`);
    } catch (error) {
      warn('skill registration failed:', error?.message ?? error);
    }
    const routeDispose = registerRoutes(ctx);
    if (routeDispose) disposers.push(routeDispose);

    try {
      const root = ctx.root ?? ctx;
      const off = root.on('session/event', (session) => {
        if (session?.id) lastSessionId = String(session.id);
      });
      if (typeof off === 'function') disposers.push(off);
    } catch (error) {
      warn('session tracking unavailable:', error?.message ?? error);
    }

    try {
      if (ctx.systemPrompt?.section) {
        disposers.push(
          ctx.systemPrompt.section({
            name: 'dsh:astro-ph-researcher-capabilities',
            order: 9910,
            text: () =>
              [
                '本机已安装 astro-ph-researcher（天文术语与文献工作台）。',
                '可用能力：',
                '- 术语中文译名核验 → astro_term_lookup（中文译名与“NADC 审定定义”以 NADC 天文学名词为准，返回词条链接与相关术语；DSH 释义须标注为非名词委原文）',
                '- 保存/列出个人术语本 → astro_term_save / astro_term_list（存于 $DSH_HOME/astro-ph-researcher）',
                '- 官方全量离线词表 → astro_dictionary(action="status"|"download")（约 3 万条，断网兜底；不随插件分发，遵守 NADC 许可）',
                '- 英文文献检索 → astro_literature_search（默认“相关性为主、时间次之、引用数再次”；返回 DOI/ADS/arXiv/Scholar 链接、评分分解与知网人工检索链接）',
                '- 文献分析包 → astro_literature_analyze（只基于给定题录/摘要，明确区分原文与推断，不编造数据）',
                '纪律：不得编造 DOI、引用数、中文译名或 NADC 词条 id；检索不到时如实说明；知网没有公开 API，只能给人工检索链接，不得绕过登录/付费墙。',
                '用户要求“交给 DSH 分析”时，优先把检索结果作为 papers 传给 astro_literature_analyze，再按返回的结构执行。',
                '写作/文献训练：本插件注册了 9 个 skill：astro-literature-research、astro-code-writing、astro-english-journal-writing、astro-phd-thesis-writing、astro-writing-goals、astro-discovery-writing、astro-critical-writing、astro-incremental-method-writing，以及 v2 的 astro-research-workflow；用户要做文献综述、代码、英文论文、学位论文或选择“发现/反驳/增量/上限”等叙述风格时优先加载对应 skill。',
                '参考文献库：astro_reference_save/list/update/cite/export（前三位作者、单位、期刊卷期页、DOI/SciX/ADS/arXiv、总结、领域/关键词标签、BibTeX/APA/GB 7714/MLA）。',
                '写作工作台：astro_writing_project（创建项目/上传研究结果文件/绑定期刊或高校格式）、astro_writing_handoff（分析结果/生成大纲/逐节起草/格式检查）、astro_format_library（期刊官网、作者指南、Overleaf 模板、高校学位论文格式）、astro_thesis_format（抓取/上传学位论文格式与模板到本地并解析；PDF/DOC 需 DSH 阅读）。',
                '数据处理与观测设备：astro_data_method（通用天文数据处理方法/统计/Python，不含书籍/章节信息）、astro_data_instrument（望远镜/卫星/探测器/引力波/中微子的数据获取、官方分析工具、开放或受限政策、在建/规划项目）、astro_data_workflow（保存个人研究流程）。',
                'v2 新增：astro_section_workflow（逐节状态/评分）、astro_author_status（只读确认台账）、astro_literature_score（文献 6 维启发式）、astro_file_format（FITS/PHA/RMF/ARF/Fermi XML/VOTable/ECSV 等）、astro_physics_reference（Landau/GR/黑洞/中子星/辐射转移/GRB/GW/中微子书目；action=recommended 为中文/译著推荐书单）、astro_research_guide（3ML/AM³/SED/DS9/Geant4 与公开源表引导）。作者确认只能由客户端按钮写入；AI 不能代替作者确认。',
              ].join('\n'),
          }),
        );
      }
    } catch (error) {
      warn('system prompt unavailable:', error?.message ?? error);
    }

    log(`host ready v${VERSION}`);
  })().catch((error) => warn('startup failed:', error?.stack ?? error));

  return () => {
    disposed = true;
    ready.catch(() => {});
    for (const dispose of disposers.splice(0)) {
      try {
        dispose?.();
      } catch (error) {
        warn('dispose failed:', error?.message ?? error);
      }
    }
    saveNow().catch(() => {});
    log('host disposed');
  };
}

export default { name, inject, apply };
