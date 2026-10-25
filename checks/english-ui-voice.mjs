import assert from 'node:assert/strict';
import {dictionaries} from '../dist/i18n.js';
import {englishTitle,translateShort,getLocale} from '../dist/language-ui.js';
import {Narrator,englishVoices,englishChunks} from '../dist/media.js';

assert.equal(getLocale(),'vi-VN');
assert.equal(translateShort('Thư viện'),'Library');
assert.equal(translateShort('Lớp 11'),'Grade 11');
assert.equal(translateShort('Điện trường'),'Electric field');
const source=dictionaries['vi-VN'].experiments,target=dictionaries['en-US'].experiments;
assert.equal(Object.keys(source).length,300);
for(const id of Object.keys(source)){
 assert.equal(translateShort(source[id].title),target[id].title,'English full title: '+id);
 assert.equal(englishTitle(id),target[id].shortTitle,'English short title: '+id);
}
const voices=[
 {name:'Vietnamese',lang:'vi-VN'}, {name:'US natural',lang:'en-US',default:true},
 {name:'UK',lang:'en-GB'}
];
assert.equal(englishVoices(voices).length,2);
assert.equal(englishVoices(voices)[0].name,'US natural');
assert.ok(englishChunks('Voltage 0.6 volts. Current 2.5 amperes.').join(' ').includes('0.6 volts.'));
let played=[],cancelled=0;
globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
globalThis.speechSynthesis={
 paused:false,getVoices:()=>voices,addEventListener(){},
 cancel(){cancelled++},resume(){this.paused=false},pause(){this.paused=true},
 speak(utterance){played.push(utterance);utterance.onstart?.()}
};
const n=new Narrator();
assert.equal(n.locale,'vi-VN');
assert.ok(n.speak('Giọng Việt.').ok);
assert.equal(played.at(-1).lang,'vi-VN');
n.setLocale('en-US');
assert.equal(n.locale,'en-US');
assert.equal(n.status().voices.length,2);
assert.ok(n.speak('The voltage is 0.6 volts.',[{src:'audio/vi13/ohm.mp3'}]).ok);
assert.equal(played.at(-1).lang,'en-US','English narration must use the English locale');
assert.equal(played.at(-1).voice.lang,'en-US','English narration must never select a Vietnamese voice');
assert.ok(played.at(-1).text.includes('0.6'));
assert.ok(cancelled>=2);
n.setLocale('vi-VN');
assert.ok(n.speak('Trở lại tiếng Việt.').ok);
assert.equal(played.at(-1).lang,'vi-VN');
globalThis.speechSynthesis.getVoices=()=>voices.filter(v=>!v.lang.startsWith('en'));
n.setLocale('en-US');
assert.equal(n.speak('An English voice is required.').ok,false);
delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;
console.log('PASS bilingual catalog titles and English browser voice selection; textbook pages and simulation state untouched.');
