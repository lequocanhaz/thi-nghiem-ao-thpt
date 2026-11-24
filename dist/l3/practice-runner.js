import {getLocale, onLocaleChange} from '../i18n.js?v=54';
import {mountPracticeView} from './practice-view.js?v=95';
import {
  createPracticeSession, createRun, dataSafe, exportPracticeCSV, maxBytes, maxEvents, maxReadings,
  maxRuns, parsePracticeSession, serializePracticeSession, validValues
} from './practice-session.js?v=94';

const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function download(text, filename, mime) {
  const url = URL.createObjectURL(new Blob([text], {type: mime}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountPractice(host, practice, {storage, updateContext} = {}) {
  const key = 'quanh-practice-' + practice.id + '-v1';
  let locale = getLocale();
  const t = pair => pair[locale === 'en-US' ? 1 : 0];
  const label = pair => escapeHtml(t(pair));
  let rawBackup = '';
  let storageError = false;
  let session = createPracticeSession(practice);
  try {
    const saved = storage?.getItem(key);
    if (saved) {
      try { session = parsePracticeSession(saved, practice); }
      catch { rawBackup = saved; }
    }
  } catch { storageError = true; }
  const run = () => session.runs.at(-1);
  const q = selector => host.querySelector(selector);
  let apparatus, viewport;
  let draftTimer = 0;
  let alive = true;
  let message = null;
  const suggestedAxes = {oscillation: ['massKg', 'meanPeriodS'], lever: ['leftNm', 'rightNm']};
  let axes = suggestedAxes[practice.id] || [practice.columns[0].key, practice.columns[1].key];
  const colors = ['#087f8c', '#c06022', '#7655bc', '#2e7142'];
  let formatter = new Intl.NumberFormat(locale, {maximumSignificantDigits: 8});
  const format = number => formatter.format(number);
  const setStatus = (copy, error = false) => {
    message = {copy, error};
    q('#practiceStatus').textContent = t(copy);
    q('#practiceStatus').dataset.error = String(error);
  };
  function showStorageStatus() {
    q('#practiceStorage').textContent = rawBackup
      ? t(['Bản lưu trên thiết bị chưa đọc được. Có thể tải bản gốc hoặc nhập phiên hợp lệ.', 'The device save could not be read. Download the original or import a valid session.'])
      : storageError
        ? t(['Thiết bị chưa lưu được phiên này. Dùng nút Xuất JSON để giữ số liệu.', 'This device could not save the session. Export JSON to keep your data.'])
        : '';
    q('[data-practice-action=backup]').hidden = !rawBackup;
  }
  function persist() {
    if (!rawBackup) {
      try {
        if (!storage) throw new Error('Unavailable storage');
        storage.setItem(key, serializePracticeSession(session));
        storageError = false;
      } catch { storageError = true; }
    }
    showStorageStatus();
  }
  function refreshState() {
    const values = practice.measure(run().state);
    const readout = q('#practiceReadout');
    const ready = validValues(practice, values);
    readout.dataset.ready = String(ready);
    readout.innerHTML = ready
      ? practice.columns.map(column => '<div><dt>' + label(column.label) + '</dt><dd>' + format(values[column.key]) +
        (column.unit ? ' <span>' + escapeHtml(column.unit) + '</span>' : '') + '</dd></div>').join('')
      : '<div class="practice-unavailable">' + label(['Chưa có phép đo hợp lệ', 'No valid measurement yet']) + '</div>';
    q('[data-practice-action=record]').disabled = !ready || run().readings.length >= maxReadings || Boolean(rawBackup);
  }
  function dispatch(action) {
    if (!alive || !dataSafe(action) || !action || Array.isArray(action) || typeof action !== 'object') return false;
    if (rawBackup) return false;
    if (run().events.length >= maxEvents) {
      setStatus(['Lượt đã đủ số thao tác. Mở lượt mới để tiếp tục.', 'This trial has reached its action limit. Begin a new trial to continue.'], true);
      return false;
    }
    const result = practice.apply(run().state, action);
    const accepted = result?.state !== undefined && dataSafe(result.state) && practice.validate(result.state) === true;
    const type = typeof action.type === 'string' ? action.type : typeof action.actionType === 'string' ? action.actionType : 'apparatus';
    run().events.push({schemaVersion: 1, type: type.slice(0, 64), action: structuredClone(action), accepted, recordedAt: new Date().toISOString()});
    if (accepted) {
      run().state = result.state;
      apparatus?.paint(run().state);
      viewport?.paint(run().state);
      refreshState();
      setStatus(result.message || ['', '']);
    } else {
      setStatus(result?.message || ['Thao tác chưa hợp lệ. Kiểm tra dụng cụ và thử lại.', 'This action is invalid. Check the setup and try again.'], true);
    }
    persist();
    return accepted;
  }
  function plot() {
    const plotHost = q('#practicePlot');
    const points = session.runs.flatMap((item, index) => item.readings.map(row => ({x: row.values[axes[0]], y: row.values[axes[1]], index})));
    if (!points.length) {
      plotHost.textContent = t(['Ghi số đo để xem các điểm trên đồ thị.', 'Record a reading to plot the data.']);
      return;
    }
    const xColumn = practice.columns.find(column => column.key === axes[0]);
    const yColumn = practice.columns.find(column => column.key === axes[1]);
    const minMax = key => {
      const values = points.map(point => point[key]);
      const min = Math.min(...values), max = Math.max(...values);
      const padding = (max - min || Math.abs(max) || 1) * .1;
      return [min - padding, max + padding];
    };
    const [minX, maxX] = minMax('x'), [minY, maxY] = minMax('y');
    const x = value => 80 + (value - minX) / (maxX - minX) * 440;
    const y = value => 218 - (value - minY) / (maxY - minY) * 180;
    const pointsMarkup = points.map(point => '<circle cx="' + x(point.x).toFixed(2) + '" cy="' + y(point.y).toFixed(2) +
      '" r="4" fill="' + colors[point.index % colors.length] + '"/>').join('');
    const ticks = [0, .5, 1].map(fraction => {
      const valueX = minX + fraction * (maxX - minX), valueY = minY + fraction * (maxY - minY);
      return '<path d="M' + x(valueX) + ' 38V218 M80 ' + y(valueY) + 'H520"/>' +
        '<text x="' + x(valueX) + '" y="237" text-anchor="middle">' + format(valueX) + '</text>' +
        '<text x="73" y="' + (y(valueY) + 4) + '" text-anchor="end">' + format(valueY) + '</text>';
    }).join('');
    const axisLabel = column => t(column.label) + (column.unit ? ' (' + column.unit + ')' : '');
    const plotLabel = t(['Đồ thị số đo', 'Recorded readings']) + ' · ' + axisLabel(yColumn) + ' / ' + axisLabel(xColumn);
    plotHost.innerHTML =
      '<svg viewBox="0 0 550 270" role="img" aria-label="' + escapeHtml(plotLabel) + '">' +
      '<text x="80" y="24">' + escapeHtml(axisLabel(yColumn)) + '</text>' +
      '<g class="practice-ticks">' + ticks + '</g>' + pointsMarkup +
      '<text x="300" y="259" text-anchor="middle">' + escapeHtml(axisLabel(xColumn)) + '</text></svg>' +
      '<ul class="practice-legend">' + [...new Set(points.map(point => point.index))].map(index =>
        '<li><span class="practice-dot tone-' + (index % colors.length) + '" aria-hidden="true"></span>' +
        label(['Lượt ', 'Trial ']) + (index + 1) + '</li>').join('') + '</ul>';
  }
  function refreshNotebook() {
    const rows = q('#practiceRows');
    const fragment = document.createDocumentFragment();
    let count = 0;
    session.runs.forEach((item, index) => item.readings.forEach(row => {
      const tr = fragment.appendChild(document.createElement('tr'));
      const values = [String(index + 1), String(++count), ...practice.columns.map(column => format(row.values[column.key]))];
      values.forEach(value => tr.insertCell().textContent = value);
    }));
    rows.replaceChildren(fragment);
    q('#practiceRun').textContent = t(['Lượt ', 'Trial ']) + session.runs.length + ' · ' + run().readings.length + t([' số đo', ' readings']);
    q('[data-practice-action=new]').disabled = Boolean(rawBackup) || session.runs.length >= maxRuns;
    plot();
  }
  function build() {
    const cameraState = viewport?.snapshot();
    viewport?.destroy();
    apparatus?.destroy?.();
    const stableFocus = document.activeElement?.id;
    const unitText = column => column.unit ? ' (' + escapeHtml(column.unit) + ')' : '';
    const columnOptions = practice.columns.map(column =>
      '<option value="' + escapeHtml(column.key) + '">' + label(column.label) + unitText(column) + '</option>').join('');
    host.innerHTML = `
      <article class="practice-lab lab" data-practice-id="${escapeHtml(practice.id)}" lang="${locale === 'en-US' ? 'en' : 'vi'}">
        <nav class="practice-breadcrumb" aria-label="${label(['Điều hướng bài thực hành', 'Practice navigation'])}">
          <a href="#library">← ${label(['Thư viện', 'Library'])}</a>
          <a href="#lab/${escapeHtml(practice.id)}">${label(['Mô hình và bài học', 'Model and lesson'])}</a>
        </nav>
        <header class="practice-heading"><h1 tabindex="-1" id="practiceTitle">${label(practice.name)}</h1><p>${label(practice.prompt)}</p></header>
        <section class="practice-workspace">
          <div id="practiceApparatus"></div>
          <aside class="practice-side">
            <p class="practice-run" id="practiceRun"></p>
            <h2>${label(['Số chỉ dụng cụ', 'Instrument readings'])}</h2>
            <dl id="practiceReadout"></dl>
            <button type="button" class="practice-primary" data-practice-action="record">${label(['Ghi số đo','Record reading'])}</button>
            <p class="practice-status" id="practiceStatus" role="status"></p>
            <details class="practice-guide"><summary>${label(['Nhiệm vụ khảo sát', 'Investigation task'])}</summary><p>${label(practice.task)}</p></details>
            <details class="practice-guide"><summary>${label(['Giới hạn mô hình', 'Model limits'])}</summary><p>${label(practice.limitations)}</p></details>
          </aside>
        </section>
        <section class="practice-notebook" aria-labelledby="practiceNotebook">
          <div class="practice-notebook-header">
            <h2 id="practiceNotebook">${label(['Sổ tay thực nghiệm', 'Experiment notebook'])}</h2>
            <div class="practice-actions">
              <button type="button" data-practice-action="new">${label(['Bắt đầu lượt mới', 'Begin new trial'])}</button>
              <button type="button" data-practice-action="csv">${label(['Xuất CSV', 'Export CSV'])}</button>
              <button type="button" data-practice-action="json">${label(['Xuất JSON', 'Export JSON'])}</button>
              <button type="button" data-practice-action="import">${label(['Nhập phiên', 'Import session'])}</button>
              <button type="button" data-practice-action="backup" hidden>${label(['Tải bản lưu gốc', 'Download original save'])}</button>
              <input type="file" id="practiceImport" accept="application/json,.json" hidden>
            </div>
          </div>
          <p id="practiceStorage" class="practice-storage" role="status"></p>
          <details class="practice-guide"><summary>${label(['Ghi dự đoán', 'Write a prediction'])}</summary>
            <label for="practicePrediction">${label(['Em dự đoán điều gì trước khi đo?', 'What do you predict before measuring?'])}</label>
            <textarea id="practicePrediction" data-practice-note="prediction" maxlength="4000"></textarea>
          </details>
          <div class="practice-table" role="region" tabindex="0" aria-label="${label(['Bảng số đo theo lượt', 'Readings by trial'])}">
            <table><thead><tr><th scope="col">${label(['Lượt', 'Trial'])}</th><th scope="col">${label(['Điểm', 'Point'])}</th>
              ${practice.columns.map(column => '<th scope="col">' + label(column.label) + '<small>' + unitText(column) + '</small></th>').join('')}
            </tr></thead><tbody id="practiceRows"></tbody></table>
          </div>
          <details class="practice-guide" id="practiceGraph"><summary>${label(['Đồ thị số đo', 'Readings plot'])}</summary>
            <div class="practice-axis"><label>${label(['Trục ngang', 'Horizontal axis'])} <select id="practiceAxisX">${columnOptions}</select></label>
            <label>${label(['Trục dọc', 'Vertical axis'])} <select id="practiceAxisY">${columnOptions}</select></label></div>
            <div id="practicePlot" class="practice-plot"></div>
          </details>
          <details class="practice-guide"><summary>${label(['Phân tích và kết luận', 'Analysis and conclusion'])}</summary>
            <label for="practiceAnalysis">${label(['Em thấy quy luật gì trong số đo?', 'What pattern do you see in the readings?'])}</label>
            <textarea id="practiceAnalysis" data-practice-note="analysis" maxlength="4000"></textarea>
            <label for="practiceConclusion">${label(['Kết luận và nguồn sai lệch', 'Conclusion and sources of error'])}</label>
            <textarea id="practiceConclusion" data-practice-note="conclusion" maxlength="4000"></textarea>
          </details>
        </section>
      </article>`;
    for (const field of host.querySelectorAll('[data-practice-note]')) {
      field.value = run().notes[field.dataset.practiceNote];
      field.readOnly = Boolean(rawBackup);
    }
    q('#practiceAxisX').value = axes[0];
    q('#practiceAxisY').value = axes[1];
    apparatus = practice.mount(q('#practiceApparatus'), {getState: () => run().state, dispatch, t});
    apparatus.paint(run().state);
    viewport = mountPracticeView(q('#practiceApparatus'), practice.id, {
      storage, getState: () => run().state, dispatch, t, apparatus, cameraState
    });
    refreshState();
    refreshNotebook();
    showStorageStatus();
    if (message) setStatus(message.copy, message.error);
    if (stableFocus) document.getElementById(stableFocus)?.focus({preventScroll: true});
  }
  function record() {
    const values = practice.measure(run().state);
    if (rawBackup || !validValues(practice, values) || run().readings.length >= maxReadings) return;
    run().readings.push({recordedAt: new Date().toISOString(), values, state: structuredClone(run().state)});
    refreshNotebook();
    refreshState();
    setStatus(['Đã ghi số đo vào sổ tay.', 'Reading recorded in the notebook.']);
    persist();
    updateContext?.();
  }
  function click(event) {
    const action = event.target.closest('[data-practice-action]')?.dataset.practiceAction;
    if (action === 'record') record();
    else if (action === 'new' && !rawBackup && session.runs.length < maxRuns) {
      session.runs.push(createRun(practice));
      message = {copy: ['Đã mở lượt mới. Số đo lượt trước vẫn có trong sổ tay.', 'New trial started. Earlier readings remain in the notebook.'], error: false};
      build();
      persist();
      updateContext?.();
      q('#practiceTitle').focus({preventScroll: true});
    } else if (action === 'import') q('#practiceImport').click();
    else if (action === 'csv') download(exportPracticeCSV(session, practice), practice.id + '-readings.csv', 'text/csv;charset=utf-8');
    else if (action === 'json') {
      try { download(serializePracticeSession(session), practice.id + '-practice.json', 'application/json'); }
      catch { setStatus(['Phiên vượt dung lượng xuất JSON. Có thể xuất bảng CSV.', 'The session exceeds the JSON size limit. Export the CSV readings.'], true); }
    } else if (action === 'backup' && rawBackup) download(rawBackup, practice.id + '-original.json', 'application/json');
  }
  const saveDraft = () => {
    clearTimeout(draftTimer);
    draftTimer = 0;
    persist();
  };
  function input(event) {
    const field = event.target;
    if (!field.dataset.practiceNote || rawBackup) return;
    run().notes[field.dataset.practiceNote] = field.value.slice(0, 4000);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraft, 250);
  }
  async function change(event) {
    if (['practiceAxisX', 'practiceAxisY'].includes(event.target.id)) {
      axes[event.target.id === 'practiceAxisX' ? 0 : 1] = event.target.value;
      plot();
    }
    if (event.target.id !== 'practiceImport') return;
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > maxBytes * 3) throw new RangeError('File size');
      const imported = parsePracticeSession(await file.text(), practice);
      if (!alive || !confirm(t(['Mở phiên từ tệp và thay phiên đang dùng? Hãy xuất JSON trước nếu muốn giữ phiên hiện tại.', 'Open the file and replace the current session? Export JSON first if you want to keep this session.']))) return;
      if (!storage) throw new Error('Unavailable storage');
      storage.setItem(key, serializePracticeSession(imported));
      session = imported;
      rawBackup = '';
      storageError = false;
      clearTimeout(draftTimer);
      draftTimer = 0;
      message = {copy: ['Đã mở phiên từ tệp.', 'Session opened from file.'], error: false};
      build();
      updateContext?.();
    } catch {
      if (alive) setStatus(['Chưa nhập được phiên. Kiểm tra tệp JSON của đúng bài và dung lượng lưu.', 'Could not import this session. Check the JSON is for this lab and storage is available.'], true);
    }
  }
  build();
  q('#practiceTitle').focus({preventScroll: true});
  const unsubscribe = onLocaleChange(next => {
    const selected = next.locale;
    if (!alive || selected === locale) return;
    locale = selected;
    formatter = new Intl.NumberFormat(locale, {maximumSignificantDigits: 8});
    build();
  });
  host.addEventListener('click', click);
  host.addEventListener('input', input);
  host.addEventListener('change', change);
  window.addEventListener('pagehide', saveDraft);
  return {
    destroy() {
      alive = false;
      viewport?.destroy();
      apparatus?.destroy?.();
      if (draftTimer) saveDraft();
      unsubscribe();
      host.removeEventListener('click', click);
      host.removeEventListener('input', input);
      host.removeEventListener('change', change);
      window.removeEventListener('pagehide', saveDraft);
    },
    getContext() {
      return {
        id: practice.id + '-practice', catalogId: practice.id, title: t(practice.name),
        conditions: t(practice.limitations), parameters: [],
        columns: practice.columns.map(column => t(column.label) + ' (' + column.unit + ')'),
        measurements: session.runs.flatMap(item => item.readings).slice(-12).map(row => practice.columns.map(column => row.values[column.key]))
      };
    }
  };
}
