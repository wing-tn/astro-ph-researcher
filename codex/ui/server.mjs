import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Literature, Library, exportLibrary, now } from './core.mjs';
import { Workspace, loadCatalog, projectMarkdown, writingPrompt, slidesMarkdown } from './workspace.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
export async function createApp({dataPath = resolve(ROOT, 'local-data/library.json'), workspacePath = join(dirname(dataPath), 'workbench.json'), literature = new Literature()} = {}) {
  const library = new Library(dataPath); await library.load();
  const workspace = new Workspace(workspacePath); await workspace.load();
  const candidates = new Map();
  const remember = rows => { for (const x of rows) candidates.set(x.id, x); while (candidates.size > 5000) candidates.delete(candidates.keys().next().value); };
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host, localPort = server.address()?.port;
    const allowedHosts = [`127.0.0.1:${localPort}`, `localhost:${localPort}`];
    const headers = {'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'"};
    const reply = (code, value, type = 'application/json; charset=utf-8', extra = {}) => { res.writeHead(code, {...headers, 'Content-Type': type, ...extra}); res.end(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)); };
    try {
      if (!allowedHosts.includes(host)) return reply(403, {error: 'Host 不允许'});
      if (req.headers.origin && !allowedHosts.map(h => `http://${h}`).includes(req.headers.origin)) return reply(403, {error: '不允许跨站请求'});
      if (req.headers['sec-fetch-site'] === 'cross-site') return reply(403, {error: '不允许跨站请求'});
      const url = new URL(req.url, `http://${host}`), path = url.pathname;
      let body = {};
      if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') return reply(415, {error: '需要 application/json'});
        let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 100000) return reply(413, {error: '请求过大'}); }
        body = text ? JSON.parse(text) : {};
      }
      if (path === '/api/health' && req.method === 'GET') return reply(200, {ok: true, appId: 'astro-ph-researcher', version: '3.4.0', dataPath, workspacePath, counts: {items: library.state.items.length, searches: library.state.searches.length, projects: workspace.state.projects.length}});
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'zh';
      if (path === '/api/catalog' && req.method === 'GET') return reply(200, await loadCatalog(lang));
      if (path === '/api/workspace' && req.method === 'GET') return reply(200, workspace.state);
      if (path === '/api/projects' && req.method === 'POST') return reply(200, await workspace.createProject(body));
      const projectRoute = path.match(/^\/api\/projects\/([a-f0-9-]{36})(?:\/(score|confirm|prompt|export))?$/);
      if (projectRoute) {
        const [, id, operation] = projectRoute;
        const project = workspace.state.projects.find(p => p.id === id);
        if (!project) return reply(404, {error: 'Project not found / 找不到项目'});
        if (!operation && req.method === 'PATCH') return reply(200, await workspace.updateProject(id, body));
        if (operation === 'score' && req.method === 'POST') return reply(200, await workspace.score(id, body.sectionId));
        if (operation === 'confirm' && req.method === 'POST') return reply(200, await workspace.confirm(id, body.sectionId, body));
        if (operation === 'prompt' && req.method === 'GET') return reply(200, {prompt: writingPrompt(project, library.state.items, lang)});
        if (operation === 'export' && req.method === 'GET') return reply(200, projectMarkdown(project, lang), 'text/markdown; charset=utf-8', {'Content-Disposition': 'attachment; filename="manuscript.md"'});
      }
      const noviceRoute = path.match(/^\/api\/beginner\/([a-z-]+)$/);
      if (noviceRoute && req.method === 'POST') return reply(200, await workspace.novice(noviceRoute[1], body));
      if (path === '/api/plan' && req.method === 'PATCH') return reply(200, await workspace.updatePlan(body));
      if (path === '/api/deep' && req.method === 'PATCH') {
        if (!(await loadCatalog()).deep.some(d => d.id === body.id)) return reply(400, {error: 'Unknown domain'});
        await workspace.change(s => { s.deepNotes[body.id] = String(body.note || '').slice(0, 20000); }); return reply(200, {ok: true});
      }
      if (path === '/api/slides' && req.method === 'GET') return reply(200, slidesMarkdown(workspace.state, library.state.items, lang, url.searchParams.get('title')), 'text/markdown; charset=utf-8', {'Content-Disposition': 'attachment; filename="research-briefing.md"'});
      if (path === '/api/backup' && req.method === 'GET') return reply(200, {version: '3.4.0', exportedAt: now(), library: library.state, workspace: workspace.state}, 'application/json; charset=utf-8', {'Content-Disposition': 'attachment; filename="astro-workbench-backup.json"'});
      if (path === '/api/statements' && req.method === 'GET') return reply(200, await readFile(join(ROOT, '../DISCLAIMER.md'),'utf8'), 'text/markdown; charset=utf-8', {'Content-Disposition':'attachment; filename="PROJECT-STATEMENTS.md"'});
      if (path === '/api/library' && req.method === 'GET') return reply(200, library.state);
      if (path === '/api/search' && req.method === 'POST') {
        const result = await literature.search(body); remember(result.results);
        await library.change(state => { state.searches.push(...result.snapshots); state.searches = state.searches.slice(-500); });
        return reply(200, result);
      }
      if (path === '/api/verify' && req.method === 'POST') {
        const result = await literature.verify(body.identifier);
        if (result.item) {
          remember([result.item]);
          // Refresh a saved item only when its own identifier matches the registry response.
          const matched = library.state.items.find(x => result.kind === 'doi' ? x.doi === result.item.doi : x.arxivId?.replace(/v\d+$/, '') === result.item.arxivId?.replace(/v\d+$/, ''));
          if (matched) await library.save(result.item);
        }
        return reply(200, result);
      }
      if (path === '/api/library' && req.method === 'POST') {
        const row = candidates.get(body.id); if (!row) return reply(400, {error: '请先检索或核验，再保存题录'});
        return reply(200, await library.save(row));
      }
      const match = path.match(/^\/api\/library\/([a-f0-9]{16})$/);
      if (match && req.method === 'PATCH') return reply(200, await library.patch(match[1], body));
      if (match && req.method === 'DELETE') {
        await library.change(state => { state.items = state.items.filter(x => x.id !== match[1]); }); return reply(200, {ok: true});
      }
      if (path === '/api/export' && req.method === 'GET') {
        const format = url.searchParams.get('format') || 'json';
        const extensions = {json: 'json', bibtex: 'bib', markdown: 'md'};
        if (!extensions[format]) return reply(400, {error: '不支持的导出格式'});
        const ids = url.searchParams.get('ids')?.split(',').filter(Boolean);
        return reply(200, exportLibrary(library.state, format, ids), format === 'json' ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', {'Content-Disposition': `attachment; filename="astro-reading-list.${extensions[format]}"`});
      }
      if (path === '/api/terms' && req.method === 'GET') {
        const seed = JSON.parse(await readFile(join(ROOT, '../data/terms.seed.json'), 'utf8'));
        const q = (url.searchParams.get('q') || '').toLowerCase();
        return reply(200, {source: seed.source, terms: seed.terms.filter(x => JSON.stringify(x).toLowerCase().includes(q)).slice(0, 30)});
      }
      const files = {'/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/i18n.js': ['i18n.js', 'text/javascript; charset=utf-8'], '/notices.js':['notices.js','text/javascript; charset=utf-8'], '/workbench.js': ['workbench.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8']};
      if (req.method === 'GET' && files[path]) { const [file, type] = files[path]; return reply(200, await readFile(join(ROOT, 'public', file)), type); }
      return reply(404, {error: '未找到'});
    } catch (e) { reply(400, {error: e.message || '请求失败'}); }
  });
  return {server, library, workspace};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--port'); const port = index >= 0 ? Number(process.argv[index + 1]) : 4317;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('端口无效');
  const {server} = await createApp({dataPath: process.env.ASTRO_UI_LIBRARY || resolve(ROOT, 'local-data/library.json')});
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? '端口已占用，请添加 --port 4318' : error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Astro literature UI: http://127.0.0.1:${server.address().port}\nLibrary: ${process.env.ASTRO_UI_LIBRARY || resolve(ROOT, 'local-data/library.json')}\nStarted: ${now()}`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { server.close(); server.closeIdleConnections(); });
}
