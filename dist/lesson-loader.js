// Editorial content is retained independently of simulation state and loaded only on opening a lab.
let catalog;
export function loadTeaching(experiment,{timeout=15000}={}){
 if(experiment.lesson)return Promise.resolve(experiment.lesson);
 catalog??=import('./lessons/catalog.js?v=50');
 let timer;
 return Promise.race([catalog,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Bài học chưa tải được sau 15 giây.')),timeout);})]).then(module=>{experiment.lesson=module.compileLesson(experiment);return experiment.lesson;}).finally(()=>clearTimeout(timer));
}
