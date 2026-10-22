// astro-ph-researcher :: PPT bridge (compose Markdown for the installed dsh-ppt skill)
import { getPlan } from './plans.js';
import { deepMeta } from './deep-library.js';
import { noviceMeta } from './novice.js';
import { listReferences } from './references.js';

function clip(text, n = 120) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function referenceRows(limit = 10) {
  return listReferences({ limit }).map((item) => {
    const authors = (item.authors ?? []).slice(0, 3).join('、');
    const year = item.year ? ` (${item.year})` : '';
    const venue = item.venue ? ` · ${item.venue}` : '';
    const key = (item.keyResults ?? [])[0] || item.summary || '';
    return `- **${item.title}**${year}${authors ? `\n  - ${authors}${venue}` : ''}${key ? `\n  - 要点：${clip(key, 220)}` : ''}${item.doi ? `\n  - DOI: ${item.doi}` : ''}`;
  });
}

function planOutline(plan) {
  const nodes = plan?.nodes ?? [];
  const byParent = new Map();
  for (const node of nodes) {
    const key = node.parentId ?? '';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(node);
  }
  const walk = (parent, depth = 0) => (byParent.get(parent ?? '') ?? []).flatMap((node) => [
    `${'  '.repeat(depth)}- [${node.status}] ${node.title}${node.phase ? `（${node.phase}）` : ''}${node.note ? `：${clip(node.note, 100)}` : ''}`,
    ...walk(node.id, depth + 1),
  ]);
  return walk(null);
}

export async function composePpt({ sources = ['references', 'plan', 'deep'], title = '天文研究报告', theme = 'data', lang = 'zh', limit = 12 } = {}) {
  const selected = new Set(Array.isArray(sources) ? sources : String(sources ?? '').split(','));
  const plan = await getPlan();
  const refs = selected.has('references') ? referenceRows(8) : [];
  const planLines = selected.has('plan') ? planOutline(plan) : [];
  const domains = selected.has('deep') ? deepMeta().domains.slice(0, 4) : [];
  const novice = selected.has('novice') ? noviceMeta().steps.slice(0, 5) : [];
  const lines = [
    `# ${title}`,
    '',
    '> 由 astro-ph-researcher 汇总；数字、引用、结论须由作者核验，不允许编造。',
    '',
    '## 一句话贡献',
    '请作者填写：本报告要回答的科学问题与一句话结论。',
    '',
  ];
  if (refs.length) {
    lines.push('## 收藏文章 / 证据链', ...refs, '');
  }
  if (planLines.length) {
    lines.push('## 研究计划树', ...planLines, '');
  }
  if (domains.length) {
    lines.push('## 跨学科检查', '| 领域 | 要检查的问题 |', '| --- | --- |', ...domains.map((d) => `| ${d.name} | ${clip((d.questions ?? [])[0] ?? d.summary, 100)} |`), '');
  }
  if (novice.length) {
    lines.push('## 新手路径 / 下一步', ...novice.map((s) => `- ${s.title}：${clip(s.deliverable, 100)}`), '');
  }
  lines.push('## 结果与不确定性', '- 统计误差 / 系统误差 / 选择效应 / 模型简并分别是什么？', '- 哪些结论是数据支持的，哪些只是推测？', '', '## 下一步', '- 补数据/基准测试', '- 完成误差预算', '- 核对引用与许可', '- 按目标期刊作者指南检查', '- 作者确认后投稿', '');
  const markdown = lines.join('\n');
  const prompt = [
    `请使用 DSH 已安装的 PPT 插件（dsh-ppt 或 dsh-ppt-maker）把下面的 Markdown 生成一份 8–12 页、可编辑的演示文稿。`,
    `主题/theme：${theme}；语言：${lang === 'en' ? 'English' : '中文'}。`,
    '要求：',
    '1. 先检查来源；不得编造数据、DOI、作者、引用或结论；',
    '2. 一页只讲一个核心信息，图表/引用要可追溯；',
    '3. 每个数字/结论标注来源，缺失就写“待补”；',
    '4. 生成后做一次视觉/质量检查，并告诉用户文件路径；',
    '5. 不要把“草稿/待补”当成最终稿。',
    '',
    'Markdown 内容：',
    markdown,
  ].join('\n');
  return { title, theme, lang, sources: [...selected], markdown, prompt, slideCount: 8 + (refs.length ? 1 : 0) + (planLines.length ? 1 : 0) + (domains.length ? 1 : 0) };
}

export function pptLinks() {
  return [
    { name: 'dsh-ppt', url: 'https://github.com/STARDUSTLC666/dsh-ppt', note: 'HTML + 可编辑 PPTX + 质量检查' },
    { name: 'dsh-ppt-maker', url: 'https://github.com/OMSociety/dsh-ppt-maker', note: '另一种 PPT 生成工作流' },
  ];
}
