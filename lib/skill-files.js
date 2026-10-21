// astro-ph-researcher :: load bundled SKILL.md files into the DSH skill registry
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function unquote(value) {
  const text = String(value ?? '').trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replace(/\\n/g, '\n').trim();
  }
  return text;
}

export function parseSkillFile(text) {
  const normalized = String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?/.exec(normalized);
  if (!match) return { name: '', description: '', content: normalized.trim(), frontmatter: {} };
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const keyValue = /^([A-Za-z][A-Za-z0-9_-]*):[ \t]*(.*)$/.exec(line.trim());
    if (!keyValue) continue;
    frontmatter[keyValue[1]] = unquote(keyValue[2]);
  }
  return {
    name: frontmatter.name ?? '',
    description: frontmatter.description ?? '',
    content: normalized.slice(match[0].length).trimStart(),
    frontmatter,
  };
}

export function loadSkillBundles(rootDir) {
  const bundles = [];
  let entries = [];
  try {
    entries = readdirSync(rootDir);
  } catch {
    return bundles;
  }
  for (const entry of entries.sort()) {
    const dir = join(rootDir, entry);
    let stat = null;
    try {
      stat = statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    try {
      const text = readFileSync(join(dir, 'SKILL.md'), 'utf8');
      const parsed = parseSkillFile(text);
      if (!parsed.name || !parsed.description || !parsed.content) continue;
      bundles.push({ ...parsed, dir });
    } catch {
      // A directory without SKILL.md is not a skill bundle.
    }
  }
  return bundles;
}

export function registerSkills(ctx, rootDir) {
  const skills = ctx?.skills;
  if (!skills || typeof skills.register !== 'function') {
    return { registered: [], skipped: 'skills service unavailable' };
  }
  const registered = [];
  for (const bundle of loadSkillBundles(rootDir)) {
    try {
      const dispose = skills.register({
        name: bundle.name,
        description: bundle.description,
        content: bundle.content,
        resourceBase: { kind: 'directory', path: bundle.dir },
        source: 'runtime',
      });
      registered.push({ name: bundle.name, dispose });
    } catch {
      // A duplicate name from another provider should not break the plugin.
    }
  }
  return { registered };
}
