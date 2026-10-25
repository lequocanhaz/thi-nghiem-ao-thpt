import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {catalogSearchIndex,matchesSearch,searchTerms,searchRank} from '../dist/catalog-search.js';

const snapshot=JSON.stringify(experiments.map(e=>[e.id,e.params,e.formula,initialState(e)]));
const find=q=>experiments.filter(e=>matchesSearch(e,searchTerms(q))).map(e=>e.id);
for(const [query,id] of [['định luật Ohm','ohm'],['dinh luat ohm','ohm'],['ĐỊNH LUẬT OHM','ohm'],['Ohm’s law','ohm'],['ampe ke','ohm'],['voltmeter','ohm'],['cân đòn','lever'],['balance beam','lever'],['phân tử','gas'],['molecules','gas'],['vibrating string','wave'],['piston','boyle']])assert.ok(find(query).includes(id),`${query} → ${id}`);
assert.equal(find('').length,300);
assert.equal(find('zzNoSuchExperiment839502').length,0);
assert.ok(!find('molecules').includes('ohm'),'Equipment aliases must not be assigned across unrelated experiments');
assert.ok(searchRank(experiments.find(e=>e.id==='ohm'),searchTerms('ohm'))>searchRank(experiments.find(e=>e.id==='series'),searchTerms('ammeter')));
for(const e of experiments)assert.equal(catalogSearchIndex(e),catalogSearchIndex(e),'Reuse the cached index');
assert.equal(JSON.stringify(experiments.map(e=>[e.id,e.params,e.formula,initialState(e)])),snapshot,'Search must preserve scientific metadata');
console.log('PASS bilingual/accent-insensitive phenomenon and apparatus search, punctuation, empty state, cached index and scientific metadata preservation.');
