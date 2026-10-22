// astro-ph-researcher :: host registration smoke test with a minimal mock Cordis ctx
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = await mkdtemp(join(tmpdir(), 'astro-ph-researcher-host-'));
process.env.ASTRO_PH_RESEARCHER_HOME = home;

const tools = new Map();
let route = null;
let disposed = false;

const ctx = {
  root: null,
  tools: {
    register(definition) {
      tools.set(definition.name, definition);
      return () => tools.delete(definition.name);
    },
  },
  webServer: {
    register(definition) {
      route = definition;
      return () => {
        route = null;
      };
    },
  },
  systemPrompt: {
    section() {
      return () => {};
    },
  },
  agents: {
    get() {
      return null;
    },
  },
  effect(fn) {
    const dispose = fn();
    return () => dispose?.();
  },
  on() {
    return () => {};
  },
};
ctx.root = ctx;

const { apply } = await import('../lib/index.js?host=' + Date.now());
const dispose = apply(ctx);

// wait for async initStore + registration
for (let i = 0; i < 50 && tools.size < 26; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

assert.equal(typeof route?.handler, 'function', 'route should be registered');
assert.deepEqual(
  [...tools.keys()].sort(),
  [
    'astro_author_status',
    'astro_data_instrument',
    'astro_data_method',
    'astro_data_workflow',
    'astro_dictionary',
    'astro_file_format',
    'astro_format_library',
    'astro_literature_analyze',
    'astro_literature_score',
    'astro_literature_search',
    'astro_physics_reference',
    'astro_reference_cite',
    'astro_reference_export',
    'astro_reference_list',
    'astro_reference_save',
    'astro_reference_update',
    'astro_research_guide',
    'astro_research_plan',
    'astro_section_workflow',
    'astro_term_list',
    'astro_term_lookup',
    'astro_term_save',
    'astro_thesis_format',
    'astro_writing_goal',
    'astro_writing_handoff',
    'astro_writing_project',
  ],
);

const analyze = tools.get('astro_literature_analyze');
const prompt = await analyze.execute({
  papers: [{ title: 'Test paper', doi: 'https://doi.org/10.1234/x', abstract: 'We test.', authors: ['A'], year: 2024 }],
  role: 'undergrad',
  focus: 'method',
});
assert.match(prompt, /Test paper/);
assert.match(prompt, /10\.1234\/x/);
assert.match(prompt, /本科生/);

const list = await tools.get('astro_term_list').execute({});
assert.match(list, /空的|共/);

const dictionary = await tools.get('astro_dictionary').execute({ action: 'status' });
assert.match(dictionary, /离线词表/);
assert.match(dictionary, /未安装|已安装/);

const savedReference = await tools.get('astro_reference_save').execute({
  paper: {
    title: 'Test reference',
    doi: 'https://doi.org/10.1234/host-smoke',
    authors: ['Alice Smith', 'Bob Jones'],
    journal: 'ApJ',
    volume: '1',
    pages: '1-2',
    year: 2024,
  },
  summary: 'A citable summary.',
  fields: ['cosmology'],
});
assert.match(savedReference, /已保存/);
const referenceList = await tools.get('astro_reference_list').execute({ query: 'Test reference' });
assert.match(referenceList, /Test reference/);
assert.match(referenceList, /cosmology/);

const dataMethod = await tools.get('astro_data_method').execute({ id: 'least-squares' });
assert.match(dataMethod, /最小二乘|加权最小二乘/);
assert.match(dataMethod, /Python 示例/);
assert.match(dataMethod, /LaTeX/);
const dataInstrument = await tools.get('astro_data_instrument').execute({ query: 'Chandra' });
assert.match(dataInstrument, /Chandra/);

// Exercise GET /health through the mock route.
function callHealth() {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = 'GET';
    req.url = '/api/astro-ph-researcher/health';
    req.socket = { remoteAddress: '127.0.0.1' };
    const chunks = [];
    const res = {
      headersSent: false,
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
        this.headersSent = true;
      },
      end(payload) {
        if (payload) chunks.push(Buffer.from(payload));
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: this.status, body: JSON.parse(text) });
        } catch (error) {
          reject(error);
        }
      },
    };
    route.handler(req, res).catch(reject);
  });
}

const createdProject = await tools.get('astro_writing_project').execute({ action: 'create', title: 'v2 route test', type: 'journal', goalId: 'refutation', targetId: 'apj' });
const projectId = /已创建项目：(\S+)/.exec(createdProject)?.[1];
assert.ok(projectId, 'project id');
const sectionsRes = await callJson('GET', `/api/astro-ph-researcher/writing/projects/${projectId}/sections`);
assert.equal(sectionsRes.status, 200);
assert.ok(sectionsRes.body.sections.results);
const draft = 'We find no significant evidence in the stacked spectrum (3 sigma upper limit); Figure 1 and Table 2 give the error budget.';
const patchRes = await callJson('PATCH', `/api/astro-ph-researcher/writing/projects/${projectId}/sections/results`, { content: draft, status: 'author_editing' });
assert.equal(patchRes.status, 200);
const scoreRes = await callJson('POST', `/api/astro-ph-researcher/writing/projects/${projectId}/sections/results/score`, { content: draft });
assert.equal(scoreRes.status, 200);
assert.ok(scoreRes.body.score.overall >= 0);
const confirmRes = await callJson('POST', `/api/astro-ph-researcher/writing/projects/${projectId}/sections/results/confirm`, { checklist: { numbersMatch: true, citationsVerified: true, claimsSupported: true, styleApplied: true } });
assert.equal(confirmRes.status, 200);
assert.equal(confirmRes.body.confirmation.confirmedBy, 'author');

const fileFormat = await tools.get('astro_file_format').execute({ action: 'get', id: 'fermi-xml' });
assert.match(fileFormat, /模型/);
assert.match(fileFormat, /不是事件/);
const physics = await tools.get('astro_physics_reference').execute({ action: 'list', domain: 'grb' });
assert.match(physics, /Gamma-Ray Bursts/);
const recommended = await tools.get('astro_physics_reference').execute({ action: 'recommended', query: '赵永恒' });
assert.match(recommended, /天文数据处理与虚拟天文台/);
assert.match(recommended, /非盈利/);
const plan = await tools.get('astro_research_plan').execute({ action: 'add', title: 'v3 plan smoke', phase: '测试' });
assert.match(plan, /v3 plan smoke/);
const guide = await tools.get('astro_research_guide').execute({ action: 'tool', id: '3ml' });
assert.match(guide, /3ML|ThreeML/);
const sectionList = await tools.get('astro_section_workflow').execute({ action: 'list', projectId });
assert.match(sectionList, /results/);
const authorStatus = await tools.get('astro_author_status').execute({ projectId });
assert.match(authorStatus, /已确认|author/);

const health = await callHealth();
assert.equal(health.status, 200);
assert.equal(health.body.ok, true);
assert.match(health.body.astrodict, /nadc\.china-vo\.org/);
assert.equal(health.body.assets.katex, true);
assert.equal(health.body.assets.version, '0.16.22');

function callRaw(path) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = 'GET';
    req.url = path;
    req.socket = { remoteAddress: '127.0.0.1' };
    const chunks = [];
    const res = {
      headersSent: false,
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
        this.headersSent = true;
      },
      end(payload) {
        if (payload) chunks.push(Buffer.from(payload));
        resolve({ status: this.status, headers: this.headers, body: Buffer.concat(chunks) });
      },
    };
    route.handler(req, res).catch(reject);
  });
}

const katexAsset = await callRaw('/api/astro-ph-researcher/assets/katex/katex.min.js');
assert.equal(katexAsset.status, 200);
assert.ok(katexAsset.body.length > 1000, 'KaTeX JS should be served');
assert.equal(katexAsset.headers['content-type'], 'text/javascript; charset=utf-8');

const denied = await new Promise((resolve) => {
  const req = new EventEmitter();
  req.method = 'GET';
  req.url = '/api/astro-ph-researcher/health';
  req.socket = { remoteAddress: '10.0.0.8' };
  const res = {
    writeHead(status) {
      this.status = status;
      this.headersSent = true;
    },
    end(payload) {
      resolve({ status: this.status, body: JSON.parse(Buffer.from(payload).toString('utf8')) });
    },
  };
  route.handler(req, res);
});
assert.equal(denied.status, 403);

function callJson(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = path;
    req.socket = { remoteAddress: '127.0.0.1' };
    req.headers = { 'content-type': 'application/json' };
    const chunks = [];
    const res = {
      headersSent: false,
      writeHead(status, headers) {
        this.status = status;
        this.headers = headers;
        this.headersSent = true;
      },
      end(payload) {
        if (payload) chunks.push(Buffer.from(payload));
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ status: this.status, body: JSON.parse(text) });
        } catch (error) {
          reject(error);
        }
      },
    };
    route.handler(req, res).catch(reject);
    if (body !== undefined) req.emit('data', Buffer.from(JSON.stringify(body)));
    req.emit('end');
  });
}

const steered = [];
ctx.agents.get = (id) => ({
  steer(message) {
    steered.push({ id, message });
  },
});

const analyzed = await callJson('POST', '/api/astro-ph-researcher/analyze', {
  type: 'term',
  sessionId: 'session-test',
  term: {
    en: 'redshift',
    zh: '红移',
    astrodictId: '16171',
    astrodictUrl: 'https://nadc.china-vo.org/astrodict/termdetails?id=16171',
    definition: '(1) 天体谱线的观测波长向长波方向频移的现象。',
    definitionSource: 'NADC《天文学名词（定义版）》',
    status: '已出版',
  },
});
assert.equal(analyzed.status, 200);
assert.equal(analyzed.body.ok, true);
assert.equal(steered.length, 1);
const steeredText = steered[0].message.content?.[0]?.text ?? '';
assert.match(steeredText, /NADC 审定定义/);
assert.match(steeredText, /16171/);
assert.match(steeredText, /非名词委原文/);

dispose();
disposed = true;
await new Promise((resolve) => setTimeout(resolve, 350));
await rm(home, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
console.log('host smoke ok', { tools: [...tools.keys()].length, disposed });
