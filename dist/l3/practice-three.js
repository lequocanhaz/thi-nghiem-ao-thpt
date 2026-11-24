import * as THREE from '../vendor/three.module.min.js';
import {OrbitControls} from '../vendor/OrbitControls.js';

const toolsByCanvas = new WeakMap();

export function projectPracticeInstrument(canvas, id) {
  return toolsByCanvas.get(canvas)?.project(id) ?? null;
}

function fitDistance(bounds, target, direction, verticalFov, aspect) {
  const right = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
  const up = direction.clone().cross(right);
  const vertical = Math.tan(verticalFov / 2);
  const horizontal = vertical * aspect;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const offset = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(distance, offset.dot(direction) + 1.12 *
          Math.max(Math.abs(offset.dot(right)) / horizontal, Math.abs(offset.dot(up)) / vertical));
      }
    }
  }
  return Math.max(distance, 1);
}

export function createPracticeThree(host, mountBench, options) {
  const {getState, dispatch, t, apparatus, onUnavailable, cameraState} = options;
  const canvas = document.createElement('canvas');
  canvas.className = 'practice-webgl';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', t(['Mô hình 3D của bàn thực hành', '3D model of the practice bench']));
  canvas.dataset.practiceCanvas = '';
  host.append(canvas);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'low-power'});
  } catch (error) {
    canvas.remove();
    throw error;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color();
  const group = new THREE.Group();
  scene.add(group);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.ShadowMaterial({opacity: .15}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.16;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(new THREE.HemisphereLight(0xe9f7ff, 0x6d869c, 1.88));
  const key = new THREE.DirectionalLight(0xfff5e6, 2.45);
  key.position.set(-3, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left:-6,right:6,top:6,bottom:-6,near:.25,far:22});
  key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa5d8ff, 1.25);
  rim.position.set(5, 4, -5);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(36, 1, .06, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minPolarAngle = .45;
  controls.maxPolarAngle = Math.PI / 2 - .06;
  controls.rotateSpeed = .58;
  controls.zoomSpeed = .7;
  const registrations = new Map(), byId = new Map();
  const raycaster = new THREE.Raycaster(), normalized = new THREE.Vector2();
  const events = new AbortController();
  let bench, dragging, frameId = 0, disposed = false, lost = false, autoFit = !cameraState;
  let previousSize = '';

  function register(object, handler) {
    registrations.set(object, handler);
    byId.set(handler.id, object);
  }
  function syncTheme() {
    const dark = document.documentElement.dataset.appearance === 'dark';
    scene.background.set(dark ? 0x1b2834 : 0xe8f0f2);
    requestRender();
  }
  function render() {
    frameId = 0;
    if (disposed || lost || document.hidden) return;
    const moving = bench?.frame?.() === true;
    renderer.render(scene, camera);
    if (moving) requestRender();
  }
  function requestRender() {
    if (!disposed && !lost && !frameId) frameId = requestAnimationFrame(render);
  }
  function fit() {
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(group);
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const toVector = values => new THREE.Vector3().fromArray(values);
    const view = bench.view;
    const target = view?.target ? toVector(view.target) : center;
    const direction = view?.position ? toVector(view.position).sub(target).normalize() : new THREE.Vector3(3, 3.4, 8).normalize();
    const distance = fitDistance(bounds, target, direction, THREE.MathUtils.degToRad(camera.fov), camera.aspect);
    controls.minDistance = Math.max(.6, distance * .43);
    controls.maxDistance = Math.min(100, distance * 2.4);
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(direction, distance);
    controls.update();
    autoFit = true;
    requestRender();
  }
  function resize() {
    const {width, height} = host.getBoundingClientRect();
    if (width < 2 || height < 2 || disposed || lost) return;
    const size = Math.round(width) + '/' + Math.round(height);
    if (previousSize === size) return;
    previousSize = size;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (autoFit) fit();
    requestRender();
  }
  function pointerRay(event) {
    const rect = canvas.getBoundingClientRect();
    normalized.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(normalized, camera);
  }
  function hitAt(event, exclude) {
    pointerRay(event);
    if (Math.abs(normalized.x) > 1 || Math.abs(normalized.y) > 1) return null;
    for (const hit of raycaster.intersectObjects([...registrations.keys()], true)) {
      let node = hit.object, visible = true;
      let entry;
      while (node) {
        if (!node.visible) visible = false;
        if (!entry && registrations.has(node)) entry = registrations.get(node);
        if (node === group) break;
        node = node.parent;
      }
      if (visible && entry && entry !== exclude) return {entry, point: hit.point};
    }
    // Snap within a small screen-space radius when a thin 3D handle is missed.
    let nearest = null, limit = event.pointerType === 'touch' ? 22 : 9;
    for (const [object, entry] of registrations) {
      if (!object.visible || entry === exclude) continue;
      const mapped = projection(entry.id);
      const distance = Math.hypot(mapped.x - event.clientX, mapped.y - event.clientY);
      if (distance < limit) { limit = distance; nearest = {entry, point:mapped.world}; }
    }
    return nearest;
  }
  function pointerDown(event) {
    if (controls.enabled || dragging || event.isPrimary === false || event.button !== 0) return;
    const hit = hitAt(event);
    if (!hit?.entry.up || hit.entry.down?.(hit.point.clone()) === false) return;
    event.preventDefault();
    canvas.focus({preventScroll: true});
    const plane = typeof hit.entry.plane === 'function' ? hit.entry.plane(hit.point.clone()) : hit.entry.plane;
    dragging = {
      entry: hit.entry, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, point: hit.point.clone(),
      plane: plane || new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), hit.point)
    };
    try { canvas.setPointerCapture(event.pointerId); }
    catch { cancel(); return; }
    canvas.dataset.dragging = '';
  }
  function pointerMove(event) {
    if (dragging?.id !== event.pointerId) return;
    event.preventDefault();
    pointerRay(event);
    const point = raycaster.ray.intersectPlane(dragging.plane, new THREE.Vector3());
    if (!point) return;
    dragging.point.copy(point);
    dragging.moved ||= Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) > 4;
    if (dragging.moved) dragging.entry.move?.(point);
    requestRender();
  }
  function releaseCapture() {
    const token = dragging;
    dragging = null;
    delete canvas.dataset.dragging;
    if (token && canvas.hasPointerCapture(token.id)) canvas.releasePointerCapture(token.id);
    return token;
  }
  function pointerUp(event) {
    if (dragging?.id !== event.pointerId) return;
    const token = releaseCapture();
    const target = hitAt(event, token.moved ? token.entry : undefined);
    const point = raycaster.ray.intersectPlane(token.plane, new THREE.Vector3()) || token.point;
    token.entry.up(point, {targetId:target?.entry.id ?? null, moved: token.moved});
    requestRender();
  }
  function cancel() {
    const token = releaseCapture();
    token?.entry.cancel?.();
    if (token) requestRender();
  }
  function cancelPointer(event) {
    if (dragging?.id === event.pointerId) cancel();
  }
  function escape(event) {
    if (event.key === 'Escape' && dragging) {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
  }
  function projection(id) {
    const object = byId.get(id);
    if (!object) return null;
    camera.updateMatrixWorld();
    const world = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
    const point = world.clone().project(camera);
    const {left, top, width, height} = canvas.getBoundingClientRect();
    return {x: left + width * (point.x + 1) / 2, y: top + height * (1 - point.y) / 2, world};
  }

  const sizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(syncTheme);
  function disposeMaterials() {
    const materials = new Set(), geometry = new Set(), textures = new Set();
    scene.traverse(object => {
      if (object.geometry) geometry.add(object.geometry);
      for (const material of [object.material].flat().filter(Boolean)) materials.add(material);
    });
    for (const material of materials) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      if (material.uniforms) {
        for (const uniform of Object.values(material.uniforms)) if (uniform.value?.isTexture) textures.add(uniform.value);
      }
      material.dispose();
    }
    for (const texture of textures) texture.dispose();
    for (const item of geometry) item.dispose();
  }
  function destroy() {
    if (disposed) return;
    cancel();
    disposed = true;
    events.abort();
    bench?.destroy?.();
    sizeObserver.disconnect();
    themeObserver.disconnect();
    controls.dispose();
    cancelAnimationFrame(frameId);
    toolsByCanvas.delete(canvas);
    disposeMaterials();
    key.shadow.map?.dispose();
    renderer.dispose();
    if (!lost) renderer.forceContextLoss();
    canvas.remove();
  }

  try {
    bench = mountBench({THREE, group, getState, dispatch, t, apparatus, register, requestRender});
    bench.paint(getState());
    if (cameraState) {
      camera.position.fromArray(cameraState.position);
      controls.target.fromArray(cameraState.target);
      controls.minDistance = cameraState.minDistance;
      controls.maxDistance = cameraState.maxDistance;
      controls.update();
    }
    resize();
    sizeObserver.observe(host);
    themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['data-appearance']});
    syncTheme();
    const on = (node, type, listener, capture = false) => node.addEventListener(type, listener, {signal: events.signal, capture});
    on(canvas, 'pointerdown', pointerDown);
    on(canvas, 'pointermove', pointerMove);
    on(canvas, 'pointerup', pointerUp);
    on(canvas, 'pointercancel', cancelPointer);
    on(canvas, 'lostpointercapture', cancelPointer);
    on(window, 'blur', cancel);
    on(document, 'keydown', escape, true);
    on(document, 'visibilitychange', () => { if (document.hidden) cancel(); else requestRender(); });
    on(canvas, 'webglcontextlost', event => {
      event.preventDefault();
      lost = true;
      onUnavailable();
    });
    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', () => { autoFit = false; });
    toolsByCanvas.set(canvas, {project: projection});
  } catch (error) {
    destroy();
    throw error;
  }
  return {
    paint(state) { if (!disposed && !lost) { bench.paint(state); requestRender(); } },
    setOrbit(enabled) { cancel(); controls.enabled = enabled; canvas.dataset.orbit = String(enabled); },
    fit,
    zoom(factor) {
      autoFit = false;
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    snapshot() {
      return autoFit || lost ? null : {position:camera.position.toArray(),target:controls.target.toArray(),
        minDistance:controls.minDistance,maxDistance:controls.maxDistance};
    },
    destroy
  };
}
