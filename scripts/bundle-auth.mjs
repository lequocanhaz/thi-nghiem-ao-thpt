// Bundle only Firebase App + Authentication. No CDN imports or source maps.
// Dependencies are pinned in package.json/package-lock.json and CI uses npm ci.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
const require=createRequire(import.meta.url);
const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const vendor=path.join(projectRoot,'dist/vendor');
const firebasePackage=JSON.parse(fs.readFileSync(require.resolve('firebase/package.json'),'utf8'));
const esbuildPackage=JSON.parse(fs.readFileSync(require.resolve('esbuild/package.json'),'utf8'));
if(firebasePackage.version!=='13.1.0'||esbuildPackage.version!=='0.28.2')throw Error('Use the pinned Firebase 13.1.0 and esbuild 0.28.2 versions from npm ci.');
fs.mkdirSync(vendor,{recursive:true});
await build({
 stdin:{contents:`export {initializeApp,getApps} from 'firebase/app';\nexport {getAuth,initializeAuth,browserSessionPersistence,browserLocalPersistence,onAuthStateChanged,setPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,GoogleAuthProvider,signInWithPopup,browserPopupRedirectResolver,signOut,deleteUser} from 'firebase/auth';`,resolveDir:projectRoot,sourcefile:'firebase-auth-entry.js',loader:'js'},
 outfile:path.join(vendor,'firebase-auth.js'),bundle:true,format:'esm',platform:'browser',target:'es2020',minify:true,sourcemap:false,legalComments:'eof',charset:'utf8',
 banner:{js:'// Quanh Lab: Firebase App/Authentication 13.1.0, locally bundled. Apache-2.0. See FIREBASE-LICENSE.txt.'}
});
// The npm meta-package omits LICENSE; this is the upstream license captured
// from the firebase@13.1.0 tag, preserved in source for reproducible offline CI.
const licensePath=path.join(projectRoot,'scripts/licenses/firebase-apache-2.0.txt');
fs.writeFileSync(path.join(vendor,'FIREBASE-LICENSE.txt'),'Firebase JavaScript SDK 13.1.0\nhttps://github.com/firebase/firebase-js-sdk\nBundled modules: Firebase App and Firebase Authentication.\n\n'+fs.readFileSync(licensePath,'utf8'));
console.log('Bundled local Firebase Authentication SDK:',fs.statSync(path.join(vendor,'firebase-auth.js')).size,'bytes; license preserved; no source maps.');
