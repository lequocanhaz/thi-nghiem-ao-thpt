import assert from 'node:assert/strict';
import {translateShort} from '../dist/language-ui.js';
const vi='Trục định hướng · không dùng để đọc số đo',en='Orientation axes · not for taking measurements';
assert.equal(translateShort(vi),en);
assert.equal(translateShort('  '+vi+'  '),'  '+en+'  ');
assert.equal(translateShort(vi+' theo dự đoán của tôi'),vi+' theo dự đoán của tôi');
assert.equal(translateShort('Trục định hướng của hình minh họa; không dùng chiều dài trên hình để đọc số đo.'),'Illustration orientation axes; do not use lengths on the illustration to take measurements.');
console.log('PASS v75 exact coordinate guidance translations; user prose and whitespace preserved.');
