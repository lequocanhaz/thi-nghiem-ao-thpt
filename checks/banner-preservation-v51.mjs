import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {experiments} from '../dist/experiments.js';

const root=new URL('../',import.meta.url);
const baseline=JSON.parse(fs.readFileSync(new URL('./banner-preservation-v51.json',import.meta.url),'utf8'));
const read=name=>fs.readFileSync(new URL(name,root));
const hash=value=>createHash('sha256').update(value).digest('hex');
for(const name of ['dist/banner.js','dist/app.css','dist/video/black-hole.mp4','dist/video/black-hole.webm','dist/video/black-hole.webp']){
 let contents=read(name);
 if(name==='dist/app.css'){
  // Preserve the original stylesheet byte-for-byte. v53 adds scoped UI rules
  // without touching the frozen banner, branding, font or palette definitions.
  const fullCSS=contents.toString(),marker='\n/* v53: readable lesson titles, compact catalog and a bounded parameter column. */';
  const boundary=fullCSS.indexOf(marker),css=boundary<0?fullCSS:fullCSS.slice(0,boundary);
  if(boundary>=0)assert.doesNotMatch(fullCSS.slice(boundary),/banner|cinematic|orbital|@font-face|:root|\.brand\b|@import/i,'UI refinements must not override protected banner or identity rules');
  assert.ok(css.includes('.teaching-tools>button>svg{'));assert.ok(css.includes('.math-tex .katex svg{max-width:none}'));
  contents=css.replace('.teaching-tools>button>svg{','.teaching-tools svg{').replace('/* Stretchy radicals/arrows use wide SVG paths clipped by KaTeX, not icon sizing. */\n.math-tex .katex svg{max-width:none}\n','');
 }
 assert.equal(hash(contents),baseline.files[name],name+' must remain byte-identical except the explicitly allowed math SVG fix');
}
// Entry changes are cache versions plus the explicitly scoped visual-settings stylesheet; startup/banner bytes stay frozen.
for(const [name,expected]of Object.entries(baseline.normalizedSharedFiles)){
 let content=read(name).toString();
 if(name==='dist/index.html'){
  assert.match(content,/<link rel="canonical" href="https:\/\/physicslab\.tech\/">/,'Canonical URL must use the custom domain');
  assert.match(content,/<meta property="og:url" content="https:\/\/physicslab\.tech\/">/,'Social URL must use the custom domain');
  // Normalise only the approved custom-domain migration while preserving the frozen banner baseline.
  content=content.replaceAll('https://physicslab.tech/','https://lequocanhaz.github.io/thi-nghiem-ao-thpt/');
 }
 assert.equal(hash(content.replace('<link rel="stylesheet" href="visual-settings.css?v=54">','').replace(/\?v=\d+/g,'?v=BASE')),expected,name);
}
assert.doesNotMatch(read('dist/visual-settings.css').toString(),/banner|cinematic|orbital|@font-face|:root|\.brand\b|@import/i,'Visual settings CSS cannot override protected identity');
const view=read('dist/views.js').toString();
const markup=view.slice(view.indexOf(' <section class="main-banner'),view.indexOf(' </section>')+' </section>'.length);
assert.equal(hash(markup),baseline.bannerMarkupSHA256,'Banner markup, text and layout');
// v53 fixes cold anchor navigation: static startup markup is not a hydrated home.
// Normalize those guards and the two explicit lab-only presentation additions; banner lifecycle/routing bytes stay frozen.
const bannerApp=read('dist/app.js').toString()
 .replace('labMarkup(e,{prefs:{...prefs,visual:visualSettings},state,config,controls:','labMarkup(e,{prefs,state,config,controls:')
 .replace("if(visualSettings.mode==='classroom'&&mode!=='present')setLayout('present');updateSpeech(narrator.status());","updateSpeech(narrator.status());")
 .replace("location.hash==='#library'&&!active&&$('#cards')","location.hash==='#library'&&!active&&$('#library')")
 .replace("location.hash==='#main'&&document.querySelector('.home-screen,.lab,.source-page')","location.hash==='#main'&&document.querySelector('.home,.lab,.source-page')");
const bannerLines=bannerApp.split('\n').filter(line=>/banner|Banner/.test(line)).join('\n');
assert.equal(hash(bannerLines),baseline.appBannerLinesSHA256,'Banner import, mount, playback lifecycle, routing and fullscreen handlers');
const ids=experiments.map(e=>e.id).sort();
assert.equal(ids.length,300);assert.equal(new Set(ids).size,300);
assert.equal(hash(JSON.stringify(ids)),baseline.experimentIDs.sha256,'Preserve exact experiment IDs');
const walk=dir=>fs.readdirSync(new URL(dir+'/',root),{withFileTypes:true}).flatMap(entry=>{
 const name=path.posix.join(dir,entry.name);return entry.isDirectory()?walk(name):[name];
});
for(const [dir,expected]of Object.entries(baseline.protectedTrees)){
 const names=walk(dir).sort();assert.equal(names.length,expected.files,dir+' file count');
 assert.equal(hash(names.map(name=>name+':'+hash(read(name))).join('\n')),expected.sha256,dir+' contents');
}

// Temporary read-only network diagnosis from GitHub's own runner (no credentials).
const dns=await import('node:dns/promises');
for(const [host,kind] of [['physicslab.tech','A'],['physicslab.tech','AAAA'],['physicslab.tech','CAA'],['www.physicslab.tech','CNAME'],['www.physicslab.tech','A']]){
 try{const answer=await Promise.race([dns.resolve(host,kind),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),6000))]);console.log('DOMAIN_DIAG',host,kind,JSON.stringify(answer));}
 catch(e){console.log('DOMAIN_DIAG',host,kind,e.code||e.message);}
}
for(const site of ['https://physicslab.tech/','https://www.physicslab.tech/']){
 try{const r=await fetch(site,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(8000)});console.log('DOMAIN_HTTP',site,r.status,r.headers.get('location')||'no redirect');}
 catch(e){console.log('DOMAIN_HTTP',site,e.cause?.code||e.message);}
}
console.log('PASS v51 SHA-256: banner media/poster/playback/markup and original CSS (except scoped math SVG fix) unchanged, added UI rules exclude banner/identity; exact 300 IDs, books, audio, lessons, brand and fonts preserved. Source/asset checks only; desktop/mobile browser playback remains unverified.');
