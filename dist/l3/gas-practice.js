import {gas} from '../physics.js?v=17';

const MIN_M3 = 0.002;
const MAX_M3 = 0.010;
const T_K = 300;
const AMOUNT_MOL = 0.24;
const STEP_M3 = 0.0005;
const M3_PER_LITRE = 0.001;
const PRESSURE_DISPLAY_DECIMALS = 1;
const VOLUME_DISPLAY_DECIMALS = 2;

const text = {
  volume: ['Thể tích', 'Volume'],
  pressure: ['Áp suất', 'Pressure'],
  temperature: ['Nhiệt độ', 'Temperature'],
  amount: ['Lượng khí', 'Amount of gas'],
  piston: ['Pít-tông của xi lanh', 'Cylinder piston'],
  controls: ['Điều chỉnh pít-tông', 'Move the piston'],
  compress: ['Nén 0,5 L', 'Compress 0.5 L'],
  expand: ['Giãn 0,5 L', 'Expand 0.5 L'],
  drag: ['Kéo tay nắm sang trái để nén hoặc sang phải để giãn.', 'Drag the handle left to compress or right to expand.'],
  keys: ['Khi chọn tay nắm, dùng phím mũi tên. Home và End đưa pít-tông về hai chốt chặn.', 'With the handle focused, use the arrow keys. Home and End move to the two end stops.'],
  thermostat: ['Xi lanh kín, giữ nhiệt độ ở 300 K', 'Sealed cylinder, held at 300 K'],
  finer: ['Độ chia: 0,01 L và 0,1 kPa', 'Resolution: 0.01 L and 0.1 kPa'],
  preview: ['Thả tay để xác nhận', 'Release to set'],
  resetDrag: ['Đã hủy di chuyển pít-tông.', 'Piston movement cancelled.'],
  min: ['Pít-tông đã chạm chốt nén ở 2 L.', 'The piston has reached the compression stop at 2 L.'],
  max: ['Pít-tông đã chạm chốt giãn ở 10 L.', 'The piston has reached the expansion stop at 10 L.'],
  invalid: ['Hãy chọn thể tích hữu hạn trong khoảng 2 đến 10 L.', 'Choose a finite volume between 2 and 10 L.'],
};

function initial() {
  return {volumeM3: 0.006};
}

function validate(state) {
  return !!state && typeof state === 'object' && !Array.isArray(state)
    && Object.keys(state).length === 1 && Object.hasOwn(state, 'volumeM3')
    && Number.isFinite(state.volumeM3) && state.volumeM3 >= MIN_M3 && state.volumeM3 <= MAX_M3;
}

/** Thermodynamic quantities in SI. Derive pressure with the existing gas model. */
export function evaluateGasPractice(state) {
  if (!validate(state)) return null;
  const {volumeM3} = state;
  const {p} = gas(AMOUNT_MOL, T_K, volumeM3 / M3_PER_LITRE);
  return {volumeM3, pressurePa: p * 1_000, temperatureK: T_K, amountMol: AMOUNT_MOL};
}

function rounded(value, decimals) {
  return Number(value.toFixed(decimals));
}

function measure(state) {
  const model = evaluateGasPractice(state);
  if (!model) return null;
  return {
    volumeL: rounded(model.volumeM3 / M3_PER_LITRE, VOLUME_DISPLAY_DECIMALS),
    pressureKPa: rounded(model.pressurePa / 1_000, PRESSURE_DISPLAY_DECIMALS),
    temperatureK: model.temperatureK,
    amountMol: model.amountMol,
  };
}

function apply(state, action) {
  if (!validate(state) || action?.type !== 'move-piston') return {message: text.invalid};
  const {volumeM3} = action;
  if (!Number.isFinite(volumeM3)) return {message: text.invalid};
  if (volumeM3 < MIN_M3) return {message: text.min};
  if (volumeM3 > MAX_M3) return {message: text.max};
  return {state: {volumeM3}};
}

function roundDragVolume(volumeM3) {
  const litres = rounded(volumeM3 / M3_PER_LITRE, VOLUME_DISPLAY_DECIMALS);
  return Math.min(MAX_M3, Math.max(MIN_M3, litres * M3_PER_LITRE));
}

function mount(host, {getState, dispatch, t}) {
  const view = host.ownerDocument.defaultView;
  const listener = new view.AbortController();
  const {signal} = listener;
  let drag = null;
  host.innerHTML = `
    <div class="practice-gas">
      <div class="gas-bench">
        <p class="gas-thermostat"><span aria-hidden="true"></span>${t(text.thermostat)}</p>
        <div class="gas-instruments">
          <div class="gas-reading">
            <span>${t(text.pressure)}</span>
            <strong><output data-gas-pressure aria-label="${t(text.pressure)} (kPa)"></output> <small>kPa</small></strong>
          </div>
          <div class="gas-reading">
            <span>${t(text.volume)}</span>
            <strong><output data-gas-volume aria-label="${t(text.volume)} (L)"></output> <small>L</small></strong>
          </div>
          <div class="gas-reading gas-constant">
            <span>${t(text.temperature)}</span><strong>300 <small>K</small></strong>
          </div>
          <div class="gas-reading gas-constant">
            <span>${t(text.amount)}</span><strong><span data-gas-amount></span> <small>mol</small></strong>
          </div>
        </div>
        <div class="gas-mechanism">
          <div class="gas-cylinder" aria-hidden="true"></div>
          <div class="gas-travel" data-gas-track>
            <div class="gas-chamber" aria-hidden="true"></div>
            <div class="gas-shaft" aria-hidden="true"></div>
            <div data-gas-piston class="gas-piston" role="slider" tabindex="0"
              aria-label="${t(text.piston)}" aria-valuemin="2" aria-valuemax="10"
              aria-describedby="gas-practice-keys">
              <span class="gas-piston-disc" aria-hidden="true"></span>
              <span class="gas-piston-handle" aria-hidden="true">↔</span>
            </div>
            <div class="gas-scale" aria-hidden="true">
              <span>2</span><span>4</span><span>6</span><span>8</span><span>10 L</span>
            </div>
          </div>
        </div>
        <p class="gas-resolution">${t(text.finer)}</p>
      </div>
      <div class="gas-actions">
        <p>${t(text.drag)}</p>
        <div class="gas-buttons" role="group" aria-label="${t(text.controls)}">
          <button type="button" data-gas-step="compress"><span aria-hidden="true">←</span> ${t(text.compress)}</button>
          <button type="button" data-gas-step="expand">${t(text.expand)} <span aria-hidden="true">→</span></button>
        </div>
        <p id="gas-practice-keys" class="gas-keys">${t(text.keys)}</p>
        <p class="gas-feedback" role="status" data-gas-feedback></p>
        <p class="gas-feedback gas-preview" data-gas-preview hidden aria-hidden="true"></p>
      </div>
    </div>`;

  const find = selector => host.querySelector(selector);
  const track = find('[data-gas-track]');
  const piston = find('[data-gas-piston]');
  const pressure = find('[data-gas-pressure]');
  const volume = find('[data-gas-volume]');
  const amount = find('[data-gas-amount]');
  const feedback = find('[data-gas-feedback]');
  const preview = find('[data-gas-preview]');
  const compress = find('[data-gas-step=compress]');
  const expand = find('[data-gas-step=expand]');
  const locale = t(['vi-VN','en-US']);
  const number = digits => new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
  const volumeFormat = number(VOLUME_DISPLAY_DECIMALS);
  const pressureFormat = number(PRESSURE_DISPLAY_DECIMALS);
  amount.textContent = number(2).format(AMOUNT_MOL);

  function setPosition(volumeM3) {
    track.style.setProperty('--gas-volume', (volumeM3 / MAX_M3 * 100) + '%');
  }

  function paint(state) {
    if (!drag) setPosition(state.volumeM3);
    const reading = measure(state);
    pressure.textContent = pressureFormat.format(reading.pressureKPa);
    volume.textContent = volumeFormat.format(reading.volumeL);
    piston.setAttribute('aria-valuenow', String(reading.volumeL));
    piston.setAttribute('aria-valuetext', volume.textContent + ' L');
    // Keep the focused control in the tab order when it reaches a stop.
    compress.setAttribute('aria-disabled', String(state.volumeM3 <= MIN_M3));
    expand.setAttribute('aria-disabled', String(state.volumeM3 >= MAX_M3));
  }

  function commit(volumeM3) {
    const current = getState();
    const bounded = roundDragVolume(volumeM3);
    const applied = bounded !== current.volumeM3 && dispatch({type: 'move-piston', volumeM3: bounded});
    const {volumeM3: actual} = getState();
    feedback.textContent = actual <= MIN_M3 ? t(text.min) : actual >= MAX_M3 ? t(text.max) : '';
    if (!applied) paint(getState());
  }

  function begin(event) {
    if (drag || event.isPrimary === false || event.button !== 0) return;
    const width = track.getBoundingClientRect().width;
    if (width <= 0) return;
    event.preventDefault();
    piston.focus({preventScroll: true});
    drag = {id: event.pointerId, x: event.clientX, width, volumeM3: getState().volumeM3};
    piston.setPointerCapture?.(event.pointerId);
    track.dataset.dragging = 'true';
    preview.hidden = false;
    feedback.textContent = '';
    preview.textContent = t(text.preview) + ' · ' + volumeFormat.format(drag.volumeM3 / M3_PER_LITRE) + ' L';
  }

  function draggingVolume(clientX) {
    return roundDragVolume(drag.volumeM3 + (clientX - drag.x) * MAX_M3 / drag.width);
  }

  function move(event) {
    if (event.pointerId !== drag?.id) return;
    event.preventDefault();
    const volumeM3 = draggingVolume(event.clientX);
    setPosition(volumeM3);
    preview.textContent = t(text.preview) + ' · ' + volumeFormat.format(volumeM3 / M3_PER_LITRE) + ' L';
  }

  function finish(event, cancel) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const {id} = drag;
    const volumeM3 = cancel ? drag.volumeM3 : draggingVolume(event.clientX);
    drag = null;
    if (piston.hasPointerCapture?.(id)) piston.releasePointerCapture(id);
    delete track.dataset.dragging;
    preview.hidden = true;
    if (cancel) {
      feedback.textContent = t(text.resetDrag);
      paint(getState());
    } else {
      commit(volumeM3);
    }
  }

  function step(direction) {
    if (!drag) commit(getState().volumeM3 + direction * STEP_M3);
  }

  function onKey(event) {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      event.stopPropagation();
      finish(null, true);
      return;
    }
    const key = event.key;
    if (drag || !['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End'].includes(key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (key === 'Home') commit(MIN_M3);
    else if (key === 'End') commit(MAX_M3);
    else step(key === 'ArrowLeft' || key === 'ArrowDown' ? -1 : 1);
  }

  piston.addEventListener('pointerdown', begin, {signal});
  piston.addEventListener('pointermove', move, {signal});
  piston.addEventListener('pointerup', event => finish(event, false), {signal});
  piston.addEventListener('pointercancel', event => finish(event, true), {signal});
  piston.addEventListener('lostpointercapture', event => finish(event, true), {signal});
  piston.addEventListener('keydown', onKey, {signal});
  view.addEventListener('blur', () => finish(null, true), {signal});
  compress.addEventListener('click', () => step(-1), {signal});
  expand.addEventListener('click', () => step(1), {signal});
  paint(getState());

  return {paint, destroy(){ finish(null, true); listener.abort(); }};
}

export const practice = {
  id: 'gas',
  name: ['Xi lanh khí lí tưởng', 'Ideal gas cylinder'],
  prompt: ['Kéo pít-tông để thay đổi thể tích khối khí. Đọc áp suất sau khi thả tay.', 'Move the piston to change the volume of the gas. Read the pressure after releasing it.'],
  task: ['Giữ nhiệt độ và lượng khí cố định. Ghi tại ít nhất ba thể tích khác nhau. Tính tích pV và so sánh các lượt đo theo độ chia của dụng cụ.', 'Keep temperature and amount fixed. Record at least three different volumes. Calculate pV and compare the readings in light of the instrument resolution.'],
  limitations: ['Khí lí tưởng trong xi lanh kín đạt cân bằng đẳng nhiệt ở mỗi vị trí. Bộ điều nhiệt duy trì 300 K. Dụng cụ làm tròn số đọc theo độ chia và khối khí được minh họa bằng một vùng màu.', 'Ideal gas in a sealed cylinder reaches isothermal equilibrium at each position. The thermostat maintains 300 K. Instruments round to their resolution, and the colored chamber represents the gas.'],
  columns: [
    {key: 'volumeL', label: text.volume, unit: 'L'},
    {key: 'pressureKPa', label: text.pressure, unit: 'kPa'},
    {key: 'temperatureK', label: text.temperature, unit: 'K'},
    {key: 'amountMol', label: text.amount, unit: 'mol'},
  ],
  initial, validate, measure, apply, mount,
};
