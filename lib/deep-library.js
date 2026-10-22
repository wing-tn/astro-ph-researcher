// astro-ph-researcher :: deep / cross-disciplinary blind-spot prompts (offline)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATA = JSON.parse(readFileSync(fileURLToPath(new URL('../data/deep-prompts.seed.json', import.meta.url)), 'utf8'));
const PHASES = ['问题', '数据', '分析', '交叉', '写作'];

export function deepMeta() {
  return { version: DATA.version ?? '3.1', notice: DATA.notice ?? '', phases: PHASES, domains: DATA.domains ?? [], prompts: DATA.prompts ?? [] };
}

export function listDeepDomains(query = '', kind = '') {
  const q = String(query ?? '').toLowerCase().trim();
  return (DATA.domains ?? []).filter((item) => {
    if (kind && item.kind !== kind) return false;
    return !q || [item.id, item.name, item.summary, ...(item.questions ?? [])].join(' ').toLowerCase().includes(q);
  });
}

export function getDeepDomain(id) {
  return (DATA.domains ?? []).find((item) => item.id === id) ?? null;
}

export function listDeepPrompts({ phase = '', level = '', query = '' } = {}) {
  const q = String(query ?? '').toLowerCase().trim();
  return (DATA.prompts ?? []).filter((item) => {
    if (phase && item.phase !== phase) return false;
    if (level && item.level !== level) return false;
    return !q || [item.id, item.title, item.prompt, item.why, item.level, item.phase].join(' ').toLowerCase().includes(q);
  });
}

export function scanBlindspots({ phase = '', domains = [], query = '', limit = 12 } = {}) {
  const selectedDomains = (Array.isArray(domains) ? domains : String(domains ?? '').split(','))
    .map((id) => getDeepDomain(String(id).trim()))
    .filter(Boolean);
  const prompts = listDeepPrompts({ phase, query }).slice(0, Math.max(1, Math.min(24, Number(limit) || 12)));
  const domainQuestions = selectedDomains.flatMap((domain) =>
    (domain.questions ?? []).slice(0, 4).map((question) => ({ domain: domain.name, domainId: domain.id, question })),
  );
  const blindspots = selectedDomains.flatMap((domain) =>
    (domain.blindspots ?? []).map((item) => ({ domain: domain.name, item })),
  );
  return {
    notice: DATA.notice ?? '',
    phase: phase || '全部',
    domains: selectedDomains,
    prompts,
    domainQuestions: domainQuestions.slice(0, Math.max(6, Math.min(20, Number(limit) || 12))),
    blindspots,
    prompt: buildDeepPrompt({ phase, selectedDomains, prompts, domainQuestions, blindspots }),
  };
}

export function buildDeepPrompt({ phase, selectedDomains, prompts, domainQuestions, blindspots }) {
  return [
    '请作为天文研究的“红队/盲点审查员”，不要重复我的结论，而是帮助我找出没有注意到的问题。',
    phase ? `当前阶段：${phase}` : '',
    selectedDomains?.length ? `交叉学科：${selectedDomains.map((d) => d.name).join('、')}` : '',
    '',
    '请按以下结构回答：',
    '1. 我可能忽略的 5 个关键假设/选择效应；',
    '2. 每个问题的可检验诊断或替代解释；',
    '3. 2 个跨学科方法（说明可迁移与不可迁移之处）；',
    '4. 最可能被审稿人攻击的 3 点；',
    '5. 下一步最小验证动作（可执行、可复现）。',
    '',
    '检查问题：',
    ...prompts.map((p) => `- [${p.phase}/${p.level}] ${p.title}：${p.prompt}`),
    ...domainQuestions.map((x) => `- [${x.domain}] ${x.question}`),
    blindspots?.length ? '\n常见盲点：' + blindspots.map((x) => `${x.domain}：${x.item}`).join('；') : '',
    '',
    '纪律：不确定就写“不确定”；不要编造数据、文献、DOI 或观测结果；最终由作者核验。',
  ].filter(Boolean).join('\n');
}

export function formatDeepDomain(domain) {
  if (!domain) return '未找到该交叉学科领域。';
  return [
    `# ${domain.name}（${domain.kind}）`,
    domain.summary,
    '',
    '## 检查问题',
    ...(domain.questions ?? []).map((q, i) => `${i + 1}. ${q}`),
    '',
    '## 常见盲点',
    ...(domain.blindspots ?? []).map((x) => `- ${x}`),
  ].join('\n');
}

export function formatDeepScan(result) {
  return [
    result.notice,
    '',
    result.prompt,
    '',
    '---',
    '以上是检查清单/提示词，不是研究结论；请用数据、公式与原始文献逐项核验。',
  ].join('\n');
}
