const reachM = .1;
const minimumPullM = .001;
const timeLimitS = 120;
const runtimeByState = new WeakMap();
const setting = {
  massKg: {min:.1, max:1.5, step:.05},
  stiffnessNPerM: {min:5, max:40, step:.5}
};
const inRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const isTime = value => inRange(value, 0, timeLimitS);
const velocityRate = ({massKg, stiffnessNPerM}) => Math.sqrt(stiffnessNPerM / massKg);

export function sampleOscillator(state, timeS) {
  const rate = velocityRate(state);
  const timeAngle = rate * timeS;
  const angleRad = timeAngle + (state.heldM < 0 ? Math.PI : 0);
  const amplitudeM = Math.abs(state.heldM);
  const positionM = state.heldM * Math.cos(timeAngle);
  return {positionM, velocityMPerS:-state.heldM * rate * Math.sin(timeAngle),
          accelerationMPerS2:-rate * rate * positionM, angleRad, amplitudeM};
}

function fullCycles(state, startS, endS) {
  return Math.floor((endS - startS) * velocityRate(state) / (2 * Math.PI) + 1e-9);
}

function elapsedReading(startS, endS) {
  return Math.round((endS - startS) * 100) / 100;
}

const initial = () => ({massKg:.5, stiffnessNPerM:10, heldM:0, released:false, startS:null, result:null});

function validate(state) {
  if (!state || typeof state !== 'object') return false;
  const {massKg, stiffnessNPerM, heldM, released, startS, result} = state;
  if (!inRange(massKg, setting.massKg.min, setting.massKg.max)
      || !inRange(stiffnessNPerM, setting.stiffnessNPerM.min, setting.stiffnessNPerM.max)
      || !inRange(heldM, -reachM, reachM) || typeof released !== 'boolean') return false;
  if (!released) return startS === null && result === null;
  if (Math.abs(heldM) < minimumPullM) return false;
  if (startS !== null) return isTime(startS) && result === null;
  return result === null || (typeof result === 'object' && isTime(result.startS)
    && isTime(result.endS) && result.endS > result.startS
    && fullCycles(state, result.startS, result.endS) >= 1);
}

function measure(state) {
  if (!validate(state) || !state.result) return null;
  const {startS, endS} = state.result;
  const durationS = elapsedReading(startS, endS);
  const cycles = fullCycles(state, startS, endS);
  return {massKg:state.massKg, stiffnessNPerM:state.stiffnessNPerM,
    amplitudeCm:Math.abs(state.heldM) * 100, durationS, cycles, meanPeriodS:durationS / cycles};
}

const reject = (vi, en) => ({message:[vi,en]});
function apply(state, action) {
  if (!validate(state) || !action || typeof action !== 'object') {
    return reject('Thiết lập con lắc không hợp lệ.', 'The oscillator setup is invalid.');
  }
  switch (action.type) {
    case 'pull':
      if (!inRange(action.value, -reachM, reachM)) return reject('Chỉ kéo vật trong khoảng ±10 cm.', 'Pull the mass within ±10 cm.');
      return {state:{...state, heldM:action.value, released:false, startS:null, result:null}};
    case 'setting': {
      const limits = Object.hasOwn(setting, action.key) && setting[action.key];
      if (!limits || !inRange(action.value, limits.min, limits.max)) {
        return reject('Giá trị của dụng cụ nằm ngoài miền cho phép.', 'The apparatus setting is outside its range.');
      }
      return {state:{...state, [action.key]:action.value, released:false, startS:null, result:null}};
    }
    case 'release':
      if (Math.abs(state.heldM) < minimumPullM) return reject('Kéo vật lệch vị trí cân bằng ít nhất 0,1 cm rồi thả.', 'Pull the mass at least 0.1 cm from equilibrium before releasing.');
      return {state:{...state, released:true, startS:null, result:null}};
    case 'start-watch':
      if (!state.released || state.startS !== null || !isTime(action.timeS) || action.timeS >= timeLimitS) {
        return reject('Thả vật rồi mới bấm giờ.', 'Release the mass before starting the watch.');
      }
      return {state:{...state, startS:action.timeS, result:null}};
    case 'stop-watch':
      if (!isTime(state.startS) || !isTime(action.timeS) || action.timeS <= state.startS
          || fullCycles(state, state.startS, action.timeS) < 1) {
        return reject('Chờ ít nhất một vòng trọn rồi chốt số đo.', 'Wait for at least one full cycle before stopping the watch.');
      }
      return {state:{...state, startS:null, result:{startS:state.startS,endS:action.timeS}}};
    default:
      return reject('Thao tác này không thuộc bàn con lắc.', 'This action is unavailable on the oscillator bench.');
  }
}

const restX = 360;
const rangeX = 185;
const railY = 145;
const pixelsAt = meters => restX + meters * rangeX / reachM;
const clampPull = meters => Math.round(1000 * Math.max(-reachM, Math.min(reachM, meters))) / 1000;

function railMarkup(eqLabel) {
  const ticks = [-10,-5,0,5,10].map(cm => {
    const x = pixelsAt(cm / 100);
    return `<path d="M ${x} 191 v 10"/><text x="${x}" y="220" text-anchor="middle">${cm > 0 ? '+' : ''}${cm}</text>`;
  }).join('');
  return `<svg class="osc-rail-diagram" viewBox="0 0 640 233" aria-hidden="true">
    <path class="osc-equilibrium" d="M ${restX} 35 V 190"/>
    <text class="osc-equilibrium-label" x="${restX}" y="44" text-anchor="middle">${eqLabel}</text>
    <path class="osc-track" d="M 45 176 H 601 M 80 176 V 184 M 575 176 V 184"/>
    <path class="osc-wall" d="M 48 103 V 176 M 30 109 L 48 103 M 30 122 L 48 116 M 30 135 L 48 129 M 30 148 L 48 142 M 30 161 L 48 155 M 30 174 L 48 168"/>
    <path class="osc-spring" d=""/>
    <g class="osc-ruler"><path d="M 155 191 H 575"/>${ticks}<text x="581" y="219">cm</text></g>
  </svg>`;
}

function settingMarkup(t, key, label, unit) {
  const {min,max,step} = setting[key];
  return `<label class="osc-setting"><span>${t(label)} <output data-setting-value="${key}"></output> ${unit}</span>
    <input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}"></label>`;
}

const coilPoints = Array.from({length:132}, (_, index) => {
  const fraction = (index + 1) / 132;
  return {fraction,y:(railY + 12 * Math.sin(fraction * 22 * Math.PI)).toFixed(2)};
});
function coilPath(endX) {
  const width = endX - 62;
  let path = `M 48 ${railY} L 62 ${railY}`;
  for (const {fraction,y} of coilPoints) path += `L ${(62 + width * fraction).toFixed(2)} ${y} `;
  return path + `L ${endX + 8} ${railY}`;
}

function mount(host, {getState, dispatch, t}) {
  host.classList.add('practice-oscillation');
  host.innerHTML = `<div class="osc-visual">
    <div class="osc-rail" data-osc-rail>
      ${railMarkup(t(['Cân bằng','Equilibrium']))}
      <button class="osc-mass" type="button" data-osc-mass aria-label="${t(['Khối nặng. Kéo trên ray hoặc dùng phím mũi tên, rồi thả.','Mass. Drag on the rail or use arrow keys, then release.'])}"><span aria-hidden="true">m</span></button>
    </div>
    <figure class="osc-phase">
      <figcaption>${t(['Vòng tròn pha','Phase circle'])}</figcaption>
      <svg viewBox="0 0 168 136" aria-hidden="true">
        <path class="osc-dial-axis" d="M 15 66 H 150 M 84 14 V 116"/>
        <circle class="osc-dial-ring" cx="84" cy="66" r="47"/>
        <path class="osc-phase-reference" data-osc-reference d="" hidden/>
        <path class="osc-phase-projection" data-osc-projection d=""/>
        <path class="osc-phase-vector" data-osc-vector d=""/>
        <circle class="osc-phase-point" data-osc-point cx="84" cy="66" r="5"/>
        <circle class="osc-phase-shadow" data-osc-shadow cx="84" cy="66" r="3"/>
        <text x="147" y="58">x</text>
      </svg>
    </figure>
  </div>
  <div class="osc-console">
    <div class="osc-controls">
      <label class="osc-setting"><span>${t(['Li độ đặt vật','Launch displacement'])} <output data-osc-held></output> cm</span>
        <input type="range" data-osc-pull min="-10" max="10" step=".1"></label>
      ${settingMarkup(t,'massKg',['Khối lượng','Mass'],'kg')}
      ${settingMarkup(t,'stiffnessNPerM',['Độ cứng lò xo','Spring constant'],'N/m')}
      <div class="osc-actions">
        <button type="button" data-osc-release>${t(['Thả vật','Release mass'])}</button>
        <button type="button" data-osc-pause hidden>${t(['Tạm dừng','Pause'])}</button>
      </div>
    </div>
    <div class="osc-watch" role="group" aria-label="${t(['Đồng hồ bấm giây','Stopwatch'])}">
      <div class="osc-watch-values">
        <span>${t(['Thời gian đo','Measured elapsed time'])}<strong><output data-osc-elapsed aria-live="off">0</output> s</strong></span>
        <span>${t(['Vòng trọn từ lúc bấm','Full cycles since start'])}<strong><output data-osc-cycles aria-live="off">0</output></strong></span>
      </div>
      <div class="osc-actions">
        <button type="button" data-osc-start>${t(['Bấm giờ','Start stopwatch'])}</button>
        <button type="button" data-osc-stop hidden>${t(['Chốt số đo','Stop stopwatch'])}</button>
      </div>
      <p data-osc-status aria-live="polite"></p>
    </div>
  </div>`;
  const $ = selector => host.querySelector(selector);
  const rail = $('[data-osc-rail]');
  const mass = $('[data-osc-mass]');
  const releaseButton = $('[data-osc-release]');
  const pauseButton = $('[data-osc-pause]');
  const startButton = $('[data-osc-start]');
  const stopButton = $('[data-osc-stop]');
  const pullControl = $('[data-osc-pull]');
  const settings = Object.keys(setting).map(key => ({
    key, input:$('[data-setting="' + key + '"]'), value:$('[data-setting-value="' + key + '"]')
  }));
  const spring = $('.osc-spring');
  const reference = $('[data-osc-reference]');
  const vector = $('[data-osc-vector]');
  const projection = $('[data-osc-projection]');
  const phasePoint = $('[data-osc-point]');
  const phaseShadow = $('[data-osc-shadow]');
  const status = $('[data-osc-status]');
  const elapsed = $('[data-osc-elapsed]');
  const cycles = $('[data-osc-cycles]');
  const held = $('[data-osc-held]');
  const controller = new AbortController();
  const on = (node, event, listener) => node.addEventListener(event, listener, {signal:controller.signal});
  const format = new Intl.NumberFormat(t(['vi-VN','en-US']), {maximumFractionDigits:3});
  const watchFormat = new Intl.NumberFormat(t(['vi-VN','en-US']), {minimumFractionDigits:2,maximumFractionDigits:2});
  const text = (node, value) => { if (node.textContent !== String(value)) node.textContent = value; };

  let running = false;
  let beganAt = 0;
  let priorS = 0;
  let hasRun = false;
  let frame = 0;
  let drag = null;
  let springEndOffset = 52;
  let paintedState;

  const time = (stamp = performance.now()) => Math.min(timeLimitS, priorS + (running ? Math.max(0, stamp - beganAt) / 1000 : 0));
  const xy = (state, phaseS) => {
    const phase = sampleOscillator(state, phaseS);
    const radius = 47 * phase.amplitudeM / reachM;
    return [84 + radius * Math.cos(phase.angleRad), 66 - radius * Math.sin(phase.angleRad)];
  };

  function draw(state, timeS) {
    const diagramState = drag ? {...state, heldM:drag.heldM} : state;
    const diagramTime = drag ? 0 : timeS;
    const {positionM} = sampleOscillator(diagramState, diagramTime);
    const x = pixelsAt(positionM);
    spring.setAttribute('d', coilPath(x - springEndOffset));
    mass.style.left = (x / 640 * 100) + '%';
    const [phaseX,phaseY] = xy(diagramState, diagramTime);
    vector.setAttribute('d', `M 84 66 L ${phaseX} ${phaseY}`);
    projection.setAttribute('d', `M ${phaseX} ${phaseY} V 66`);
    phasePoint.setAttribute('cx', phaseX);
    phasePoint.setAttribute('cy', phaseY);
    phaseShadow.setAttribute('cx', phaseX);
    const startS = hasRun ? state.startS : null;
    reference.toggleAttribute('hidden', startS === null);
    if (startS !== null) {
      const [guideX,guideY] = xy(state,startS);
      reference.setAttribute('d', `M 84 66 L ${guideX} ${guideY}`);
    }
    const interval = state.result ?? (startS === null ? null : {startS,endS:Math.max(startS,timeS)});
    text(elapsed, watchFormat.format(interval ? elapsedReading(interval.startS, interval.endS) : 0));
    text(cycles, interval ? fullCycles(state, interval.startS, interval.endS) : 0);
    text(held, format.format((drag ? drag.heldM : state.heldM) * 100));
  }

  function paint(state) {
    paintedState = state;
    for (const {key,input,value} of settings) {
      input.value = state[key];
      input.disabled = running;
      text(value, format.format(state[key]));
    }
    pullControl.value = state.heldM * 100;
    pullControl.disabled = running;
    mass.disabled = running;
    releaseButton.hidden = running;
    releaseButton.textContent = hasRun ? t(['Thả lại','Release again']) : t(['Thả vật','Release mass']);
    pauseButton.hidden = !hasRun || priorS >= timeLimitS;
    pauseButton.textContent = running ? t(['Tạm dừng','Pause']) : t(['Tiếp tục','Resume']);
    startButton.hidden = hasRun && state.startS !== null;
    startButton.disabled = !hasRun || priorS >= timeLimitS;
    stopButton.hidden = !hasRun || state.startS === null;
    text(status, state.result ? t(['Đã chốt. Ghi số đo vào sổ tay.', 'Reading ready. Record it in the notebook.'])
      : running && state.startS !== null ? t(['Dừng sát lúc kim pha quay lại vạch màu cam.', 'Stop when the phase hand returns to the orange mark.'])
      : running ? t(['Chọn thời điểm bắt đầu bấm giờ.', 'Choose when to start the stopwatch.'])
      : hasRun ? t(['Đồng hồ mô phỏng đã tạm dừng.', 'The simulation clock is paused.'])
      : t(['Kéo vật trên ray rồi thả.', 'Pull the mass along the rail and release.']));
    draw(state, time());
  }

  function pause() {
    if (!running) return;
    priorS = time();
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
    paint(getState());
  }

  function animate(stamp) {
    const timeS = time(stamp);
    if (timeS >= timeLimitS) {
      pause();
      return;
    }
    draw(getState(), timeS);
    frame = requestAnimationFrame(animate);
  }

  function resume() {
    beganAt = performance.now();
    running = true;
    frame = requestAnimationFrame(animate);
    paint(getState());
  }

  function resetPosition() {
    hasRun = false;
    priorS = 0;
  }

  function operate(action) {
    const accepted = dispatch(action);
    if (!accepted) {
      const error = apply(getState(), action).message;
      if (error) text(status, t(error));
    }
    return accepted;
  }
  function release() {
    if (running || !operate({type:'release'})) return;
    hasRun = true;
    priorS = 0;
    resume();
    pauseButton.focus({preventScroll:true});
  }

  on(releaseButton,'click',release);
  on(pauseButton,'click',() => running ? pause() : resume());
  on(startButton,'click',() => {
    if (operate({type:'start-watch',timeS:time()})) stopButton.focus({preventScroll:true});
  });
  on(stopButton,'click',() => {
    if (operate({type:'stop-watch',timeS:time()})) startButton.focus({preventScroll:true});
  });
  on(pullControl,'input',() => {
    resetPosition();
    dispatch({type:'pull',value:clampPull(Number(pullControl.value) / 100)});
  });
  for (const {key,input} of settings) on(input,'input',() => {
    resetPosition();
    dispatch({type:'setting',key,value:Number(input.value)});
  });

  on(mass,'click',event => { if (event.detail === 0) release(); });
  on(mass,'keydown',event => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      cancelDrag();
    }
    if (running || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? .01 : .001;
    const initialPosition = sampleOscillator(getState(), time()).positionM;
    resetPosition();
    dispatch({type:'pull',value:clampPull(initialPosition + (event.key === 'ArrowRight' ? step : -step))});
  });
  on(mass,'pointerdown',event => {
    if (running || drag || event.button !== 0) return;
    const state = getState();
    const startM = sampleOscillator(state, time()).positionM;
    drag = {pointerId:event.pointerId, startX:event.clientX, startM, heldM:startM};
    mass.setPointerCapture(event.pointerId);
    mass.classList.add('is-grabbed');
  });
  on(mass,'pointermove',event => {
    if (event.pointerId !== drag?.pointerId) return;
    drag.heldM = pointerPosition(event);
    draw(getState(), time());
  });
  on(mass,'pointerup',event => {
    if (event.pointerId !== drag?.pointerId) return;
    const startX = drag.startX;
    const heldM = pointerPosition(event);
    cancelDrag();
    if (Math.abs(event.clientX - startX) < 3) return;
    resetPosition();
    if (dispatch({type:'pull',value:heldM}) && Math.abs(heldM) >= minimumPullM) release();
  });
  function pointerPosition(event) {
    const scale = rail.getBoundingClientRect().width || 1;
    return clampPull(drag.startM + (event.clientX - drag.startX) / scale * 640 / rangeX * reachM);
  }
  function cancelDrag() {
    if (!drag) return;
    const {pointerId} = drag;
    drag = null;
    mass.classList.remove('is-grabbed');
    if (mass.hasPointerCapture(pointerId)) mass.releasePointerCapture(pointerId);
    draw(getState(), time());
  }
  on(mass,'pointercancel',cancelDrag);
  on(mass,'lostpointercapture',cancelDrag);
  on(document,'visibilitychange',() => { if (document.hidden) { cancelDrag(); pause(); } });
  function resizeRail() {
    const width = rail.clientWidth;
    if (!width) return;
    springEndOffset = mass.offsetWidth / width * 320;
    mass.style.setProperty('--osc-block-height', (width * 56 / 640) + 'px');
    draw(getState(),time());
  }
  const resize = new ResizeObserver(resizeRail);
  resize.observe(rail);

  // A locale redraw remounts the view with the same logical state object.
  // A new trial or imported session gets its own clock.
  const current = getState();
  const previousClock = runtimeByState.get(current);
  if (previousClock) {
    hasRun = true;
    priorS = previousClock.seconds;
    runtimeByState.delete(current);
  }
  if (previousClock?.running && priorS < timeLimitS) resume();
  else paint(current);
  return {paint, destroy() {
    if (hasRun) runtimeByState.set(paintedState, {seconds:time(),running});
    controller.abort();
    resize.disconnect();
    cancelAnimationFrame(frame);
    drag = null;
  }};
}

export const practice = {
  id:'oscillation',
  name:['Thực hành con lắc lò xo','Spring oscillator practical'],
  prompt:['Kéo vật lệch vị trí cân bằng và thả. Dùng đồng hồ để đo chu kì từ nhiều vòng dao động.', 'Pull the mass away from equilibrium and release it. Use the stopwatch to measure the period across several cycles.'],
  task:['Bấm giờ trong khi vật đang chạy. Chờ kim pha trở lại vạch màu cam khoảng ba lần, chốt rồi ghi số đo. Lặp lại với khối lượng khác và giữ độ cứng lò xo.', 'Start the stopwatch while the mass is moving. Wait for the phase hand to return to the orange mark about three times, stop the watch, then record. Repeat with a different mass and the same spring constant.'],
  limitations:['Lò xo tuân theo định luật Hooke, vật chuyển động ngang và bỏ qua ma sát. Đồng hồ đọc đến 0,01 s. Kết quả phụ thuộc lúc em bấm và dừng so với vị trí lặp lại trên vòng tròn pha.', 'The spring obeys Hooke’s law and the mass moves horizontally without friction. The watch reads to 0.01 s. Your result depends on when you start and stop relative to the repeated position on the phase circle.'],
  columns:[
    {key:'massKg',label:['Khối lượng','Mass'],unit:'kg'},
    {key:'meanPeriodS',label:['Chu kì đo được','Measured period'],unit:'s'},
    {key:'stiffnessNPerM',label:['Độ cứng','Spring constant'],unit:'N/m'},
    {key:'amplitudeCm',label:['Biên độ','Amplitude'],unit:'cm'},
    {key:'durationS',label:['Thời gian đo','Elapsed time'],unit:'s'},
    {key:'cycles',label:['Số vòng','Cycles'],unit:''}
  ],
  initial, validate, measure, apply, mount
};
