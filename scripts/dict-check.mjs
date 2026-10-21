// Download and verify the official NADC dictionary (network + ~700 KB).
// Uses a temp data dir so it never touches the real term book.
// Run: node scripts/dict-check.mjs [--no-download]
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.ASTRO_PH_RESEARCHER_HOME = join(tmpdir(), 'astro-ph-researcher-dict-check');

const { dictionaryStatus, downloadDictionary, initDictionary, offlineLookup } = await import('../lib/dictionary.js');

await initDictionary();
console.log('before:', dictionaryStatus());
const before = dictionaryStatus();
if ((!before.installed || process.argv.includes('--download')) && !process.argv.includes('--no-download')) {
  const status = await downloadDictionary();
  console.log('after:', status);
}
for (const query of ['redshift', '红移', '引力透镜效应', 'AGN', '2dFGRS', 'cosmic microwave background']) {
  console.log(query, '->', offlineLookup(query, 3));
}
