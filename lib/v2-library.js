import { readFileSync } from 'node:fs';

const ROOT = new URL('../data/', import.meta.url);
const load = (name) => {
  try { return JSON.parse(readFileSync(new URL(name, ROOT), 'utf8')); } catch { return {}; }
};

export function listFileFormats(query = '') {
  const q = String(query ?? '').toLowerCase().trim();
  const all = load('file-formats.seed.json').formats ?? [];
  return all.filter((item) => !q || [item.id, item.name, item.kind, ...(item.aliases ?? []), ...(item.tools ?? [])].join(' ').toLowerCase().includes(q));
}

export function getFileFormat(id) {
  return (load('file-formats.seed.json').formats ?? []).find((item) => item.id === id) ?? null;
}

export function formatFileFormat(item) {
  if (!item) return '未找到该文件格式。';
  const lines = [
    `${item.name}（${item.id}）`,
    `类型：${item.kind}；扩展名：${(item.extensions ?? []).join(' / ') || '无固定扩展名'}`,
    `它是什么：${item.what}`,
    item.keys?.length ? `关键头/字段：${item.keys.join('、')}` : '',
    item.tools?.length ? `常用工具：${item.tools.join('、')}` : '',
    item.mistakes?.length ? `常见错误：${item.mistakes.map((x) => `- ${x}`).join(' ')}` : '',
    item.docs ? `官方文档：${item.docs}` : '',
    item.related?.length ? `相关格式：${item.related.join('、')}` : '',
    '注意：格式解释不等于物理结论；先检查 HDU、单位、坐标、曝光与版本。',
  ];
  return lines.filter(Boolean).join('\n');
}

export function listRecommendedBooks(query = '') {
  const q = String(query ?? '').toLowerCase().trim();
  return (load('recommended-books.seed.json').books ?? []).filter((item) => !q || [item.id, item.title, ...(item.authors ?? []), item.publisher, item.domain, item.origin].join(' ').toLowerCase().includes(q));
}

export function getRecommendedBook(id) {
  return (load('recommended-books.seed.json').books ?? []).find((item) => item.id === id) ?? null;
}

export function recommendedBooksNotice() {
  return load('recommended-books.seed.json').notice ?? '';
}

export function formatRecommendedBook(item) {
  if (!item) return '未找到该推荐书籍。';
  return [
    `${item.title}${item.year ? `（${item.year}）` : ''}`,
    `作者：${(item.authors ?? []).join('、')}`,
    item.publisher ? `出版：${item.publisher}` : '',
    item.isbn ? `ISBN：${item.isbn}` : '',
    `语言/来源：${item.language} / ${item.origin}`,
    `领域：${item.domain}`,
    `推荐理由：${item.why}`,
    item.verified ? '元数据：已核验' : '元数据：待核验（版次/ISBN 以出版社为准）',
    item.note ? `备注：${item.note}` : '',
    '非盈利开源项目，仅列书目元数据，不提供原文/摘录/下载；版权归作者/出版社，如有侵权请联系 1253932197@qq.com 删除。',
  ].filter(Boolean).join('\n');
}

export function listPhysicsBooks(query = '', domain = '') {
  const q = String(query ?? '').toLowerCase().trim();
  const d = String(domain ?? '').toLowerCase().trim();
  return (load('physics-books.seed.json').books ?? []).filter((item) => {
    if (d && !(item.domains ?? []).map((x) => x.toLowerCase()).includes(d)) return false;
    return !q || [item.id, item.title, ...(item.authors ?? []), ...(item.domains ?? []), item.use].join(' ').toLowerCase().includes(q);
  });
}

export function getPhysicsBook(id) {
  return (load('physics-books.seed.json').books ?? []).find((item) => item.id === id) ?? null;
}

export function formatPhysicsBook(item) {
  if (!item) return '未找到该物理/天文书目。';
  return [
    `${item.title}${item.edition ? `（${item.edition} ed.）` : ''}（${item.year}）`,
    `作者：${(item.authors ?? []).join('、')}`,
    item.series ? `系列：${item.series}` : '',
    item.publisher ? `出版：${item.publisher}` : '',
    item.doi ? `DOI：${item.doi}` : '',
    `领域：${(item.domains ?? []).join('、')}；层级：${item.tier}`,
    `用途：${item.use}`,
    '使用边界：候选书目；版次/章节/符号约定需核验；不随插件分发全文。',
  ].filter(Boolean).join('\n');
}

export function listResearchTools(query = '') {
  const q = String(query ?? '').toLowerCase().trim();
  return (load('research-tools.seed.json').tools ?? []).filter((item) => !q || [item.id, item.name, item.kind, ...(item.aliases ?? []), ...(item.use ?? [])].join(' ').toLowerCase().includes(q));
}

export function formatResearchTool(item) {
  if (!item) return '未找到该分析工具。';
  return [
    `${item.name}（${item.id}）`,
    `类型：${item.kind}`,
    `链接：${item.url}`,
    `安装：${item.install}`,
    `用途：${(item.use ?? []).join('、')}`,
    `输入：${(item.inputs ?? []).join('、')}`,
    `输出：${(item.outputs ?? []).join('、')}`,
    `检查：${(item.checks ?? []).join('；')}`,
    item.citation ? `引用：${item.citation}` : '',
    item.notes ? `备注：${item.notes}` : '',
    '插件只给引导/配置/结果解释，不自动运行重型计算，不绕过数据权限。',
  ].filter(Boolean).join('\n');
}

export function listCatalogs(query = '') {
  const q = String(query ?? '').toLowerCase().trim();
  return (load('research-tools.seed.json').catalogs ?? []).filter((item) => !q || [item.id, item.name, item.kind].join(' ').toLowerCase().includes(q));
}

export function formatCatalog(item) {
  if (!item) return '未找到该公开源表。';
  return [`${item.name}（${item.id}）`, `类型：${item.kind}`, `官方入口：${item.url}`, `访问：${item.access}`, item.citation ? `引用：${item.citation}` : '', '下载/导入前检查版本、坐标历元、许可；不在插件内绕过登录/付费。'].filter(Boolean).join('\n');
}

function clampScore(n) {
  return Math.max(0, Math.min(5, Math.round(n)));
}

export function scoreLiterature(reference, override = null) {
  const ref = reference ?? {};
  const abstract = String(ref.abstract ?? ref.summary ?? '');
  const hasDoi = Boolean(ref.doi);
  const hasAuthors = (ref.authors ?? []).length >= 2;
  const hasVenue = Boolean(ref.venue || ref.journal);
  const hasAbstract = abstract.length > 120;
  const evidence = (String(ref.keyResults ?? '').length + abstract.length) / 400;
  const reproducible = /code|data|available|public|survey|sample|method|pipeline/i.test(abstract + ' ' + (ref.summary ?? '')) ? 1 : 0;
  const year = Number(ref.year) || 0;
  const currentYear = new Date().getFullYear();
  const age = year ? currentYear - year : 20;
  const scores = {
    relevance: clampScore(3 + (ref.collection || ref.collections?.length ? 1 : 0)),
    evidence: clampScore(1.5 + evidence + (ref.keyResults?.length ? 0.8 : 0)),
    method: clampScore(2 + (ref.abstract?.length > 200 ? 1 : 0) + (reproducible ? 0.8 : 0)),
    reproducibility: clampScore(1 + reproducible * 3 + (hasDoi ? 0.5 : 0)),
    venue: clampScore(hasVenue ? 4 : 1 + (hasDoi ? 1 : 0)),
    currency: clampScore(age <= 2 ? 5 : age <= 5 ? 4 : age <= 10 ? 3 : age <= 20 ? 2 : 1),
  };
  const weights = { relevance: 0.25, evidence: 0.2, method: 0.15, reproducibility: 0.15, venue: 0.15, currency: 0.1 };
  const weighted = Number(Object.entries(scores).reduce((sum, [k, v]) => sum + v * weights[k], 0).toFixed(2));
  const reasons = [];
  if (!hasDoi) reasons.push('没有 DOI，引用前需核验');
  if (!hasVenue) reasons.push('缺少期刊/会议信息');
  if (!hasAbstract) reasons.push('摘要缺失或过短，证据评分受限');
  if (!reproducible) reasons.push('未看到数据/代码/方法可复现线索');
  if (year && age > 10) reasons.push(`发表已 ${age} 年，需结合后续工作`);
  return {
    referenceId: ref.id ?? null,
    title: ref.title ?? '',
    rubricVersion: 'literature-v2.0',
    scores,
    weighted,
    reasons,
    flags: reasons,
    authorOverride: override ?? null,
    source: 'heuristic-advisory',
    scoredAt: new Date().toISOString(),
    notice: '评分是辅助排序，不是论文质量或科学真理的最终判决；作者可覆盖并写理由。',
  };
}
