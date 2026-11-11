// Measure the existing fixed toolbar; no lab data, route or control is changed.
export function installWorkspaceInsets({document=globalThis.document,window=globalThis.window}={}){
 const main=document?.querySelector('#main');
 if(!main||!window)return null;
 let toolbar=null,resizeObserver=null,frame=0,height=-1,destroyed=false;
 function measure(){
  frame=0;if(destroyed)return;
  const style=toolbar&&window.getComputedStyle(toolbar);
  const next=toolbar&&style.position==='fixed'&&style.display!=='none'&&style.visibility!=='hidden'?Math.ceil(toolbar.getBoundingClientRect().height):0;
  if(next!==height){height=next;document.documentElement.style.setProperty('--workspace-toolbar-height',next+'px');}
 }
 function schedule(){if(!frame&&!destroyed)frame=window.requestAnimationFrame(measure);}
 function attach(){
  const next=main.querySelector('.workspace-toolbar');
  if(next!==toolbar){resizeObserver?.disconnect();resizeObserver=null;toolbar=next;
   if(toolbar&&window.ResizeObserver){resizeObserver=new window.ResizeObserver(schedule);resizeObserver.observe(toolbar);}
  }
  schedule();
 }
 // #main replaces its direct surface node on navigation; SVG/readout updates do not trigger this observer.
 const routes=new window.MutationObserver(attach);routes.observe(main,{childList:true});
 window.addEventListener('resize',schedule);attach();
 return {refresh:attach,destroy(){destroyed=true;routes.disconnect();resizeObserver?.disconnect();window.removeEventListener('resize',schedule);if(frame)window.cancelAnimationFrame(frame);document.documentElement.style.removeProperty('--workspace-toolbar-height');}};
}
if(typeof document!=='undefined')globalThis.quanhWorkspaceInsets=installWorkspaceInsets();
