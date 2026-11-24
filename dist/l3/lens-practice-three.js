import {opticalState, railBounds} from './lens-practice.js?v=94';

const unitsPerM = 7;
const opticalY = 1.5;
const objectHeightM = .025;
const apertureM = .046;
const screenBottom = .55;
const screenTop = 2.12;
const railX = distanceM => (distanceM - .5) * unitsPerM;
const railHeight = heightM => opticalY + heightM * unitsPerM;
const stations = ['objectM', 'lensM', 'screenM'];
const stationColors = {objectM: 0xf1a62a, lensM: 0x748bef, screenM: 0x169a85};

export function mountBench3D({THREE, group, getState, dispatch, register, requestRender}) {
  const standard = (color, options = {}) => new THREE.MeshStandardMaterial({color, roughness: .56, ...options});
  const bench = standard(0x4a6679, {metalness: .23});
  const rail = standard(0xa6b7c6, {metalness: .75, roughness: .29});
  const dark = standard(0x203143);
  const dial = standard(0xc6d2da, {metalness: .26});
  const tick = standard(0x2e4759);
  const stage = new THREE.Group();
  stage.name = 'Optics apparatus';
  group.add(stage);

  function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = !material.transparent;
    part.receiveShadow = !material.transparent;
    parent.add(part);
    return part;
  }
  const box = (parent, material, size, x, y, z) => mesh(new THREE.BoxGeometry(...size), material, parent, x, y, z);
  const boltShape = new THREE.CylinderGeometry(.037, .037, .026, 8);
  box(stage, bench, [7.52, .22, 1.57], 0, .2, 0);
  box(stage, dark, [7.42, .075, 1.51], 0, .065, 0);
  box(stage, dial, [7.16, .025, .28], 0, .326, .58);
  for (const z of [-.22, .22]) {
    box(stage, rail, [7.16, .11, .12], 0, .366, z);
    box(stage, dark, [7.12, .025, .04], 0, .425, z);
  }
  for (const x of [-3.53, 3.53]) {
    box(stage, dark, [.15, .28, .86], x, .416, 0);
    for (const z of [-.25, .25]) mesh(boltShape, rail, stage, x, .57, z);
  }

  const tickInstance = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), tick, 51);
  const marker = new THREE.Object3D();
  for (let i = 0; i <= 50; i++) {
    const major = i % 5 === 0;
    marker.position.set(railX(i / 50), .345, .673 - (major ? .035 : .014));
    marker.scale.set(major ? .022 : .014, .009, major ? .139 : .083);
    marker.updateMatrix();
    tickInstance.setMatrixAt(i, marker.matrix);
  }
  stage.add(tickInstance);

  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.5, opticalY, 0), new THREE.Vector3(3.5, opticalY, 0)]),
    new THREE.LineDashedMaterial({color: 0x86a0b0, dashSize: .07, gapSize: .07, transparent: true, opacity: .64})
  );
  axis.computeLineDistances();
  stage.add(axis);

  const carriages = {};
  for (const station of stations) {
    const tool = new THREE.Group();
    tool.name = station;
    stage.add(tool);
    const accent = standard(stationColors[station], {metalness: .21, roughness: .36});
    box(tool, dark, [.41, .12, .7], 0, .472, 0);
    box(tool, accent, [.3, .032, .56], 0, .546, 0);
    box(tool, dark, [.11, .53, .13], 0, .811, 0);
    mesh(new THREE.CylinderGeometry(.075, .075, .12, 10), accent, tool, 0, .51, .41).rotateX(Math.PI / 2);
    for (const z of [-.25, .25]) mesh(boltShape, rail, tool, 0, .55, z);
    carriages[station] = {tool, accent};
  }

  const target = carriages.objectM.tool;
  box(target, dark, [.095, .46, .48], 0, 1.2, 0);
  box(target, dark, [.065, .102, .075], 0, 1.447, 0);
  // The amber arrow tip is the source of the traced ray bundle.
  const targetMaterial = standard(0xffc348, {emissive: new THREE.Color(0xa35602), emissiveIntensity: .48});
  const targetHeight = objectHeightM * unitsPerM;
  const tipHeight = .066;
  mesh(new THREE.CylinderGeometry(.024, .024, targetHeight - tipHeight, 10), targetMaterial,
    target, 0, opticalY + (targetHeight - tipHeight) / 2, 0);
  mesh(new THREE.ConeGeometry(.059, tipHeight, 14), targetMaterial,
    target, 0, opticalY + targetHeight - tipHeight / 2, 0);

  const lens = carriages.lensM.tool;
  const lensRadius = apertureM * unitsPerM;
  const holderMaterial = carriages.lensM.accent;
  mesh(new THREE.TorusGeometry(lensRadius + .014, .038, 10, 56), dark, lens, 0, opticalY, 0).rotateY(Math.PI / 2);
  mesh(new THREE.TorusGeometry(lensRadius + .018, .018, 8, 48), holderMaterial, lens, -.085, opticalY, 0).rotateY(Math.PI / 2);
  box(lens, dark, [.19, .21, .19], 0, 1.097, 0);
  const profile = [];
  for (const sign of [-1, 1]) {
    for (let i = 0; i <= 12; i++) {
      const u = sign === -1 ? i / 12 : 1 - i / 12;
      profile.push(new THREE.Vector2(u * lensRadius, sign * (.02 + .074 * (1 - u * u))));
    }
  }
  const glass = standard(0x92bcff, {transparent: true, opacity: .42, roughness: .14, metalness: .12, depthWrite: false});
  mesh(new THREE.LatheGeometry(profile, 48), glass, lens, 0, opticalY, 0).rotateZ(-Math.PI / 2);

  const screen = carriages.screenM.tool;
  const screenY = (screenBottom + screenTop) / 2;
  const screenHeight = screenTop - screenBottom;
  const frame = carriages.screenM.accent;
  box(screen, frame, [.087, screenHeight + .155, 1.22], .057, screenY, 0);
  box(screen, standard(0xe6f5ef, {roughness: .82}), [.037, screenHeight, 1.07], .0185, screenY, 0);
  const guide = standard(0x9dbeb8, {roughness: .9});
  box(screen, guide, [.003, .009, .96], -.002, opticalY, 0);
  box(screen, guide, [.003, .95, .009], -.002, opticalY, 0);

  const projection = new THREE.Group();
  screen.add(projection);
  const imageInk = new THREE.MeshBasicMaterial({color: 0x884c16});
  const imageLine = mesh(new THREE.CylinderGeometry(.022, .022, 1, 10), imageInk, projection);
  const imageTip = mesh(new THREE.ConeGeometry(.056, .1, 14), imageInk, projection);
  imageTip.rotation.x = Math.PI;
  const blurShape = new THREE.CircleGeometry(1, 40);
  const blur = [.12, .16, .24].map((opacity, i) => {
    const material = new THREE.MeshBasicMaterial({color: 0xe09b36, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide});
    const spot = mesh(blurShape, material, screen, -.005 - i * .001);
    spot.rotateY(-Math.PI / 2);
    return spot;
  });

  const rayShape = new THREE.CylinderGeometry(.012, .012, 1, 8);
  const beam = new THREE.MeshBasicMaterial({color: 0xffbb45, transparent: true, opacity: .92, depthWrite: false});
  const rayStarts = [objectHeightM, 0, -.032];
  const rays = rayStarts.map(() => {
    const incident = mesh(rayShape, beam, stage);
    const refracted = mesh(rayShape, beam, stage);
    const extension = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineDashedMaterial({color: 0xeab96f, dashSize: .082, gapSize: .05, transparent: true, opacity: .62}));
    extension.frustumCulled = false;
    stage.add(extension);
    return {incident, refracted, extension};
  });
  const delta = new THREE.Vector3();
  const vertical = new THREE.Vector3(0, 1, 0);
  function connect(segment, a, b) {
    delta.subVectors(b, a);
    segment.visible = delta.lengthSq() > 1e-8;
    if (!segment.visible) return;
    segment.position.copy(a).lerp(b, .5);
    segment.scale.y = delta.length();
    segment.quaternion.setFromUnitVectors(vertical, delta.normalize());
  }
  const rayPoint = (positionM, heightM) => new THREE.Vector3(railX(positionM), railHeight(heightM), 0);

  function drawRays(state, optics) {
    const source = rayPoint(state.objectM, objectHeightM);
    rayStarts.forEach((height, index) => {
      const ray = rays[index];
      const slope = (height - objectHeightM) / optics.d - height / optics.f;
      const atLens = rayPoint(state.lensM, height);
      connect(ray.incident, source, atLens);
      const hAtScreen = railHeight(height + slope * optics.screenDistanceM);
      let endM = hAtScreen >= screenBottom && hAtScreen <= screenTop ? state.screenM : 1;
      const limitY = slope < 0 ? .58 : 2.63;
      if (slope !== 0) {
        const limitM = state.lensM + ((limitY - opticalY) / unitsPerM - height) / slope;
        endM = Math.min(endM, limitM);
      }
      connect(ray.refracted, atLens, rayPoint(endM, height + slope * (endM - state.lensM)));
      ray.extension.visible = optics.imageDistanceM !== null && optics.imageDistanceM < 0;
      if (ray.extension.visible) {
        const virtualM = Math.max(0, state.lensM + optics.imageDistanceM);
        const backward = rayPoint(virtualM, height + slope * (virtualM - state.lensM));
        const line = ray.extension.geometry.attributes.position;
        line.setXYZ(0, atLens.x, atLens.y, atLens.z);
        line.setXYZ(1, backward.x, backward.y, backward.z);
        line.needsUpdate = true;
        ray.extension.computeLineDistances();
      }
    });
  }

  function paint(state) {
    const optics = opticalState(state);
    stations.forEach(station => { carriages[station].tool.position.x = railX(state[station]); });
    glass.color.set([0x92bcff, 0x9b9efb, 0x84d2fb][state.lensNumber - 1]);
    drawRays(state, optics);
    const imageY = railHeight(-objectHeightM * optics.screenDistanceM / optics.d);
    projection.visible = optics.focus === 'sharp';
    if (projection.visible) {
      const tipLength = Math.min(.1, (opticalY - imageY) * .45);
      const baseY = imageY + tipLength;
      imageLine.position.set(-.012, (opticalY + baseY) / 2, 0);
      imageLine.scale.y = opticalY - baseY;
      imageTip.position.set(-.012, imageY + tipLength / 2, 0);
      imageTip.scale.y = tipLength / .1;
    }
    const blurRadius = Math.max(0, Math.min(.47, imageY - screenBottom, screenTop - imageY,
      optics.blurDiameterM * unitsPerM / 2));
    blur.forEach((spot, i) => {
      spot.visible = optics.focus !== 'sharp' && blurRadius > .005;
      spot.position.y = spot.visible ? imageY : opticalY;
      spot.scale.setScalar(spot.visible ? blurRadius * (1 - i * .24) : 0);
    });
    requestRender();
  }

  // Each drag previews the same SI-coordinate change as the precision controls.
  // A single accepted action commits the snapped carriage position on release.
  for (const station of stations) {
    let drag = null;
    const localX = point => group.worldToLocal(point.clone()).x;
    const preview = point => {
      if (!drag || !point) return;
      const [min, max] = railBounds(getState(), station);
      const tentative = drag.positionM + (localX(point) - drag.x) / unitsPerM;
      drag.next = Math.max(min, Math.min(max, Math.round(tentative * 200) / 200));
      paint({...getState(), [station]: drag.next});
    };
    register(carriages[station].tool, {
      id: station,
      down(point) {
        drag = {positionM: getState()[station], x: localX(point), next: getState()[station]};
      },
      move: preview,
      up(point, {moved} = {}) {
        if (!drag) return;
        if (moved) preview(point);
        const next = drag.next;
        drag = null;
        if (moved && next !== getState()[station]) dispatch({type: 'position', station, positionM: next});
        paint(getState());
      },
      cancel() {
        drag = null;
        paint(getState());
      }
    });
  }
  paint(getState());
  return {
    paint,
    stageSelector: '.lens-stage',
    view: {position: [-4.8, 4.5, 9], target: [0, 1.12, 0]}
  };
}
