// astro-ph-researcher :: writing studio (targets, uploaded results, prompts)
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { DATA_DIR } from './store.js';
import { getWritingGoal } from './writing-goals.js';
import { createSections, SECTION_DEFS } from './sections.js';
import { hashId, log, unique, warn } from './util.js';

const PROJECTS_PATH = join(DATA_DIR, 'projects.json');
const PROJECTS_DIR = join(DATA_DIR, 'projects');
const CUSTOM_FORMATS_PATH = join(DATA_DIR, 'thesis-formats.custom.json');
const JOURNAL_SEED = new URL('../data/journals.seed.json', import.meta.url);
const THESIS_SEED = new URL('../data/thesis-formats.seed.json', import.meta.url);

const FALLBACK_JOURNALS = [
  { id: 'apj', name: 'The Astrophysical Journal', abbrev: 'ApJ', publisher: 'IOP/AAS', homepage: 'https://iopscience.iop.org/journal/0004-637X', authorGuidelines: 'https://journals.aas.org/apj/', overleafTemplate: '', citationStyle: 'AASTeX + natbib author-year', language: 'en-US', verified: false },
  { id: 'aa', name: 'Astronomy & Astrophysics', abbrev: 'A&A', publisher: 'EDP Sciences', homepage: 'https://www.aanda.org/', authorGuidelines: 'https://www.aanda.org/for-authors', overleafTemplate: '', citationStyle: 'A&A style', language: 'en-GB', verified: false },
  { id: 'mnras', name: 'Monthly Notices of the Royal Astronomical Society', abbrev: 'MNRAS', publisher: 'Oxford University Press', homepage: 'https://academic.oup.com/mnras', authorGuidelines: 'https://academic.oup.com/mnras/pages/General_Instructions', overleafTemplate: '', citationStyle: 'MNRAS style', language: 'en-GB', verified: false },
  { id: 'raa', name: 'Research in Astronomy and Astrophysics', abbrev: 'RAA', publisher: 'IOP/CAS', homepage: 'https://iopscience.iop.org/journal/1674-4527', authorGuidelines: 'https://raa-journal.org/', overleafTemplate: '', citationStyle: 'RAA style', language: 'en-US', verified: false },
  { id: 'prl', name: 'Physical Review Letters', abbrev: 'PRL', publisher: 'American Physical Society', homepage: 'https://journals.aps.org/prl/', authorGuidelines: 'https://journals.aps.org/prl/authors', overleafTemplate: '', citationStyle: 'APS/REVTeX numeric', language: 'en-US', verified: false },
  { id: 'prd', name: 'Physical Review D', abbrev: 'PRD', publisher: 'American Physical Society', homepage: 'https://journals.aps.org/prd/', authorGuidelines: 'https://journals.aps.org/prd/authors', overleafTemplate: '', citationStyle: 'APS/REVTeX numeric', language: 'en-US', verified: false },
  { id: 'jheap', name: 'Journal of High Energy Astrophysics', abbrev: 'JHEAP', publisher: 'Elsevier', homepage: 'https://www.sciencedirect.com/journal/journal-of-high-energy-astrophysics', authorGuidelines: 'https://www.sciencedirect.com/journal/journal-of-high-energy-astrophysics/publish/guide-for-authors', overleafTemplate: '', citationStyle: 'Elsevier numbered', language: 'en-US', verified: false },
  { id: 'cpc', name: 'Chinese Physics C', abbrev: 'CPC', publisher: 'IOP/IHEP', homepage: 'https://iopscience.iop.org/journal/1674-1137', authorGuidelines: 'https://cpc-hepnp.ihep.ac.cn/', overleafTemplate: '', citationStyle: 'CPC style', language: 'en-US', verified: false },
  { id: 'universe', name: 'Universe', abbrev: 'Universe', publisher: 'MDPI', homepage: 'https://www.mdpi.com/journal/universe', authorGuidelines: 'https://www.mdpi.com/journal/universe/instructions', overleafTemplate: '', citationStyle: 'MDPI numbered', language: 'en-US', verified: false },
  { id: 'nature', name: 'Nature', abbrev: 'Nature', publisher: 'Springer Nature', homepage: 'https://www.nature.com/nature/', authorGuidelines: 'https://www.nature.com/nature/for-authors', overleafTemplate: '', citationStyle: 'Nature numbered', language: 'en-GB', verified: false },
  { id: 'science', name: 'Science', abbrev: 'Science', publisher: 'AAAS', homepage: 'https://www.science.org/journal/science', authorGuidelines: 'https://www.science.org/content/page/science-information-authors', overleafTemplate: '', citationStyle: 'Science numbered', language: 'en-US', verified: false },
  { id: 'aj', name: 'The Astronomical Journal', abbrev: 'AJ', publisher: 'IOP/AAS', homepage: 'https://iopscience.iop.org/journal/1538-3881', authorGuidelines: 'https://journals.aas.org/aj/', overleafTemplate: '', citationStyle: 'AASTeX + natbib author-year', language: 'en-US', verified: false },
  { id: 'pasp', name: 'Publications of the Astronomical Society of the Pacific', abbrev: 'PASP', publisher: 'IOP/AASP', homepage: 'https://iopscience.iop.org/journal/1538-3873', authorGuidelines: 'https://iopscience.iop.org/journal/1538-3873/page/author-information', overleafTemplate: '', citationStyle: 'PASP style', language: 'en-US', verified: false },
];

const FALLBACK_THESIS = [
  { id: 'generic-cn', university: '中国高校通用（上传格式要求前）', department: '', degree: '博士/硕士', yearVersion: '以学校当年文件为准', title: 'GB/T 7714-2015 参考文献著录规则', url: 'https://openstd.samr.gov.cn/', formatNotes: [], citationStandard: 'GB/T 7714-2015', templateUrl: '', verified: false, notes: '占位条目；请上传/选择具体学校格式。' },
];

let loaded = false;
let projects = [];
let customFormats = [];
let saving = null;
let saveTimer = null;
let journalsCache = null;
let thesisCache = null;

function readJson(urlOrPath, fallback) {
  try {
    const text = readFileSync(urlOrPath, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function loadJournals() {
  // Small seed files can change while the plugin is live; read each call.
  const data = readJson(JOURNAL_SEED, null);
  const list = Array.isArray(data?.journals) ? data.journals : FALLBACK_JOURNALS;
  journalsCache = list;
  return journalsCache;
}

function loadThesisFormats() {
  const data = readJson(THESIS_SEED, null);
  const list = Array.isArray(data?.formats) ? data.formats : FALLBACK_THESIS;
  thesisCache = [...list, ...customFormats];
  return thesisCache;
}

export function listJournals() {
  return loadJournals();
}

export function getJournal(id) {
  return loadJournals().find((journal) => journal.id === id) ?? null;
}

export function listThesisFormats() {
  return loadThesisFormats();
}

export function getThesisFormat(id) {
  return loadThesisFormats().find((format) => format.id === id) ?? null;
}

export async function initWriting() {
  if (loaded) return;
  try {
    const raw = await readFile(PROJECTS_PATH, 'utf8');
    const data = JSON.parse(raw);
    projects = Array.isArray(data?.projects) ? data.projects : [];
  } catch (error) {
    if (error?.code !== 'ENOENT') warn(`writing projects unavailable: ${error?.message ?? error}`);
    projects = [];
  }
  try {
    const raw = await readFile(CUSTOM_FORMATS_PATH, 'utf8');
    const data = JSON.parse(raw);
    customFormats = Array.isArray(data?.formats) ? data.formats : [];
  } catch {
    customFormats = [];
  }
  thesisCache = null;
  loaded = true;
  log(`writing studio ready: ${projects.length} projects, ${customFormats.length} custom formats`);
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
    saveNow().catch((error) => warn('writing save failed:', error?.message ?? error));
  }, 250);
  saveTimer.unref?.();
}

export async function saveNow() {
  if (saving) return saving;
  saving = (async () => {
    await writeJsonAtomic(PROJECTS_PATH, { version: 1, updatedAt: new Date().toISOString(), projects });
    await writeJsonAtomic(CUSTOM_FORMATS_PATH, { version: 1, updatedAt: new Date().toISOString(), formats: customFormats });
  })().finally(() => {
    saving = null;
  });
  return saving;
}

function normalizeProject(input) {
  const id = String(input.id ?? '').trim() || `proj_${hashId(`${input.title ?? ''}:${Date.now()}`, 10)}`;
  return {
    id,
    title: String(input.title ?? '').trim() || '未命名写作项目',
    type: input.type === 'thesis' ? 'thesis' : 'journal',
    language: ['en', 'zh', 'bilingual'].includes(input.language) ? input.language : 'en',
    goalId: String(input.goalId ?? '').trim(),
    targetId: String(input.targetId ?? '').trim(),
    styleNotes: String(input.styleNotes ?? '').trim(),
    outline: String(input.outline ?? '').trim(),
    status: String(input.status ?? 'draft'),
    referenceIds: unique(Array.isArray(input.referenceIds) ? input.referenceIds.map(String) : []),
    files: Array.isArray(input.files) ? input.files : [],
    sections: createSections(input.sections ?? {}),
    createdAt: String(input.createdAt ?? '') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function listProjects() {
  return projects.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function getProject(id) {
  return projects.find((project) => project.id === id) ?? null;
}

export function createProject(input) {
  const project = normalizeProject(input);
  projects.push(project);
  scheduleSave();
  return project;
}

export function updateProject(id, patch = {}) {
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return null;
  const previous = projects[index];
  projects[index] = normalizeProject({ ...previous, ...patch, id, createdAt: previous.createdAt, files: patch.files ?? previous.files });
  scheduleSave();
  return projects[index];
}

export function deleteProject(id) {
  const index = projects.findIndex((project) => project.id === id);
  if (index < 0) return false;
  projects.splice(index, 1);
  try {
    rmSync(join(PROJECTS_DIR, id), { recursive: true, force: true });
  } catch {
    // Project files are best-effort cleanup.
  }
  scheduleSave();
  return true;
}

function safeFileName(name) {
  return String(name ?? 'file')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 120) || 'file';
}

export async function addProjectFiles(id, files = []) {
  const project = getProject(id);
  if (!project) throw new Error('project not found');
  const dir = join(PROJECTS_DIR, id, 'files');
  await mkdir(dir, { recursive: true });
  const added = [];
  for (const file of Array.isArray(files) ? files : []) {
    const name = safeFileName(file?.name);
    const encoded = String(file?.content ?? '');
    const buffer = file?.encoding === 'base64' ? Buffer.from(encoded, 'base64') : Buffer.from(encoded, 'utf8');
    if (buffer.length > 8 * 1024 * 1024) throw new Error(`file too large: ${name}`);
    const target = join(dir, name);
    await writeFile(target, buffer);
    const preview = file?.encoding === 'base64' ? '' : buffer.toString('utf8').slice(0, 3000);
    added.push({
      name,
      path: target,
      size: buffer.length,
      type: String(file?.type ?? ''),
      encoding: file?.encoding === 'base64' ? 'base64' : 'utf8',
      preview,
      addedAt: new Date().toISOString(),
    });
  }
  project.files = [...(project.files ?? []), ...added];
  project.updatedAt = new Date().toISOString();
  scheduleSave();
  return { project, added };
}

export function addCustomThesisFormat(input = {}) {
  const format = {
    id: `custom_${hashId(`${input.university ?? ''}:${input.yearVersion ?? ''}:${Date.now()}`, 10)}`,
    university: String(input.university ?? '').trim(),
    department: String(input.department ?? '').trim(),
    degree: String(input.degree ?? '博士/硕士').trim(),
    yearVersion: String(input.yearVersion ?? '未标注版本').trim(),
    title: String(input.title ?? '用户上传的学位论文格式要求').trim(),
    url: String(input.url ?? '').trim(),
    formatNotes: Array.isArray(input.formatNotes) ? input.formatNotes.map(String) : [],
    citationStandard: String(input.citationStandard ?? '').trim(),
    templateUrl: String(input.templateUrl ?? '').trim(),
    verified: false,
    verifiedAt: new Date().toISOString(),
    notes: String(input.notes ?? '用户上传/自定义格式').trim(),
    custom: true,
    sourceFile: String(input.sourceFile ?? '').trim(),
    formatText: String(input.formatText ?? '').slice(0, 20000),
  };
  if (!format.university) throw new Error('university is required');
  customFormats.push(format);
  thesisCache = null;
  scheduleSave();
  return format;
}

export function exportFormatPack() {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    journals: loadJournals(),
    thesisFormats: loadThesisFormats().filter((format) => !format.custom),
    customFormats,
    licenseNote: '期刊/高校格式只存链接与要点摘要；转载前请遵守原机构条款。',
  };
}

export function importFormatPack(pack = {}) {
  const incoming = Array.isArray(pack.customFormats) ? pack.customFormats : Array.isArray(pack.formats) ? pack.formats : [];
  let added = 0;
  for (const input of incoming) {
    if (!input?.university) continue;
    const exists = customFormats.some(
      (format) => format.university === input.university && format.yearVersion === input.yearVersion,
    );
    if (exists) continue;
    try {
      addCustomThesisFormat({
        university: input.university,
        department: input.department,
        degree: input.degree,
        yearVersion: input.yearVersion,
        title: input.title,
        url: input.url,
        formatNotes: input.formatNotes,
        citationStandard: input.citationStandard,
        templateUrl: input.templateUrl,
        notes: input.notes,
        sourceFile: input.sourceFile,
        formatText: input.formatText,
      });
      added += 1;
    } catch {
      // skip malformed entries
    }
  }
  thesisCache = null;
  scheduleSave();
  return { added, total: customFormats.length, thesisFormats: loadThesisFormats() };
}

export function buildProjectPrompt(project, options = {}) {
  const mode = ['outline', 'draft', 'analyze', 'format', 'audit'].includes(options.mode) ? options.mode : 'outline';
  const target = project.type === 'journal' ? getJournal(project.targetId) : getThesisFormat(project.targetId);
  const files = (project.files ?? []).slice(0, 12);
  const lines = [];
  lines.push(`【写作项目】${project.title}`);
  lines.push(`类型：${project.type === 'journal' ? '英文期刊论文' : '学位论文'}；语言：${project.language}`);
  if (target) {
    lines.push(`目标：${target.name ?? target.title}${target.abbrev ? ` (${target.abbrev})` : ''}`);
    if (target.authorGuidelines) lines.push(`作者指南：${target.authorGuidelines}`);
    if (target.overleafTemplate) lines.push(`Overleaf 模板：${target.overleafTemplate}`);
    if (target.citationStyle) lines.push(`引用风格：${target.citationStyle}`);
    if (target.university) lines.push(`学校：${target.university}；版本：${target.yearVersion}；格式链接：${target.url || '未提供'}`);
    if (target.citationStandard) lines.push(`引用标准：${target.citationStandard}`);
    if (target.formatNotes?.length) lines.push(`格式要点：${target.formatNotes.join('；')}`);
    if (target.formatText) lines.push(`用户上传的格式要求（节选）：\n${target.formatText.slice(0, 4000)}`);
  } else if (project.targetId) {
    lines.push(`目标 id：${project.targetId}（未在本地格式库中找到，请让用户确认）`);
  }
  const formatWorkspace = options.formatWorkspace;
  if (formatWorkspace) {
    lines.push('', '【已下载/上传的格式材料】');
    lines.push(`来源：${formatWorkspace.sourceUrl || '用户上传'}`);
    lines.push(`获取时间：${formatWorkspace.fetchedAt || formatWorkspace.uploadedAt || ''}`);
    for (const file of (formatWorkspace.files ?? []).slice(0, 8)) {
      lines.push(`- ${file.name}：${file.path}${file.needsDsh ? '（需要 DSH 解析 PDF/DOC）' : '（已解析文本）'}`);
    }
    if (formatWorkspace.text) lines.push('', `已解析格式文本（节选）：\n${String(formatWorkspace.text).slice(0, 6000)}`);
    if (formatWorkspace.errors?.length) lines.push('', '下载/解析未完成：', ...formatWorkspace.errors.slice(0, 6).map((item) => `- ${item}`));
    lines.push('', '如果材料含 PDF/DOC 未解析：请优先使用 DSH 的 PDF 阅读/转录工具读取 file.path，再提取页面/字体/行距/章节/参考文献要求；不要假装已经读过未解析文件。');
  }
  if (project.styleNotes) lines.push(`用户风格/要求：${project.styleNotes}`);
  if (project.outline) lines.push(`已有大纲：\n${project.outline}`);
  const sectionRows = SECTION_DEFS.map((def) => {
    const sec = project.sections?.[def.id] ?? {};
    return `${def.nameZh}（${sec.status ?? 'todo'}${sec.score?.overall ? `, 分 ${sec.score.overall}` : ''}${sec.confirmation ? ', 已作者确认' : ''}）`;
  });
  lines.push('', '【逐节状态】', sectionRows.join('；'));
  lines.push('执行纪律：只写当前选中的一节；作者未确认前不得把该节标记为完成；任何修改后旧确认失效。');
  const goal = getWritingGoal(project.goalId);
  if (goal) {
    lines.push('', '【写作目标 / 叙述风格】');
    lines.push(`${goal.nameZh}（${goal.nameEn}）`);
    lines.push(`何时用：${goal.whenToUse}`);
    lines.push(`核心姿态：${goal.coreStance}`);
    lines.push(`新颖性表述：${goal.noveltyClaim}`);
    lines.push(`证据门槛：${goal.evidenceThreshold.join('；')}`);
    lines.push(`标题模式：${goal.titlePatterns.join(' / ')}`);
    lines.push(`摘要动作：${goal.abstractMoves.join(' → ')}`);
    lines.push(`主张动词：${goal.claimVerbs.join(', ')}`);
    lines.push(`期刊匹配：${goal.journalFit.join(' / ')}`);
    lines.push(`风格提示词：${goal.prompt}`);
    if (goal.reviewerRisks?.length) lines.push(`审稿人最可能质疑：${goal.reviewerRisks.join('；')}`);
    if (goal.exemplars?.length) lines.push(`风格示例（仅结构参考，引用前核验）：${goal.exemplars.map((paper) => `${paper.title} (${paper.year}, DOI:${paper.doi})`).join('；')}`);
    lines.push('执行要求：先按此风格给出 3 个标题变体与摘要骨架，再写正文；若证据不足以支撑该风格的强主张，降级为更保守的风格并说明。');
  }
  lines.push('');
  lines.push('【上传的研究结果文件】');
  if (!files.length) lines.push('（尚未上传文件）');
  files.forEach((file, index) => {
    lines.push(`${index + 1}. ${file.name} (${file.size} bytes, ${file.type || 'unknown'})`);
    if (file.preview) lines.push('   预览：' + file.preview.replace(/\s+/g, ' ').slice(0, 1200));
  });
  lines.push('');
  lines.push('【可用参考文献】');
  const refs = Array.isArray(options.references) ? options.references.slice(0, 20) : [];
  if (!refs.length) lines.push('（文献库为空；写作前先用 astro_reference_save 建立文献库）');
  for (const ref of refs) {
    lines.push(`- ${ref.title} | ${ref.journal ?? ''} ${ref.year ?? ''} | DOI: ${ref.doi ?? ''}`);
    if (ref.summary) lines.push(`  总结：${ref.summary.slice(0, 500)}`);
  }
  lines.push('');
  lines.push('【本次任务】');
  if (mode === 'analyze') {
    lines.push('先分析上传的研究结果：数据/样本、仪器/波段、方法、关键结果、误差、局限、可复现性、可用图表。');
    lines.push('不要编造数据；缺失处明确写“文件未提供”。输出 1) 结果摘要 2) 可支撑的论文卖点 3) 建议图表清单 4) 需要补做的分析。');
  } else if (mode === 'outline') {
    lines.push('先不要写全文。输出：1) 3-5 个候选标题（具体、含源/信使/波段/方法/结果）2) 摘要骨架 3) 关键词候选（领域/望远镜/方法/源类型）4) 章节大纲与每节要点 5) 图表清单 6) 需要补读的文献/数据 7) 目标期刊匹配度。');
    lines.push('遵守用户要求的写作规范：先框架后写作、引言引原始文献、数据方法可复现、结果与图表一致、结论给物理诠释。');
  } else if (mode === 'draft') {
    lines.push('按已确认大纲逐节起草，不要一次生成全文。先写标题/摘要/关键词/引言，再写数据与方法、结果、讨论、结论；每节后自检引用、数字、单位、图表一致性。');
    lines.push('英文期刊论文用 US 或 UK 母语者学术英语；中文论文用规范学术书面语。避免 AI 套话、重复连接词、空洞形容词。');
    lines.push('引用只用文献库/检索结果中存在的条目，禁止编造 DOI 或引用不相干文献。');
  } else if (mode === 'audit') {
    lines.push('做一次“投稿前红队审计”，不要重写全文。按当前写作目标逐条检查：');
    lines.push('1) 主张-证据表：每个强主张对应哪张图/哪个表/哪个数值/哪条引用；缺证据的标红；');
    lines.push('2) 风格-证据匹配：目标风格需要的主张强度是否被数据支撑；不够就建议降级风格（如 discovery → confirmation/incremental）；');
    lines.push('3) 引用意图：每处引用是支持、扩展还是反驳；是否误引；是否漏引原始文献；');
    lines.push('4) 审稿人红队：按目标列出 10 个最可能被问的问题；');
    lines.push('5) 标题/摘要/图注/结论是否互相一致；数字、单位、误差、显著性是否一致；');
    lines.push('6) 给出必须修/建议修/可不修三档，并标出对应章节。');
    lines.push('不要编造审稿意见或数据；不能从已给材料判断的，写“需作者确认”。');
  } else {
    lines.push('把目标期刊/学校格式要求解析成检查清单：页面/字体/行距/页边距/图表/公式/参考文献/摘要字数/模板下载；列出当前项目缺什么。');
  }
  lines.push('');
  lines.push('如果信息不足，先问用户一个最关键的问题；不要假装已经读过未上传的文件。');
  return lines.join('\n');
}
