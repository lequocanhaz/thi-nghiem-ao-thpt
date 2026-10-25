import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {VISUAL_STORAGE_KEY,VISUAL_MODES,visualPreset,normalizeVisualSettings,loadVisualSettings,saveVisualSettings,updateVisualSetting,visualRenderConfig,visualSettingsMarkup,applyVisualAppearance,syncVisualSettings} from '../dist/visual-settings.js';

const session='{"lever":{"rows":[{"values":[1,2,3]}]}}';
const persisted=new Map([['thpt-lab-v1',session],['thpt-ui-v3','{"textSize":1.15}']]);
const writes=[],storage={getItem:key=>persisted.get(key)??null,setItem:(key,value)=>{writes.push(key);persisted.set(key,value);}};
assert.deepEqual(loadVisualSettings(storage),visualPreset(),'new users inherit the experiment settings');
const originalConfig={mode:2,capMode:'discharge',gasAxis:'v',viewMode:'2d',switches:{labels:false,grid:true,trajectory:true,axes:false,vectors:false,lines:true}};
const configSnapshot=structuredClone(originalConfig);
assert.deepEqual(visualRenderConfig(originalConfig,visualPreset(),{motion:true}).switches,originalConfig.switches);
for(const mode of VISUAL_MODES){
 const settings=visualPreset(mode.value);
 assert.equal(saveVisualSettings(storage,settings),true);
 assert.deepEqual(loadVisualSettings(storage),settings);
 assert.deepEqual(originalConfig,configSnapshot,'visual preferences never mutate the live experiment config');
 assert.equal(persisted.get('thpt-lab-v1'),session,'saving presentation must preserve recorded data');
 assert.equal(persisted.get('thpt-ui-v3'),'{"textSize":1.15}','the existing UI settings key is not replaced');
 const transformed=visualRenderConfig(originalConfig,settings,{motion:true,presentation:false});
 assert.equal(transformed.capMode,'discharge');assert.equal(transformed.mode,2);assert.equal(transformed.viewMode,'2d');
 assert.equal(transformed.switches.axes,false);assert.equal(transformed.switches.vectors,false);
 assert.equal(transformed.motion,mode.value!=='reduced-motion');
 assert.equal(transformed.teacherMode,mode.value==='classroom');
}
assert.ok(writes.every(key=>key===VISUAL_STORAGE_KEY),'only the dedicated presentation preference key is written');
assert.deepEqual(loadVisualSettings({getItem(){throw Error('Storage blocked');}}),visualPreset());
assert.equal(saveVisualSettings({setItem(){throw Error('Storage full');}},visualPreset()),false);
assert.deepEqual(normalizeVisualSettings({mode:'<script>',labels:'true',grid:0,trajectory:[],contrast:'evil',reducedMotion:'false'}),visualPreset());
assert.deepEqual(loadVisualSettings({getItem:()=>'{broken JSON'}),visualPreset());
assert.deepEqual(normalizeVisualSettings(null),visualPreset());

let settings=updateVisualSetting(visualPreset(),'labels','on');
settings=updateVisualSetting(settings,'grid','off');
settings=updateVisualSetting(settings,'trajectory','off');
settings=updateVisualSetting(settings,'reducedMotion',true);
const next=visualRenderConfig(originalConfig,settings,{motion:true});
assert.deepEqual(next.switches,{...originalConfig.switches,labels:true,grid:false,trajectory:false});
assert.equal(next.motion,false);
assert.deepEqual(updateVisualSetting(settings,'mode','standard'),visualPreset(),'choosing a preset resets its presentation overrides');
assert.equal(updateVisualSetting(settings,'labels','inherit').labels,null);
assert.equal(visualRenderConfig(originalConfig,visualPreset(),{presentation:true,motion:false}).switches.labels,true);
assert.equal(visualRenderConfig(originalConfig,visualPreset(),{presentation:true,motion:false}).motion,false);

const {document}=parseHTML('<html><body><section class="stage-shell">'+visualSettingsMarkup(settings)+'</section></body></html>');
assert.equal(document.querySelector('.visual-settings').tagName,'DETAILS');
assert.ok(document.querySelector('.visual-settings > summary'));
assert.equal(document.querySelector('[role="group"]').getAttribute('aria-label'),'Thiết lập hiển thị mô hình');
assert.equal(document.querySelector('[role="status"]').getAttribute('aria-live'),'polite');
for(const control of document.querySelectorAll('select'))assert.ok(document.querySelector(`label[for="${control.id}"]`),'every select has a visible label');
assert.equal(document.querySelector('#visualMode').querySelectorAll('option').length,4);
assert.ok(!document.querySelector('[data-visual-setting="particleScale"]'),'no particle size slider without renderer support');
const shell=document.querySelector('.stage-shell');
applyVisualAppearance(shell,visualPreset('high-contrast'));
assert.equal(shell.dataset.visualContrast,'high');
applyVisualAppearance(shell,visualPreset('reduced-motion'));
assert.equal(shell.classList.contains('visual-reduced-motion'),true);
applyVisualAppearance(shell,visualPreset());
assert.equal(shell.classList.contains('visual-reduced-motion'),false);
// Linkedom has a read-only select.value; browser tests cover the native select update path.
const fakeControl={dataset:{visualSetting:'trajectory'},type:'select-one',value:''};
syncVisualSettings({querySelectorAll:()=>[fakeControl]},settings);
assert.equal(fakeControl.value,'off');

let cases=0;
for(const experiment of experiments){
 const state=initialState(experiment),before=structuredClone(state);
 for(const mode of VISUAL_MODES){
  const base={...originalConfig,mode:0};
  const baseline=evaluate(experiment.id,state,base);
  const displayed=evaluate(experiment.id,state,visualRenderConfig(base,visualPreset(mode.value),{motion:true}));
  assert.deepEqual(displayed,baseline,experiment.id+' '+mode.value+' must not change scientific results');
  assert.deepEqual(state,before,experiment.id+' physical state must survive presentation changes');
  cases++;
 }
}
console.log(`PASS visual settings: 4 presets, isolated storage, inherited switches, accessible controls, ${cases} unchanged model evaluations. Browser state/camera behavior is tested separately.`);
