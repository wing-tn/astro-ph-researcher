// astro-ph-researcher :: astronomy data-processing methods + instrument/data workflow library
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

import { DATA_DIR } from './store.js';
import { hashId, log, normalizeTerm, unique, warn } from './util.js';

const METHODS_SEED = new URL('../data/data-methods.seed.json', import.meta.url);
const INSTRUMENTS_SEED = new URL('../data/instruments.seed.json', import.meta.url);
const WORKFLOWS_PATH = join(DATA_DIR, 'workflows.json');

const STATUS_LABELS = {
  running: '运行中',
  commissioning: '调试/试运行',
  under_construction: '在建',
  planned: '规划中',
  proposed: '提案/未立项',
  ended: '已结束',
};

const POLICY_LABELS = {
  open: '开放数据',
  restricted: '受限/申请',
  proprietary: '专有期',
  closed: '闭源/需合作',
};

const FALLBACK_METHODS = [
  {
    id: 'least-squares',
    category: '拟合',
    name: '加权最小二乘拟合',
    principle: '在给定设计矩阵与测量误差时，最小化加权残差平方和，得到参数的闭式解；是线性模型与许多非线性拟合的基础。',
    formula: 'χ² = Σ[(y_i − f(x_i;θ))/σ_i]²；线性模型 θ = (AᵀWA)⁻¹AᵀWy，W=diag(1/σ_i²)',
    assumptions: ['测量误差独立', '误差方差已知或可估计', '模型形式正确'],
    steps: ['构造设计矩阵 A', '按误差构造权重 W', '求解 θ', '检查残差与 χ² 自由度'],
    python: {
      description: 'numpy 加权最小二乘的独立实现',
      code: "import numpy as np\nA = np.column_stack([np.ones_like(x), x])\nW = np.diag(1.0 / sigma**2)\ntheta = np.linalg.solve(A.T @ W @ A, A.T @ W @ y)\nresid = y - A @ theta\nchi2 = float(resid.T @ W @ resid)",
    },
    pitfalls: ['忽略误差相关性', '把系统误差当随机误差', '过拟合后不检查残差'],
    related: ['最大似然估计', '置信区间'],
  },
];

const FALLBACK_INSTRUMENTS = [
  {
    id: 'chandra',
    name: 'Chandra X-ray Observatory',
    type: 'space_telescope',
    status: 'running',
    openPolicy: 'open',
    operator: 'NASA/CXC',
    country: 'USA',
    waveband: 'X-ray',
    description: '高分辨率 X 射线成像与谱学空间望远镜。',
    dataLinks: [{ label: 'Chandra Data Archive', url: 'https://cxc.harvard.edu/cda/', type: 'archive' }],
    analysisLinks: [{ label: 'CIAO', url: 'https://cxc.cfa.harvard.edu/ciao/', type: 'software' }],
    software: [{ name: 'CIAO', url: 'https://cxc.cfa.harvard.edu/ciao/', language: 'CIAO/Sherpa', openSource: true, notes: 'HEASoft 生态' }],
    workflow: ['在 CDA 检索目标/曝光', '下载 Level 2 事件与响应文件', 'CIAO 重处理/筛选', '谱拟合或成像分析', '记录版本与引用'],
    advice: '公开数据可直接下载；注意专有期与校准版本。',
    verified: false,
    notes: '占位条目，待调研数据覆盖。',
  },
];

let loaded = false;
let workflows = [];
let saving = null;
let saveTimer = null;

function readJson(urlOrPath, fallback) {
  try {
    return JSON.parse(readFileSync(urlOrPath, 'utf8'));
  } catch {
    return fallback;
  }
}

function methodData() {
  const data = readJson(METHODS_SEED, null);
  return data && Array.isArray(data.methods) ? data : { methods: FALLBACK_METHODS, statistics: [] };
}

function instrumentData() {
  const data = readJson(INSTRUMENTS_SEED, null);
  return data && Array.isArray(data.instruments) ? data : { instruments: FALLBACK_INSTRUMENTS };
}

export function listMethods(filter = {}) {
  const data = methodData();
  const q = normalizeTerm(filter.q ?? filter.query ?? '');
  const category = String(filter.category ?? '').trim();
  return (data.methods ?? [])
    .filter((method) => !q || normalizeTerm([method.name, method.principle, method.formula, method.category, ...(method.related ?? [])].join(' ')).includes(q))
    .filter((method) => !category || method.category === category)
    .slice(0, Math.max(1, Math.min(200, Number(filter.limit) || 100)));
}

export function getMethod(id) {
  return (methodData().methods ?? []).find((method) => method.id === id) ?? null;
}

export function listStatistics(filter = {}) {
  const data = methodData();
  const q = normalizeTerm(filter.q ?? filter.query ?? '');
  return (data.statistics ?? []).filter((item) => !q || normalizeTerm([item.name, item.statement, item.use].join(' ')).includes(q));
}

export function listInstruments(filter = {}) {
  const data = instrumentData();
  const q = normalizeTerm(filter.q ?? filter.query ?? '');
  const status = String(filter.status ?? '').trim();
  const openPolicy = String(filter.openPolicy ?? filter.policy ?? '').trim();
  const type = String(filter.type ?? '').trim();
  return (data.instruments ?? [])
    .filter((item) => !q || normalizeTerm([item.name, item.id, item.operator, item.waveband, item.description, item.country].join(' ')).includes(q))
    .filter((item) => !status || item.status === status)
    .filter((item) => !openPolicy || item.openPolicy === openPolicy)
    .filter((item) => !type || item.type === type)
    .slice(0, Math.max(1, Math.min(300, Number(filter.limit) || 200)));
}

export function getInstrument(id) {
  return (instrumentData().instruments ?? []).find((item) => item.id === id) ?? null;
}

export function dataStats() {
  const methods = methodData();
  const instruments = instrumentData();
  return {
    methods: methods.methods?.length ?? 0,
    statistics: methods.statistics?.length ?? 0,
    instruments: instruments.instruments?.length ?? 0,
    open: (instruments.instruments ?? []).filter((item) => item.openPolicy === 'open').length,
    restricted: (instruments.instruments ?? []).filter((item) => item.openPolicy !== 'open').length,
    underConstruction: (instruments.instruments ?? []).filter((item) => ['under_construction', 'planned', 'proposed'].includes(item.status)).length,
    workflows: workflows.length,
  };
}

async function writeWorkflowsAtomic() {
  await mkdir(dirname(WORKFLOWS_PATH), { recursive: true });
  const tmp = `${WORKFLOWS_PATH}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tmp, `${JSON.stringify({ version: 1, workflows }, null, 2)}\n`, 'utf8');
  await rename(tmp, WORKFLOWS_PATH);
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow().catch((error) => warn('workflow save failed:', error?.message ?? error));
  }, 250);
  saveTimer.unref?.();
}

export async function saveNow() {
  if (saving) return saving;
  saving = writeWorkflowsAtomic().finally(() => {
    saving = null;
  });
  return saving;
}

export async function initDataLibrary() {
  if (loaded) return;
  try {
    const raw = await readFile(WORKFLOWS_PATH, 'utf8');
    const data = JSON.parse(raw);
    workflows = Array.isArray(data?.workflows) ? data.workflows : [];
  } catch (error) {
    if (error?.code !== 'ENOENT') warn(`workflow library unavailable: ${error?.message ?? error}`);
    workflows = [];
  }
  loaded = true;
  log(`data library ready: ${methodData().methods?.length ?? 0} methods, ${dataStats().instruments} instruments, ${workflows.length} workflows`);
}

export function listWorkflows() {
  return workflows.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function saveWorkflow(input = {}) {
  const instrument = input.instrumentId ? getInstrument(String(input.instrumentId)) : null;
  const workflow = {
    id: String(input.id ?? '').trim() || `wf_${hashId(`${input.instrumentId ?? ''}:${input.name ?? ''}:${Date.now()}`, 10)}`,
    instrumentId: String(input.instrumentId ?? ''),
    instrumentName: instrument?.name ?? String(input.instrumentName ?? ''),
    name: String(input.name ?? instrument?.name ?? '未命名工作流').trim(),
    steps: Array.isArray(input.steps) ? input.steps.map(String) : instrument?.workflow ?? [],
    notes: String(input.notes ?? '').trim(),
    links: Array.isArray(input.links) ? input.links : [...(instrument?.dataLinks ?? []), ...(instrument?.analysisLinks ?? [])],
    createdAt: String(input.createdAt ?? '') || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const index = workflows.findIndex((item) => item.id === workflow.id);
  if (index >= 0) {
    workflow.createdAt = workflows[index].createdAt;
    workflows[index] = workflow;
  } else {
    workflows.push(workflow);
  }
  scheduleSave();
  return workflow;
}

export function deleteWorkflow(id) {
  const index = workflows.findIndex((item) => item.id === id);
  if (index < 0) return false;
  workflows.splice(index, 1);
  scheduleSave();
  return true;
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

export function policyLabel(policy) {
  return POLICY_LABELS[policy] ?? policy;
}

export function formatMethod(method) {
  if (!method) return '未找到方法。';
  const lines = [`${method.name}（${method.category}）`, '', `原理：${method.principle}`];
  if (method.formula) lines.push('', `公式：${method.formula}`);
  if (method.formulaLatex) lines.push('', `LaTeX（可粘贴）：\`${method.formulaLatex}\``);
  if (method.assumptions?.length) lines.push('', '假设：', ...method.assumptions.map((item) => `- ${item}`));
  if (method.steps?.length) lines.push('', '步骤：', ...method.steps.map((item, index) => `${index + 1}. ${item}`));
  if (method.python?.code) lines.push('', `Python 示例（独立实现，非书中原文）：\n\`\`\`python\n${method.python.code}\n\`\`\``);
  if (method.pitfalls?.length) lines.push('', '常见坑：', ...method.pitfalls.map((item) => `- ${item}`));
  return lines.join('\n');
}

export function formatInstrument(item) {
  if (!item) return '未找到观测设备。';
  const lines = [
    `${item.name}（${item.id}）`,
    `状态：${statusLabel(item.status)} · 数据政策：${policyLabel(item.openPolicy)} · 类型：${item.type} · 波段：${item.waveband ?? ''}`,
    `运营：${item.operator ?? ''}${item.country ? `（${item.country}）` : ''}`,
    item.description ? `简介：${item.description}` : '',
  ].filter(Boolean);
  if (item.dataLinks?.length) lines.push('', '数据/获取：', ...item.dataLinks.map((link) => `- ${link.label}: ${link.url}`));
  if (item.analysisLinks?.length) lines.push('', '分析/文档：', ...item.analysisLinks.map((link) => `- ${link.label}: ${link.url}`));
  if (item.software?.length) lines.push('', '软件：', ...item.software.map((sw) => `- ${sw.name}${sw.openSource ? '（开源）' : '（闭源）'}: ${sw.url}`));
  if (item.workflow?.length) lines.push('', '建议工作流：', ...item.workflow.map((step, index) => `${index + 1}. ${step}`));
  if (item.advice) lines.push('', `建议：${item.advice}`);
  if (item.notes) lines.push('', `备注：${item.notes}`);
  return lines.join('\n');
}

export function buildInstrumentPrompt(item, options = {}) {
  if (!item) return '未找到观测设备。';
  const lines = [
    '【天文观测设备/数据工作流任务】',
    `${item.name}（${item.id}）`,
    `状态：${statusLabel(item.status)}；数据政策：${policyLabel(item.openPolicy)}；类型：${item.type}；波段：${item.waveband ?? ''}`,
    `运营：${item.operator ?? ''}${item.country ? `（${item.country}）` : ''}`,
    item.description ? `简介：${item.description}` : '',
  ].filter(Boolean);
  if (item.dataLinks?.length) lines.push('', '官方数据/获取链接：', ...item.dataLinks.map((link) => `- ${link.label}: ${link.url}`));
  if (item.analysisLinks?.length) lines.push('', '官方分析/文档：', ...item.analysisLinks.map((link) => `- ${link.label}: ${link.url}`));
  if (item.software?.length) lines.push('', '软件：', ...item.software.map((sw) => `- ${sw.name}${sw.openSource ? '（开源）' : '（闭源）'}：${sw.url}；${sw.notes ?? ''}`));
  if (item.workflow?.length) lines.push('', '官方/建议步骤：', ...item.workflow.map((step, index) => `${index + 1}. ${step}`));
  if (item.advice) lines.push('', `数据政策建议：${item.advice}`);
  if (item.notes) lines.push('', `备注：${item.notes}`);

  if (options.method) {
    lines.push('', `【可搭配的数据处理方法】${options.method.name}`, options.method.principle, options.method.python?.code ? `Python 示例：\n\`\`\`python\n${options.method.python.code}\n\`\`\`` : '');
  }
  lines.push(
    '',
    '【本次任务】',
    '请基于以上官方链接（不要编造未给出的 URL）设计一个可执行、可复现的数据分析工作流：',
    '1) 数据获取：用哪个归档/API、检索什么、下载哪些产品、专有期/申请限制；',
    '2) 环境与软件：官方工具/开源包、版本、依赖、安装方式；',
    '3) 步骤：筛选/校准/背景/响应/拟合/统计/绘图，每步输入输出；',
    '4) 验证：与官方教程或已知结果对照，误差与系统atics；',
    '5) 存档与引用：数据版本、软件版本、DOI/致谢；',
    '6) 若数据闭源/受限，给出申请建议、替代公开数据集或合作分析边界。',
    '先问我一个最关键的问题；不要假装已经访问过未打开的链接。',
  );
  return lines.join('\n');
}

export { STATUS_LABELS, POLICY_LABELS };
