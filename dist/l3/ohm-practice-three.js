import {circuitLeads, circuitTerminals, observeCircuit} from './ohm-practice.js?v=94';

const deviceSpecs = [
  {id:'source', title:['Nguồn DC','DC supply'], unit:'V', x:-2.75, z:-.85, depth:2.18, color:0xb94832,
    terminals:['sourceP','sourceN']},
  {id:'ammeter', title:['Ampe kế','Ammeter'], unit:'A', x:0, z:-1.63, depth:1.8, color:0x176a96,
    terminals:['ammeterP','ammeterN']},
  {id:'voltmeter', title:['Vôn kế','Voltmeter'], unit:'V', x:2.75, z:-.85, depth:2.18, color:0x764d9f,
    terminals:['voltmeterP','voltmeterN']},
  {id:'resistor', title:['Điện trở tải','Load resistor'], unit:'Ω', x:0, z:.52, depth:1.9, color:0x49675a,
    terminals:['resistorP','resistorN']}
];

export const view = {position:[2.9,7.8,10.8],target:[0,.35,-.12]};

export function mountBench3D({THREE, group, getState, dispatch, t, register, requestRender}) {
  const vector = (x,y,z) => new THREE.Vector3(x,y,z);
  const labels = new Map();
  const sockets = new Map();
  const leads = new Map();
  const leadIds = Object.keys(circuitLeads);
  let selection = null;
  let drag = null;

  const standard = (color, extras) => new THREE.MeshStandardMaterial({color, roughness:.63, ...extras});
  const metal = standard(0xbdcbd5, {metalness:.69,roughness:.32});
  const brass = standard(0xe2b66b, {metalness:.56,roughness:.35});
  const edge = standard(0x23354a);
  const body = standard(0x4a5c71);
  const bezel = standard(0x111d28);
  const plate = standard(0xe7eef0, {roughness:.8});
  const screw = new THREE.CylinderGeometry(.057,.057,.045,12);
  const jackGeometry = new THREE.TorusGeometry(.148,.038,9,23);
  const mountBase = new THREE.BoxGeometry(1,1,1);
  const meterNumber = new Intl.NumberFormat(t(['vi-VN','en-US']), {maximumFractionDigits:3});
  const supplyNumber = new Intl.NumberFormat(t(['vi-VN','en-US']), {maximumFractionDigits:2});

  function add(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function block(parent, material, dims, x, y, z) {
    const mesh = add(parent,mountBase,material,x,y,z);
    mesh.scale.set(...dims);
    return mesh;
  }
  function cylinder(parent, material, radius, height, x, y, z) {
    return add(parent,new THREE.CylinderGeometry(radius,radius,height,18),material,x,y,z);
  }

  // The labels sit on the top instrument faces and stay readable in shaded views.
  function sign(parent, x, y, z, width, depth, {ink = '#ecf5ff',paper = '',digits = false,tilt = -Math.PI/2} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = Math.max(80,Math.round(512*depth/width));
    const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.MeshBasicMaterial({map:texture,transparent:!paper,depthWrite:Boolean(paper),toneMapped:false});
    const mesh = add(parent,new THREE.PlaneGeometry(width,depth),material,x,y,z);
    mesh.rotation.x = tilt;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    let last = null;
    return (text, color = ink) => {
      if (last?.text === text && last.color === color) return;
      last = {text,color};
      context.clearRect(0,0,canvas.width,canvas.height);
      if (paper) {
        context.fillStyle = paper;
        context.fillRect(0,0,canvas.width,canvas.height);
      }
      context.fillStyle = color;
      const fontSize = Math.round(canvas.height*(digits ? .67 : .73));
      context.font = (digits?'700 ':'650 ') + fontSize + 'px ' + (digits?'monospace':'system-ui, sans-serif');
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text,canvas.width/2,canvas.height*.54,canvas.width*.94);
      texture.needsUpdate = true;
    };
  }

  block(group,edge,[8.2,.18,5.64],0,-.03,-.16);
  block(group,plate,[8.12,.11,5.56],0,.10,-.16);
  const rails = standard(0x7691a0);
  for (const x of [-3.82,3.82]) {
    block(group,rails,[.073,.018,5.15],x,.166,-.16);
    for (const z of [-2.58,2.28]) add(group,screw,metal,x,.17,z);
  }

  function selectSocket(id) {
    if (selection === null) return;
    connect(selection,id);
  }

  for (const device of deviceSpecs) {
    const {id,x,z,depth} = device;
    const panel = new THREE.Group();
    panel.position.set(x,0,z);
    group.add(panel);
    const accent = standard(device.color);
    block(panel,edge,[2.28,.15,depth+.12],0,.205,0);
    block(panel,body,[2.14,.38,depth],0,.39,0);
    block(panel,accent,[2.04,.075,depth-.09],0,.601,0);
    for (const corner of [-1,1]) {
      for (const side of [-1,1]) add(panel,screw,metal,corner*.9,.65,side*(depth/2-.12));
    }
    sign(panel,0,.65,-depth*.34,1.7,.25)(t(device.title));
    const meterTilt = -.73;
    const meterHousing = block(panel,bezel,[1.63,.62,.076],0,.91,-.20);
    meterHousing.rotation.x = meterTilt;
    labels.set(id, sign(panel,0,.94,-.165,1.50,.49,{ink:'#a4f2da',paper:'#112a33',digits:true,tilt:meterTilt}));
    if (id === 'resistor') {
      const ceramic = standard(0xeed8a9,{roughness:.48});
      const axial = cylinder(panel,ceramic,.105,.75,0,.79,.23);
      axial.rotation.z = Math.PI/2;
      for (const position of [-.22,-.11,.09,.25]) {
        const band = cylinder(panel,position===.25?brass:edge,.108,.044,position,.79,.23);
        band.rotation.z = Math.PI/2;
      }
    }
    for (const [index, terminalId] of device.terminals.entries()) {
      const offset = index === 0 ? -.49 : .49;
      const terminalZ = depth*.31;
      const socket = new THREE.Group();
      socket.position.set(offset,.65,terminalZ);
      panel.add(socket);
      const tone = index === 0 && id !== 'resistor' ? 0xba492f : 0x222f42;
      const collar = standard(tone, {emissive:0x529c84,emissiveIntensity:0});
      cylinder(socket,collar,.184,.109,0,.056,0);
      const ring = add(socket,jackGeometry,metal,0,.115,0);
      ring.rotation.x = -Math.PI/2;
      const cap = cylinder(socket,bezel,.113,.024,0,.103,0);
      cap.castShadow = false;
      sign(panel,offset,.65,terminalZ-.28,.28,.22)(circuitTerminals[terminalId].mark);
      sockets.set(terminalId,{point:vector(x+offset,.805,z+terminalZ),collar});
      register(socket,{id:'socket:'+terminalId,up(_point,{moved}) {if (!moved) selectSocket(terminalId);}});
    }
  }

  const control = new THREE.Group();
  control.position.set(-2.75,0,.83);
  group.add(control);
  block(control,edge,[1.85,.29,.7],0,.31,0);
  block(control,metal,[1.57,.047,.58],0,.481,0);
  const switchPivot = new THREE.Group();
  switchPivot.position.set(-.47,.55,0);
  control.add(switchPivot);
  block(switchPivot,bezel,[.88,.118,.18],.43,.03,0);
  block(switchPivot,brass,[.32,.142,.28],.77,.04,0);
  const lamp = standard(0x8b7780,{emissive:0xc97045,emissiveIntensity:.12});
  cylinder(control,lamp,.08,.07,-.61,.53,.18);
  const switchLabel = sign(control,.14,.51,.22,1,.16,{ink:'#192c35'});
  register(control,{id:'switch',up(_point,{moved}) {if (!moved) dispatch({type:'switch'});}});

  block(group,edge,[7.17,.12,.76],0,.213,2.1);
  const plugInsulation = new THREE.CylinderGeometry(.135,.185,.285,16);
  const plugPin = new THREE.CylinderGeometry(.043,.043,.12,12);
  const socketDock = new THREE.TorusGeometry(.206,.025,8,22);

  function leadDestination(id, state) {
    const port = state.connections[id];
    const socket = sockets.get(port);
    if (!socket) return leads.get(id).dockAt;
    const connected = leadIds.filter(lead => state.connections[lead] === port);
    const offset = (connected.indexOf(id)-(connected.length-1)/2)*.22;
    return socket.point.clone().add(vector(offset,0,0));
  }

  function drawLead(id,state) {
    const lead = leads.get(id);
    const end = drag?.id === id ? drag.destination : leadDestination(id,state);
    const active = selection === id;
    lead.dockGlow.emissiveIntensity = active ? .75 : .11;
    lead.color.emissiveIntensity = active ? .24 : .05;
    if (lead.lastEnd?.distanceToSquared(end) < 1e-7) return;
    lead.lastEnd = end.clone();
    lead.plug.position.copy(end);
    const anchor = sockets.get(circuitLeads[id].anchor).point;
    const delta = end.clone().sub(anchor);
    const lift = .46 + Math.min(delta.length()*.13,.63) + lead.index*.13;
    const bend1 = anchor.clone().add(vector(delta.x*.25,lift,delta.z*.13-.14));
    const bend2 = end.clone().add(vector(-delta.x*.23,lift*.72,-delta.z*.17+.15));
    const curve = new THREE.CubicBezierCurve3(anchor,bend1,bend2,end);
    const geometry = new THREE.TubeGeometry(curve,26,.038,8,false);
    lead.wire.geometry.dispose();
    lead.wire.geometry = geometry;
  }
  function paint(state) {
    const reading = observeCircuit(state);
    labels.get('source')(supplyNumber.format(state.supplyV)+' V');
    labels.get('ammeter')(Number.isFinite(reading.current)? meterNumber.format(reading.current)+' A' : '— A');
    labels.get('voltmeter')(Number.isFinite(reading.voltage)? supplyNumber.format(reading.voltage)+' V' : '— V');
    labels.get('resistor')(String(state.resistance)+' Ω');
    switchPivot.rotation.z = state.closed ? 0 : .35;
    switchLabel(state.closed?t(['ĐÃ ĐÓNG','CLOSED']):t(['ĐANG MỞ','OPEN']));
    lamp.color.setHex(reading.status==='short' ? 0xc54436 : state.closed ? 0x59bd80 : 0x8b7780);
    lamp.emissive.copy(lamp.color);
    lamp.emissiveIntensity = state.closed ? .75 : .08;
    for (const [id,socket] of sockets) {
      socket.collar.emissiveIntensity = !state.closed && selection && circuitLeads[selection].anchor!==id ? .4 : 0;
    }
    for (const id of leadIds) drawLead(id,state);
    requestRender();
  }

  function connect(lead, target) {
    if (dispatch({type:'connect',lead,terminal:target})) selection = null;
    paint(getState());
  }

  function nearestSocket(point) {
    if (!point) return null;
    let best = null;
    let distance = .47;
    for (const [id,{point:socketPoint}] of sockets) {
      const d = Math.hypot(point.x-socketPoint.x,point.z-socketPoint.z);
      if (d < distance) {
        distance = d;
        best = id;
      }
    }
    return best;
  }

  const workspacePlane = new THREE.Plane(vector(0,1,0),-.83);

  leadIds.forEach((id,index) => {
    const x = (index-2)*1.37;
    const {color,label} = circuitLeads[id];
    const colorMaterial = standard(color,{emissive:color,emissiveIntensity:.05,roughness:.43});
    const dockGlow = standard(color,{emissive:color,emissiveIntensity:.11,roughness:.55});
    const plug = new THREE.Group();
    group.add(plug);
    const parking = new THREE.Group();
    parking.position.set(x,.281,2.04);
    group.add(parking);
    const dock = add(parking,socketDock,dockGlow,0,0,0);
    dock.rotation.x = -Math.PI/2;
    cylinder(parking,bezel,.174,.023,0,-.013,0);
    add(plug,plugInsulation,colorMaterial,0,.126,0);
    add(plug,plugPin,brass,0,-.024,0);
    sign(group,x,.284,2.39,1.29,.19)(t(label),color);
    const wire = add(group,new THREE.BufferGeometry(),colorMaterial,0,0,0);
    leads.set(id,{index,dockAt:vector(x,.299,2.04),dockGlow,color:colorMaterial,plug,wire,lastEnd:null});

    const handle = {
      plane:workspacePlane,
      down() {
        drag = {id,destination:leadDestination(id,getState()),previousSelection:selection};
      },
      move(point) {
        if (!drag || drag.id!==id || !point || getState().closed) return;
        selection = id;
        const local = group.worldToLocal(point.clone());
        drag.destination = vector(
          Math.max(-4,Math.min(4,local.x)),
          .83,
          Math.max(-2.87,Math.min(2.67,local.z))
        );
        paint(getState());
      },
      up(point,{targetId,moved}) {
        const previousSelection = selection;
        const current = getState();
        drag = null;
        if (moved) {
          const local = point && group.worldToLocal(point.clone());
          const target = targetId?.startsWith('socket:') ? targetId.slice(7) : nearestSocket(local);
          if (target) {
            connect(id,target);
            return;
          }
          if (local && Math.hypot(local.x-x,local.z-2.04)<.39 && current.connections[id]) {
            if (dispatch({type:'disconnect',lead:id})) selection = null;
            paint(getState());
            return;
          }
          selection = id;
        } else if (previousSelection && previousSelection !== id && current.connections[id]) {
          connect(previousSelection,current.connections[id]);
          return;
        } else {
          selection = previousSelection===id ? null : id;
        }
        paint(getState());
      },
      cancel() {
        if (drag) selection = drag.previousSelection;
        drag = null;
        paint(getState());
      }
    };
    register(plug,{...handle,id:'lead:'+id});
    register(parking,{...handle,id:'dock:'+id});
  });

  paint(getState());
  return {paint,stageSelector:'.ohm-bench',view};
}
