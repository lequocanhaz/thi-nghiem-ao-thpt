const railLengthM = 1;
const stationGapM = 0.06;
const railMarginM = 0.02;
const positionStepM = 0.005;
const focusToleranceM = 0.005;
const targetHeightM = 0.025;
const focalLengthsM = [0.12, 0.16, 0.20];
const stations = ['objectM', 'lensM', 'screenM'];
const stationNames = {
  objectM: ['Vật sáng', 'Object'],
  lensM: ['Thấu kính', 'Lens'],
  screenM: ['Màn hứng ảnh', 'Screen']
};
const rounded = value => Math.round(value * 1000) / 1000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const onScale = value => Number.isFinite(value) && Math.abs(value / positionStepM - Math.round(value / positionStepM)) < 1e-9;

export function railBounds(state, station) {
  if (station === 'objectM') return [railMarginM, rounded(state.lensM - stationGapM)];
  if (station === 'lensM') return [rounded(state.objectM + stationGapM), rounded(state.screenM - stationGapM)];
  if (station === 'screenM') return [rounded(state.lensM + stationGapM), railLengthM - railMarginM];
  return null;
}

export function validLensRail(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state) || Object.keys(state).length !== 4) return false;
  if (!Number.isInteger(state.lensNumber) || state.lensNumber < 1 || state.lensNumber > focalLengthsM.length) return false;
  if (!stations.every(station => Object.hasOwn(state, station) && onScale(state[station]))) return false;
  return state.objectM >= railMarginM && state.screenM <= railLengthM - railMarginM &&
    rounded(state.lensM - state.objectM) >= stationGapM && rounded(state.screenM - state.lensM) >= stationGapM;
}

export function opticalState(state) {
  const f = focalLengthsM[state.lensNumber - 1];
  const d = rounded(state.lensM - state.objectM);
  const screenDistanceM = rounded(state.screenM - state.lensM);
  const collimate = Math.abs(d - f) < 1e-12;
  const imageDistanceM = collimate ? null : (f * d) / (d - f);
  const magnification = imageDistanceM === null ? null : -imageDistanceM / d;
  const radiusM = 0.046;
  const blurDiameterM = Math.abs(2 * radiusM * (1 + screenDistanceM * (1 / d - 1 / f)));
  let focus = 'sharp';
  if (collimate) focus = 'parallel';
  else if (imageDistanceM < 0) focus = 'virtual';
  else if (imageDistanceM > railLengthM - railMarginM - state.lensM + focusToleranceM) focus = 'beyond';
  else if (screenDistanceM < imageDistanceM - focusToleranceM - 1e-12) focus = 'before';
  else if (screenDistanceM > imageDistanceM + focusToleranceM + 1e-12) focus = 'after';
  return {f, d, screenDistanceM, imageDistanceM, magnification, blurDiameterM, focus};
}

export function applyLensAction(state, action) {
  const invalid = {message: ['Thao tác này không phù hợp với bàn quang học.', 'This action is unavailable on the optical bench.']};
  if (!validLensRail(state) || !action || typeof action !== 'object') return invalid;
  if (action.type === 'replace-lens') {
    const candidate = {...state, lensNumber: action.lensNumber};
    return validLensRail(candidate) ? {state: candidate} : invalid;
  }
  if (action.type !== 'position' || !stations.includes(action.station) || !onScale(action.positionM)) return invalid;
  const next = {...state, [action.station]: rounded(action.positionM)};
  if (!validLensRail(next)) return {message: [
    'Đã tới chặn ray. Vật, kính và màn cần cách nhau ít nhất 6 cm và giữ nguyên thứ tự.',
    'Rail stop reached. Keep the object, lens, and screen in order with at least 6 cm between them.'
  ]};
  return {state: next};
}

const focusCopy = {
  sharp: ['Ảnh rõ trên màn', 'Sharp image on the screen'],
  before: ['Màn đang ở trước vị trí ảnh rõ', 'The screen is before the sharp image plane'],
  after: ['Màn đã qua vị trí ảnh rõ', 'The screen is beyond the sharp image plane'],
  beyond: ['Ảnh thật nằm ngoài phạm vi ray', 'The real image falls beyond the rail'],
  virtual: ['Ảnh ảo cùng phía với vật', 'Virtual image on the object side'],
  parallel: ['Chùm tia ló song song', 'The outgoing rays are parallel']
};
const focusHints = {
  sharp: ['Có thể ghi khoảng cách vật và màn tính từ thấu kính.', 'Distances from the lens can now be recorded.'],
  before: ['Dịch màn xa thấu kính hơn.', 'Move the screen farther from the lens.'],
  after: ['Dịch màn lại gần thấu kính.', 'Move the screen closer to the lens.'],
  beyond: ['Đưa vật ra xa thấu kính hơn để đưa vị trí hội tụ vào phạm vi ray.', 'Move the object farther from the lens to bring the focus onto the rail.'],
  virtual: ['Các đường kéo dài đứt nét gặp nhau phía vật. Màn bên kia kính chỉ hứng chùm tia phân kì.', 'The dashed extensions meet on the object side. The screen receives a diverging bundle.'],
  parallel: ['Vật đang ở tiêu diện. Dời vật để tìm một ảnh rõ ở khoảng cách hữu hạn.', 'The object is in the focal plane. Move the object to find a sharp image at a finite distance.']
};

function mountLensRail(host, {getState, dispatch, t}) {
  const x = positionM => 56 + 648 * positionM / railLengthM;
  const y = heightM => 149 - heightM * 425;
  const displayCm = value => (Math.round(value * 1000) / 10).toLocaleString(t(['vi-VN','en-US']));
  const ruler = Array.from({length: 51}, (_, index) => {
    const stationX = x(index / 50);
    const major = index % 5 === 0;
    return `<path d="M${stationX} 237v${major ? 11 : 5}"/>${major ? `<text x="${stationX}" y="265">${index * 2}</text>` : ''}`;
  }).join('');
  host.innerHTML = `<div class="practice-lens">
    <div class="lens-stage">
      <svg class="lens-schematic" viewBox="0 0 760 300" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="lensGlass" x2="1" y2="0"><stop stop-color="#393366"/><stop offset=".5" stop-color="#91baff" stop-opacity=".8"/><stop offset="1" stop-color="#33295d"/></linearGradient>
          <linearGradient id="lensScreenGlass" x2="1" y2="0"><stop stop-color="#4bd2bb" stop-opacity=".16"/><stop offset="1" stop-color="#94f4cd" stop-opacity=".43"/></linearGradient>
          <clipPath id="lensRayBounds"><rect x="22" y="19" width="716" height="203" rx="3"/></clipPath>
        </defs>
        <path class="lens-optic-axis" d="M30 149H730"/>
        <path class="lens-rail-shadow" d="M40 233H720"/><path class="lens-rail-track" d="M40 230H720"/>
        <g class="lens-ruler">${ruler}<text x="704" y="286">cm</text></g>
        <g data-lens-drawing="screenM">
          <rect x="-8" y="55" width="16" height="161" rx="4" class="lens-screen-edge" fill="url(#lensScreenGlass)"/>
          <path d="M0 215V231" class="lens-stand"/><path d="M-16 229H16" class="lens-screen-foot"/>
        </g>
        <g clip-path="url(#lensRayBounds)"><path class="lens-virtual-rays"/><path class="lens-light-rays"/></g>
        <g data-lens-drawing="lensM">
          <path class="lens-glass-outline" d="M0 87Q24 149 0 211Q-24 149 0 87Z" fill="url(#lensGlass)"/>
          <path class="lens-stand" d="M0 212V232"/><path class="lens-glass-foot" d="M-16 230H16"/>
        </g>
        <g data-lens-drawing="objectM" class="lens-object-drawing">
          <path class="lens-object-arrow" d="M0 149V${y(targetHeightM)}m-6 5 6-6 6 6"/>
          <path class="lens-stand" d="M0 157V230"/><path class="lens-object-foot" d="M-16 230H16"/>
        </g>
      </svg>
      ${stations.map(station => `<button type="button" data-lens-tool="${station}" class="lens-drag"><span aria-hidden="true"></span></button>`).join('')}
    </div>
    <div class="lens-observation" data-focus="before">
      <div class="lens-projection" aria-hidden="true"><span class="lens-projection-arrow">↓</span></div>
      <div><strong class="lens-focus-name" role="status"></strong><p class="lens-focus-hint"></p></div>
    </div>
    <div class="lens-controls">
      ${stations.map(station => `<label class="lens-position"><span class="lens-position-name"><span class="lens-marker" data-marker="${station}"></span>${t(stationNames[station])}<output aria-hidden="true" data-lens-position="${station}"></output></span><input type="range" data-lens-range="${station}" step="0.5"></label>`).join('')}
      <label class="lens-choice"><span>${t(['Mẫu kính hội tụ', 'Converging lens sample'])}</span><select data-lens-choice>${focalLengthsM.map((_,index) => `<option value="${index+1}">${t(['Mẫu','Sample'])} ${index+1}</option>`).join('')}</select></label>
    </div>
    <dl class="lens-distances"><div><dt>${t(['Vật đến kính','Object to lens'])}</dt><dd data-lens-distance="object"></dd></div><div><dt>${t(['Màn đến kính','Screen to lens'])}</dt><dd data-lens-distance="screen"></dd></div></dl>
  </div>`;
  const stage = host.querySelector('.lens-stage');
  const rays = host.querySelector('.lens-light-rays');
  const extensions = host.querySelector('.lens-virtual-rays');
  const observation = host.querySelector('.lens-observation');
  const focusName = host.querySelector('.lens-focus-name');
  const focusHint = host.querySelector('.lens-focus-hint');
  const imageArrow = host.querySelector('.lens-projection-arrow');
  const lensChoice = host.querySelector('[data-lens-choice]');
  const dObject = host.querySelector('[data-lens-distance=object]');
  const dScreen = host.querySelector('[data-lens-distance=screen]');
  const controls = Object.fromEntries(stations.map(station => [station, {
    tool: host.querySelector(`[data-lens-tool=${station}]`),
    drawing: host.querySelector(`[data-lens-drawing=${station}]`),
    range: host.querySelector(`[data-lens-range=${station}]`),
    output: host.querySelector(`[data-lens-position=${station}]`)
  }]));
  let drag = null;

  function paint(state) {
    const optics = opticalState(state);
    for (const station of stations) {
      const {tool, drawing, range, output} = controls[station];
      const [min, max] = railBounds(state, station);
      const cm = displayCm(state[station]);
      const absoluteX = x(state[station]);
      tool.style.left = `${absoluteX / 760 * 100}%`;
      tool.setAttribute('aria-label', `${t(stationNames[station])}, ${cm} cm`);
      drawing.setAttribute('transform', `translate(${absoluteX} 0)`);
      range.min = String(rounded(min * 100));
      range.max = String(rounded(max * 100));
      range.value = String(rounded(state[station] * 100));
      range.setAttribute('aria-valuetext', `${cm} cm`);
      output.textContent = `${cm} cm`;
    }
    lensChoice.value = String(state.lensNumber);
    const rayPaths = [], extensionPaths = [];
    for (const heightAtLens of [targetHeightM, 0, -0.032]) {
      const incomingAngle = (heightAtLens - targetHeightM) / optics.d;
      const refractedAngle = incomingAngle - heightAtLens / optics.f;
      const heightAtScreen = heightAtLens + refractedAngle * optics.screenDistanceM;
      const lensPoint = `${x(state.lensM)} ${y(heightAtLens)}`;
      const hitY = y(heightAtScreen);
      const end = hitY >= 55 && hitY <= 216 ? state.screenM : railLengthM;
      const endY = y(heightAtLens + refractedAngle * (end - state.lensM));
      rayPaths.push(`M${x(state.objectM)} ${y(targetHeightM)}L${lensPoint}L${x(end)} ${endY}`);
      if (optics.imageDistanceM !== null && optics.imageDistanceM < 0) {
        const to = Math.max(-0.06, state.lensM + optics.imageDistanceM);
        extensionPaths.push(`M${lensPoint}L${x(to)} ${y(heightAtLens + refractedAngle * (to - state.lensM))}`);
      }
    }
    rays.setAttribute('d', rayPaths.join(' '));
    extensions.setAttribute('d', extensionPaths.join(' '));
    imageArrow.style.setProperty('--lens-blur', `${clamp(optics.blurDiameterM * 52, 0, 14)}px`);
    imageArrow.style.setProperty('--lens-image-scale', String(clamp(optics.screenDistanceM / optics.d, .45, 1.85)));
    observation.dataset.focus = optics.focus;
    const label = t(focusCopy[optics.focus]);
    if (focusName.textContent !== label) focusName.textContent = label;
    focusHint.textContent = t(focusHints[optics.focus]);
    dObject.textContent = `${displayCm(optics.d)} cm`;
    dScreen.textContent = `${displayCm(optics.screenDistanceM)} cm`;
  }

  function onPointerDown(event) {
    const tool = event.target.closest('[data-lens-tool]');
    if (!tool || drag || event.button !== 0 || !event.isPrimary) return;
    const station = tool.dataset.lensTool;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width) return;
    event.preventDefault();
    tool.focus({preventScroll: true});
    try { tool.setPointerCapture(event.pointerId); } catch { return; }
    const start = getState();
    drag = {tool, station, pointerId: event.pointerId, start, preview: start, clientX: event.clientX, width: bounds.width};
    tool.dataset.dragging = 'true';
  }

  function onPointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const {start, station, clientX, width} = drag;
    const deltaM = (event.clientX - clientX) * 760 / (648 * width);
    const [min, max] = railBounds(start, station);
    const positionM = clamp(rounded(Math.round((start[station] + deltaM) / positionStepM) * positionStepM), min, max);
    if (positionM === drag.preview[station]) return;
    const {state} = applyLensAction(start, {type: 'position', station, positionM});
    if (state) {
      drag.preview = state;
      paint(state);
    }
  }

  function finishDrag(event, cancel = false) {
    if (!drag || (event?.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
    const {tool, pointerId, station, preview, start} = drag;
    drag = null;
    delete tool.dataset.dragging;
    if (tool.hasPointerCapture(pointerId)) tool.releasePointerCapture(pointerId);
    if (!cancel && preview[station] !== start[station]) dispatch({type: 'position', station, positionM: preview[station]});
    paint(getState());
  }

  function onKey(event) {
    const station = event.target.closest('[data-lens-tool]')?.dataset.lensTool;
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      finishDrag(null, true);
    } else if (station && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const state = getState();
      const [min, max] = railBounds(state, station);
      const delta = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? .02 : positionStepM);
      const positionM = clamp(rounded(state[station] + delta), min, max);
      if (positionM !== state[station]) dispatch({type: 'position', station, positionM});
    }
  }

  function onInput(event) {
    const station = event.target.dataset.lensRange;
    if (station) dispatch({type: 'position', station, positionM: rounded(Number(event.target.value) / 100)});
  }

  function onChange(event) {
    if (event.target === lensChoice) dispatch({type: 'replace-lens', lensNumber: Number(lensChoice.value)});
  }

  const pointerUp = event => finishDrag(event);
  const cancel = event => finishDrag(event, true);
  const blur = () => finishDrag(null, true);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', pointerUp);
  stage.addEventListener('pointercancel', cancel);
  stage.addEventListener('lostpointercapture', cancel);
  host.addEventListener('keydown', onKey);
  host.addEventListener('input', onInput);
  host.addEventListener('change', onChange);
  host.ownerDocument.defaultView.addEventListener('blur', blur);
  paint(getState());
  return {paint, destroy() {
    blur();
    stage.removeEventListener('pointerdown', onPointerDown);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerup', pointerUp);
    stage.removeEventListener('pointercancel', cancel);
    stage.removeEventListener('lostpointercapture', cancel);
    host.removeEventListener('keydown', onKey);
    host.removeEventListener('input', onInput);
    host.removeEventListener('change', onChange);
    host.ownerDocument.defaultView.removeEventListener('blur', blur);
  }};
}

export const practice = {
  id: 'lens',
  name: ['Tìm ảnh rõ trên màn', 'Focus an image on the screen'],
  prompt: ['Dịch vật, thấu kính và màn dọc theo ray. Kéo dụng cụ trực tiếp hoặc chỉnh vị trí theo từng 0,5 cm.', 'Move the object, lens, and screen along the rail. Drag the instruments or adjust the positions in 0.5 cm increments.'],
  task: ['Giữ cùng mẫu kính. Tìm và ghi hai cặp khoảng cách khi ảnh rõ, với vật ở hai khoảng cách khác nhau tới kính. Dùng d và d′ để tính f = dd′/(d + d′), rồi so sánh hai kết quả. Điều gì xảy ra khi đưa vật rất gần kính?', 'Keep the same lens sample. Find two sharply focused positions at different object-to-lens distances. Use d and d′ to calculate f = dd′/(d + d′) and compare the results. What happens when you place the object very close to the lens?'],
  limitations: ['Mô hình thấu kính mỏng hội tụ và tia cận trục. Điều kiện ghi số đo là màn cách mặt phẳng ảnh thật tối đa 0,5 cm. Vệt mờ minh họa độ lệch nét theo chùm tia hữu hạn. Ray dài 1 m.', 'This model uses a converging thin lens and paraxial rays. The screen must be within 0.5 cm of the real image plane to record distances. The blur illustrates defocus from a finite aperture. The rail is 1 m long.'],
  columns: [
    {key: 'objectDistanceM', label: ['Vật đến kính', 'Object to lens'], unit: 'm'},
    {key: 'screenDistanceM', label: ['Màn đến kính', 'Screen to lens'], unit: 'm'},
    {key: 'lensNumber', label: ['Mẫu kính', 'Lens sample'], unit: ''}
  ],
  initial: () => ({objectM: .14, lensM: .38, screenM: .72, lensNumber: 1}),
  validate: validLensRail,
  apply: applyLensAction,
  measure(state) {
    if (!validLensRail(state)) return null;
    const optics = opticalState(state);
    if (optics.focus !== 'sharp') return null;
    return {lensNumber: state.lensNumber, objectDistanceM: optics.d, screenDistanceM: optics.screenDistanceM};
  },
  mount: mountLensRail
};
