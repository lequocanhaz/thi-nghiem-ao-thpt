const key='quanh-appearance-v1';
let mode='light';try{mode=localStorage.getItem(key)==='dark'?'dark':'light';}catch{}
const root=document.documentElement;
const button=document.createElement('button');button.id='appearanceToggle';button.className='appearance-toggle';button.type='button';
const sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>';
const moon='<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5a8.5 8.5 0 1 0 9.5 9.5Z"/>';
function apply(){
 root.dataset.appearance=mode;
 const en=root.lang.toLowerCase().startsWith('en');
 const label=mode==='dark'?(en?'Day mode':'Chế độ ban ngày'):(en?'Night mode':'Chế độ ban đêm');
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(mode==='dark'?sun:moon)+'</svg>';
 button.setAttribute('aria-label',label);button.title=label;button.setAttribute('aria-pressed',String(mode==='dark'));
}
button.addEventListener('click',()=>{mode=mode==='dark'?'light':'dark';try{localStorage.setItem(key,mode);}catch{}apply();});
function mount(){const nav=document.querySelector('.header nav,.reading-header nav');if(nav)nav.append(button);apply();}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
document.addEventListener('quanh-locale-change',apply);
new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:['lang']});
