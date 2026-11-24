const models = {
  ohm: {selector: '.ohm-bench', load: () => import('./ohm-practice-three.js?v=95')},
  lens: {selector: '.lens-stage', load: () => import('./lens-practice-three.js?v=95')},
  oscillation: {selector: '.osc-visual', load: () => import('./oscillation-practice-three.js?v=95')},
  lever: {selector: '.lever-visual', load: () => import('./lever-practice-three.js?v=95')},
  gas: {selector: '.gas-mechanism', load: () => import('./gas-practice-three.js?v=95')}
};

export function mountPracticeView(host, id, controls) {
  const {t, storage} = controls;
  const model = models[id];
  const diagram = model && host.querySelector(model.selector);
  if (!diagram) return null;
  const key = 'quanh-practice-view-' + id + '-v1';
  let preferred = '3d';
  try { if (storage?.getItem(key) === '2d') preferred = '2d'; }
  catch { /* The view works without stored preferences. */ }
  const shell = document.createElement('section');
  shell.className = 'practice-view';
  shell.setAttribute('aria-label', t(['Góc nhìn bàn thực hành', 'Practice bench view']));
  shell.innerHTML = `
    <div class="practice-view-toolbar">
      <div role="group" aria-label="${t(['Chọn cách hiển thị', 'Choose a view'])}">
        <button type="button" data-practice-view="3d">3D</button>
        <button type="button" data-practice-view="2d">2D</button>
      </div>
      <div class="practice-camera-tools" role="group" aria-label="${t(['Điều khiển camera', 'Camera controls'])}" hidden>
        <button type="button" data-practice-orbit aria-pressed="false">${t(['Xoay góc nhìn', 'Orbit view'])}</button>
        <button type="button" data-practice-fit>${t(['Vừa bàn', 'Frame bench'])}</button>
        <button type="button" data-practice-zoom="out" aria-label="${t(['Thu nhỏ', 'Zoom out'])}">−</button>
        <button type="button" data-practice-zoom="in" aria-label="${t(['Phóng to', 'Zoom in'])}">+</button>
      </div>
    </div>
    <p class="practice-view-status" role="status" hidden></p>
    <div class="practice-three-stage" hidden></div>`;
  diagram.before(shell);
  const stage = shell.querySelector('.practice-three-stage'), status = shell.querySelector('.practice-view-status');
  const cameraTools = shell.querySelector('.practice-camera-tools'), orbit = shell.querySelector('[data-practice-orbit]');
  let view, alive = true, generation = 0, current = null, cameraState = controls.cameraState ?? null;
  function mark(mode) {
    current = mode;
    host.dataset.practiceShown = mode;
    for (const button of shell.querySelectorAll('[data-practice-view]')) {
      button.setAttribute('aria-pressed', String(button.dataset.practiceView === mode));
    }
  }
  function notice(copy) {
    status.hidden = !copy;
    status.textContent = copy ? t(copy) : '';
  }
  function disposeView() {
    if (view) {
      cameraState = view.snapshot();
      view.destroy();
      view = undefined;
    }
  }
  function show2D(copy) {
    generation++;
    disposeView();
    mark('2d');
    diagram.hidden = false;
    stage.hidden = true;
    cameraTools.hidden = true;
    notice(copy);
  }
  const unavailable = [
    'Không mở được WebGL. Bài và số đo vẫn dùng được ở 2D. Chọn 3D để thử lại.',
    'WebGL is unavailable. The practice and its readings are available in 2D. Select 3D to retry.'
  ];
  async function show3D() {
    const attempt = ++generation;
    mark('3d');
    cameraTools.hidden = true;
    diagram.hidden = true;
    stage.hidden = false;
    notice(['Đang mở bàn 3D…', 'Opening the 3D bench…']);
    try {
      const [core, lab] = await Promise.all([import('./practice-three.js?v=95'), model.load()]);
      if (!alive || generation !== attempt) return;
      view = core.createPracticeThree(stage, lab.mountBench3D, {
        ...controls, cameraState,
        onUnavailable: () => queueMicrotask(() => {
          if (alive && generation === attempt) show2D(unavailable);
        })
      });
      cameraTools.hidden = false;
      orbit.setAttribute('aria-pressed', 'false');
      notice();
    } catch {
      if (alive && generation === attempt) show2D(unavailable);
    }
  }
  function select(mode) {
    if (mode === current) return;
    try { storage?.setItem(key, mode); }
    catch { /* Keep this selection on the open page. */ }
    if (mode === '3d') show3D();
    else show2D();
  }
  shell.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.practiceView) select(button.dataset.practiceView);
    else if (button === orbit && view) {
      const on = orbit.getAttribute('aria-pressed') !== 'true';
      orbit.setAttribute('aria-pressed', String(on));
      view.setOrbit(on);
    } else if (button.hasAttribute('data-practice-fit')) view?.fit();
    else if (button.dataset.practiceZoom) view?.zoom(button.dataset.practiceZoom === 'in' ? .82 : 1.22);
  });
  if (preferred === '3d') show3D();
  else show2D();
  return {
    paint(state) { view?.paint(state); },
    snapshot() { return view ? view.snapshot() : cameraState; },
    destroy() {
      alive = false;
      generation++;
      disposeView();
      delete host.dataset.practiceShown;
      diagram.hidden = false;
      shell.remove();
    }
  };
}
