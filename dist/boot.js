// Session data contains plain objects, arrays, strings and numbers.
if(typeof globalThis.structuredClone!=='function')globalThis.structuredClone=value=>JSON.parse(JSON.stringify(value));
if(typeof Object.hasOwn!=='function')Object.hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const main=document.querySelector('#main');
import('./app.js?v=20').catch(error=>{console.error('Lab startup failed',error);main.innerHTML='<section class="startup-state"><span class="startup-symbol">↻</span><h1>Thí nghiệm chưa tải được</h1><p>Thử tải lại trang hoặc mở bằng trình duyệt khác.</p><button id="reloadLab" class="button primary">Tải lại</button></section>';document.querySelector('#reloadLab').addEventListener('click',()=>location.reload());});
