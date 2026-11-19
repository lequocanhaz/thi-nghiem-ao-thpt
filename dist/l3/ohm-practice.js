import {ohm} from '../physics.js';

export const circuitTerminals = {
  sourceP: {x: 16.7, y: 29, mark: '+', name: ['Nguồn dương', 'Source positive']},
  sourceN: {x: 16.7, y: 45, mark: '−', name: ['Nguồn âm', 'Source negative']},
  ammeterP: {x: 50, y: 24, mark: '+', name: ['Ampe kế dương', 'Ammeter positive']},
  ammeterN: {x: 50, y: 40, mark: '−', name: ['Ampe kế âm', 'Ammeter negative']},
  resistorP: {x: 50, y: 74, mark: '1', name: ['Điện trở đầu 1', 'Resistor terminal 1']},
  resistorN: {x: 50, y: 90, mark: '2', name: ['Điện trở đầu 2', 'Resistor terminal 2']},
  voltmeterP: {x: 83.3, y: 29, mark: '+', name: ['Vôn kế dương', 'Voltmeter positive']},
  voltmeterN: {x: 83.3, y: 45, mark: '−', name: ['Vôn kế âm', 'Voltmeter negative']}
};

export const circuitLeads = {
  source: {anchor: 'sourceP', color: '#e04b45', label: ['Nguồn +', 'Source +']},
  ammeter: {anchor: 'ammeterN', color: '#238ab5', label: ['Ampe kế −', 'Ammeter −']},
  return: {anchor: 'resistorN', color: '#64785d', label: ['Điện trở 2', 'Resistor 2']},
  voltageP: {anchor: 'voltmeterP', color: '#c27c14', label: ['Vôn kế +', 'Voltmeter +']},
  voltageN: {anchor: 'voltmeterN', color: '#9655bc', label: ['Vôn kế −', 'Voltmeter −']}
};

const messages = {
  open: ['Công tắc đang mở. Đóng công tắc sau khi nối dây.', 'The switch is open. Close it after attaching the leads.'],
  short: ['Ngắn mạch. Hai cực nguồn đang nối qua dây hoặc ampe kế mà không qua điện trở. Hãy mở công tắc và sửa cách nối.', 'Short circuit. The source terminals are joined through leads or the ammeter without the resistor. Open the switch and correct the wiring.'],
  loop: ['Chưa có vòng kín qua điện trở. Kiểm tra đường nối từ cực dương về cực âm của nguồn.', 'The resistor circuit is open. Check the path from the positive to the negative source terminal.'],
  series: ['Dòng điện đang đi vòng qua ampe kế. Nối ampe kế nối tiếp với điện trở.', 'The current bypasses the ammeter. Connect it in series with the resistor.'],
  parallel: ['Nối hai đầu vôn kế song song với hai đầu điện trở để đo hiệu điện thế.', 'Connect the voltmeter across the two ends of the resistor.'],
  polarity: ['Đồng hồ đang mắc ngược cực. Hãy đổi đầu nối để ghi số đo theo chiều dương.', 'A meter polarity is reversed. Swap its connections to record positive readings.'],
  ready: ['Mạch đã kín và hai đồng hồ đã mắc đúng. Đọc số chỉ rồi ghi một lần đo.', 'The circuit is closed and both meters are wired correctly. Read the displays and record a measurement.'],
  socket: ['Chọn một cọc khác đầu cố định của dây.', 'Choose a terminal different from the fixed end of the lead.'],
  invalid: ['Kiểm tra đầu dây hoặc giá trị cài đặt.', 'Check the lead or the setting.'],
  choose: ['Chọn hoặc kéo một đầu dây, sau đó chạm vào cọc cần nối.', 'Select or drag a lead, then attach it to a terminal.'],
  powered: ['Hãy mở công tắc trước khi tháo hoặc nối dây.', 'Open the switch before adding or removing a lead.']
};

const has = (object, key) => typeof key === 'string' && Object.hasOwn(object, key);
const terminalIds = Object.keys(circuitTerminals);
const leadIds = Object.keys(circuitLeads);

function initial() {
  return {supplyV: 6, resistance: 10, closed: false, connections: Object.fromEntries(leadIds.map(id => [id, null]))};
}

function validate(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)
      || !Number.isFinite(state.supplyV) || state.supplyV < 0 || state.supplyV > 12
      || !Number.isInteger(state.resistance) || state.resistance < 2 || state.resistance > 30
      || typeof state.closed !== 'boolean' || !state.connections || Array.isArray(state.connections)
      || Object.keys(state.connections).length !== leadIds.length) return false;
  return leadIds.every(id => Object.hasOwn(state.connections, id)
    && (state.connections[id] === null
      || has(circuitTerminals, state.connections[id]) && state.connections[id] !== circuitLeads[id].anchor));
}

function apply(state, action) {
  if (!validate(state) || !action || typeof action !== 'object') return {message: messages.invalid};
  switch (action.type) {
    case 'connect':
      if (!has(circuitLeads, action.lead) || !has(circuitTerminals, action.terminal)) return {message: messages.invalid};
      if (state.closed) return {message: messages.powered};
      if (action.terminal === circuitLeads[action.lead].anchor) return {message: messages.socket};
      return {state: {...state, connections: {...state.connections, [action.lead]: action.terminal}}};
    case 'disconnect':
      if (!has(circuitLeads, action.lead)) return {message: messages.invalid};
      if (state.closed) return {message: messages.powered};
      return {state: {...state, connections: {...state.connections, [action.lead]: null}}};
    case 'switch':
      return {state: {...state, closed: !state.closed}};
    case 'set': {
      if (!['supplyV', 'resistance'].includes(action.key)) return {message: messages.invalid};
      const next = {...state, [action.key]: action.value};
      return validate(next) ? {state: next} : {message: messages.invalid};
    }
    default:
      return {message: messages.invalid};
  }
}

// Wire-connected terminals share a potential. The ideal ammeter is conductive,
// while the voltmeter has infinite input resistance.
function nodeMap(state) {
  const nodes = Object.fromEntries(terminalIds.map(id => [id, id]));
  const join = (from, to) => {
    const original = nodes[to];
    for (const id of terminalIds) {
      if (nodes[id] === original) nodes[id] = nodes[from];
    }
  };
  for (const lead of leadIds) {
    const to = state.connections[lead];
    if (to !== null) join(circuitLeads[lead].anchor, to);
  }
  const leadsOnly = {...nodes};
  join('ammeterP', 'ammeterN');
  return {leadsOnly, nodes};
}

function acrossSource(nodes, from, to) {
  return nodes[from] === nodes.sourceP && nodes[to] === nodes.sourceN
    || nodes[to] === nodes.sourceP && nodes[from] === nodes.sourceN;
}

function meterValue(value, resolution) {
  return Math.round(value * resolution) / resolution;
}

export function observeCircuit(state) {
  if (!validate(state)) return {status: 'invalid'};
  if (!state.closed) return {status: 'open'};
  const {nodes, leadsOnly} = nodeMap(state);
  if (nodes.sourceP === nodes.sourceN) return {status: 'short'};
  if (!acrossSource(nodes, 'resistorP', 'resistorN')) return {status: 'loop'};
  if (acrossSource(leadsOnly, 'resistorP', 'resistorN')) return {status: 'series'};
  if (!acrossSource(nodes, 'voltmeterP', 'voltmeterN')) return {status: 'parallel'};

  const positiveAmmeter = leadsOnly.ammeterP === leadsOnly.sourceP
    || ['resistorP', 'resistorN'].some(id => nodes[id] === nodes.sourceN && leadsOnly[id] === leadsOnly.ammeterP);
  const positiveVoltmeter = nodes.voltmeterP === nodes.sourceP;
  const {i} = ohm(state.supplyV, state.resistance);
  return {
    status: positiveAmmeter && positiveVoltmeter ? 'ready' : 'polarity',
    voltage: meterValue((positiveVoltmeter ? 1 : -1) * state.supplyV, 100),
    current: meterValue((positiveAmmeter ? 1 : -1) * i, 1000)
  };
}

function measure(state) {
  const observation = observeCircuit(state);
  return observation.status === 'ready'
    ? {voltage: observation.voltage, current: observation.current, resistance: state.resistance}
    : null;
}

const devices = [
  {id: 'source', label: ['Nguồn một chiều', 'DC supply'], mark: 'U', unit: 'V'},
  {id: 'ammeter', label: ['Ampe kế', 'Ammeter'], mark: 'A', unit: 'A'},
  {id: 'resistor', label: ['Điện trở', 'Resistor'], mark: 'R', unit: 'Ω'},
  {id: 'voltmeter', label: ['Vôn kế', 'Voltmeter'], mark: 'V', unit: 'V'}
];

function mount(host, {getState, dispatch, t}) {
  let selected = null;
  let gesture = null;
  const number = (value, digits) => Number.isFinite(value)
    ? new Intl.NumberFormat(t(['vi-VN', 'en-US']), {maximumFractionDigits: digits}).format(value)
    : '—';
  const selectedLabel = lead => circuitLeads[lead].label;
  host.innerHTML = `<div class="practice-ohm">
    <div class="ohm-bench" role="group" aria-label="${t(['Bàn lắp mạch điện', 'Circuit assembly bench'])}">
      <canvas class="ohm-connections" aria-hidden="true"></canvas>
      ${devices.map(device => `<div class="ohm-instrument ohm-instrument-${device.id}">
        <strong><span aria-hidden="true">${device.mark}</span> ${t(device.label)}</strong>
        <output data-ohm-display="${device.id}">— ${device.unit}</output>
      </div>`).join('')}
      ${terminalIds.map(id => {
        const terminal = circuitTerminals[id];
        return `<button type="button" class="ohm-socket" data-ohm-terminal="${id}" aria-label="${t(terminal.name)}"
          title="${t(terminal.name)}" style="--socket-x:${terminal.x}%;--socket-y:${terminal.y}%"><span>${terminal.mark}</span></button>`;
      }).join('')}
    </div>
    <fieldset class="ohm-leads">
      <legend>${t(['Đầu dây có thể di chuyển', 'Movable lead ends'])}</legend>
      <div class="ohm-lead-list">
        ${leadIds.map(id => `<button type="button" data-ohm-lead="${id}" style="--lead-color:${circuitLeads[id].color}" aria-pressed="false">
          <i aria-hidden="true"></i>${t(selectedLabel(id))}
        </button>`).join('')}
      </div>
      <p class="ohm-lead-status" aria-live="polite"></p>
      <button type="button" data-ohm-disconnect hidden>${t(['Tháo đầu dây đã chọn', 'Disconnect selected lead'])}</button>
    </fieldset>
    <div class="ohm-supply-controls">
      <label>${t(['Điện áp nguồn (V)', 'Supply voltage (V)'])}<input data-ohm-setting="supplyV" type="number" min="0" max="12" step="any" inputmode="decimal"></label>
      <label>${t(['Điện trở (Ω)', 'Resistance (Ω)'])}<input data-ohm-setting="resistance" type="number" min="2" max="30" step="1" inputmode="numeric"></label>
      <button type="button" data-ohm-switch></button>
    </div>
    <p class="ohm-circuit-status" role="status"></p>
  </div>`;

  const root = host.firstElementChild;
  const bench = root.querySelector('.ohm-bench');
  const canvas = root.querySelector('canvas');
  const context = canvas.getContext('2d');
  const leadPrompt = root.querySelector('.ohm-lead-status');
  const disconnect = root.querySelector('[data-ohm-disconnect]');
  const power = root.querySelector('[data-ohm-switch]');
  const circuitStatus = root.querySelector('.ohm-circuit-status');
  const leadButtons = new Map(leadIds.map(id => [id, root.querySelector(`[data-ohm-lead="${id}"]`)]));
  const sockets = new Map(terminalIds.map(id => [id, root.querySelector(`[data-ohm-terminal="${id}"]`)]));
  const display = new Map(devices.map(({id, unit}) => [id, {node: root.querySelector(`[data-ohm-display="${id}"]`), unit}]));
  const settings = [...root.querySelectorAll('[data-ohm-setting]')];
  let suppressClick = false;

  function drawLeads(state) {
    if (!context) return;
    const rect = bench.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * scale), height = Math.round(rect.height * scale);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    const point = id => ({x: circuitTerminals[id].x / 100 * rect.width, y: circuitTerminals[id].y / 100 * rect.height});
    const line = (lead, endX, endY, preview = false) => {
      const {x, y} = point(circuitLeads[lead].anchor);
      const jog = Math.max(15, Math.min(50, Math.abs(endX - x) / 3));
      const direction = endX >= x ? 1 : -1;
      // Vertically aligned device sockets still get a visible outward bend.
      const offset = Math.abs(endX - x) < 8 ? 24 : 0;
      context.beginPath();
      context.moveTo(x, y);
      context.bezierCurveTo(x + direction * jog, y + offset, endX - direction * jog + offset, endY, endX, endY);
      context.strokeStyle = circuitLeads[lead].color;
      context.lineCap = 'round';
      context.lineWidth = lead === selected ? 4 : 2.5;
      context.setLineDash(preview ? [6, 4] : []);
      context.stroke();
    };
    for (const lead of leadIds) {
      const to = state.connections[lead];
      if (!to || gesture?.dragged && gesture.lead === lead) continue;
      const end = point(to);
      line(lead, end.x, end.y);
    }
    if (gesture?.dragged) line(gesture.lead, gesture.x - rect.left, gesture.y - rect.top, true);
  }

  function paintSelection(state) {
    for (const [id, button] of leadButtons) {
      button.setAttribute('aria-pressed', String(id === selected));
      const to = state.connections[id];
      const label = t(selectedLabel(id));
      button.setAttribute('aria-label', to
        ? label + t([' đang nối đến ', ' connected to ']) + t(circuitTerminals[to].name)
        : label + t([' chưa nối', ' disconnected']));
    }
    for (const [id, button] of sockets) {
      button.toggleAttribute('data-ohm-available', selected !== null && !state.closed && circuitLeads[selected].anchor !== id);
      button.toggleAttribute('data-ohm-connected', leadIds.some(lead => state.connections[lead] === id));
    }
    const to = selected && state.connections[selected];
    const text = selected
      ? (t(selectedLabel(selected)) + ' · ' + (to ? t(circuitTerminals[to].name) : t(['chưa nối', 'disconnected'])))
      : t(messages.choose);
    if (leadPrompt.textContent !== text) leadPrompt.textContent = text;
    disconnect.hidden = !to;
    disconnect.disabled = state.closed;
    drawLeads(state);
  }

  function paint(state) {
    paintSelection(state);
    const observation = observeCircuit(state);
    const values = {source: state.supplyV, resistor: state.resistance, ammeter: observation.current, voltmeter: observation.voltage};
    for (const [id, {node, unit}] of display) node.textContent = number(values[id], id === 'ammeter' ? 3 : 2) + ' ' + unit;
    for (const field of settings) {
      if (field !== host.ownerDocument.activeElement) field.value = String(state[field.dataset.ohmSetting]);
    }
    power.textContent = state.closed ? t(['Mở công tắc', 'Open switch']) : t(['Đóng công tắc', 'Close switch']);
    power.dataset.closed = String(state.closed);
    circuitStatus.dataset.level = observation.status === 'short' ? 'danger' : observation.status;
    const status = t(messages[observation.status]);
    if (circuitStatus.textContent !== status) circuitStatus.textContent = status;
  }

  function chooseLead(lead) {
    selected = lead;
    paintSelection(getState());
  }

  function connect(lead, terminal) {
    if (dispatch({type:'connect', lead, terminal})) {
      selected = null;
      paintSelection(getState());
    }
  }

  function click(event) {
    const lead = event.target.closest('[data-ohm-lead]');
    if (lead) {
      if (event.detail && suppressClick) {
        suppressClick = false;
        return;
      }
      chooseLead(lead.dataset.ohmLead);
      return;
    }
    const terminal = event.target.closest('[data-ohm-terminal]');
    if (terminal) {
      if (selected) connect(selected, terminal.dataset.ohmTerminal);
      return;
    }
    if (event.target.closest('[data-ohm-switch]')) dispatch({type:'switch'});
    if (event.target.closest('[data-ohm-disconnect]') && selected) dispatch({type:'disconnect', lead:selected});
  }

  function change(event) {
    const input = event.target.closest('[data-ohm-setting]');
    if (!input) return;
    const key = input.dataset.ohmSetting;
    if (!dispatch({type:'set', key, value:input.valueAsNumber})) input.value = String(getState()[key]);
  }

  function capture(event) {
    const button = event.target.closest('[data-ohm-lead]');
    if (!button || event.button !== 0 || !event.isPrimary || gesture) return;
    suppressClick = false;
    const {clientX, clientY, pointerId} = event;
    gesture = {pointerId, button, lead:button.dataset.ohmLead, startX:clientX, startY:clientY, x:clientX, y:clientY, dragged:false};
    button.setPointerCapture(pointerId);
  }

  function move(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (!gesture.dragged && Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) >= 7) {
      gesture.dragged = true;
      chooseLead(gesture.lead);
    }
    if (gesture.dragged) drawLeads(getState());
  }

  function release(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const {button, pointerId, lead, dragged} = gesture;
    gesture = null;
    if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    if (dragged) {
      suppressClick = true;
      if (event.type === 'pointerup') {
        const socket = host.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest('[data-ohm-terminal]');
        if (socket && bench.contains(socket)) connect(lead, socket.dataset.ohmTerminal);
      }
      drawLeads(getState());
    }
  }

  const listeners = [
    ['click', click], ['change', change], ['pointerdown', capture], ['pointermove', move],
    ['pointerup', release], ['pointercancel', release], ['lostpointercapture', release]
  ];
  for (const [type, listener] of listeners) root.addEventListener(type, listener);
  const observer = new ResizeObserver(() => drawLeads(getState()));
  observer.observe(bench);
  paint(getState());
  return {
    paint,
    destroy() {
      if (gesture?.button.hasPointerCapture(gesture.pointerId)) gesture.button.releasePointerCapture(gesture.pointerId);
      gesture = null;
      observer.disconnect();
      for (const [type, listener] of listeners) root.removeEventListener(type, listener);
    }
  };
}

export const practice = {
  id:'ohm',
  name:['Lắp mạch định luật Ohm', 'Build an Ohm’s law circuit'],
  prompt:['Lắp mạch kín qua điện trở và ampe kế. Nối vôn kế vào hai đầu điện trở, sau đó đóng công tắc và đọc hai đồng hồ.', 'Build a closed loop through the resistor and ammeter. Connect the voltmeter across the resistor, then close the switch and read both meters.'],
  task:['Giữ R cố định. Thay đổi điện áp nguồn, ghi ít nhất 5 cặp U–I và giải thích độ dốc. Lặp lại với điện trở khác để đối chiếu.', 'Hold R fixed. Vary the supply voltage, record at least five U–I pairs and explain the slope. Repeat with another resistor for comparison.'],
  limitations:['Nguồn, dây và điện trở lí tưởng. Vôn kế có độ phân giải 0,01 V; ampe kế 0,001 A. Mô hình báo ngắn mạch và khóa ghi số đo khi mạch không phù hợp.', 'Ideal source, leads and resistor. The meters resolve 0.01 V and 0.001 A. A short circuit or unsuitable wiring prevents recording.'],
  columns:[
    {key:'voltage',label:['Hiệu điện thế đo', 'Measured voltage'],unit:'V'},
    {key:'current',label:['Dòng điện đo','Measured current'],unit:'A'},
    {key:'resistance',label:['Điện trở','Resistance'],unit:'Ω'}
  ],
  initial,
  validate,
  measure,
  apply,
  mount
};
