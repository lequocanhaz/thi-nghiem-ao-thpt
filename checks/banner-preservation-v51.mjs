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
 content=content.replace('<link rel="stylesheet" href="lab-extras-v67.css"><script type="module" src="appearance-v67.js"></script>','');
 if(name==='dist/index.html'){
  assert.match(content,/<link rel="canonical" href="https:\/\/physicslab\.tech\/">/,'Canonical URL must use the custom domain');
  assert.match(content,/<meta property="og:url" content="https:\/\/physicslab\.tech\/">/,'Social URL must use the custom domain');
  // Normalise only the approved custom-domain migration while preserving the frozen banner baseline.
  assert.match(content,/<link rel="stylesheet" href="banner-title\.css\?v=62">/,'The centered two-line title CSS must be deployed');
  assert.ok(content.includes("<meta name=\"description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">"),'Expected updated Google description');
  content=content.replace("<meta name=\"description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">","<meta name=\"description\" content=\"300 thí nghiệm Vật lí THPT tương tác trong không gian 3D. Điều khiển, nghe thuyết minh, đo và phân tích số liệu.\">");
  assert.ok(content.includes("<meta property=\"og:description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">"),'Expected updated OpenGraph description');
  content=content.replace("<meta property=\"og:description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">","<meta property=\"og:description\" content=\"Khám phá 300 thí nghiệm tương tác, điều chỉnh mô hình 3D, đo và phân tích số liệu. Đọc ba sách Vật lí lớp 10, 11, 12.\">");
  assert.ok(content.includes("<meta name=\"twitter:description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">"),'Expected updated Twitter description');
  content=content.replace("<meta name=\"twitter:description\" content=\"Quanh Lab – hệ thống thí nghiệm Vật lí ảo dành cho học sinh, giáo viên THPT với 300 thí nghiệm tương tác 2D/3D, đo đạc, vẽ đồ thị và sách Vật lí 10–12.\">","<meta name=\"twitter:description\" content=\"300 thí nghiệm Vật lí tương tác và ba sách giáo khoa THPT.\">");
  content=content.replace('<link rel="stylesheet" href="observation.css?v=65">','');
  content=content.replace('<link rel="stylesheet" href="account.css?v=64"><script type="module" src="account-ui.js?v=66"></script>','');
  content=content.replaceAll('https://physicslab.tech/','https://lequocanhaz.github.io/thi-nghiem-ao-thpt/').replace('<link rel="stylesheet" href="banner-title.css?v=62">','');
 }
 assert.equal(hash(content.replace('<link rel="stylesheet" href="visual-settings.css?v=54">','').replace('<a href="experiments/">Danh mục đầy đủ</a><a href="about.html">Giới thiệu</a>','').replace(/<link rel="sitemap"[^>]+>/,'').replace(/<script id="quanhSiteData" type="application\/ld\+json">[^<]+<\/script>/,'').replace(/\?v=\d+/g,'?v=BASE')),expected,name);
}
assert.doesNotMatch(read('dist/visual-settings.css').toString(),/banner|cinematic|orbital|@font-face|:root|\.brand\b|@import/i,'Visual settings CSS cannot override protected identity');
const view=read('dist/views.js').toString();
const markup=view.slice(view.indexOf(' <section class="main-banner'),view.indexOf(' </section>')+' </section>'.length);
// The owner-approved title is the sole change allowed inside the previously protected banner markup.
const currentTitle='<h1 tabindex="-1" id="bannerTitle" class="primary-heading"><span class="banner-title-row banner-title-row--main">HỆ THỐNG THÍ NGHIỆM</span><em class="banner-title-row banner-title-row--sub">VẬT LÍ ẢO</em></h1>';
const originalTitle='<h1 tabindex="-1" id="bannerTitle" class="primary-heading">Thí nghiệm<br><em>Vật Lí</em></h1>';
assert.equal(markup.split(currentTitle).length,2,'The banner heading must exactly match the requested Vietnamese title');
assert.equal(hash(markup.replace(currentTitle,originalTitle)),baseline.bannerMarkupSHA256,'Everything beyond the new heading preserves the original banner markup');
// The old whole-line hash froze every unrelated action in the one-line click
// handler. Preserve actual banner responsibilities against the pre-redesign
// source instead, without changing or overwriting the historic v51 baseline.
const lifecycle=JSON.parse(fs.readFileSync(new URL('./banner-lifecycle-v59.json',import.meta.url),'utf8'));
const currentApp=read('dist/app.js').toString();
for(const [key,pattern] of Object.entries(lifecycle.patterns)){
 const fragment=currentApp.match(new RegExp(pattern))?.[0];assert.ok(fragment,'Missing protected banner responsibility: '+key);
 assert.equal(hash(fragment.replace('pendingClearId=null;pendingSession=null;','')),lifecycle.sha256[key],'Unchanged banner '+key);
}
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
console.log('PASS v51 SHA-256: banner media/poster/playback/markup and original CSS (except scoped math SVG fix) unchanged, added UI rules exclude banner/identity; exact 300 IDs, books, audio, lessons, brand and fonts preserved. Source/asset checks only; desktop/mobile browser playback remains unverified.');
