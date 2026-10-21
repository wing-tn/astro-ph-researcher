// Build the static sidebar preview from the real client CSS.
import { readFile, writeFile } from 'node:fs/promises';

const client = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
const match = client.match(/const CSS = `([\s\S]*?)`;/);
if (!match) throw new Error('CSS template literal not found in lib/client.js');
const template = await readFile(new URL('../demo/template.html', import.meta.url), 'utf8');
const html = template.replace('/*__CSS__*/', match[1]);
await writeFile(new URL('../demo/index.html', import.meta.url), html, 'utf8');
console.log('demo/index.html written', html.length, 'bytes');
