// Presentation-only search index. Never changes scientific catalog records.
import {englishStudy,englishParameter,englishTopic} from './english-study.js?v=56';

export const normalizeSearch=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const apparatus={
 ohm:'ampe kế ammeter vôn kế voltmeter điện trở resistor nguồn điện power supply',
 series:'ampe kế ammeter vôn kế voltmeter điện trở resistor',
 parallel:'ampe kế ammeter vôn kế voltmeter điện trở resistor',
 electric:'điện tích charge Coulomb đường sức field lines điện nghiệm electrostatics',
 lever:'cân đòn balance beam đòn bẩy lever quả cân weights',
 hooke:'lực kế dynamometer spring lò xo quả cân weights',
 oscillation:'con lắc lò xo spring mass oscillator',
 pendulum:'con lắc đơn simple pendulum quả nặng bob',
 boyle:'xi lanh syringe piston pít tông khí gas áp kế pressure gauge',
 gas:'phân tử molecules piston pít tông nhiệt kế thermometer',
 wave:'dây rung vibrating string sóng ngang transverse wave',
 standing:'dây rung vibrating string sóng dừng standing wave',
 lens:'thấu kính lens màn screen quang học optics',
 microscope:'kính hiển vi microscope vật kính objective thị kính eyepiece',
 telescope:'kính thiên văn telescope vật kính objective thị kính eyepiece',
 collision:'xe carts va chạm collision động lượng momentum'
};
const indexes=new WeakMap();
export function catalogSearchIndex(experiment){
 let index=indexes.get(experiment);
 if(!index){
  const en=englishStudy(experiment);
  index={
   heading:normalizeSearch([experiment.title,experiment.shortTitle,experiment.topic,en.title,englishTopic(experiment.topic)].join(' ')),
   text:normalizeSearch([experiment.id,experiment.title,experiment.shortTitle,experiment.topic,experiment.description,en.title,englishTopic(experiment.topic),en.explanation,apparatus[experiment.id]||'',...(experiment.params||[]).flatMap((p,i)=>[p.label,englishParameter(p,i)])].join(' '))
  };
  indexes.set(experiment,index);
 }
 return index;
}
export function searchTerms(query){return normalizeSearch(query).split(/\s+/).filter(Boolean);}
export function matchesSearch(experiment,terms){return terms.every(term=>catalogSearchIndex(experiment).text.includes(term));}
export function searchRank(experiment,terms){
 if(!terms.length)return 0;
 const {heading}=catalogSearchIndex(experiment);
 return heading.includes(terms.join(' '))?3:terms.every(term=>heading.includes(term))?2:1;
}
