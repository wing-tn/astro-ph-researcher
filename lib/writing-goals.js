// astro-ph-researcher :: writing goals / narrative styles
import { readFileSync } from 'node:fs';

const SEED = new URL('../data/writing-goals.seed.json', import.meta.url);

function load() {
  try {
    const data = JSON.parse(readFileSync(SEED, 'utf8'));
    return Array.isArray(data?.goals) ? data : { goals: [] };
  } catch {
    return { goals: [] };
  }
}

export function listWritingGoals(query = '') {
  const q = String(query ?? '').trim().toLowerCase();
  return load().goals.filter((goal) => !q || [goal.id, goal.nameZh, goal.nameEn, ...(goal.aliases ?? [])].join(' ').toLowerCase().includes(q));
}

export function getWritingGoal(id) {
  return load().goals.find((goal) => goal.id === id) ?? null;
}

export function formatWritingGoal(goal) {
  if (!goal) return '未找到写作目标。';
  const lines = [
    `${goal.nameZh}（${goal.nameEn}）`,
    `何时用：${goal.whenToUse}`,
    `核心姿态：${goal.coreStance}`,
    `新颖性：${goal.noveltyClaim}`,
    '',
    `标题模式：${goal.titlePatterns.join(' / ')}`,
    `摘要动作：${goal.abstractMoves.join(' → ')}`,
    `主张动词：${goal.claimVerbs.join(', ')}`,
    `证据门槛：${goal.evidenceThreshold.join('；')}`,
    `期刊匹配：${goal.journalFit.join(' / ')}`,
    '',
    `提示词：${goal.prompt}`,
  ];
  if (goal.exemplars?.length) {
    lines.push('', '示例论文（仅作结构参考）：');
    for (const paper of goal.exemplars) lines.push(`- ${paper.title} (${paper.year}) DOI:${paper.doi} — ${paper.why}`);
  }
  lines.push('', '注意：风格是修辞结构，不得改变数据/引用事实；引用示例论文时应先核验 DOI 与结论。');
  return lines.join('\n');
}

export function writingGoalStats() {
  const goals = load().goals;
  return { count: goals.length, ids: goals.map((goal) => goal.id) };
}
