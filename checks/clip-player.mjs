import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ClipPlayer} from '../dist/clip-player.js';
import {Narrator} from '../dist/media.js';
import {guideClips,readoutClips,previewClips,numberWords} from '../dist/voice-recordings.js';
import {voiceIndex} from '../dist/voice-index.js';
import {experiments,initialState} from '../dist/experiments.js';
import {meters} from '../dist/measurements.js';
import {evaluate} from '../dist/models.js';
assert.equal(Object.keys(voiceIndex).length,301);
for(const [id,group]of Object.entries(voiceIndex)){assert.ok(fs.statSync(new URL('../dist/'+group.src,import.meta.url)).size>1000,id+' valid asset');for(const[start,end]of Object.values(group.segments)){assert.ok(start>=0&&end>start&&end<=group.duration+.001,id+' cue');}}
for(const e of experiments){assert.equal(guideClips(e.id).length,4);assert.equal(guideClips(e.id,'tasks').length,1);for(let i=0;i<3;i++)assert.equal(guideClips(e.id,'coach',i).length,1);const s=initialState(e),d=evaluate(e.id,s),readings=meters[e.id].map(m=>({key:m.key,display:'1,25',unit:m.unit}));assert.equal(readoutClips(e.id,readings).length,15+readings.filter(r=>r.unit).length,e.id+' number/label/unit clips');}
assert.deepEqual(numberWords('−1,25e-6'),['âm','một','phẩy','hai','năm','nhân','mười','mũ','âm','sáu']);assert.deepEqual(numberWords('1.005,00'),['một','nghìn','không','trăm','lẻ','năm','phẩy','không','không']);assert.deepEqual(numberWords('—'),['chưa xác định']);assert.equal(previewClips().length,1);
const sources=[];let fetches=0;class Context{constructor(){this.currentTime=0;this.destination={};this.state='suspended';}resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}decodeAudioData(){return Promise.resolve({duration:500})}createBufferSource(){const s={playbackRate:{value:1},connect(){},disconnect(){},start(...args){s.started=args},stop(){s.stopped=true}};sources.push(s);return s;}}
globalThis.AudioContext=Context;globalThis.fetch=async()=>{fetches++;return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}};
const states=[],p=new ClipPlayer(s=>states.push(s));assert.equal(sources.length,0,'never autoplay');assert.ok(p.play(previewClips()).ok);assert.equal(p.status().loading,true);await new Promise(r=>setTimeout(r,0));assert.equal(p.status().speaking,true);assert.equal(sources.length,1);p.togglePause();assert.equal(p.context.state,'suspended');p.togglePause();assert.equal(p.context.state,'running');p.stop();assert.equal(sources[0].stopped,true);assert.equal(p.status().speaking,false);
let release;globalThis.fetch=()=>new Promise(r=>{release=r});const pending=new ClipPlayer();pending.play([{src:'other.mp3',start:0,end:1}]);await Promise.resolve();pending.stop();release({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});const oldCount=sources.length;await new Promise(r=>setTimeout(r,0));assert.equal(sources.length,oldCount,'late load cannot restart stopped audio');
globalThis.fetch=async()=>({ok:false,status:404});const failure=new ClipPlayer();failure.play([{src:'missing.mp3',start:0,end:1}]);await new Promise(r=>setTimeout(r,0));assert.equal(failure.status().speaking,false);assert.ok(failure.status().error.includes('404'));
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;const narrator=new Narrator();assert.equal(narrator.status().voices[0].name,'Tiếng Việt tích hợp');assert.equal(narrator.speak('Hướng dẫn',guideClips('ohm')).ok,true);await new Promise(r=>setTimeout(r,0));assert.equal(narrator.status().speaking,true);narrator.stop();assert.equal(narrator.status().speaking,false);
delete globalThis.AudioContext;delete globalThis.fetch;
console.log('PASS 301 packaged Vietnamese files and all cues, 300 guides/steps/readout mappings, Vietnamese number composition, playback without OS voices, no autoplay, pause/resume/cancel races and load errors. Device audio is not tested.');
