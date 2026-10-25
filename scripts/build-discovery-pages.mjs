// Build crawlable, script-independent entry pages from the existing catalog.
// The production domain stays on GitHub Pages until custom DNS/HTTPS is verified.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {experiments} from '../dist/experiments.js';
import {dictionaries} from '../dist/i18n.js';
import {formulaCatalog} from '../dist/formula-catalog.js';
import katex from 'katex';

export const siteURL='https://lequocanhaz.github.io/thi-nghiem-ao-thpt/';
const root=new URL('../dist/',import.meta.url);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const url=path=>new URL(path,siteURL).href;
export function discoveryPage(e){
 const path=`experiments/${e.id}.html`,title=`${e.shortTitle} · Vật lí ${e.grade} | Quanh Lab`;
 const description=e.description;
 const data={'@context':'https://schema.org','@type':'LearningResource',name:e.title,description,url:url(path),inLanguage:'vi',educationalLevel:`Lớp ${e.grade}`,learningResourceType:'Thí nghiệm Vật lí tương tác',isAccessibleForFree:true,about:{'@type':'Thing',name:e.topic},publisher:{'@type':'Organization',name:'Quanh Lab'}};
 const formula=katex.renderToString(formulaCatalog[e.id],{throwOnError:true,trust:false,strict:'ignore',output:'htmlAndMathml',displayMode:true});
 return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url(path)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Quanh Lab"><meta property="og:locale" content="vi_VN"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url(path)}"><meta property="og:image" content="${url('video/black-hole.webp')}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="../brand/quanh-mark.svg" type="image/svg+xml"><link rel="stylesheet" href="../vendor/katex/katex.min.css?v=48"><link rel="stylesheet" href="../product.css?v=59"><script type="application/ld+json">${json(data)}</script></head>
<body><a class="skip" href="#content">Đến nội dung</a><header><a class="wordmark" href="../"><img src="../brand/quanh-mark.svg" width="44" height="40" alt="">QUANH <b>LAB</b></a><nav aria-label="Điều hướng"><a href="../#library">Thư viện</a><a href="../books.html">Sách giáo khoa</a><a href="../about.html">Giới thiệu</a></nav></header>
<main id="content"><a class="back" href="./">← Danh mục thí nghiệm</a><p class="eyebrow">Lớp ${e.grade} · ${esc(e.topic)}</p><h1>${esc(e.title)}</h1><p class="lead">${esc(description)}</p><p class="english-title" lang="en">${esc(dictionaries['en-US'].experiments[e.id].title)}</p><a class="button" href="../#lab/${e.id}">Mở thí nghiệm tương tác <span aria-hidden="true">↗</span></a>
<section aria-labelledby="relationship"><h2 id="relationship">Quan hệ khảo sát</h2><div class="formula" tabindex="0" role="region" aria-label="Công thức khảo sát">${formula}</div><p>${esc(e.theory)}</p></section><section aria-labelledby="conditions"><h2 id="conditions">Điều kiện mô hình</h2><p>${esc(e.limit)}</p></section><section aria-labelledby="procedure"><h2 id="procedure">Gợi ý khảo sát</h2><ol>${e.tasks.map(task=>`<li>${esc(task)}</li>`).join('')}</ol></section><p class="note">Mở không gian tương tác để thay tham số, quan sát mô hình, ghi số liệu và xem đồ thị. Phiên thí nghiệm được lưu trên thiết bị đang dùng.</p></main><footer><a href="../about.html">Quanh Lab · Lê Quốc Anh</a><a href="../#sources">Nguồn học liệu</a><a href="../about.html#rights">Thông tin tài nguyên</a></footer></body></html>\n`;
}
function catalogPage(){
 const title='Danh mục 300 thí nghiệm Vật lí | Quanh Lab';
 return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="Danh mục 300 thí nghiệm Vật lí lớp 10, 11, 12: cơ học, dao động, sóng, điện, từ, quang và vật lí hiện đại."><link rel="canonical" href="${url('experiments/')}"><link rel="stylesheet" href="../product.css?v=59"></head><body><a class="skip" href="#content">Đến nội dung</a><header><a class="wordmark" href="../"><img src="../brand/quanh-mark.svg" width="44" height="40" alt="">QUANH <b>LAB</b></a><nav aria-label="Điều hướng"><a href="../#library">Tìm thí nghiệm</a><a href="../books.html">Sách giáo khoa</a></nav></header><main id="content"><p class="eyebrow">KHÁM PHÁ VẬT LÍ</p><h1>300 cách bắt đầu một câu hỏi.</h1><p class="lead">Chọn một bài để xem mục tiêu, công thức và điều kiện mô hình. Tiếp tục vào không gian tương tác để tự khảo sát.</p><nav class="grade-nav" aria-label="Chọn lớp">${[10,11,12].map(grade=>`<a href="#grade-${grade}">Lớp ${grade}</a>`).join('')}</nav>${[10,11,12].map(grade=>`<section id="grade-${grade}"><h2>Vật lí ${grade}</h2><ul class="catalog-list">${experiments.filter(e=>e.grade===grade).map(e=>`<li><a href="${e.id}.html"><span>${esc(e.title)}</span><small>${esc(e.topic)}</small><span aria-hidden="true">↗</span></a></li>`).join('')}</ul></section>`).join('')}</main><footer><a href="../about.html">Giới thiệu Quanh Lab</a><a href="../#sources">Nguồn học liệu</a></footer></body></html>\n`;
}
export function buildDiscoveryPages(){
 fs.mkdirSync(new URL('experiments/',root),{recursive:true});
 for(const e of experiments)fs.writeFileSync(new URL(`experiments/${e.id}.html`,root),discoveryPage(e));
 fs.writeFileSync(new URL('experiments/index.html',root),catalogPage());
 const paths=['','books.html','about.html','about-en.html','experiments/',...experiments.map(e=>`experiments/${e.id}.html`)];
 fs.writeFileSync(new URL('sitemap.xml',root),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path=>`  <url><loc>${esc(url(path))}</loc></url>`).join('\n')}\n</urlset>\n`);
 // This project is below a shared github.io host. Only the host root can serve
 // /robots.txt; do not pretend a project-subpath robots file controls crawlers.
 console.log(`Generated ${experiments.length} entry pages, one catalog and ${paths.length} sitemap URLs. No scientific records were changed.`);
}
if(process.argv[1]===fileURLToPath(import.meta.url))buildDiscoveryPages();
