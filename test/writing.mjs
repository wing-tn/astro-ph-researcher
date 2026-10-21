// astro-ph-researcher :: writing studio tests (local only)
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.ASTRO_PH_RESEARCHER_HOME = join(tmpdir(), 'astro-ph-researcher-writing-test');
const writing = await import('../lib/writing.js');

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

test('creates a journal project with target and prompt context', async () => {
  await writing.initWriting();
  const project = writing.createProject({
    title: 'A test paper',
    type: 'journal',
    language: 'en',
    targetId: 'apj',
    goalId: 'refutation',
    styleNotes: 'US English; ApJ letters style.',
  });
  assert.equal(project.type, 'journal');
  assert.equal(project.language, 'en');
  const prompt = writing.buildProjectPrompt(project, {
    mode: 'outline',
    references: [{ title: 'Ref one', journal: 'ApJ', year: 2024, doi: 'https://doi.org/10.1/x', summary: 'A summary' }],
  });
  assert.match(prompt, /A test paper/);
  assert.match(prompt, /ApJ/);
  assert.match(prompt, /Ref one/);
  assert.match(prompt, /候选标题/);
  assert.match(prompt, /refutation|批判|反驳/);
});

test('uploads text and base64 files and includes previews', async () => {
  const project = writing.listProjects()[0];
  const result = await writing.addProjectFiles(project.id, [
    { name: 'results.csv', type: 'text/csv', content: 'z,m\n0.1,20\n', encoding: 'utf8' },
    { name: 'figure.png', type: 'image/png', content: Buffer.from('fakepng').toString('base64'), encoding: 'base64' },
  ]);
  assert.equal(result.added.length, 2);
  assert.equal(result.project.files.length, 2);
  const prompt = writing.buildProjectPrompt(result.project, { mode: 'analyze' });
  assert.match(prompt, /results\.csv/);
  assert.match(prompt, /z,m/);
  assert.match(prompt, /figure\.png/);
});

test('adds a custom thesis format and exports a format pack', async () => {
  const format = writing.addCustomThesisFormat({
    university: '测试大学',
    department: '天文系',
    yearVersion: '2025 版',
    citationStandard: 'GB/T 7714-2015',
    url: 'https://example.edu/format',
  });
  assert.equal(format.custom, true);
  assert.equal(format.university, '测试大学');
  const pack = writing.exportFormatPack();
  assert.ok(Array.isArray(pack.journals));
  assert.ok(pack.customFormats.some((item) => item.id === format.id));
});

test('updates and deletes a project', async () => {
  const project = writing.listProjects()[0];
  const updated = writing.updateProject(project.id, { outline: '1. Intro\n2. Methods' });
  assert.match(updated.outline, /Intro/);
  assert.equal(writing.deleteProject(updated.id), true);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL - ${name}`);
    console.error(error);
  }
}
if (failed) {
  console.error(`\n${failed}/${tests.length} tests failed`);
  process.exit(1);
}
console.log(`\n${tests.length}/${tests.length} tests passed`);
