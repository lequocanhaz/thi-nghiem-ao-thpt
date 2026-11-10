import assert from 'node:assert/strict';
import {profilePhotoURL} from '../dist/auth-client.js';
assert.equal(profilePhotoURL('https://lh3.googleusercontent.com/a/photo=s96-c'),'https://lh3.googleusercontent.com/a/photo=s96-c');
for(const value of [undefined,null,'','javascript:alert(1)','data:image/svg+xml,<svg/>','http://lh3.googleusercontent.com/a','https://lh3.googleusercontent.com.evil.test/a','https://evil.test/a','https://name:secret@lh3.googleusercontent.com/a'])assert.equal(profilePhotoURL(value),null);
console.log('PASS profile avatar v79: only bounded HTTPS Google photo URLs without embedded credentials; unsafe/other origins fall back to initials. Image load/error is tested in Chromium separately.');
