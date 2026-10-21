// Live integration check: NADC + OpenAlex. Run: node scripts/live-check.mjs
import { lookupTerm, formatTermLookup } from '../lib/astrodict.js';
import { formatLiteratureSearch, searchLiterature } from '../lib/literature.js';

const term = process.argv[2] || 'redshift';
const query = process.argv[3] || 'gravitational lensing galaxy clusters';

console.log(`\n=== NADC: ${term} ===`);
try {
  const result = await lookupTerm(term, { includeRelated: true, relatedLimit: 6 });
  console.log('found:', result.found, 'matchedBy:', result.matchedBy, 'verification:', result.verification);
  console.log(formatTermLookup(result).slice(0, 2400));
  if (result.term) {
    console.log('\nTERM JSON:', JSON.stringify(result.term, null, 2).slice(0, 1200));
  }
} catch (error) {
  console.error('NADC failed:', error);
}

console.log(`\n=== OpenAlex: ${query} ===`);
try {
  const result = await searchLiterature({ query, sort: 'balanced', limit: 3, halfLifeYears: 8 });
  console.log('source:', result.sourceUsed, 'count:', result.count, 'notes:', result.notes);
  console.log(formatLiteratureSearch(result).slice(0, 4000));
} catch (error) {
  console.error('search failed:', error);
}
