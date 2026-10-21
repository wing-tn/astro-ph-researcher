// astro-ph-researcher :: bundled SKILL.md discovery/registration tests
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const { loadSkillBundles, parseSkillFile, registerSkills } = await import('../lib/skill-files.js');
const skillsDir = fileURLToPath(new URL('../skills/', import.meta.url));

const bundles = loadSkillBundles(skillsDir);
assert.deepEqual(
  bundles.map((bundle) => bundle.name).sort(),
  ['astro-code-writing', 'astro-critical-writing', 'astro-discovery-writing', 'astro-english-journal-writing', 'astro-incremental-method-writing', 'astro-literature-research', 'astro-phd-thesis-writing', 'astro-research-workflow',
  'astro-writing-goals'],
);
for (const bundle of bundles) {
  assert.ok(bundle.description.length > 10);
  assert.ok(bundle.content.length > 1000);
  assert.match(bundle.content, /^#/m);
}

const parsed = parseSkillFile(`---\nname: test-skill\ndescription: "A test skill"\nwhenToUse: test\n---\n\n# Body\n`);
assert.equal(parsed.name, 'test-skill');
assert.equal(parsed.description, 'A test skill');
assert.match(parsed.content, /# Body/);

const registered = [];
const result = registerSkills(
  {
    skills: {
      register(definition) {
        registered.push(definition);
        return () => {};
      },
    },
  },
  skillsDir,
);
assert.equal(result.registered.length, 9);
assert.equal(registered.length, 9);
assert.ok(registered.every((definition) => definition.name.startsWith('astro-')));
assert.ok(registered.every((definition) => definition.resourceBase?.kind === 'directory'));

console.log(`skills ok: ${bundles.length} bundles registered`);
