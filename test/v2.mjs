// astro-ph-researcher v2 :: scoring, section workflow, author confirmation, libraries
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'astro-ph-researcher-v2-'));
process.env.ASTRO_PH_RESEARCHER_HOME = home;

const { createProject, getProject } = await import('../lib/writing.js');
const { createSections, setSection, scoreSection, buildConfirmation, sha256 } = await import('../lib/sections.js');
const { listFileFormats, getFileFormat, listPhysicsBooks, listRecommendedBooks, listResearchTools, listCatalogs, scoreLiterature } = await import('../lib/v2-library.js');
const { initWriting } = await import('../lib/writing.js');
const { initReferences } = await import('../lib/references.js');
const { initStore } = await import('../lib/store.js');

await initStore();
await initReferences();
await initWriting();

const project = createProject({ title: 'v2 test', type: 'journal', goalId: 'refutation', targetId: 'apj' });
assert.ok(project.sections.result || project.sections.results, 'default sections');
let sections = createSections(project.sections);
sections = setSection(sections, 'results', { content: 'We find no significant evidence in the stacked spectrum (3 sigma upper limit); Figure 1 and Table 2 give the error budget.' , status: 'author_editing' });
const score = scoreSection({ content: sections.results.content, sectionId: 'results', goalId: 'refutation' });
assert.ok(score.overall >= 0 && score.overall <= 100);
assert.equal(score.rubricVersion, 'section-v2.0');
sections = { ...sections, results: { ...sections.results, score } };
const confirmation = buildConfirmation({
  projectId: project.id,
  section: sections.results,
  content: sections.results.content,
  checklist: { numbersMatch: true, citationsVerified: true, claimsSupported: true, styleApplied: true },
  note: 'author checked',
});
assert.equal(confirmation.confirmedBy, 'author');
assert.equal(confirmation.contentHash, sha256(sections.results.content));
assert.throws(() => buildConfirmation({ projectId: project.id, section: sections.results, content: 'changed', checklist: { numbersMatch: true } }));

assert.ok(listFileFormats('fits').length > 0);
assert.match(getFileFormat('fermi-xml').what, /模型/);
assert.match(getFileFormat('fermi-xml').what, /不是事件/);
assert.ok(listPhysicsBooks('', 'grb').length > 0);
assert.ok(listResearchTools('3ml').length > 0);
assert.ok(listResearchTools('AM3').length > 0, 'AM3 alias');
assert.ok(listResearchTools('GENT4').length > 0, 'GENT4 alias');
assert.ok(listResearchTools('SED').length > 0, 'SED alias');
assert.ok(listCatalogs('fermi').length > 0);
assert.ok(listRecommendedBooks('').length >= 5);
assert.ok(listRecommendedBooks('赵永恒').length >= 1);
assert.equal(scoreLiterature({ id: 'x', title: 'Test', doi: '10.1/x', year: 2024, authors: ['A', 'B'], venue: 'ApJ', abstract: 'We use code and data. '.repeat(20) }).rubricVersion, 'literature-v2.0');

rmSync(home, { recursive: true, force: true });
console.log('v2 ok: sections/scoring/confirmation/libraries');
