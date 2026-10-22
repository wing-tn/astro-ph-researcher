#!/usr/bin/env node
// Installs a project-scoped Codex action. Existing setup and actions are preserved.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
const args=process.argv.slice(2),lang=args[args.indexOf('--lang')+1]==='en'?'en':'zh';
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node.js 22+ is required.');
let project=option('--project');
if(args.includes('--interactive')){
  const prompt=createInterface({input:process.stdin,output:process.stdout});
  try{project=(await prompt.question(lang==='en'?'Codex project directory: ':'Codex 项目目录：')).trim().replace(/^"(.*)"$/,'$1');}finally{prompt.close();}
}
if(args.includes('--check')){await stat(new URL('../ui/server.mjs',import.meta.url));console.log('OK: Node.js 22+, launcher, local UI. Version 3.4.0. No files changed.');process.exit(0);}
if(!project){console.log(lang==='en'?'Usage: node scripts/install-action.mjs --project <your-Codex-project> --lang en':'用法：node scripts/install-action.mjs --project <Codex项目目录> --lang zh');process.exitCode=1;}
else{
  const root=resolve(project);if(!(await stat(root)).isDirectory())throw new Error('Project directory is required.');
  const dir=join(root,'.codex','environments'),path=join(dir,'environment.toml');let previous='';
  try{previous=await readFile(path,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
  const marker='# astro-ph-researcher 3.4.0 action';
  if(previous.includes('# astro-ph-researcher')||(previous.includes('open-ui.mjs')&&previous.includes('Astro'))){console.log('Astro action already exists. Existing configuration preserved.');}
  else{
    const quote=s=>process.platform==='win32'?`'${s.replace(/'/g,"''")}'`:`'${s.replace(/'/g,"'\\''")}'`;
    const launcher=fileURLToPath(new URL('./open-ui.mjs',import.meta.url));
    const command=`${process.platform==='win32'?'& ':''}${quote(process.execPath)} ${quote(launcher)} --lang ${lang}`;
    const block=`\n${marker}\n[[actions]]\nname = ${JSON.stringify(lang==='en'?'Open Astro Workbench':'打开 Astro 工作台')}\nicon = "run"\ncommand = ${JSON.stringify(command)}\n`;
    await mkdir(dir,{recursive:true});if(previous)await writeFile(`${path}.before-astro-${Date.now()}.bak`,previous,{flag:'wx'});
    await writeFile(path,(previous||'version = 1\nname = "Astro Research Workbench"\n[setup]\nscript = ""\n')+block,'utf8');
    console.log(`${lang==='en'?'Installed project action':'已添加项目操作按钮'}: ${path}\n${lang==='en'?'Reopen this project in Codex; use the top-bar action.':'在 Codex 中重新打开该项目后，使用顶栏操作按钮。'}`);
  }
}
