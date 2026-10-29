const key='quanh-appearance-v1';
let mode='light';try{mode=localStorage.getItem(key)==='dark'?'dark':'light';}catch{}
const root=document.documentElement;
function apply(){root.dataset.appearance=mode;const en=root.lang.toLowerCase().startsWith('en');button.textContent=mode==='dark'?(en?'Day mode':'Chế độ ban ngày'):(en?'Night mode':'Chế độ ban đêm');button.setAttribute('aria-label',button.textContent);}
const button=document.createElement('button');button.id='appearanceToggle';button.className='appearance-toggle';button.type='button';
button.addEventListener('click',()=>{mode=mode==='dark'?'light':'dark';try{localStorage.setItem(key,mode);}catch{}apply();});
function mount(){document.body.append(button);apply();}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
document.addEventListener('quanh-locale-change',apply);

new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:['lang']});
