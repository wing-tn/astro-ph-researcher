// astro-ph-researcher :: data method/instrument/workflow library tests
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.ASTRO_PH_RESEARCHER_HOME = join(tmpdir(), 'astro-ph-researcher-data-test');
const data = await import('../lib/data-library.js');

await data.initDataLibrary();
assert.ok(Array.isArray(data.listMethods({})));
assert.ok(data.listMethods({}).length >= 20);

const methods = data.listMethods({ q: '最小二乘' });
assert.ok(methods.length >= 1);
const method = methods[0];
assert.ok(method.principle.length > 10);
assert.ok(method.python?.code);
assert.match(data.formatMethod(method), /Python 示例/);

const instruments = data.listInstruments({ query: 'Chandra' });
assert.ok(instruments.length >= 1);
assert.ok(instruments[0].dataLinks.length >= 1);
assert.match(data.formatInstrument(instruments[0]), /数据\/获取/);

const workflow = data.saveWorkflow({
  instrumentId: instruments[0].id,
  name: 'Test workflow',
  notes: 'test note',
});
assert.equal(workflow.instrumentId, instruments[0].id);
assert.equal(data.listWorkflows().length, 1);
assert.equal(data.deleteWorkflow(workflow.id), true);
assert.equal(data.listWorkflows().length, 0);

console.log(`data library ok: ${data.listMethods({}).length} methods, ${data.dataStats().instruments} instruments`);
