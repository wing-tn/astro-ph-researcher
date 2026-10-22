// astro-ph-researcher :: novice step-by-step path + local progress
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DATA_DIR } from './store.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PATH_FILE = fileURLToPath(new URL('../data/novice-path.seed.json', import.meta.url));
const PROGRESS_FILE = join(DATA_DIR, 'novice-progress.json');
const PATH = JSON.parse(readFileSync(PATH_FILE, 'utf8'));
const EMPTY_PROGRESS = {
  completed: [],
  current: PATH.steps?.[0]?.id ?? 'start',
  startedAt: null,
  updatedAt: null,
  notes: {},
};

let cache = null;

async function readProgress() {
  try {
    if (!existsSync(PROGRESS_FILE)) return structuredClone(EMPTY_PROGRESS);
    const parsed = JSON.parse(await readFile(PROGRESS_FILE, 'utf8'));
    return {
      ...structuredClone(EMPTY_PROGRESS),
      ...parsed,
      completed: Array.isArray(parsed.completed) ? [...new Set(parsed.completed.map(String))] : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return structuredClone(EMPTY_PROGRESS);
  }
}

async function writeProgress(progress) {
  await mkdir(DATA_DIR, { recursive: true });
  const next = { ...progress, updatedAt: new Date().toISOString() };
  const tmp = `${PROGRESS_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
  await rename(tmp, PROGRESS_FILE);
  cache = next;
  return next;
}

export function noviceMeta() {
  const steps = PATH.steps ?? [];
  return {
    version: PATH.version ?? '3.2',
    notice: PATH.notice ?? '',
    steps: steps.map((step, index) => ({ ...step, index, total: steps.length })),
  };
}

export async function getNoviceProgress() {
  if (cache) return structuredClone(cache);
  cache = await readProgress();
  return structuredClone(cache);
}

export async function startNovice() {
  const progress = await getNoviceProgress();
  const data = {
    ...progress,
    current: progress.current ?? PATH.steps?.[0]?.id ?? 'start',
    startedAt: progress.startedAt ?? new Date().toISOString(),
  };
  await writeProgress(data);
  return data;
}

export async function completeNoviceStep(id) {
  const step = (PATH.steps ?? []).find((item) => item.id === id);
  if (!step) throw new Error(`未知新手步骤：${id}`);
  const progress = await getNoviceProgress();
  if (!progress.completed.includes(id)) progress.completed.push(id);
  const next = (PATH.steps ?? []).find((item) => !progress.completed.includes(item.id));
  progress.current = next?.id ?? step.id;
  if (!progress.startedAt) progress.startedAt = new Date().toISOString();
  await writeProgress(progress);
  return { progress: structuredClone(progress), step, next };
}

export async function resetNovice() {
  return writeProgress(structuredClone(EMPTY_PROGRESS));
}

export async function getNovicePath() {
  const progress = await getNoviceProgress();
  const steps = noviceMeta().steps;
  const current = steps.find((step) => step.id === progress.current) ?? steps.find((step) => !progress.completed.includes(step.id)) ?? steps[0] ?? null;
  return {
    ...noviceMeta(),
    progress,
    current,
    completedCount: progress.completed.length,
    percent: steps.length ? Math.round((progress.completed.length / steps.length) * 100) : 0,
  };
}

export function formatNoviceStep(step) {
  if (!step) return '未找到该新手步骤。';
  return [
    `# ${step.index + 1}/${step.total} · ${step.title}`,
    `阶段：${step.phase} · 建议用时：${step.duration}`,
    `目标：${step.goal}`,
    '',
    '## 要做什么',
    ...(step.actions ?? []).map((x, i) => `${i + 1}. ${x}`),
    '',
    '## 本步提示词（可复制到 DSH）',
    step.prompt,
    '',
    '## 交付物',
    step.deliverable,
    '',
    '## 检查清单',
    ...(step.checklist ?? []).map((x) => `- [ ] ${x}`),
    '',
    '## 常见坑',
    ...(step.pitfalls ?? []).map((x) => `- ${x}`),
    '',
    `下一步：${step.next}`,
    '',
    '纪律：AI 可以讲解/起草，但数据、公式、引用与结果必须由你核验；不要把提示词当结论。',
  ].join('\n');
}

export function formatNovicePath(path) {
  return [
    path.notice,
    '',
    `进度：${path.completedCount}/${path.steps.length}（${path.percent}%） · 当前：${path.current?.title ?? '已完成'}`,
    '',
    ...path.steps.map((step) => `${step.index + 1}. ${step.id === path.current?.id ? '▶ ' : path.progress.completed.includes(step.id) ? '✓ ' : '○ '}${step.title}（${step.phase}）`),
  ].join('\n');
}
