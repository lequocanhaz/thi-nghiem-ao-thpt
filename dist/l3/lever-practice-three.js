import {leverHooksM, observeLever} from './lever-practice.js?v=94';

const sceneUnitsPerMetre = 2.25;
const pivotHeight = 2.36;
const beamHalfLength = 3.13;
const beamHalfHeight = .12;
const hookDepth = .28;
const hookOffsetY = -.135;
const trayTop = .26;
const trayDepth = .99;
const trayWidth = 2.88;
const loadWidth = .51;
const loadDepth = .43;
const loadColors = [0x35cabe, 0xf1a651, 0xb7a0fa];
const loadNames = ['A', 'B', 'C'];
const loadHeight = massKg => .27 + .12 * Math.sqrt(massKg);

function indexFor(id, prefix, count) {
  if (typeof id !== 'string' || !id.startsWith(prefix)) return null;
  const suffix = id.slice(prefix.length);
  const index = Number(suffix);
  return suffix === String(index) && Number.isInteger(index) && index >= 0 && index < count ? index : null;
}

export function mountBench3D({THREE, group, getState, dispatch, t, register, requestRender}) {
  const material = (color, extra) => new THREE.MeshStandardMaterial({color, roughness: .55, ...extra});
  const deck = material(0xd4e5e8);
  const frame = material(0x30546a, {metalness: .28});
  const beamMaterial = material(0x174759, {metalness: .32, roughness: .37});
  const ruler = material(0xa1d8dc, {metalness: .12});
  const metal = material(0x92aab5, {metalness: .48, roughness: .32});
  const foot = material(0x285162, {metalness: .24});
  const bumper = material(0x253745);
  const brass = material(0xe4a94b, {metalness: .42, roughness: .39});
  const cable = material(0x7e979e, {metalness: .28});
  const trayMaterial = material(0xbeccd2);
  const trayInset = material(0x4e7487);
  const hookMaterials = {
    free: material(0xc8e0e5, {metalness: .40}),
    occupied: material(0x60c3bb, {metalness: .22}),
    target: material(0x78ecdb, {emissive: 0x168876, emissiveIntensity: .25}),
    blocked: material(0xee8369, {emissive: 0x942c18, emissiveIntensity: .25}),
  };
  const targetMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const shortCylinder = new THREE.CylinderGeometry(1, 1, 1, 18);
  const ringGeometry = new THREE.TorusGeometry(1, .23, 8, 20);
  const hitGeometry = new THREE.SphereGeometry(1, 10, 8);

  function mesh(geometry, appearance, parent, x, y, z) {
    const shape = new THREE.Mesh(geometry, appearance);
    shape.position.set(x, y, z);
    shape.castShadow = appearance !== targetMaterial;
    shape.receiveShadow = appearance !== targetMaterial;
    parent.add(shape);
    return shape;
  }

  function box(parent, size, position, appearance) {
    const shape = mesh(boxGeometry, appearance, parent, ...position);
    shape.scale.set(...size);
    return shape;
  }

  function pin(parent, radius, length, position, appearance) {
    const shape = mesh(shortCylinder, appearance, parent, ...position);
    shape.rotation.x = Math.PI / 2;
    shape.scale.set(radius, length, radius);
    return shape;
  }

  function decal(parent, label, width, height, x, y, z, {ink = '#133544', background, font = 47} = {}) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 112;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (background) {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.font = '750 ' + String(font) + 'px Manrope, system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = ink;
    context.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 18);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const layer = new THREE.MeshBasicMaterial({map: texture, transparent: !background, depthWrite: Boolean(background), toneMapped: false});
    const plane = mesh(new THREE.PlaneGeometry(width, height), layer, parent, x, y, z);
    plane.castShadow = false;
    plane.receiveShadow = false;
    return plane;
  }

  const table = new THREE.Group();
  group.add(table);
  box(table, [7.49, .17, 2.91], [0, .102, 0], deck);
  box(table, [7.49, .08, 2.92], [0, .056, 0], frame);
  for (const x of [-3.28, 3.28]) {
    for (const z of [-1.09, 1.09]) {
      box(table, [.35, .08, .37], [x, .026, z], bumper);
    }
  }

  const pedestal = new THREE.Group();
  group.add(pedestal);
  box(pedestal, [1.38, .13, 1.13], [0, .245, -.33], frame);
  box(pedestal, [1.17, .09, .94], [0, .355, -.33], metal);
  const outline = new THREE.Shape();
  outline.moveTo(-.59, .39);
  outline.lineTo(.59, .39);
  outline.lineTo(.17, pivotHeight);
  outline.lineTo(-.17, pivotHeight);
  outline.closePath();
  mesh(new THREE.ExtrudeGeometry(outline, {depth: .42, bevelEnabled: false}), frame, pedestal, 0, 0, -.7);
  box(pedestal, [.41, .69, .24], [0, pivotHeight - .34, -.23], metal);
  pin(pedestal, .21, .55, [0, pivotHeight, -.115], metal);
  pin(pedestal, .147, .05, [0, pivotHeight, .174], brass);
  pin(pedestal, .048, .014, [0, pivotHeight, .204], frame);

  // The cap top is the lowest corner of the beam at the model's stop angle.
  const stopWitness = {loads: getState().loads.map((load, index) => ({...load, hook: index === 0 ? 0 : null}))};
  const stopAngle = Math.abs(observeLever(stopWitness).angleRad);
  const stopX = beamHalfLength * Math.cos(stopAngle) - beamHalfHeight * Math.sin(stopAngle);
  const stopY = pivotHeight - beamHalfLength * Math.sin(stopAngle) - beamHalfHeight * Math.cos(stopAngle);
  for (const side of [-1, 1]) {
    const x = side * stopX;
    box(table, [.52, .11, .55], [x, .236, -.05], foot);
    box(table, [.21, stopY - .32, .21], [x, .29 + (stopY - .32) / 2, -.05], metal);
    box(table, [.38, .09, .40], [x, stopY - .045, -.05], bumper);
  }

  const beam = new THREE.Group();
  beam.position.set(0, pivotHeight, -.05);
  group.add(beam);
  box(beam, [beamHalfLength * 2, beamHalfHeight * 2, .44], [0, 0, 0], beamMaterial);
  box(beam, [beamHalfLength * 2 - .15, .041, .018], [0, .07, .229], ruler);
  for (let index = -12; index <= 12; index++) {
    const x = index * .1 * sceneUnitsPerMetre;
    box(beam, [.012, index % 3 === 0 ? .062 : .028, .015], [x, .036, .233], ruler);
  }

  const decimal = new Intl.NumberFormat(t(['vi-VN', 'en-US']), {maximumFractionDigits: 2});
  const hooks = leverHooksM.map((metres, index) => {
    const holder = new THREE.Group();
    holder.position.set(metres * sceneUnitsPerMetre, hookOffsetY, hookDepth);
    beam.add(holder);
    pin(holder, .079, .12, [0, .009, -.043], metal);
    const ring = mesh(ringGeometry, hookMaterials.free, holder, 0, -.012, .025);
    ring.scale.setScalar(.12);
    const hit = mesh(hitGeometry, targetMaterial, holder, 0, -.01, .018);
    hit.scale.setScalar(.18);
    decal(beam, decimal.format(Math.abs(metres)) + ' m', .48, .16, holder.position.x, .203, .229,
      {ink: '#e8f8fd', background: '#174759', font: 74});
    register(holder, {id: 'hook:' + index, up(_point, {moved}) {
      if (!moved && selected !== null) {
        dispatch({type: 'attach', load: selected, hook: index});
        paint(getState());
      }
    }});
    return {holder, ring};
  });

  const tray = new THREE.Group();
  tray.position.set(0, trayTop, trayDepth);
  group.add(tray);
  box(tray, [trayWidth, .073, .73], [0, -.037, 0], trayMaterial);
  box(tray, [trayWidth - .12, .009, .64], [0, .005, 0], trayInset);
  for (const x of [-(trayWidth - .07) / 2, (trayWidth - .07) / 2]) {
    box(tray, [.07, .12, .73], [x, .025, 0], trayMaterial);
  }
  for (const z of [-.33, .33]) {
    box(tray, [trayWidth, .12, .07], [0, .025, z], trayMaterial);
  }
  for (const x of [-.94, 0, .94]) {
    box(tray, [.68, .011, .54], [x, .01, 0], trayMaterial);
  }
  decal(tray, t(['Khay tải', 'Load tray']), 1.07, .14, 0, .036, .369,
    {ink: '#e4f2f5', background: '#30546a', font: 77});
  register(tray, {id: 'tray', up(_point, {moved}) {
    if (!moved && selected !== null && getState().loads[selected].hook !== null) {
      dispatch({type: 'return', load: selected});
      paint(getState());
    }
  }});

  const pivotLocal = new THREE.Vector3();
  let selected = null;
  let drag = null;

  function hookPosition(index) {
    return group.worldToLocal(hooks[index].holder.getWorldPosition(new THREE.Vector3()));
  }

  function placeLoad(index, load) {
    const part = loads[index];
    const height = loadHeight(load.massKg);
    part.body.scale.y = height;
    part.eye.position.y = height / 2 + .057;
    const hanging = load.hook !== null;
    part.hanger.visible = hanging;
    if (hanging) {
      const hook = hookPosition(load.hook);
      part.model.position.set(hook.x, hook.y - .32 - height / 2, hook.z + .032);
      const top = part.model.position.y + part.eye.position.y;
      part.hanger.position.set(hook.x, (top + hook.y) / 2, part.model.position.z);
      part.hanger.scale.y = hook.y - top;
    } else {
      part.model.position.set((index - 1) * .94, trayTop + .017 + height / 2, trayDepth);
    }
    if (drag?.index === index && drag.active) {
      part.model.position.copy(drag.position);
      part.hanger.visible = false;
    } else {
      part.grip.position.copy(part.model.position);
    }
    const highlighted = selected === index || drag?.index === index;
    part.body.material.emissive.setHex(highlighted ? loadColors[index] : 0);
    part.body.material.emissiveIntensity = highlighted ? .19 : 0;
  }

  function hookNear(point) {
    if (!point) return null;
    let choice = null;
    let nearest = .27;
    for (let index = 0; index < hooks.length; index++) {
      const hook = hookPosition(index);
      const distance = Math.hypot(point.x - hook.x, point.y - hook.y);
      if (distance < nearest) {
        choice = index;
        nearest = distance;
      }
    }
    return choice;
  }

  function paint(state) {
    beam.rotation.z = observeLever(state).angleRad;
    beam.updateWorldMatrix(true, true);
    for (let index = 0; index < hooks.length; index++) {
      const occupied = state.loads.some(load => load.hook === index);
      const candidate = drag?.active && drag.hook === index;
      hooks[index].ring.material = candidate
        ? occupied ? hookMaterials.blocked : hookMaterials.target
        : occupied ? hookMaterials.occupied : hookMaterials.free;
    }
    state.loads.forEach((load, index) => placeLoad(index, load));
    requestRender();
  }

  const loads = loadNames.map((name, index) => {
    const model = new THREE.Group();
    group.add(model);
    const body = box(model, [loadWidth, .31, loadDepth], [0, 0, 0],
      material(loadColors[index], {metalness: .24, roughness: .38}));
    const eye = mesh(ringGeometry, metal, model, 0, .21, 0);
    eye.scale.setScalar(.079);
    const hanger = mesh(shortCylinder, cable, group, 0, 1, 0);
    hanger.scale.set(.012, .32, .012);
    decal(model, name, .31, .186, 0, .016, loadDepth / 2 + .002, {ink: '#143141', font: 99});

    // The preview moves the visible weight, while its hit proxy stays at origin.
    // This lets the release ray pick a different registered hook or the tray.
    const grip = new THREE.Group();
    group.add(grip);
    const hit = mesh(hitGeometry, targetMaterial, grip, 0, 0, 0);
    hit.scale.set(.29, .31, .28);
    function reset() {
      drag = null;
      paint(getState());
    }
    register(grip, {
      id: 'load:' + index,
      down(point) {
        selected = index;
        const local = group.worldToLocal(pivotLocal.copy(point));
        drag = {index, active: false, hook: null, origin: local.clone(), position: model.position.clone(), offset: model.position.clone().sub(local)};
        paint(getState());
      },
      move(point) {
        if (drag?.index !== index) return;
        const local = group.worldToLocal(pivotLocal.copy(point));
        if (!drag.active && local.distanceTo(drag.origin) < .035) return;
        drag.active = true;
        drag.hook = hookNear(local);
        drag.position.copy(local).add(drag.offset);
        paint(getState());
      },
      up(point, {targetId, moved}) {
        const movedLoad = drag?.index === index && moved;
        const local = point ? group.worldToLocal(pivotLocal.copy(point)) : null;
        drag = null;
        if (movedLoad) {
          const state = getState();
          const hook = indexFor(targetId, 'hook:', hooks.length) ?? hookNear(local);
          const otherLoad = indexFor(targetId, 'load:', loads.length);
          const overTray = targetId === 'tray' || (otherLoad !== null && otherLoad !== index && state.loads[otherLoad].hook === null)
            || (local && local.y <= trayTop + .36 && local.y >= trayTop - .20 && Math.abs(local.x) <= trayWidth / 2);
          if (hook !== null) dispatch({type: 'attach', load: index, hook});
          else if (overTray && state.loads[index].hook !== null) dispatch({type: 'return', load: index});
          else if (!overTray) dispatch({type: 'invalid-drop'});
        }
        paint(getState());
      },
      cancel: reset,
    });
    return {model, body, eye, hanger, grip};
  });

  paint(getState());

  return {
    paint,
    stageSelector: '.lever-visual',
    view: {position: [1.5, 4.5, 9.2], target: [0, 1.08, 0]},
  };
}
