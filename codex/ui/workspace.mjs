import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { Library, now } from './core.mjs';
import { SECTION_DEFS, createSections, setSection, scoreSection, buildConfirmation } from './sections.mjs';
import { noviceEnglish, deepEnglish } from './novice-en.mjs';

const text = (v, max = 50000) => String(v ?? '').slice(0, max);
const seed = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
export async function loadCatalog(lang = 'zh') {
  const [novice, goals, methods, instruments, books, journals, thesis, deep, tools, plan] = await Promise.all(['novice-path.seed', 'writing-goals.seed', 'data-methods.seed', 'instruments.seed', 'recommended-books.seed', 'journals.seed', 'thesis-formats.seed', 'deep-prompts.seed', 'research-tools.seed', 'research-plan-template'].map(seed));
  return {version: '3.4.0', sections: SECTION_DEFS, novice: lang === 'en' ? noviceEnglish : novice.steps, goals: goals.goals, methods: methods.methods,
    statistics: methods.statistics, instruments: instruments.instruments, books: books.books, journals: journals.journals, thesis: thesis.formats,
    deep: deep.domains.map(d => lang === 'en' ? {...d, name: deepEnglish[d.id]?.[0] || d.id, summary: deepEnglish[d.id]?.[1] || '', questions: deepEnglish[d.id]?.[2] || [], blindspots: []} : d), tools: tools.tools, catalogs: tools.catalogs, planTemplate: plan};
}
export class Workspace extends Library {
  constructor(path) { super(path); this.state = {version: 1, projects: [], novice: {completed: [], notes: {}}, plan: null, deepNotes: {}}; }
  async load() {
    try { const state = JSON.parse(await readFile(this.path, 'utf8')); if (state.version !== 1 || !Array.isArray(state.projects) || !state.novice || !state.deepNotes) throw new Error('Invalid workspace format / 工作区文件格式无效'); this.state = state; }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!this.state.plan) { const template = await seed('research-plan-template'); this.state.plan = {...template, updatedAt: now()}; }
  }
  createProject(input) {
    return this.change(s => {
      const title = text(input.title, 300).trim(); if (!title) throw new Error('Project title is required / 请填写项目标题');
      const project = {id: randomUUID(), title, type: input.type === 'thesis' ? 'thesis' : 'journal', language: ['en', 'zh', 'bilingual'].includes(input.language) ? input.language : 'en',
        goalId: text(input.goalId, 80), targetId: text(input.targetId, 100), question: '', materials: '', outline: '', sections: createSections(), referenceIds: [], createdAt: now(), updatedAt: now()};
      s.projects.push(project); return project;
    });
  }
  updateProject(id, input) {
    return this.change(s => {
      const p = s.projects.find(p => p.id === id); if (!p) throw new Error('Project not found / 找不到项目');
      for (const key of ['title', 'question', 'materials', 'outline', 'goalId', 'targetId']) if (input[key] !== undefined) p[key] = text(input[key], key === 'title' ? 300 : 50000);
      if (['en', 'zh', 'bilingual'].includes(input.language)) p.language = input.language;
      if (input.referenceIds !== undefined) { if (!Array.isArray(input.referenceIds)) throw new Error('Invalid reference selection'); p.referenceIds = [...new Set(input.referenceIds.map(x => text(x, 80)))].slice(0, 500); }
      if (input.sectionId !== undefined) p.sections = setSection(p.sections, input.sectionId, {content: text(input.content)});
      p.updatedAt = now(); return p;
    });
  }
  score(id, sectionId) {
    return this.change(s => {
      const p = s.projects.find(p => p.id === id), section = p?.sections[sectionId]; if (!section) throw new Error('Section not found');
      section.score = scoreSection({content: section.content, sectionId, goalId: p.goalId}); p.updatedAt = now(); return p;
    });
  }
  confirm(id, sectionId, input) {
    return this.change(s => {
      const p = s.projects.find(p => p.id === id), section = p?.sections[sectionId]; if (!section) throw new Error('Section not found');
      if (input.contentHash !== section.contentHash) throw new Error('Content changed; save and review again / 内容已变化，请保存后重新核对');
      if (!section.content.trim()) throw new Error('Empty sections cannot be confirmed / 空章节不能确认');
      section.confirmation = buildConfirmation({projectId: id, section, checklist: input.checklist, note: input.note, content: section.content});
      section.status = 'author_confirmed'; p.updatedAt = now(); return p;
    });
  }
  async novice(id, input) {
    const steps = (await loadCatalog()).novice, step = steps.find(x => x.id === id); if (!step) throw new Error('Unknown novice step');
    return this.change(s => {
      if (input.note !== undefined) s.novice.notes[id] = text(input.note, 10000);
      if (input.completed === true) {
        if (!Array.isArray(input.checks) || input.checks.length !== step.checklist.length || !input.checks.every(x => x === true)) throw new Error('Check every completion item / 请核对本步全部检查项');
        s.novice.completed = [...new Set([...s.novice.completed, id])];
      } else if (input.completed === false) s.novice.completed = s.novice.completed.filter(x => x !== id);
      s.novice.updatedAt = now(); return s.novice;
    });
  }
  updatePlan(input) {
    return this.change(s => {
      if (!Array.isArray(input.nodes) || input.nodes.length > 200) throw new Error('Invalid plan nodes / 计划节点无效');
      const nodes = input.nodes.map(n => ({id: text(n.id, 80), parentId: n.parentId ? text(n.parentId, 80) : null, title: text(n.title, 300), note: text(n.note, 10000), source: text(n.source, 2000), status: ['todo', 'doing', 'done'].includes(n.status) ? n.status : 'todo', phase: text(n.phase, 100)}));
      const ids = new Set(nodes.map(x => x.id)); if (ids.size !== nodes.length || nodes.some(x => !x.id || !x.title || (x.parentId && !ids.has(x.parentId)))) throw new Error('Plan IDs, titles or parent links invalid');
      for (const n of nodes) { const seen = new Set([n.id]); let parent = n.parentId; while (parent) { if (seen.has(parent)) throw new Error('Plan contains a cycle / 计划包含循环依赖'); seen.add(parent); parent = nodes.find(x => x.id === parent)?.parentId; } }
      s.plan = {version: '3.4.0', title: text(input.title, 300), goal: text(input.goal, 2000), nodes, updatedAt: now()}; return s.plan;
    });
  }
}
export function projectMarkdown(p, lang = 'en') {
  const en = lang === 'en';
  return `# ${p.title}\n\n${en ? 'Research question' : '研究问题'}: ${p.question}\n\n${en ? 'Goal / target / manuscript language' : '目标 / 期刊或学校 / 稿件语言'}: ${p.goalId} / ${p.targetId} / ${p.language}\n\n## ${en ? 'Materials supplied by the author' : '作者提供的材料'}\n\n${p.materials}\n\n## ${en ? 'Outline' : '提纲'}\n\n${p.outline}\n\n` + SECTION_DEFS.map(def => {
    const s = p.sections[def.id]; return `## ${en ? def.nameEn : def.nameZh}\n\n${s.content || (en ? '[Not drafted]' : '【尚未起草】')}\n\n> ${s.status}; ${en ? 'heuristic score' : '启发式评分'}: ${s.score?.overall ?? '—'}; ${en ? 'author confirmation' : '作者确认'}: ${s.confirmation?.confirmedAt || '—'}\n`;
  }).join('\n') + `\n## ${en ? 'Linked reading-list IDs' : '关联阅读清单编号'}\n\n${p.referenceIds.join('\n')}\n`;
}
export function writingPrompt(p, rows = [], lang = 'en') {
  const refs = rows.filter(r => p.referenceIds.includes(r.id));
  const sourceRows = refs.map(r => `- ${r.title}; DOI ${r.doi || 'not provided'}; arXiv ${r.arxivId || 'not provided'}; evidence ${r.evidence}; ${r.notes || ''}`).join('\n');
  const drafts = SECTION_DEFS.filter(d => p.sections[d.id].content.trim()).map(d => `### ${lang === 'en' ? d.nameEn : d.nameZh}\n${p.sections[d.id].content}`).join('\n\n');
  const draftContext = lang === 'zh' ? `\n\n作者已有草稿（未经科学核验）：\n${drafts || '尚未起草。'}` : `\n\nExisting author drafts (not scientifically validated):\n${drafts || 'No draft supplied.'}`;
  if (lang === 'zh') return `请使用 astro-ph-researcher 的天文英文期刊/学位论文写作规范协助以下项目。\n项目：${p.title}\n写作目标：${p.goalId}\n目标期刊/学校：${p.targetId}\n稿件语言：${p.language}\n科学问题：${p.question}\n作者材料：\n${p.materials}\n提纲：\n${p.outline}\n关联文献：\n${sourceRows || '未选择文献；不得编造引用。'}\n\n先指出数据、误差、方法或原始文献缺口，再逐节起草或修改。不得编造数值、DOI、样本或结论；缺失就标待补。分开原文陈述、作者推断与我的推断。正式格式以期刊/学校当年官方指南为准；逐节内容必须由作者核对确认。网页生成的是交接提示词，不是已完成的模型写作。${draftContext}`;
  return `Use $astro-ph-researcher:${p.type === 'thesis' ? 'astro-phd-thesis-writing' : 'astro-english-journal-writing'} for this project.\nProject: ${p.title}\nWriting goal: ${p.goalId}\nTarget journal/institution: ${p.targetId}\nManuscript language: ${p.language}\nResearch question: ${p.question}\nAuthor-supplied materials:\n${p.materials}\nOutline:\n${p.outline}\nLinked sources:\n${sourceRows || 'No sources selected. Do not invent citations.'}${draftContext}\n\nIdentify missing data, uncertainties, methods and primary references before drafting or revising sections. Never invent measurements, DOIs, samples or scientific conclusions. Mark missing inputs explicitly. Separate statements in sources, author inference and your own inference. Verify current official journal/institution instructions. Each section needs review and confirmation by the human author. This page produces a handoff prompt; it does not call a language model.`;
}
export function slidesMarkdown(workspace, rows, lang = 'en', title = '') {
  const en = lang === 'en';
  return `# ${title || (en ? 'Astronomy research briefing' : '天文研究汇报')}\n\n> ${en ? 'Outline only. Verify all numbers, citations and claims before producing slides.' : '仅为大纲；制作幻灯片前请核对全部数值、引用与结论。'}\n\n## ${en ? 'Scientific question' : '科学问题'}\n\n${workspace.plan.goal}\n\n## ${en ? 'Research plan' : '研究计划'}\n\n${workspace.plan.nodes.map(n => `- [${n.status}] ${n.title}: ${n.note}`).join('\n')}\n\n## ${en ? 'Literature and evidence' : '文献与证据'}\n\n${rows.slice(0, 12).map(r => `- ${r.title} (${r.year || ''}); DOI ${r.doi || '—'}; arXiv ${r.arxivId || '—'}; evidence ${r.evidence}\n  ${r.notes || ''}`).join('\n')}\n\n## ${en ? 'Results and uncertainties' : '结果与不确定性'}\n\n${en ? '[Author to supply: measurements, uncertainties, systematics and alternative explanations.]' : '【作者待补：测量值、不确定度、系统误差与替代解释。】'}\n\n## ${en ? 'Next steps' : '下一步'}\n\n${workspace.plan.nodes.filter(n => n.status !== 'done').map(n => `- ${n.title}`).join('\n')}\n`;
}
