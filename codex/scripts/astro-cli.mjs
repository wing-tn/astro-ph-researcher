#!/usr/bin/env node
// Local, offline query CLI for the Codex distribution of astro-ph-researcher.
// It reads only ./data/*.json; no network, no credentials.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

function readJson(name) {
  try {
    return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
  } catch (error) {
    console.error(`Cannot read data/${name}: ${error.message}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const json = args.includes('--json');
const idIndex = args.indexOf('--id');
const id = idIndex >= 0 ? args[idIndex + 1] : '';
const positional = args.filter((arg, index) => !arg.startsWith('--') && (index === 0 || index - 1 !== idIndex));
const command = positional[0] ?? 'stats';
const query = positional.slice(1).join(' ').trim();
const norm = (value) => String(value ?? '').toLowerCase();

function matches(text, needle) {
  return !needle || norm(text).includes(norm(needle));
}

function line(label, value) {
  return value ? `${label}: ${value}` : '';
}

function output(value, text) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(text);
  }
}

function terms() {
  const data = readJson('terms.seed.json');
  return data.terms ?? data;
}

function methods() {
  return readJson('data-methods.seed.json');
}

function instruments() {
  return readJson('instruments.seed.json').instruments ?? [];
}

function journals() {
  return readJson('journals.seed.json').journals ?? [];
}

function thesisFormats() {
  return readJson('thesis-formats.seed.json').formats ?? [];
}

function recommendedBooks() {
  return readJson('recommended-books.seed.json').books ?? [];
}

function writingGoals() {
  return readJson('writing-goals.seed.json').goals ?? [];
}

function printTerm(term) {
  return [
    `${term.en ?? term.key} → ${term.zh ?? ''}`,
    line('领域', term.field),
    line('NADC id', term.astrodictId),
    line('状态', term.status),
    line('词条', term.astrodictUrl),
    term.definition ? `NADC 定义: ${term.definition}` : '',
    term.explanation ? `DSH 释义: ${term.explanation}` : '',
  ].filter(Boolean).join('\n');
}

function printMethod(method) {
  const lines = [
    `${method.name}（第 ${method.chapter} 章 · ${method.category}）`,
    `原理: ${method.principle}`,
    method.formula ? `公式: ${method.formula}` : '',
    method.assumptions?.length ? `假设:\n${method.assumptions.map((item) => `- ${item}`).join('\n')}` : '',
    method.steps?.length ? `步骤:\n${method.steps.map((item, index) => `${index + 1}. ${item}`).join('\n')}` : '',
    method.python?.code ? `Python 示例（独立实现）:\n\`\`\`python\n${method.python.code}\n\`\`\`` : '',
    method.pitfalls?.length ? `常见坑:\n${method.pitfalls.map((item) => `- ${item}`).join('\n')}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function printInstrument(item) {
  const lines = [
    `${item.name}（${item.id}）`,
    `状态: ${item.status} · 数据政策: ${item.openPolicy} · 波段: ${item.waveband ?? ''}`,
    line('运营', `${item.operator ?? ''}${item.country ? ` (${item.country})` : ''}`),
    item.description ? `简介: ${item.description}` : '',
    item.dataLinks?.length ? `数据:\n${item.dataLinks.map((link) => `- ${link.label}: ${link.url}`).join('\n')}` : '',
    item.analysisLinks?.length ? `分析/文档:\n${item.analysisLinks.map((link) => `- ${link.label}: ${link.url}`).join('\n')}` : '',
    item.software?.length ? `软件:\n${item.software.map((sw) => `- ${sw.name}${sw.openSource ? '（开源）' : '（闭源）'}: ${sw.url}`).join('\n')}` : '',
    item.workflow?.length ? `建议工作流:\n${item.workflow.map((step, index) => `${index + 1}. ${step}`).join('\n')}` : '',
    item.advice ? `建议: ${item.advice}` : '',
    item.notes ? `备注: ${item.notes}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function printJournal(item) {
  return [
    `${item.abbrev} · ${item.name}`,
    line('出版社', item.publisher),
    line('范围', item.scope),
    line('主页', item.homepage),
    line('作者指南', item.authorGuidelines),
    line('Overleaf 模板', item.overleafTemplate),
    line('引用风格', item.citationStyle),
    line('语言', item.language),
    line('验证', item.verified ? 'verified' : '未验证（以官方页面为准）'),
  ].filter(Boolean).join('\n');
}

function printThesis(item) {
  return [
    `${item.university} · ${item.yearVersion}`,
    line('院系', item.department),
    line('学位', item.degree),
    line('规范', item.url),
    line('引用标准', item.citationStandard),
    line('模板', item.templateUrl),
    line('验证', item.verified ? 'verified' : '未验证（以学校官方文件为准）'),
    item.notes ? `备注: ${item.notes}` : '',
  ].filter(Boolean).join('\n');
}

function printRecommended(book) {
  return [
    `${book.title}${book.year ? ` (${book.year})` : ''}`,
    `作者: ${(book.authors ?? []).join('、')}`,
    line('出版', book.publisher),
    line('ISBN', book.isbn),
    line('领域', book.domain),
    `推荐理由: ${book.why}`,
    book.verified ? '' : '元数据待核验：版次/ISBN 以出版社为准。',
    '仅书目元数据；版权归作者/出版社；非盈利；侵权联系 1253932197@qq.com 删除。',
  ].filter(Boolean).join('\n');
}

function printGoal(goal) {
  return [
    `${goal.nameZh}（${goal.nameEn}） · ${goal.id}`,
    `何时用: ${goal.whenToUse}`,
    `姿态: ${goal.coreStance}`,
    `证据: ${goal.evidenceThreshold.join('；')}`,
    `标题: ${goal.titlePatterns.join(' / ')}`,
    `摘要: ${goal.abstractMoves.join(' → ')}`,
    `期刊: ${goal.journalFit.join(' / ')}`,
    `提示词: ${goal.prompt}`,
  ].join('\n');
}

if (command === 'stats') {
  const m = methods();
  const i = instruments();
  output(
    {
      methods: m.methods?.length ?? 0,
      statistics: m.statistics?.length ?? 0,
      instruments: i.length,
      journals: journals().length,
      thesisFormats: thesisFormats().length,
      recommended: recommendedBooks().length,
    },
    [
      `method: ${m.methods?.length ?? 0}`,
      `statistics: ${m.statistics?.length ?? 0}`,
      `instruments: ${i.length}`,
      `journals: ${journals().length}`,
      `thesis: ${thesisFormats().length}`,
      `recommended: ${recommendedBooks().length}`,
    ].join('\n'),
  );
} else if (command === 'term') {
  const rows = terms().filter((term) => matches([term.en, term.zh, term.key, term.field, ...(term.aliases ?? [])].join(' '), query));
  output(rows, rows.length ? rows.map(printTerm).join('\n\n---\n\n') : 'no matching term');
} else if (command === 'method' || command === 'statistics') {
  const data = methods();
  const pool = command === 'statistics' ? data.statistics ?? [] : data.methods ?? [];
  const rows = id ? pool.filter((item) => item.id === id) : pool.filter((item) => matches([item.name, item.principle, item.formula, item.category, item.statement, item.use].join(' '), query));
  output(rows, rows.length ? rows.map((item) => (command === 'statistics' ? `${item.name}\n${item.statement}\n用途: ${item.use}\n${item.python ?? ''}` : printMethod(item))).join('\n\n---\n\n') : 'no matching method/statistics');
} else if (command === 'instrument') {
  const pool = instruments();
  const rows = id ? pool.filter((item) => item.id === id) : pool.filter((item) => matches([item.name, item.id, item.operator, item.waveband, item.description, item.country].join(' '), query));
  output(rows, rows.length ? rows.map(printInstrument).join('\n\n---\n\n') : 'no matching instrument');
} else if (command === 'journal') {
  const rows = journals().filter((item) => matches([item.name, item.abbrev, item.publisher, item.scope].join(' '), query));
  output(rows, rows.length ? rows.map(printJournal).join('\n\n---\n\n') : 'no matching journal');
} else if (command === 'thesis') {
  const rows = thesisFormats().filter((item) => matches([item.university, item.department, item.yearVersion, item.degree].join(' '), query));
  output(rows, rows.length ? rows.map(printThesis).join('\n\n---\n\n') : 'no matching thesis format');
} else if (command === 'recommended' || command === 'books') {
  const rows = recommendedBooks().filter((item) => matches([item.id, item.title, ...(item.authors ?? []), item.publisher, item.domain].join(' '), query));
  output(rows, rows.length ? rows.map(printRecommended).join('\n\n---\n\n') : 'no matching recommended book');
} else if (command === 'goal' || command === 'style') {
  const rows = id ? writingGoals().filter((item) => item.id === id) : writingGoals().filter((item) => matches([item.id, item.nameZh, item.nameEn, ...(item.aliases ?? [])].join(' '), query));
  output(rows, rows.length ? rows.map(printGoal).join('\n\n---\n\n') : 'no matching writing goal');
} else {
  console.error('usage: node scripts/astro-cli.mjs [stats|term|method|statistics|instrument|journal|thesis|goal|recommended] [query] [--json] [--id ID]');
  process.exit(2);
}
