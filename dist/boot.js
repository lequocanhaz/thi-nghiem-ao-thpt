// Keep the static library readable while modules load; fonts never block startup.
if(typeof globalThis.structuredClone!=='function')globalThis.structuredClone=value=>JSON.parse(JSON.stringify(value));
if(typeof Object.hasOwn!=='function')Object.hasOwn=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
let finished=false;
function fallback(){
 if(finished)return;
 const status=document.querySelector('#startupStatus');
 if(status){status.textContent='Công cụ chưa tải được. Kiểm tra kết nối và thử lại.';
 const button=document.createElement('button');button.className='button secondary';button.textContent='Thử lại';button.addEventListener('click',()=>location.reload());status.append(' ',button);}
}
const timer=setTimeout(fallback,15000);
import('./app.js?v=61').then(()=>{finished=true;clearTimeout(timer);}).catch(error=>{clearTimeout(timer);console.error('Lab startup failed',error);fallback();});
