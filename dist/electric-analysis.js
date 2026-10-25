import {electricModes} from './experiments.js?v=59';

// Older saved tables may have mode labels but no configuration snapshot.
// Never infer an unknown mode from its magnitude or silently mix F with E.
export function rowInGraphMode(e,row,c={}){
 if(e.id!=='electric')return true;
 const mode=Number.isInteger(row.c?.mode)?row.c.mode:electricModes.indexOf(row.values?.[0]);
 const unit=[0,2].includes(mode)?'N':'N/C',recordedUnit=row.values?.[7];
 return mode===(c.mode??0)&&(!recordedUnit||recordedUnit===unit);
}

export function graphColumnLabel(e,index,c={}){
 if(e.id==='electric'&&index===6)return [0,2].includes(c.mode??0)?'F (N)':'E (N/C)';
 return e.headers[index];
}
