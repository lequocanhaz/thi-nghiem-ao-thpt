const MEDIA = ['water', 'bath', 'solid'];
const MAX_PLOT_POINTS = 480;
const TRACE_GAP_SECONDS = 1.5;

const labels = {
  vi: {
    title: 'So sánh các lượt',
    trial: 'Lượt',
    trialA: 'Lượt A',
    trialB: 'Lượt B',
    single: 'Chỉ xem lượt A',
    source: 'Nguồn nhiệt độ',
    student: 'Số em ghi',
    instrument: 'Nhiệt kế tự ghi',
    medium: 'Vị trí đo của đầu dò',
    origin: 'Mốc thời gian',
    start: 'Từ lúc bắt đầu',
    sample: 'Từ lúc đưa mẫu vào bình',
    missingOrigin: 'Lượt này chưa ghi thao tác đưa mẫu vào bình.',
    water: 'Nước trong bình',
    bath: 'Bể gia nhiệt',
    solid: 'Mẫu vật rắn',
    time: 'Thời gian mô phỏng (s)',
    timeAfterTransfer: 'Thời gian sau khi đưa mẫu vào bình (s)',
    temperature: 'Nhiệt độ (°C)',
    empty: 'Chưa có số đo phù hợp. Chọn vị trí đo khác hoặc thu thêm dữ liệu.',
    comparisonHint: 'Tạo thêm một lượt để đối chiếu trên cùng trục.',
    studentHint: 'Các chấm là số em tự ghi. Dấu × chỉ phép đo cục bộ khi nước chưa đều.',
    instrumentHint: 'Đường biểu diễn số chỉ nhiệt kế được lưu theo thời gian. Dấu × chỉ phép đo cục bộ khi nước chưa đều.',
    sampleHint: 'Đồ thị hiển thị mẫu rút gọn. CSV chứa toàn bộ dữ liệu đã ghi.',
    points: 'Số điểm',
    first: 'Điểm đầu',
    last: 'Điểm cuối',
    skipped: 'Điểm không vẽ do bị loại hoặc phép đo không hợp lệ',
    waterAtTransfer: 'Nước lúc đưa mẫu',
    addedIce: 'Tổng đá đã thả',
    transferredSolid: 'Vật rắn lúc chuyển',
    vesselCapacity: 'Nhiệt dung bình',
    changed: 'Điều kiện thay đổi hoặc có chất tràn trong lúc trao đổi nhiệt.'
  },
  en: {
    title: 'Compare trials',
    trial: 'Trial',
    trialA: 'Trial A',
    trialB: 'Trial B',
    single: 'Show only trial A',
    source: 'Temperature source',
    student: 'Your readings',
    instrument: 'Thermometer trace',
    medium: 'Probe placement',
    origin: 'Time origin',
    start: 'From trial start',
    sample: 'From sample transfer',
    missingOrigin: 'This trial has no recorded sample transfer.',
    water: 'Water in vessel',
    bath: 'Heating bath',
    solid: 'Solid sample',
    time: 'Simulation time (s)',
    timeAfterTransfer: 'Time after sample transfer (s)',
    temperature: 'Temperature (°C)',
    empty: 'No matching measurements yet. Choose another probe placement or collect more data.',
    comparisonHint: 'Add a trial to compare it on the same axes.',
    studentHint: 'Dots are your recorded readings. × marks a local reading in water that is not uniform.',
    instrumentHint: 'Lines show stored thermometer readings over time. × marks a local reading in water that is not uniform.',
    sampleHint: 'The plot displays a subset of the samples. The CSV contains all recorded data.',
    points: 'Points',
    first: 'First point',
    last: 'Last point',
    skipped: 'Excluded or invalid points omitted',
    waterAtTransfer: 'Water at sample transfer',
    addedIce: 'Total ice added',
    transferredSolid: 'Solid at transfer',
    vesselCapacity: 'Vessel heat capacity',
    changed: 'Conditions changed or material spilled during heat exchange.'
  }
};

const numberInRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

function sampleForPlot(points) {
  if (points.length <= MAX_PLOT_POINTS) return points;
  const result = [points[0]];
  const bucketSize = Math.ceil((points.length - 2) / ((MAX_PLOT_POINTS - 2) / 2));
  for (let start = 1; start < points.length - 1; start += bucketSize) {
    let minimum = start;
    let maximum = start;
    for (let index = start + 1; index < Math.min(start + bucketSize, points.length - 1); index++) {
      if (points[index].temperatureC < points[minimum].temperatureC) minimum = index;
      if (points[index].temperatureC > points[maximum].temperatureC) maximum = index;
    }
    result.push(points[Math.min(minimum, maximum)]);
    if (minimum !== maximum) result.push(points[Math.max(minimum, maximum)]);
  }
  result.push(points.at(-1));
  return result;
}

function firstSampleTransfer(trial) {
  let time = null;
  for (const event of trial?.events || []) {
    if (event?.accepted !== true || event.undone || !numberInRange(event.simTimeS, 0, 1e9)) continue;
    const sampleAdded = trial.activity === 'ice'
      ? event.actionType === 'add-ice' && event.payloadSI?.target === 'vessel' && event.payloadSI.massKg > 0
      : trial.activity === 'solid' && event.actionType === 'move-solid' && event.payloadSI?.target === 'water';
    if (sampleAdded && (time === null || event.simTimeS < time)) time = event.simTimeS;
  }
  return time;
}

export function prepareComparisonSeries(trial, { source = 'student', medium = 'water', origin = 'start' } = {}) {
  const instrument = source === 'instrument';
  const zeroTime = origin === 'sample' ? firstSampleTransfer(trial) : 0;
  if (zeroTime === null) return { count: 0, omitted: 0, points: [], missingOrigin: true };
  const data = instrument ? trial?.trace : trial?.readings;
  const stored = Array.isArray(data) ? data : [];
  const rows = stored.filter(row => numberInRange(row?.simTimeS, zeroTime, 1e9));
  rows.sort((a, b) => a.simTimeS - b.simTimeS);
  const points = [];
  let omitted = 0;
  let segment = 0;
  let previous = null;

  for (const row of rows) {
    const placement = instrument ? row.probePlacement : row.observation?.probePlacement;
    if (placement !== medium) {
      previous = null;
      continue;
    }
    const temperatureC = instrument ? row.displayTemperatureC : row.studentValueC;
    if (row.valid !== true || row.excludedReason || !numberInRange(temperatureC, -50, 150)) {
      omitted++;
      previous = null;
      continue;
    }
    const local = row.representative === false;
    const timeS = row.simTimeS - zeroTime;
    if (!previous || local || timeS - previous.timeS > TRACE_GAP_SECONDS) segment++;
    const point = { timeS, temperatureC, local, segment };
    points.push(point);
    previous = local ? null : point;
  }

  return {
    count: points.length,
    omitted,
    first: points[0],
    last: points.at(-1),
    points: sampleForPlot(points)
  };
}

function chartBounds(pairs) {
  let end = 1;
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const { series } of pairs) {
    for (const point of series.points) {
      end = Math.max(end, point.timeS);
      minimum = Math.min(minimum, point.temperatureC);
      maximum = Math.max(maximum, point.temperatureC);
    }
  }
  const padding = Math.max(1, (maximum - minimum) * 0.06);
  return { end, low: minimum - padding, high: maximum + padding };
}

function chartMarks(points, bounds, source, seriesName) {
  const lines = [];
  const markers = [];
  const localMarks = [];
  let previous = null;
  for (const point of points) {
    const x = Number((600 * point.timeS / bounds.end).toFixed(2));
    const y = Number((220 * (bounds.high - point.temperatureC) / (bounds.high - bounds.low)).toFixed(2));
    if (point.local) {
      localMarks.push(`M${x - 3},${y - 3}l6,6 M${x - 3},${y + 3}l6,-6`);
      previous = null;
      continue;
    }
    if (source === 'instrument') {
      const operation = previous?.segment === point.segment ? 'L' : 'M';
      lines.push(`${operation}${x},${y}`);
    }
    if (source === 'student' || previous?.segment !== point.segment) markers.push(`M${x},${y}h0.1`);
    previous = point;
  }
  return `<g class="l3-cmp-${seriesName}"><path class="l3-cmp-line" d="${lines.join(' ')}"/><path class="l3-cmp-marker" d="${markers.join(' ')}"/><path class="l3-cmp-local" d="${localMarks.join(' ')}"/></g>`;
}

function renderChart(pairs, source, origin, copy, format) {
  if (pairs.every(({ series }) => series.count === 0)) return `<p>${copy.empty}</p>`;
  const bounds = chartBounds(pairs);
  const fractions = [0, 1 / 3, 2 / 3, 1];
  const grid = fractions.map(fraction => `M0,${220 * fraction}H600 M${600 * fraction},0V220`).join(' ');
  const timeAxis = origin === 'sample' ? copy.timeAfterTransfer : copy.time;
  const label = `${copy[source]} · ${copy.temperature} · ${timeAxis}`;
  return `<figure class="l3-cmp-chart">
    <figcaption>${copy[source]} · ${copy.temperature}</figcaption>
    <div class="l3-cmp-axes">
      <div class="l3-cmp-ticks-y" aria-hidden="true">${fractions.map(f => `<span>${format(bounds.high - f * (bounds.high - bounds.low))}</span>`).join('')}</div>
      <svg viewBox="-4 -4 608 228" preserveAspectRatio="none" role="img" aria-label="${label}">
        <path class="l3-cmp-grid" d="${grid}"/>
        ${pairs.map(({ series, key }) => chartMarks(series.points, bounds, source, key)).join('')}
      </svg>
      <div class="l3-cmp-ticks-x" aria-hidden="true">${fractions.map(f => `<span>${format(f * bounds.end)}</span>`).join('')}</div>
    </div>
    <p class="l3-cmp-axis-label">${timeAxis}</p>
    <p class="l3-cmp-caption">${source === 'student' ? copy.studentHint : copy.instrumentHint} ${pairs.some(({ series }) => series.count > series.points.length) ? copy.sampleHint : ''}</p>
  </figure>`;
}

function renderConditions(trial, copy, format, formatMass) {
  const conditions = trial.conditionsSI || {};
  const accepted = (trial.events || []).filter(event => event?.accepted === true && !event.undone);
  const addedIce = accepted.some(event => event.actionType === 'add-ice' && event.payloadSI?.target === 'vessel');
  const movedSolid = accepted.some(event => event.actionType === 'move-solid' && event.payloadSI?.target === 'water');
  const condition = (name, value) => `<div><dt>${copy[name]}</dt><dd>${value}</dd></div>`;
  const temperature = value => Number.isFinite(value) ? `${format(value - 273.15)} °C` : '—';
  const mass = value => Number.isFinite(value) && Number.isFinite(value * 1000) && value >= 0 ? `${formatMass(value * 1000)} g` : '—';
  const lines = [];
  if ((addedIce || movedSolid) && Number.isFinite(conditions.waterMassKg)) {
    lines.push(condition('waterAtTransfer', `${mass(conditions.waterMassKg)} · ${temperature(conditions.waterTempK)}`));
  }
  if (addedIce) lines.push(condition('addedIce', mass(conditions.iceMassKg)));
  if (movedSolid) lines.push(condition('transferredSolid', `${mass(conditions.solidMassKg)} · ${temperature(conditions.solidTempK)}`));
  if (Number.isFinite(conditions.calorimeterHeatCapacityJPerK)) {
    lines.push(condition('vesselCapacity', `${format(conditions.calorimeterHeatCapacityJPerK)} J/K`));
  }
  return lines.join('');
}

function renderSummary(pairs, copy, format, formatMass) {
  const pointLabel = point => point ? `${format(point.temperatureC)} °C · ${format(point.timeS)} s${point.local ? ' ×' : ''}` : '—';
  return `<div class="l3-cmp-summaries">${pairs.map(({ trial, label, series, key }) => `<section class="l3-cmp-summary">
    <h3><span class="l3-cmp-key l3-cmp-${key}" aria-hidden="true"></span>${label}</h3>
    ${series.missingOrigin ? `<p class="l3-cmp-caption">${copy.missingOrigin}</p>` : ''}
    <dl>
      <div><dt>${copy.points}</dt><dd>${format(series.count)}</dd></div>
      <div><dt>${copy.first}</dt><dd>${pointLabel(series.first)}</dd></div>
      <div><dt>${copy.last}</dt><dd>${pointLabel(series.last)}</dd></div>
      ${series.omitted ? `<div><dt>${copy.skipped}</dt><dd>${format(series.omitted)}</dd></div>` : ''}
      ${renderConditions(trial, copy, format, formatMass)}
    </dl>
    ${trial.conditionsSI?.setupChangedDuringExchange || trial.conditionsSI?.spillMassKg > 0 ? `<p class="l3-cmp-caption">${copy.changed}</p>` : ''}
  </section>`).join('')}</div>`;
}

export function mountThermalComparison(host, { session, locale, view = {} }) {
  const copy = /^en/i.test(locale || '') ? labels.en : labels.vi;
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const format = value => Math.abs(value) >= 1e7 ? value.toExponential(2) : formatter.format(value);
  const massFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  const formatMass = value => value >= 1e7 ? value.toExponential(2) : massFormatter.format(value);
  const document = host.ownerDocument;
  const details = document.createElement('details');
  details.className = 'l3-comparison';
  const sameSession = view.sessionId === session.sessionId;
  details.open = sameSession && view.open === true;
  details.innerHTML = `<summary>${copy.title}</summary><div class="l3-cmp-body"></div>`;
  host.replaceChildren(details);

  let source = sameSession && view.source === 'instrument' ? 'instrument' : 'student';
  let medium = sameSession && MEDIA.includes(view.medium) ? view.medium : 'water';
  let origin = sameSession && view.origin === 'sample' ? 'sample' : 'start';
  let trialA = sameSession ? view.trialA : undefined;
  let trialB = sameSession ? view.trialB : undefined;
  let single = sameSession && view.single === true;
  let optionsKey = '';
  const body = details.querySelector('.l3-cmp-body');
  const option = (value, name, selected) => `<option value="${value}"${selected ? ' selected' : ''}>${escapeText(name)}</option>`;

  function refresh() {
    if (!details.open) return;
    details.dataset.source = source;
    const trials = session.trials || [];
    const media = session.activity === 'solid' ? MEDIA : ['water'];
    if (!media.includes(medium)) medium = 'water';
    if (!Number.isInteger(trialA) || trialA < 0 || trialA >= trials.length) trialA = Math.max(0, trials.length - 2);
    if (!Number.isInteger(trialB) || trialB < -1 || trialB >= trials.length || trialA === trialB || trialB === -1 && !single) {
      trialB = trials.length < 2 ? -1 : trials.length - 1 === trialA ? trialA - 1 : trials.length - 1;
    }
    if (!body.firstElementChild) {
      body.innerHTML = `<div class="l3-cmp-controls">
        <label>${copy.trialA}<select data-l3-cmp="a"></select></label>
        <label>${copy.trialB}<select data-l3-cmp="b"></select></label>
        <label>${copy.source}<select data-l3-cmp="source">${['student', 'instrument'].map(id => option(id, copy[id], id === source)).join('')}</select></label>
        ${media.length > 1 ? `<label>${copy.medium}<select data-l3-cmp="medium">${media.map(id => option(id, copy[id], id === medium)).join('')}</select></label>` : ''}
        <label>${copy.origin}<select data-l3-cmp="origin">${['start', 'sample'].map(id => option(id, copy[id], id === origin)).join('')}</select></label>
      </div><div class="l3-cmp-output"></div>`;
    }
    const key = `${trials.length}:${trialA}:${trialB}`;
    if (optionsKey !== key) {
      const selectA = body.querySelector('[data-l3-cmp=a]');
      const selectB = body.querySelector('[data-l3-cmp=b]');
      const trialOptions = (active, except) => trials.map((_, index) => index === except ? '' : option(index, `${copy.trial} ${index + 1}`, index === active)).join('');
      selectA.innerHTML = trialOptions(trialA);
      selectA.disabled = !trials.length;
      selectB.innerHTML = option(-1, copy.single, trialB === -1) + trialOptions(trialB, trialA);
      selectB.disabled = trials.length < 2;
      optionsKey = key;
    }
    const pairs = [{ index: trialA, key: 'a', label: copy.trialA }, { index: trialB, key: 'b', label: copy.trialB }]
      .filter(({ index }) => trials[index])
      .map(({ index, key, label }) => ({ trial: trials[index], key, label: `${label} · ${copy.trial} ${index + 1}`, series: prepareComparisonSeries(trials[index], { source, medium, origin }) }));
    body.querySelector('.l3-cmp-output').innerHTML = `${trials.length < 2 ? `<p class="l3-cmp-caption">${copy.comparisonHint}</p>` : ''}${renderChart(pairs, source, origin, copy, format)}${renderSummary(pairs, copy, format, formatMass)}`;
  }

  function choose(event) {
    const field = event.target.dataset?.l3Cmp;
    if (field === 'a') {
      const previous = trialA;
      trialA = Number(event.target.value);
      if (trialA === trialB) trialB = previous;
    }
    if (field === 'b') {
      trialB = Number(event.target.value);
      single = trialB === -1;
    }
    if (field === 'source') source = event.target.value;
    if (field === 'medium') medium = event.target.value;
    if (field === 'origin') origin = event.target.value;
    if (field) refresh();
  }

  details.addEventListener('toggle', refresh);
  body.addEventListener('change', choose);
  refresh();

  return {
    update(nextSession, { traceOnly = false } = {}) {
      session = nextSession;
      if (!traceOnly || source === 'instrument') refresh();
    },
    getView() {
      return { sessionId: session.sessionId, open: details.open, source, medium, origin, trialA, trialB, single };
    },
    destroy() {
      details.removeEventListener('toggle', refresh);
      body.removeEventListener('change', choose);
      details.remove();
    }
  };
}
