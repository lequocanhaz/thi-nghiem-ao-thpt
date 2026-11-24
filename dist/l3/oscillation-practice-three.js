import {oscillatorTravelM, sampleOscillator} from './oscillation-practice.js?v=95';

const equilibriumX = -.48;
const travel = 1.42;
const metresToScene = travel / oscillatorTravelM;
const trackZ = .48;
const shaftEndX = -3.15;
const springHeight = .69;
const dialX = 2.38;
const dialY = 1.35;
const dialZ = -.72;
const dialRadius = .76;

export function mountBench3D({THREE, group, getState, t, register, requestRender, apparatus}) {
  const material = (color, roughness = .46, metalness = .06) =>
    new THREE.MeshStandardMaterial({color, roughness, metalness});
  const baseMat = material(0x527586);
  const chassisMat = material(0x233b4c);
  const trackMat = material(0x8db4c5, .3, .67);
  const stopMat = material(0xf3b043);
  const springMat = material(0x9a7bdc, .27, .48);
  const blockMat = material(0x159a97, .35, .12);
  const axleMat = material(0x405267);
  const plateMat = material(0x172e3f);
  const tickMat = material(0xc6dfe7);
  const phaseMat = new THREE.MeshBasicMaterial({color:0x55ebe1});
  const markerMat = new THREE.MeshBasicMaterial({color:0xffc268});
  const yAxis = new THREE.Vector3(0, 1, 0);
  const phaseVector = new THREE.Vector3();
  const phaseCenter = new THREE.Vector3(dialX,dialY,dialZ+.08);
  const scratch = new THREE.Vector3();

  function object(geometry, color, parent = group, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, color);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  const box = (w, h, d, mat, x, y, z, parent = group) =>
    object(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
  function rod(radius, mat) {
    return object(new THREE.CylinderGeometry(radius,radius,1,12),mat);
  }
  function setRod(mesh, from, to) {
    scratch.subVectors(to,from);
    const length = scratch.length();
    mesh.visible = length > 1e-7;
    if (mesh.visible) {
      mesh.position.copy(from).addScaledVector(scratch,.5);
      mesh.scale.y = length;
      mesh.quaternion.setFromUnitVectors(yAxis,scratch.divideScalar(length));
    }
  }
  function legend(content, size, width, height, parent = group) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.ceil(1024 * height / width);
    const ctx = canvas.getContext('2d');
    ctx.font = '700 ' + size + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d9eef4';
    for (const [label, x] of content) ctx.fillText(label, canvas.width*x, canvas.height*.53);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return object(new THREE.PlaneGeometry(width,height),
      new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),parent);
  }

  // Work surface, isolated track and physical end posts.
  box(7.1,.19,2.82,baseMat,0,.025,0);
  box(7,.045,2.73,chassisMat,0,.137,0);
  for (const x of [-3.06,-1.75,.22,1.5]) {
    box(.12,.10,.92,baseMat,x,.20,trackZ);
    for (const z of [trackZ-.26,trackZ+.26]) box(.14,.12,.11,chassisMat,x,.256,z);
  }
  for (const z of [trackZ-.26,trackZ+.26]) box(5.05,.075,.115,trackMat,-.853,.345,z);
  box(.18,.68,.95,chassisMat,shaftEndX-.19,.53,trackZ);
  box(.11,.36,.85,trackMat,shaftEndX-.045,.69,trackZ);
  box(.12,.36,.82,chassisMat,1.63,.405,trackZ);
  for (const x of [equilibriumX-travel-.39,equilibriumX+travel+.39]) {
    box(.09,.15,.72,stopMat,x,.415,trackZ);
  }

  const mass = new THREE.Group();
  group.add(mass);
  mass.position.set(equilibriumX,.58,trackZ);
  box(.63,.42,.63,blockMat,0,.09,0,mass);
  box(.52,.046,.56,tickMat,0,.32,0,mass);
  box(.70,.09,.71,axleMat,0,-.103,0,mass);
  const massTag = legend([['m',.5]],200,.45,.26,mass);
  massTag.position.set(0,.09,.32);
  for (const x of [-.25,.25]) for (const z of [-.26,.26]) {
    const wheel = object(new THREE.CylinderGeometry(.093,.093,.095,16),chassisMat,mass,x,-.103,z);
    wheel.rotation.x = Math.PI/2;
  }

  class CoilCurve extends THREE.Curve {
    getPoint(fraction, target = new THREE.Vector3()) {
      const angle = fraction * Math.PI * 18;
      return target.set(fraction,Math.sin(angle)*.145,Math.cos(angle)*.145);
    }
  }
  const spring = object(new THREE.TubeGeometry(new CoilCurve(),144,.032,8,false),springMat);
  const anchor = rod(.039,springMat);
  const joint = rod(.038,springMat);
  setRod(anchor,new THREE.Vector3(shaftEndX,springHeight,trackZ),
    new THREE.Vector3(shaftEndX+.18,springHeight,trackZ+.145));

  // Ruler marks share the displacement scale of the model.
  box(3.44,.035,.34,plateMat,equilibriumX,.184,1.079);
  const rulerContent = [];
  for (let index = -10; index <= 10; index += 1) {
    const x = equilibriumX + travel * index / 10;
    const tickLength = index % 5 === 0 ? .083 : .047;
    box(.012,.01,tickLength,index === 0 ? stopMat : tickMat,x,.209,1.003);
    if (index % 5 === 0) rulerContent.push([index>0?'+'+index:String(index),.5+travel*index/32]);
  }
  rulerContent.push(['cm',.951]);
  const ruler = legend(rulerContent,54,3.2,.19);
  ruler.rotation.x = -Math.PI/2;
  ruler.position.set(equilibriumX,.212,1.14);

  // Phase wheel on a rear upright, physically separate from the rail.
  box(.11,1.07,.24,chassisMat,dialX,.69,dialZ-.41);
  box(1.83,1.95,.14,plateMat,dialX,1.4,dialZ-.085);
  const dial = object(new THREE.TorusGeometry(dialRadius,.014,8,96),trackMat);
  dial.position.copy(phaseCenter);
  box(1.63,.014,.025,trackMat,dialX,dialY,dialZ+.08);
  box(.014,1.61,.025,trackMat,dialX,dialY,dialZ+.08);
  for (let step = 0; step < 12; step += 1) {
    const angle = step * Math.PI / 6;
    const radius = dialRadius+.024;
    const tick = box(.060,.018,.027,tickMat,dialX+radius*Math.cos(angle),dialY+radius*Math.sin(angle),dialZ+.083);
    tick.rotation.z = angle;
  }
  const title = legend([[t(['Vòng tròn pha','Phase circle']),.5]],93,1.68,.185);
  title.position.set(dialX,2.275,dialZ-.01);
  const phaseHand = rod(.027,phaseMat);
  const phaseShadow = rod(.013,phaseMat);
  const phaseTip = object(new THREE.SphereGeometry(.058,18,12),phaseMat);
  const projectionTip = object(new THREE.SphereGeometry(.042,14,10),phaseMat);
  const phaseMark = rod(.021,markerMat);
  const markerEnd = new THREE.Vector3();
  const projectionEnd = new THREE.Vector3();
  const springEnd = new THREE.Vector3();
  const massJoint = new THREE.Vector3();

  let drag = null;

  function paint() {
    const motion = apparatus.getMotion();
    const state = motion.state || getState();
    const diagramState = drag ? {...state,heldM:drag.heldM} : state;
    const timeS = drag ? 0 : motion.timeS;
    const phase = sampleOscillator(diagramState,timeS);
    mass.position.x = equilibriumX + phase.positionM * metresToScene;
    spring.position.set(shaftEndX+.18,springHeight,trackZ);
    spring.scale.x = mass.position.x-.50-spring.position.x;
    springEnd.set(mass.position.x-.50,springHeight,trackZ+.145);
    massJoint.set(mass.position.x-.313,springHeight,trackZ);
    setRod(joint,springEnd,massJoint);

    const radius = phase.amplitudeM / oscillatorTravelM * dialRadius;
    phaseVector.set(dialX + radius*Math.cos(phase.angleRad),
      dialY + radius*Math.sin(phase.angleRad),phaseCenter.z);
    phaseTip.position.copy(phaseVector);
    projectionEnd.set(phaseVector.x,dialY,phaseCenter.z);
    projectionTip.position.copy(projectionEnd);
    setRod(phaseHand,phaseCenter,phaseVector);
    setRod(phaseShadow,phaseVector,projectionEnd);
    if (!drag && state.startS !== null) {
      const {angleRad} = sampleOscillator(state,state.startS);
      markerEnd.set(dialX+radius*Math.cos(angleRad),dialY+radius*Math.sin(angleRad),phaseCenter.z+.035);
      setRod(phaseMark,phaseCenter,markerEnd);
    } else phaseMark.visible = false;
    return motion.running;
  }

  const fromPoint = point => {
    const value = drag.startM+(point.x-drag.startX)/metresToScene;
    return THREE.MathUtils.clamp(value,-oscillatorTravelM,oscillatorTravelM);
  };
  register(mass,{
    id:'mass',
    down(point) {
      const motion = apparatus.getMotion();
      if (motion.running) return false;
      const startM = sampleOscillator(motion.state || getState(),motion.timeS).positionM;
      drag = {startX:point.x,startM,heldM:startM};
    },
    move(point) {
      if (!drag) return;
      drag.heldM = fromPoint(point);
      requestRender();
    },
    up(point,{moved}) {
      if (!drag) return;
      const heldM = fromPoint(point);
      drag = null;
      if (moved) apparatus.releaseFrom(heldM);
      requestRender();
    },
    cancel() {
      drag = null;
      requestRender();
    }
  });
  const unsubscribe = apparatus.onMotionChange(requestRender);
  paint();
  return {
    stageSelector:'.osc-visual',
    view:{position:[3.4,3.4,10],target:[0,1,0]},
    paint,
    frame:paint,
    destroy:unsubscribe
  };
}
