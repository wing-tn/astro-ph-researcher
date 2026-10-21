// astro-ph-researcher :: formula rendering contract test (KaTeX + assets + client wiring)
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const katexCtx = { window: {}, document: { createElement: () => ({}), head: { appendChild: () => {} } }, navigator: { userAgent: '' }, console };
katexCtx.globalThis = katexCtx;
katexCtx.self = katexCtx;
vm.createContext(katexCtx);
vm.runInContext(readFileSync(resolve(root, 'assets/katex/katex.min.js'), 'utf8'), katexCtx);
const katex = katexCtx.katex;
assert.ok(katex?.renderToString, 'KaTeX should load');

const methods = JSON.parse(readFileSync(resolve(root, 'data/data-methods.seed.json'), 'utf8'));
const terms = JSON.parse(readFileSync(resolve(root, 'data/terms.seed.json'), 'utf8'));
const formulas = [
  ...methods.methods.map((item) => ['method:' + item.id, item.formulaLatex]),
  ...methods.statistics.map((item) => ['stat:' + item.id, item.formulaLatex]),
  ...terms.terms.map((item) => ['term:' + item.en, item.formulaLatex]),
].filter(([, latex]) => latex);
assert.ok(formulas.length >= 40, 'should cover methods, statistics and terms');
for (const [id, latex] of formulas) {
  assert.doesNotThrow(() => katex.renderToString(latex, { displayMode: true, throwOnError: true, strict: 'ignore' }), id);
}

for (const file of ['assets/katex/katex.min.js', 'assets/katex/katex.min.css', 'assets/katex/fonts/KaTeX_Main-Regular.woff2']) {
  assert.equal(existsSync(resolve(root, file)), true, file);
}
const client = readFileSync(resolve(root, 'lib/client.js'), 'utf8');
for (const marker of ['function ensureKatex', 'function Formula', '复制 LaTeX', '查看/粘贴 LaTeX', 'katexPromise = null']) {
  assert.match(client, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
console.log(`formula UI contract ok: ${formulas.length} formulas`);
