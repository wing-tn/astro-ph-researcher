#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),lang=args[args.indexOf('--lang')+1]==='en'?'en':'zh';
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node.js 22+ is required.');
async function health(port){try{const r=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(500)});const d=await r.json();return d.appId==='astro-ph-researcher'&&d.version==='3.4.0'?d:false;}catch{return false;}}
const portIndex=args.indexOf('--port'),startPort=portIndex>=0?Number(args[portIndex+1]):4317,endPort=portIndex>=0?startPort+1:4328;
if(!Number.isInteger(startPort)||startPort<1||startPort>65535)throw new Error('Invalid local port');
let port=startPort,ready=false;
// Scan the whole range before starting: an earlier port may become free after a service was started later.
for(let candidate=startPort;candidate<endPort;candidate++){if(await health(candidate)){port=candidate;ready=true;break;}}
for(;!ready&&port<endPort;port++){
  if(await health(port)){ready=true;break;}
  let reachable=false;try{await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(300)});reachable=true;}catch{}
  if(reachable)continue;
  const child=spawn(process.execPath,[fileURLToPath(new URL('../ui/server.mjs',import.meta.url)),'--port',String(port)],{detached:true,windowsHide:true,stdio:'ignore'});child.on('error',()=>{});child.unref();
  for(let attempt=0;attempt<40;attempt++){if(await health(port)){ready=true;break;}await new Promise(r=>setTimeout(r,200));}
  if(ready)break;
}
if(!ready)throw new Error('Could not start the workbench. Run node ui/server.mjs to inspect diagnostics.');
const url=`http://127.0.0.1:${port}/?lang=${lang}`;
console.log(`${lang==='en'?'Astro Research Workbench':'Astro 天文研究工作台'} 3.4.0\n${url}\n${lang==='en'?'The local service runs in the background.':'本地服务在后台运行。'}`);
if(!args.includes('--no-browser')){
  const command=process.platform==='win32'?['rundll32.exe',['url.dll,FileProtocolHandler',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];
  const browser=spawn(command[0],command[1],{detached:true,windowsHide:true,stdio:'ignore'});browser.on('error',()=>console.log(`Open ${url}`));browser.unref();
}
