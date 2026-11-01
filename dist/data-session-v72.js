// Recorded values remain unchanged. Grouping only governs interpretation of fits.
// A table column can be a dependent result: vary no input unless the mapping
// explicitly identifies that column as the chosen independent parameter.
export function conditionGroups(experiment,rows,x,columnFor){
 if(!Array.isArray(rows))return [];
 const groups=new Map();
 rows.forEach((row,index)=>{
  const state=row?.s;
  // In the one-source electric modes, r1 is a distance computed from
  // positions. All translations/orientations are equivalent for the tabulated
  // magnitude at fixed r1 and charges; retain charges as controlled variables.
  const radial=experiment.id==='electric'&&x===4&&[0,1].includes(row.c?.mode);
  const aliases={energy:['h0'],decay:['n0'],horizontal:['v0'],collision:['v1','v2'],pendulum:['angle']};
  const directColumn=p=>!(aliases[experiment.id]||[]).includes(p.key)&&columnFor(experiment,p.key)===x;
  const controlled=(experiment.params||[]).filter(p=>p.key!=='t'&&!directColumn(p)&&!(radial&&/^(?:[xyz][12]|p[xyz])$/.test(p.key)));
  // A changing clock is a confounder when an input parameter is on x. Only
  // explicitly selecting the recorded time column permits time to vary.
  const timeColumn=columnFor(experiment,'t');
  if(timeColumn!==null&&timeColumn!==undefined&&timeColumn!==x&&!controlled.some(p=>p.key==='t'))controlled.push({key:'t'});
  const missing=controlled.some(p=>!state||!Object.hasOwn(state,p.key)||!Number.isFinite(state[p.key]));
  // Legacy tables without snapshots stay readable but cannot establish equal
  // experimental conditions from their displayed/rounded values alone.
  const key=missing?'unknown:'+index:JSON.stringify({
   parameters:controlled.map(p=>[p.key,state[p.key]]),
   mode:experiment.id==='electric'?(row.c?.mode??row.values?.[0]):undefined,
   capacitorMode:experiment.id==='capacitor'?(row.c?.capMode??row.values?.[0]):undefined,
  });
  if(!groups.has(key))groups.set(key,{key,known:!missing,conditions:missing?null:Object.fromEntries(controlled.map(p=>[p.key,state[p.key]])),rows:[],indices:[]});
  const group=groups.get(key);group.rows.push(row);group.indices.push(index);
 });
 return [...groups.values()];
}

// A single regression must never pool measurements from distinct controlled
// conditions. Unknown legacy snapshots are not a scientific compatibility claim.
export function regressionConditions(experiment,rows,x,columnFor){
 const groups=conditionGroups(experiment,rows,x,columnFor);
 return {groups,compatible:groups.length===1&&groups[0].known,reason:groups.some(g=>!g.known)?'unknown-conditions':groups.length>1?'mixed-conditions':groups.length===0?'empty':null};
}

export function pauseForParameterEdit(running,locale='vi-VN'){
 return {running:false,message:running?(locale==='en-US'?'Paused because a parameter changed. Recorded measurements are kept.':'Đã tạm dừng vì thay đổi tham số. Số liệu đã ghi được giữ nguyên.'):''};
}
