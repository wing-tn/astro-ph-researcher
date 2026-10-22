import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Workspace,loadCatalog,projectMarkdown,writingPrompt,slidesMarkdown} from '../workspace.mjs';
import {createApp} from '../server.mjs';
import {strings} from '../public/i18n.js';

test('catalog preserves all libraries and English learning checklist parity',async()=>{
  const [zh,en]=await Promise.all([loadCatalog('zh'),loadCatalog('en')]);
  assert.equal(zh.novice.length,9);assert.equal(en.novice.length,9);assert.equal(en.goals.length,10);assert.equal(en.methods.length,34);assert.equal(en.statistics.length,9);assert.equal(en.instruments.length,30);
  for(const step of zh.novice){const translated=en.novice.find(s=>s.id===step.id);assert.equal(translated.checklist.length,step.checklist.length);assert.doesNotMatch(translated.title,/[\u4e00-\u9fff]/);}
  assert.equal(en.deep.length,9);assert.equal(en.sections.length,10);
  for(const[key,pair]of Object.entries(strings)){assert.equal(pair.length,2,key);assert.ok(pair.every(x=>typeof x==='string'&&x.trim()),key);}
  for(const v of ['search','library','writing','plan','beginner','resources','deep','slides','verify','terms','history','settings'])assert.ok(strings[v]&&strings[v+'Title']&&strings[v+'Desc']);
});
test('writing saves, scores and confirms a section; changing text invalidates confirmation and score',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'astro-writing-'));try{
    const w=new Workspace(join(dir,'workbench.json'));await w.load();const p=await w.createProject({title:'Interface test; no scientific result',language:'en',goalId:'method-software'});
    let updated=await w.updateProject(p.id,{question:'A reproducibility check',sectionId:'abstract',content:'We describe a public code pipeline and state its assumptions. This is a test draft without scientific measurements.'});
    await w.score(p.id,'abstract');assert.equal(w.state.projects[0].sections.abstract.score.source,'heuristic');
    await assert.rejects(w.confirm(p.id,'abstract',{contentHash:'stale',checklist:{}}));
    await assert.rejects(w.confirm(p.id,'abstract',{contentHash:updated.sections.abstract.contentHash,checklist:{numbersMatch:true}}));
    updated=await w.confirm(p.id,'abstract',{contentHash:updated.sections.abstract.contentHash,checklist:{numbersMatch:true,citationsVerified:true,claimsSupported:true,styleApplied:true}});assert.equal(updated.sections.abstract.confirmation.confirmedBy,'author');
    updated=await w.updateProject(p.id,{sectionId:'abstract',content:'Revised text requiring new author review.'});assert.equal(updated.sections.abstract.confirmation,null);assert.equal(updated.sections.abstract.score,null);
    const reload=new Workspace(w.path);await reload.load();assert.match(reload.state.projects[0].sections.abstract.content,/Revised text/);
    assert.match(writingPrompt(updated,[],'en'),/Do not invent citations/);assert.match(writingPrompt(updated,[],'en'),/Revised text/);assert.match(writingPrompt(updated,[],'zh'),/Revised text/);assert.match(projectMarkdown(updated,'en'),/Revised text/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('beginner completion requires checklist and plan cycle validation prevents corrupt saves',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'astro-learning-'));try{
    const w=new Workspace(join(dir,'workbench.json'));await w.load();await assert.rejects(w.novice('start',{completed:true,checks:[]}));
    await w.novice('start',{completed:true,checks:[true,true,true,true],note:'Learning note'});assert.deepEqual(w.state.novice.completed,['start']);
    await w.novice('start',{completed:false});assert.equal(w.state.novice.notes.start,'Learning note');assert.equal(w.state.novice.completed.length,0);
    await assert.rejects(w.updatePlan({nodes:[{id:'a',title:'A',parentId:'b'},{id:'b',title:'B',parentId:'a'}]}));
    await w.updatePlan({title:'Plan',goal:'Question',nodes:[{id:'a',title:'Task',status:'doing',note:'Deliverable'}]});assert.match(slidesMarkdown(w.state,[],'en'),/Deliverable/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('workspace HTTP endpoints persist projects, export prompts and back up both stores',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'astro-api-'));const {server}=await createApp({dataPath:join(dir,'library.json')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  const call=async(path,body,method='POST')=>{const r=await fetch(base+path,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,path);return r.json();};
  try{
    const catalog=await call('/api/catalog?lang=en');assert.equal(catalog.novice.length,9);
    const p=await call('/api/projects',{title:'Project',type:'journal'});await call(`/api/projects/${p.id}`,{sectionId:'title',content:'A draft title'},'PATCH');
    const prompt=await call(`/api/projects/${p.id}/prompt?lang=en`);assert.match(prompt.prompt,/human author/);
    const md=await(await fetch(base+`/api/projects/${p.id}/export?lang=en`)).text();assert.match(md,/A draft title/);
    const backup=await call('/api/backup');assert.equal(backup.version,'3.4.0');assert.equal(backup.workspace.projects.length,1);assert.ok(Array.isArray(backup.library.items));
    const health=await call('/api/health');assert.equal(health.appId,'astro-ph-researcher');assert.equal(health.version,'3.4.0');
    const statements=await(await fetch(base+'/api/statements')).text();assert.match(statements,/1126615665/);assert.match(statements,/AIGC/);assert.match(statements,/MIT/);
    const notices=await(await fetch(base+'/notices.js')).text();assert.match(notices,/1126615665/);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});
test('project action installer preserves existing actions and is idempotent',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'astro-action-'));try{
    const script=fileURLToPath(new URL('../../scripts/install-action.mjs',import.meta.url));
    execFileSync(process.execPath,[script,'--project',dir,'--lang','en']);const path=join(dir,'.codex/environments/environment.toml');const first=await readFile(path,'utf8');assert.match(first,/Open Astro Workbench/);assert.match(first,/open-ui.mjs/);
    execFileSync(process.execPath,[script,'--project',dir,'--lang','en']);assert.equal(await readFile(path,'utf8'),first);
    await writeFile(path,'version = 1\nname = "Existing"\n[[actions]]\nname = "Original action"\ncommand = "echo ok"\n');execFileSync(process.execPath,[script,'--project',dir,'--lang','en']);const merged=await readFile(path,'utf8');assert.match(merged,/Original action/);assert.match(merged,/Open Astro Workbench/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
