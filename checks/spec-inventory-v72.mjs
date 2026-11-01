import assert from 'node:assert/strict';
import fs from 'node:fs';
import {experiments} from '../dist/experiments.js';
const source=JSON.parse(fs.readFileSync(new URL('../sources/specification-v72/profiles.json',import.meta.url),'utf8'));
const coverage=JSON.parse(fs.readFileSync(new URL('../docs/spec-v72/coverage.json',import.meta.url),'utf8'));
assert.equal(source.profiles.length,300);assert.equal(new Set(source.profiles.map(x=>x.id)).size,300);
assert.deepEqual(source.profiles.map(x=>x.id).sort(),experiments.map(x=>x.id).sort());
assert.equal(coverage.sourceSha256,source.sha256);assert.match(source.sha256,/^[a-f0-9]{64}$/);
assert.equal(source.requirementsAreProposals,true);
for(const e of experiments){const p=source.profiles.find(p=>p.id===e.id),r=coverage.experiments.find(r=>r.id===e.id);assert.equal(p.grade,e.grade,e.id);assert.ok(p.requirements.includes('S7'),e.id);assert.equal(r.pedagogicalReview,'pending');assert.equal(r.realDeviceReview,'pending');assert.equal(r.curriculum.verification,'pending');}
console.log('PASS 300 source-specification profiles match current IDs/grades; proposed requirements and pending teacher/device/curriculum acceptance are preserved.');
