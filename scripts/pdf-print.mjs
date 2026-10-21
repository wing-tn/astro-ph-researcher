import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const edge = String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
const root = String.raw`F:\dsh插件\astro-ph-researcher-2.0\presentation`;
const profile = String.raw`C:\Users\12539\AppData\Local\Temp\astro-ph-researcher-v2-edge-profile`;
for (let i = 1; i <= 12; i += 1) {
  const n = String(i).padStart(2, '0');
  const html = `${root}\\print-slides\\slide-${n}.html`;
  const pdf = `${root}\\print-slides\\slide-${n}.pdf`;
  const result = spawnSync(edge, [
    '--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--disable-javascript',
    `--user-data-dir=${profile}`, '--no-pdf-header-footer', `--print-to-pdf=${pdf}`,
    `file:///F:/dsh插件/astro-words/presentation/print-slides/slide-${n}.html`,
  ], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0 || !existsSync(pdf)) {
    console.error(`slide ${n} failed`, result.error ?? result.stderr ?? result.status);
    process.exit(1);
  }
}
console.log('printed 12 slides');
