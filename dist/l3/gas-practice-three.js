import {practice} from './gas-practice.js?v=94';

const minVolumeM3 = .002;
const maxVolumeM3 = .010;
const depthScale = 480;
const chamberStart = -3.15;
const chamberEnd = chamberStart + maxVolumeM3 * depthScale;
const axisY = 1.23;
const boreRadius = .61;

export function mountBench3D({THREE, group, getState, dispatch, t, register, requestRender}) {
  const locale = t(['vi-VN', 'en-US']);
  const volumeFormat = new Intl.NumberFormat(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const pressureFormat = new Intl.NumberFormat(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const materials = {
    paint: new THREE.MeshStandardMaterial({color: 0x28475b, roughness: .66}),
    rubber: new THREE.MeshStandardMaterial({color: 0x101e28, roughness: .86}),
    steel: new THREE.MeshStandardMaterial({color: 0x93b2c1, metalness: .53, roughness: .34}),
    bronze: new THREE.MeshStandardMaterial({color: 0xffb75c, metalness: .36, roughness: .35, emissive: 0xff9b31, emissiveIntensity: .08}),
    shell: new THREE.MeshStandardMaterial({color: 0x8cc6d8, emissive: 0x164250, emissiveIntensity: .12, transparent: true, opacity: .40, side: THREE.DoubleSide, depthWrite: false, roughness: .23}),
    gas: new THREE.MeshStandardMaterial({color: 0x2eabc4, transparent: true, opacity: .20, depthWrite: false, side: THREE.FrontSide, roughness: .36}),
    tracer: new THREE.MeshStandardMaterial({color: 0x78ebed, emissive: 0x2d9da6, emissiveIntensity: .22, roughness: .42})
  };
  const mesh = (geometry, material, x, y, z, parent = group) => {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  };
  const box = (w, h, d, material, x, y, z, parent) =>
    mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  const cylinder = (radius, length, arc = Math.PI * 2, start = 0, open = false) =>
    new THREE.CylinderGeometry(radius, radius, length, 40, 1, open, start, arc).rotateZ(-Math.PI / 2);
  function ring(radius, thickness, x, material) {
    const geometry = new THREE.TorusGeometry(radius, thickness, 8, 48).rotateY(Math.PI / 2);
    return mesh(geometry, material, x, axisY, 0);
  }
  function face(width, height, pixelsWide, pixelsHigh, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = pixelsWide;
    canvas.height = pixelsHigh;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({map: texture, toneMapped: false});
    mesh(new THREE.PlaneGeometry(width, height), material, x, y, z);
    return {context: canvas.getContext('2d'), texture};
  }

  box(7.05, .18, 2.05, materials.paint, -.06, .14, -.03).receiveShadow = true;
  box(6.65, .04, 1.92, materials.steel, -.06, .25, -.03);
  for (const x of [-2.9, 2.9]) for (const z of [-.72, .68]) {
    box(.44, .10, .34, materials.rubber, x, .04, z);
  }
  box(.35, .37, .87, materials.paint, chamberStart - .10, .43, 0);
  const tubeLength = chamberEnd - chamberStart + .23;
  const mid = chamberStart + tubeLength / 2;
  // The open arc represents a section through the vessel. The inner gas stays sealed by the piston.
  const shell = mesh(cylinder(boreRadius + .09, tubeLength, Math.PI * 1.12, Math.PI * .44, true), materials.shell, mid, axisY, 0);
  shell.renderOrder = 3;
  mesh(cylinder(boreRadius + .13, .19), materials.paint, chamberStart - .11, axisY, 0);
  mesh(cylinder(boreRadius + .06, .06), materials.steel, chamberStart - .22, axisY, 0);
  ring(boreRadius + .074, .044, chamberStart - .012, materials.steel);
  ring(boreRadius + .075, .034, chamberEnd + .19, materials.steel);
  for (const y of [axisY - .69, axisY + .69]) {
    box(tubeLength, .037, .06, materials.steel, mid, y, -.1);
  }
  box(.29, .35, 1.17, materials.paint, chamberEnd + .25, .43, 0);
  box(.24, .90, .44, materials.paint, 2.38, .69, 0);
  box(.33, .24, .34, materials.paint, 2.38, axisY, 0);
  const actuator = mesh(cylinder(.098, 1), materials.steel, 0, axisY, 0);
  const gas = mesh(cylinder(boreRadius - .02, 1), materials.gas, 0, axisY, 0);
  gas.renderOrder = 2;

  const piston = new THREE.Group();
  piston.position.y = axisY;
  group.add(piston);
  mesh(cylinder(boreRadius -.032, .16), materials.bronze, .083, 0, 0, piston);
  mesh(cylinder(boreRadius -.01, .038), materials.rubber, .03, 0, 0, piston);
  mesh(cylinder(boreRadius -.014, .046), materials.rubber, .15, 0, 0, piston);
  mesh(cylinder(.19, .16), materials.bronze, .23, 0, 0, piston);
  // Enlarge the hit area around the visible rim without changing the gas or piston geometry.
  const hitMaterial = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false});
  box(.47, 1.20, .72, hitMaterial, .08, 0, .38, piston);

  // A fixed number of dots illustrates density as the chamber changes size.
  const moleCount = 36;
  const tracers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.033, 1), materials.tracer, moleCount);
  group.add(tracers);
  const dotCoordinates = Array.from({length: moleCount}, (_, i) => {
    const angle = i * 2.3999632297;
    const radius = (boreRadius - .11) * Math.sqrt(((i * 17 + 3) % moleCount + .5) / moleCount);
    return {along: ((i * 19 + 7) % moleCount + .5) / moleCount, y: Math.sin(angle) * radius, z: Math.cos(angle) * radius};
  });
  const dotPose = new THREE.Matrix4();

  const gaugeX = -.74;
  box(.18, 1.83, .17, materials.steel, gaugeX + .94, 1.16, -.83);
  box(.18, .12, .70, materials.steel, gaugeX + .94, 2.075, -.48);
  box(3.07, .85, .26, materials.paint, gaugeX, 2.31, -.08);
  box(2.92, .73, .08, materials.rubber, gaugeX, 2.31, .071);
  const meter = face(2.86, .677, 900, 216, gaugeX, 2.31, .114);
  const scale = face(5.10, .264, 1100, 58, -.75, .47, .887);
  scale.context.fillStyle = '#192d3b';
  scale.context.fillRect(0, 0, 1100, 58);
  scale.context.textAlign = 'center';
  scale.context.font = '600 23px sans-serif';
  for (let halfLitre = 4; halfLitre <= 20; halfLitre++) {
    const x = (chamberStart + halfLitre * .0005 * depthScale + .75) / 5.10 * 1100 + 550;
    const major = halfLitre % 4 === 0;
    scale.context.fillStyle = major ? '#c4e3eb' : '#6c969f';
    scale.context.fillRect(x - 1, 0, major ? 3 : 2, major ? 19 : 10);
    if (major) scale.context.fillText(halfLitre === 20 ? '10 L' : (halfLitre / 2).toString(), x, 46);
  }
  scale.texture.needsUpdate = true;

  let drag = null;
  let displayed = '';
  function paintMeter(reading, preview) {
    const pressure = pressureFormat.format(reading.pressureKPa);
    const volume = volumeFormat.format(reading.volumeL);
    const signature = [pressure, volume, preview].join('|');
    if (signature === displayed) return;
    displayed = signature;
    const ctx = meter.context;
    ctx.fillStyle = '#0e212b';
    ctx.fillRect(0, 0, 900, 216);
    ctx.fillStyle = '#284755';
    ctx.fillRect(449, 17, 2, 134);
    ctx.fillRect(19, 165, 859, 2);
    ctx.fillStyle = '#a7c9d4';
    ctx.font = '600 29px sans-serif';
    ctx.fillText(t(['ÁP SUẤT · kPa', 'PRESSURE · kPa']), 29, 46);
    ctx.fillText(t(['THỂ TÍCH · L', 'VOLUME · L']), 480, 46);
    ctx.fillStyle = preview ? '#ffd49a' : '#92ebe6';
    ctx.font = '650 73px monospace';
    ctx.fillText(pressure, 26, 132);
    ctx.fillText(volume, 477, 132);
    ctx.fillStyle = '#a7c9d4';
    ctx.font = '500 25px sans-serif';
    const footer = preview
      ? t(['Xem trước · Thả tay để đo', 'Preview · Release to measure'])
      : reading.temperatureK + ' K    ·    ' + volumeFormat.format(reading.amountMol) + ' mol';
    ctx.fillText(footer, 30, 201);
    meter.texture.needsUpdate = true;
  }
  function paint(state) {
    const volumeM3 = drag?.volumeM3 ?? state.volumeM3;
    const length = volumeM3 * depthScale;
    const x = chamberStart + length;
    piston.position.x = x;
    actuator.position.x = (x + .29 + 2.38) / 2;
    actuator.scale.x = 2.38 - (x + .29);
    gas.position.x = chamberStart + length / 2;
    gas.scale.x = length;
    for (let i = 0; i < moleCount; i++) {
      const dot = dotCoordinates[i];
      dotPose.makeTranslation(chamberStart + .044 + (length - .088) * dot.along, axisY + dot.y, dot.z);
      tracers.setMatrixAt(i, dotPose);
    }
    tracers.instanceMatrix.needsUpdate = true;
    tracers.computeBoundingSphere();
    materials.bronze.emissiveIntensity = drag ? .24 : .08;
    const readings = practice.measure({volumeM3});
    if (readings) paintMeter(readings, Boolean(drag));
  }
  function planVolume(point) {
    const x = group.worldToLocal(point.clone()).x;
    const volume = drag.original + (x - drag.startX) / depthScale;
    return Math.min(maxVolumeM3, Math.max(minVolumeM3, Math.round(volume * 1e5) / 1e5));
  }
  register(piston, {
    id: 'piston',
    plane(point) {
      return new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), point);
    },
    down(point) {
      const volumeM3 = getState().volumeM3;
      drag = {startX: group.worldToLocal(point.clone()).x, original: volumeM3, volumeM3};
      paint(getState());
      requestRender();
    },
    move(point) {
      if (!drag) return;
      drag.volumeM3 = planVolume(point);
      paint(getState());
      requestRender();
    },
    up(point, {moved}) {
      if (!drag) return;
      const volumeM3 = point ? planVolume(point) : drag.volumeM3;
      drag = null;
      if (moved && volumeM3 !== getState().volumeM3) dispatch({type: 'move-piston', volumeM3});
      paint(getState());
      requestRender();
    },
    cancel() {
      drag = null;
      paint(getState());
      requestRender();
    }
  });
  return {paint, stageSelector: '.gas-mechanism'};
}
