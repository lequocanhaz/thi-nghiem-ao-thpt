// Loaded on demand by the experiment viewport, never by the home library.
let ready=null,pending=null,attempt=0;
export const peekRenderers=()=>ready;
export function loadRenderers({onProgress=()=>{},timeout=15000,importModule=url=>import(url)}={}){
 if(ready){onProgress(100);return Promise.resolve(ready);}
 if(pending)return pending;
 const run=++attempt;let completed=0,timer;
 onProgress(0);
 const task=Promise.all(['scene3d.js','software-scene.js'].map(name=>importModule(`./${name}?v=59&attempt=${run}`).then(module=>{if(run===attempt)onProgress(Math.round(++completed/2*100));return module;})));
 pending=Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Tải mô hình quá 15 giây. Kiểm tra kết nối rồi thử lại.')),timeout);})]).then(([webgl,software])=>{if(run===attempt)ready={LabScene:webgl.LabScene,SoftwareScene:software.SoftwareScene};return ready;}).finally(()=>{clearTimeout(timer);if(run===attempt){pending=null;attempt++;}});
 return pending;
}
