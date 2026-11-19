import {G} from '../physics.js?v=17';

export const leverHooksM = Object.freeze([-1.2, -.6, -.3, .3, .6, 1.2]);
const loadNames = ['A', 'B', 'C'];
const STOP_ANGLE_RAD = Math.PI / 15;
const MIN_MASS_KG = .2;
const MAX_MASS_KG = 3;

const copy = {
 select: ['Chọn tải rồi chọn một móc, hoặc kéo tải lên đòn.', 'Select a load and a hook, or drag a load onto the beam.'],
 empty: ['Chưa có tải trên đòn.', 'There are no loads on the beam.'],
 balanced: ['Đòn cân bằng.', 'The beam is balanced.'],
 left: ['Đầu trái hạ xuống chốt chặn.', 'The left end rests on its stop.'],
 right: ['Đầu phải hạ xuống chốt chặn.', 'The right end rests on its stop.'],
 occupied: ['Móc đã có tải. Chọn móc khác hoặc hạ tải đang treo.', 'This hook is occupied. Choose another hook or remove the current load.'],
 pick: ['Chọn một tải trước khi treo.', 'Choose a load before attaching it.'],
 same: ['Tải đã ở móc này.', 'This load is already attached to that hook.'],
 invalidDrop: ['Thả tải vào một móc hoặc khay.', 'Drop the load onto a hook or back onto the tray.'],
 invalid: ['Vị trí hoặc khối lượng ngoài giới hạn của bộ dụng cụ.', 'The position or mass is outside the apparatus range.'],
 adjustAttached: ['Hạ tải xuống khay trước khi đổi khối lượng.', 'Return the load to the tray before changing its mass.'],
 onTray: ['Đang ở khay', 'On the tray'],
 hookLeft: ['Móc trái', 'Left hook'],
 hookRight: ['Móc phải', 'Right hook'],
 load: ['Tải', 'Load'],
 return: ['Hạ tải về khay', 'Return load to tray'],
 mass: ['Khối lượng tải đã chọn (kg)', 'Selected load mass (kg)'],
 diagram: ['Đòn bẩy và khay tải', 'Lever and load tray'],
 tray: ['Khay tải', 'Load tray'],
 placeOn: ['Treo vào móc', 'Attach to hook'],
 arm: ['Cánh tay đòn', 'Moment arm'],
 arms: ['Cánh tay đòn theo phương ngang', 'Horizontal moment arms'],
 hooks: ['Vị trí móc tính từ trục quay', 'Hook positions from the pivot'],
 clockwise: ['Mômen phải', 'Right moment'],
 counter: ['Mômen trái', 'Left moment'],
 net: ['Tổng mômen', 'Net moment'],
};

const validLoadId = index => Number.isInteger(index) && index >= 0 && index < loadNames.length;
const validHookId = index => Number.isInteger(index) && index >= 0 && index < leverHooksM.length;
const validMass = mass => Number.isFinite(mass) && mass >= MIN_MASS_KG && mass <= MAX_MASS_KG
 && mass === Math.round(mass * 10) / 10;

export function initialLever() {
 return {loads: [.5, 1, 2].map(massKg => ({massKg, hook: null}))};
}

export function validateLever(state) {
 if (!state || !Array.isArray(state.loads) || state.loads.length !== loadNames.length) return false;
 const occupied = new Set();
 for (const load of state.loads) {
  if (!load || !validMass(load.massKg)) return false;
  if (load.hook === null) continue;
  if (!validHookId(load.hook) || occupied.has(load.hook)) return false;
  occupied.add(load.hook);
 }
 return true;
}

export function applyLever(state, action) {
 if (!validateLever(state) || !action) return {message: copy.invalid};
 if (action.type === 'invalid-drop') return {message: copy.invalidDrop};
 const {load: selected} = action;
 if (!validLoadId(selected)) return {message: copy.pick};
 const previous = state.loads[selected];
 let next;
 switch (action.type) {
  case 'attach': {
   if (!validHookId(action.hook)) return {message: copy.invalid};
   if (previous.hook === action.hook) return {message: copy.same};
   if (state.loads.some(load => load.hook === action.hook)) return {message: copy.occupied};
   next = {massKg: previous.massKg, hook: action.hook};
   break;
  }
  case 'return': {
   if (previous.hook === null) return {message: copy.onTray};
   next = {massKg: previous.massKg, hook: null};
   break;
  }
  case 'set-mass': {
   if (previous.hook !== null) return {message: copy.adjustAttached};
   if (!validMass(action.massKg)) return {message: copy.invalid};
   next = {massKg: action.massKg, hook: null};
   break;
  }
  default: return {message: copy.invalid};
 }
 return {state: {loads: state.loads.map((load, index) => index === selected ? next : load)}};
}

export function observeLever(state) {
 // The allowed masses and positions are decimal tenths. Compare integer
 // products so equality does not depend on binary rounding of 0.1 kg or 0.3 m.
 const products = state.loads.map(({massKg, hook}) => hook === null ? 0
  : -Math.round(massKg * 10) * Math.round(leverHooksM[hook] * 10));
 const net = products.reduce((sum, moment) => sum + moment, 0);
 const angleRad = Math.sign(net) * STOP_ANGLE_RAD;
 const cosAngle = Math.cos(angleRad);
 const scale = G * cosAngle / 100;
 return {
  angleRad, netNm: net * scale,
  leftNm: products.reduce((sum, moment) => sum + Math.max(0, moment), 0) * scale,
  rightNm: products.reduce((sum, moment) => sum + Math.min(0, moment), 0) * scale,
  armsM: state.loads.map(({hook}) => hook === null ? 0 : Math.abs(leverHooksM[hook]) * cosAngle),
  loaded: products.some(moment => moment !== 0)
 };
}

export function measureLever(state) {
 const obs = observeLever(state);
 if (!obs.loaded) return null;
 return {
  armAM: obs.armsM[0], armBM: obs.armsM[1], armCM: obs.armsM[2],
  leftNm: obs.leftNm, rightNm: obs.rightNm, netNm: obs.netNm
 };
}

const pair = (vi, en) => [vi, en];
const colors = [
 {light:'#38c9c4', mid:'#0a847f', dark:'#095b61'},
 {light:'#ffbd6c', mid:'#d77123', dark:'#8e3d1a'},
 {light:'#b8a3fc', mid:'#7858cb', dark:'#503889'}
];
const blend = (context, a, b, y1, y2) => {
 const grad = context.createLinearGradient(0, y1, 0, y2);
 grad.addColorStop(0, a);
 grad.addColorStop(1, b);
 return grad;
};

function mount(host, {getState, dispatch, t}) {
 host.classList.add('practice-lever');
 host.innerHTML = `<div class="lever-lab">
  <div class="lever-bench">
   <div class="lever-visual">
    <canvas aria-label="${t(copy.diagram)}" role="img"></canvas>
    <div class="lever-loading-area"></div>
   </div>
   <div class="lever-readout">
    <p class="lever-state" role="status"></p>
    <dl>
     <div><dt>${t(copy.counter)}</dt><dd data-lever-moment="leftNm"></dd></div>
     <div><dt>${t(copy.clockwise)}</dt><dd data-lever-moment="rightNm"></dd></div>
     <div><dt>${t(copy.net)}</dt><dd data-lever-moment="netNm"></dd></div>
    </dl>
   </div>
  </div>
  <div class="lever-controls">
   <p class="lever-instruction">${t(copy.select)}</p>
   <div class="lever-weight-buttons" role="group" aria-label="${t(copy.tray)}"></div>
   <label for="lever-mass-input">${t(copy.mass)}</label>
   <div class="lever-mass-controls">
    <button type="button" data-lever-mass-delta="-1" aria-label="${t(pair('Giảm khối lượng', 'Decrease mass'))}">−</button>
    <input id="lever-mass-input" type="number" inputmode="decimal" min="0.2" max="3" step="0.1">
    <button type="button" data-lever-mass-delta="1" aria-label="${t(pair('Tăng khối lượng', 'Increase mass'))}">+</button>
   </div>
   <button class="lever-return" type="button" data-lever-return>${t(copy.return)}</button>
   <div class="lever-hook-area">
    <h3>${t(copy.hooks)}</h3>
    <div class="lever-hook-buttons"></div>
   </div>
   <div class="lever-arm-area">
    <h3>${t(copy.arms)}</h3>
    <dl class="lever-arms"></dl>
   </div>
  </div>
 </div>`;
 const q = selector => host.querySelector(selector);
 const visual = q('.lever-visual');
 const canvas = q('canvas');
 const ctx = canvas.getContext('2d');
 const weightButtons = q('.lever-weight-buttons');
 const dragArea = q('.lever-loading-area');
 const hookButtons = q('.lever-hook-buttons');
 const massInput = q('#lever-mass-input');
 const decrease = q('[data-lever-mass-delta="-1"]');
 const increase = q('[data-lever-mass-delta="1"]');
 const returnButton = q('[data-lever-return]');
 const status = q('.lever-state');
 const language = t(pair('vi-VN','en-US'));
 const format = new Intl.NumberFormat(language, {maximumFractionDigits: 3});
 const loadLabel = index => t(copy.load) + ' ' + loadNames[index];
 const hookLabel = index => t(leverHooksM[index] < 0 ? copy.hookLeft : copy.hookRight)
  + ' ' + format.format(Math.abs(leverHooksM[index])) + ' m';
 const fromData = (el, key) => Number(el.dataset[key]);

 const makeButton = (container, key, index, label) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset[key] = String(index);
  button.textContent = label;
  container.append(button);
  return button;
 };
 const loadButtons = loadNames.map((_, index) => makeButton(weightButtons, 'leverLoad', index, loadLabel(index)));
 const dragButtons = loadNames.map((_, index) => {
  const button = makeButton(dragArea, 'leverDrag', index, '');
  button.setAttribute('aria-label', loadLabel(index));
  return button;
 });
 const pins = leverHooksM.map((_, index) => makeButton(hookButtons, 'leverHook', index, hookLabel(index)));
 const arms = loadNames.map((_, index) => {
  const row = document.createElement('div');
  const label = document.createElement('dt');
  const value = document.createElement('dd');
  label.textContent = loadLabel(index);
  row.append(label, value);
  q('.lever-arms').append(row);
  return value;
 });
 let selected = null;
 let activeDrag = null;
 let layout;
 let suppressedClickId = null;

 function draw(state = getState()) {
  const width = visual.clientWidth;
  const height = visual.clientHeight;
  if (!width || !height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const pxWidth = Math.round(width * dpr), pxHeight = Math.round(height * dpr);
  if (canvas.width !== pxWidth || canvas.height !== pxHeight) {
   canvas.width = pxWidth;
   canvas.height = pxHeight;
  }
  const obs = observeLever(state);
  const scale = Math.min((width / 2 - 26) / 1.38, 275);
  const center = {x:width / 2,y:height * .37};
  const armPoint = (s, angle = obs.angleRad) => ({
   x:center.x + scale * s * Math.cos(angle), y:center.y - scale * s * Math.sin(angle)
  });
  const trayY = height - 47;
  const trayWidth = Math.min(width - 28, 245);
  const trayLeft = (width - trayWidth)/2;
  const hooks = leverHooksM.map(s => armPoint(s));
  const positions = state.loads.map(({hook}, index) => {
   if (hook === null) return {x: trayLeft + trayWidth * (index + .5) / loadNames.length, y: trayY + 18};
   return {x: hooks[hook].x, y:hooks[hook].y + 36};
  });
  layout = {hooks, positions, trayY, trayWidth, trayLeft};
  for (const [index, button] of dragButtons.entries()) {
   button.style.left = positions[index].x + 'px';
   button.style.top = positions[index].y + 'px';
  }
  if (!ctx) return;
  const dark = document.documentElement.dataset.appearance === 'dark';
  ctx.setTransform(pxWidth / width, 0, 0, pxHeight / height, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const rounded = (x,y,w,h,r,fill,stroke) => {
   ctx.beginPath();
   if (ctx.roundRect) ctx.roundRect(x,y,w,h,r);
   else ctx.rect(x,y,w,h);
   if (fill) {ctx.fillStyle=fill;ctx.fill();}
   if (stroke) {ctx.strokeStyle=stroke;ctx.stroke();}
  };
  const line = (a,b,stroke,width=1) => {
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
   ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();ctx.lineWidth=1;
  };
  const text = (label,x,y,color,options={}) => {
   ctx.font = `${options.weight ?? 600} ${options.size ?? 13}px system-ui, sans-serif`;
   ctx.textAlign=options.align ?? 'center';
   ctx.fillStyle=color;ctx.fillText(label,x,y);
  };

  ctx.fillStyle = blend(ctx,dark?'#182732':'#ebf3f7',dark?'#243a46':'#d7e8ed',0,height);
  ctx.fillRect(0,0,width,height);
  // The dots make the field easy to track while keeping attention on the load.
  ctx.fillStyle = dark ? '#405565' : '#b9d1d9';
  for (let y=18;y<trayY;y+=20) for (let x=14;x<width;x+=20) ctx.fillRect(x,y,1,1);

  const baseline = trayY - 19;
  const rightStop = armPoint(1.38,-STOP_ANGLE_RAD), leftStop = armPoint(-1.38,STOP_ANGLE_RAD);
  for (const foot of [leftStop,rightStop]) {
   const cap = foot.y + 6;
   rounded(foot.x - 4,cap,8,baseline - cap,3,dark?'#728b95':'#7f9ca5');
   rounded(foot.x - 11,cap,22,8,2,dark?'#bad7d7':'#477581');
   rounded(foot.x - 13,baseline,26,6,2,dark?'#627884':'#6a8e98');
  }
  ctx.beginPath();
  ctx.moveTo(center.x,center.y + 2);
  ctx.lineTo(center.x - 28,baseline + 4);
  ctx.lineTo(center.x + 28,baseline + 4);
  ctx.closePath();
  ctx.fillStyle = blend(ctx,dark?'#698ba3':'#688fa7',dark?'#314a5b':'#31566e',center.y,baseline);
  ctx.fill();
  rounded(center.x-43,baseline,86,8,3,dark?'#738a9a':'#406578');

  const leftEnd = armPoint(-1.38), rightEnd = armPoint(1.38);
  ctx.lineCap='round';
  line(leftEnd,rightEnd,dark?'#132732':'#1f4355',15);
  line({x:leftEnd.x,y:leftEnd.y-3},{x:rightEnd.x,y:rightEnd.y-3},dark?'#8eafb8':'#9fc4d1',4);
  ctx.lineCap='butt';
  const hover = activeDrag && nearestHook(activeDrag.x,activeDrag.y);
  for (const [index, point] of hooks.entries()) {
   const occupied = state.loads.some(load => load.hook === index);
   const candidate = hover === index;
   const ink = candidate && occupied ? '#ea8970' : candidate || occupied ? '#63dfd3' : '#bdd5df';
   ctx.beginPath();
   ctx.arc(point.x,point.y,6,0,Math.PI*2);
   ctx.fillStyle = ink;ctx.fill();
   ctx.strokeStyle = '#224554';ctx.stroke();
   text(format.format(Math.abs(leverHooksM[index])),point.x,point.y-15,dark?'#d4e8ed':'#365c6a',{size:11});
   if (candidate) {
    ctx.beginPath();ctx.arc(point.x,point.y,15,0,Math.PI*2);
    ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.stroke();ctx.lineWidth=1;
   }
  }
  ctx.beginPath();
  ctx.arc(center.x,center.y,9,0,Math.PI*2);
  ctx.fillStyle='#f7b350';ctx.fill();ctx.strokeStyle='#61431f';ctx.stroke();
  rounded(trayLeft,trayY,trayWidth,38,7,dark?'#162c39':'#c7dce4',dark?'#668890':'#91b4c2');
  text(t(copy.tray),center.x,trayY-9,dark?'#c0d8dd':'#365c6a',{size:12});

  function block(x,y,index,massKg,dragged=false) {
   const w = width <= 400 ? 22 : 30;
   const h = 16 + Math.sqrt(massKg)*8;
   const c = colors[index];
   if (selected === index || dragged) rounded(x-w/2-3,y-h/2-3,w+6,h+6,6,dark?'#e0f7f6':'#fff');
   rounded(x-w/2,y-h/2,w,h,5,blend(ctx,c.light,c.mid,y-h/2,y+h/2),c.dark);
   text(loadNames[index],x,y+4,'#111f28',{weight:800,size:12});
  }
  for (const [index, {hook,massKg}] of state.loads.entries()) {
   const point = positions[index];
   if (activeDrag?.index === index && activeDrag.moved) ctx.globalAlpha=.27;
   if (hook !== null) line(hooks[hook],point,dark?'#b2cfd4':'#385864',2);
   block(point.x,point.y,index,massKg);
   ctx.globalAlpha=1;
  }
  if (activeDrag?.moved) block(activeDrag.x,activeDrag.y,activeDrag.index,state.loads[activeDrag.index].massKg,true);
 }

 function nearestHook(x,y) {
  if (!layout) return null;
  let nearest = null;
  let best = 26;
  for (const [i,hook] of layout.hooks.entries()) {
   const distance=Math.hypot(x-hook.x,y-hook.y);
   if (distance < best) {best=distance;nearest=i;}
  }
  return nearest;
 }

 function paint(state) {
  const obs = observeLever(state);
  const words = !obs.loaded ? copy.empty : obs.angleRad===0 ? copy.balanced : obs.angleRad>0 ? copy.left : copy.right;
  const phrase = t(words);
  if (status.textContent !== phrase) status.textContent = phrase;
  host.dataset.leverTilt = !obs.loaded || obs.angleRad === 0 ? 'level' : obs.angleRad > 0 ? 'left' : 'right';
  for (const name of ['leftNm','rightNm','netNm']) q(`[data-lever-moment="${name}"]`).textContent = format.format(obs[name]) + ' N·m';
  for (const [index, load] of state.loads.entries()) {
   const here = load.hook === null ? t(copy.onTray) : hookLabel(load.hook);
   loadButtons[index].textContent = loadLabel(index) + ' · ' + format.format(load.massKg) + ' kg';
   loadButtons[index].setAttribute('aria-label',loadButtons[index].textContent + '. ' + here);
   loadButtons[index].setAttribute('aria-pressed',String(index === selected));
   dragButtons[index].setAttribute('aria-pressed',String(index === selected));
   dragButtons[index].setAttribute('aria-label',loadButtons[index].getAttribute('aria-label'));
   arms[index].textContent = load.hook === null ? '—' : format.format(obs.armsM[index]) + ' m';
  }
  for (const [index, pin] of pins.entries()) {
   const loadId = state.loads.findIndex(load => load.hook === index);
   pin.dataset.occupied=loadId === -1 ? 'false' : 'true';
   pin.textContent=hookLabel(index) + (loadId === -1 ? '' : ' · ' + loadNames[loadId]);
   pin.setAttribute('aria-label',t(copy.placeOn) + ' ' + hookLabel(index) + (loadId < 0 ? '' : '. ' + loadLabel(loadId)));
  }
  const load = state.loads[selected];
  const editable = Boolean(load && load.hook === null);
  massInput.disabled = !editable;
  decrease.disabled = !editable || load.massKg <= MIN_MASS_KG;
  increase.disabled = !editable || load.massKg >= MAX_MASS_KG;
  returnButton.disabled = !load || load.hook === null;
  if (document.activeElement !== massInput) massInput.value = load ? String(load.massKg) : '';
  draw(state);
 }

 function select(index) {
  selected = index;
  paint(getState());
 }

 function pointInStage(event) {
  const rect = visual.getBoundingClientRect();
  return {x: event.clientX - rect.left,y: event.clientY - rect.top};
 }

 function onDown(event) {
  const start = event.target.closest('[data-lever-drag]');
  if (!start || activeDrag || event.button !== 0) return;
  const index = fromData(start, 'leverDrag');
  const point = pointInStage(event);
  activeDrag = {index,pointerId:event.pointerId,...point,startX:point.x,startY:point.y,moved:false};
  start.setPointerCapture(event.pointerId);
 }

 function onMove(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  const {x,y}=pointInStage(event);
  const moved=activeDrag.moved || Math.hypot(x-activeDrag.startX,y-activeDrag.startY)>6;
  Object.assign(activeDrag,{x,y,moved});
  if (moved) draw();
 }

 function onPointerEnd(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  const {index,moved}=activeDrag;
  activeDrag=null;
  if (event.type === 'pointerup' && moved && layout) {
   suppressedClickId=event.pointerId;
   const {x,y}=pointInStage(event);
   const hook=nearestHook(x,y);
   selected=index;
   if (hook !== null) dispatch({type:'attach',load:index,hook});
   else if (y>=layout.trayY-5 && y<=layout.trayY+45 && x>=layout.trayLeft && x<=layout.trayLeft+layout.trayWidth) {
    if (getState().loads[index].hook !== null) dispatch({type:'return',load:index});
   } else dispatch({type:'invalid-drop'});
   paint(getState());
   return;
  }
  draw();
 }

 function onClick(event) {
  const button=event.target.closest('button');
  if (!button || !host.contains(button)) return;
  if (button.matches('[data-lever-drag]')) {
   const isDragClick=event.detail>0 && event.pointerId===suppressedClickId;
   suppressedClickId=null;
   if (isDragClick) return;
   select(fromData(button,'leverDrag'));
  } else if (button.matches('[data-lever-load]')) select(fromData(button,'leverLoad'));
  else if (button.matches('[data-lever-hook]')) dispatch({type:'attach',load:selected,hook:fromData(button,'leverHook')});
  else if (button === returnButton) dispatch({type:'return',load:selected});
  else if (button === decrease || button === increase) {
   const {massKg} = getState().loads[selected];
   dispatch({type:'set-mass',load:selected,massKg:(Math.round(massKg*10)+fromData(button,'leverMassDelta'))/10});
  }
 }

 function onMassChange() {
  const massKg=massInput.valueAsNumber;
  const accepted=dispatch({type:'set-mass',load:selected,massKg:Number.isFinite(massKg)?massKg:null});
  if (!accepted && selected !== null) massInput.value=String(getState().loads[selected].massKg);
 }

 const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
 const theme = typeof MutationObserver === 'function' ? new MutationObserver(() => draw()) : null;
 resize?.observe(visual);
 theme?.observe(document.documentElement,{attributes:true,attributeFilter:['data-appearance']});
 host.addEventListener('click',onClick);
 massInput.addEventListener('change',onMassChange);
 visual.addEventListener('pointerdown',onDown);
 visual.addEventListener('pointermove',onMove);
 for (const name of ['pointerup','pointercancel','lostpointercapture']) visual.addEventListener(name,onPointerEnd);
 return {
  paint,
  destroy() {
   activeDrag=null;resize?.disconnect();theme?.disconnect();
   host.removeEventListener('click',onClick);
   massInput.removeEventListener('change',onMassChange);
   visual.removeEventListener('pointerdown',onDown);
   visual.removeEventListener('pointermove',onMove);
   for (const name of ['pointerup','pointercancel','lostpointercapture']) visual.removeEventListener(name,onPointerEnd);
   host.classList.remove('practice-lever');
   delete host.dataset.leverTilt;
  }
 };
}

export const practice = {
 id: 'lever',
 name: ['Cân bằng đòn bẩy','Balancing a lever'],
 prompt: ['Treo tải vào các móc, rồi ghi mômen của mỗi bên.','Hang the loads from the hooks and record the moments on each side.'],
 task: ['Tìm hai cách cân bằng với khối lượng khác nhau. Giữ nguyên tải A, thay vị trí hoặc khối lượng tải B và đối chiếu tổng mômen với dự đoán. Quy ước bên trái dương.','Find two balances using different masses. Keep load A fixed, change load B’s position or mass, and compare the net moment with your prediction. Moments from loads on the left are positive.'],
 limitations: ['Đòn nhẹ và cứng, trục quay không ma sát. Đòn lệch mômen đứng yên ở chốt chặn 12°. Số đo là mômen do các tải ở tư thế đang quan sát, cánh tay đòn là hình chiếu ngang. Cột cánh tay đòn bằng 0 khi tải ở trong khay.','The beam is light and rigid and the pivot is frictionless. An unbalanced beam rests against a 12° stop. Readings show moments from the loads in the current pose and lever arms are horizontal projections. An arm of zero in the table means the load is in the tray.'],
 columns: [
  {key:'armAM',label:['Cánh tay A','Arm A'],unit:'m'},
  {key:'armBM',label:['Cánh tay B','Arm B'],unit:'m'},
  {key:'armCM',label:['Cánh tay C','Arm C'],unit:'m'},
  {key:'leftNm',label:copy.counter,unit:'N·m'},
  {key:'rightNm',label:copy.clockwise,unit:'N·m'},
  {key:'netNm',label:copy.net,unit:'N·m'}
 ],
 initial: initialLever,
 validate: validateLever,
 apply: applyLever,
 measure: measureLever,
 mount
};
