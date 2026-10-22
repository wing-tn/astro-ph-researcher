// astro-ph-researcher :: local research plan tree (no network, no AI call)
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_DIR } from './store.js';
import { hashId } from './util.js';

const PLAN_PATH = join(DATA_DIR, 'plans.json');
const DEFAULT_PLAN = {
  id: 'default',
  title: '我的研究计划',
  goal: '',
  updatedAt: new Date().toISOString(),
  nodes: [],
};

let cache = null;

async function readPlanFile() {
  try {
    if (!existsSync(PLAN_PATH)) return structuredClone(DEFAULT_PLAN);
    const parsed = JSON.parse(await readFile(PLAN_PATH, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return structuredClone(DEFAULT_PLAN);
    return {
      ...structuredClone(DEFAULT_PLAN),
      ...parsed,
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    };
  } catch {
    return structuredClone(DEFAULT_PLAN);
  }
}

async function writePlanFile(plan) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${PLAN_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(plan, null, 2) + '\n', 'utf8');
  await rename(tmp, PLAN_PATH);
  cache = plan;
  return plan;
}

export async function getPlan() {
  if (cache) return structuredClone(cache);
  cache = await readPlanFile();
  return structuredClone(cache);
}

export async function patchPlan(patch = {}) {
  const plan = await getPlan();
  if (patch.title !== undefined) plan.title = String(patch.title).slice(0, 160);
  if (patch.goal !== undefined) plan.goal = String(patch.goal).slice(0, 2000);
  plan.updatedAt = new Date().toISOString();
  return writePlanFile(plan);
}

export function nodeId(prefix = 'node') {
  return `${prefix}_${hashId(`${Date.now()}_${Math.random()}`, 10)}`;
}

export async function upsertNode(input = {}) {
  const plan = await getPlan();
  const parentId = input.parentId ? String(input.parentId) : null;
  const existing = input.id ? plan.nodes.find((item) => item.id === input.id) : null;
  if (existing) {
    for (const key of ['title', 'note', 'status', 'phase', 'source', 'tags', 'parentId']) {
      if (input[key] !== undefined) existing[key] = input[key];
    }
    existing.updatedAt = new Date().toISOString();
  } else {
    const node = {
      id: String(input.id || nodeId()),
      parentId: parentId && plan.nodes.some((item) => item.id === parentId) ? parentId : null,
      title: String(input.title || '未命名节点').slice(0, 180),
      note: String(input.note || '').slice(0, 8000),
      status: ['todo', 'doing', 'done', 'blocked'].includes(input.status) ? input.status : 'todo',
      phase: String(input.phase || '未分组').slice(0, 80),
      source: String(input.source || '').slice(0, 200),
      tags: Array.isArray(input.tags) ? [...new Set(input.tags.map(String))].slice(0, 12) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    plan.nodes.push(node);
  }
  plan.updatedAt = new Date().toISOString();
  await writePlanFile(plan);
  return { plan: structuredClone(plan), node: existing || plan.nodes[plan.nodes.length - 1] };
}

export async function deleteNode(id) {
  const plan = await getPlan();
  const doomed = new Set([String(id)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of plan.nodes) {
      if (node.parentId && doomed.has(node.parentId) && !doomed.has(node.id)) {
        doomed.add(node.id);
        changed = true;
      }
    }
  }
  plan.nodes = plan.nodes.filter((node) => !doomed.has(node.id));
  plan.updatedAt = new Date().toISOString();
  await writePlanFile(plan);
  return { plan: structuredClone(plan), removed: doomed.size };
}

export function summarizePlan(plan) {
  const nodes = plan?.nodes ?? [];
  const byStatus = {};
  const byPhase = {};
  for (const node of nodes) {
    byStatus[node.status] = (byStatus[node.status] ?? 0) + 1;
    byPhase[node.phase || '未分组'] = (byPhase[node.phase || '未分组'] ?? 0) + 1;
  }
  const roots = nodes.filter((node) => !node.parentId);
  const lines = [
    `# ${plan?.title || '研究计划'}`,
    plan?.goal ? `\n目标：${plan.goal}` : '',
    `\n节点：${nodes.length} 个；根节点：${roots.length} 个。`,
    `状态：${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(' / ') || '暂无'}`,
    `阶段：${Object.entries(byPhase).map(([k, v]) => `${k} ${v}`).join(' / ') || '暂无'}`,
    '\n## 结构',
    ...renderTree(nodes, null, 0),
  ];
  return lines.filter(Boolean).join('\n');
}

export function renderPlanMarkdown(plan) {
  return summarizePlan(plan);
}

function renderTree(nodes, parentId, depth) {
  return nodes
    .filter((node) => (node.parentId ?? null) === parentId)
    .flatMap((node) => [
      `${'  '.repeat(depth)}- [${node.status === 'done' ? 'x' : ' '}] ${node.title}${node.note ? ` — ${node.note.split('\n')[0]}` : ''}`,
      ...renderTree(nodes, node.id, depth + 1),
    ]);
}

export async function exportPlan(format = 'md') {
  const plan = await getPlan();
  if (format === 'json') return { mime: 'application/json', filename: 'research-plan.json', body: JSON.stringify(plan, null, 2) };
  return { mime: 'text/markdown', filename: 'research-plan.md', body: renderPlanMarkdown(plan) };
}
