const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const project = JSON.parse(fs.readFileSync('project.config.json','utf8'));
const root = path.resolve(project.miniprogramRoot);
const app = JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
assert.equal(project.compileType,'miniprogram');
assert.equal(root,process.cwd());
assert.ok(project.appid);
const files = ['app.js','app.json','app.wxss','sitemap.json'];
for (const page of app.pages) for (const ext of ['js','json','wxml','wxss']) files.push(`${page}.${ext}`);
let assets = new Set();
for (const file of files) {
 assert.ok(fs.existsSync(path.join(root,file)),`Missing ${file}`);
 const text = fs.readFileSync(path.join(root,file),'utf8');
 if (file.endsWith('.js')) execFileSync(process.execPath,['--check',file]);
 if (file.endsWith('.json')) JSON.parse(text);
 if (file.endsWith('.wxml')) {
  for (const match of text.matchAll(/{{([\s\S]*?)}}/g)) {
   const expression=match[1].replaceAll('&amp;','&');
   const line=text.slice(0,match.index).split('\n').length;
   assert.ok(!/[\r\n]/.test(expression),`${file}:${line}: Keep WXML bindings on one line to avoid split string literals`);
   try {new vm.Script('('+expression+')');} catch(error) {throw new Error(`${file}:${line}: Invalid WXML expression: ${error.message}`);}
  }
 }

 for (const match of text.matchAll(/\/assets\/[\w.-]+/g)) assets.add(match[0]);
 assert.ok(!text.includes('/workspace/'),`Cloud-only path in ${file}`);
}
for (const asset of assets) assert.ok(fs.existsSync(path.join(root,asset.slice(1))),`Missing ${asset}`);
assert.ok(!app.renderer,'Use standard WebView rendering for this implementation');
console.log(`PASS: ${app.pages.length} page routes, ${files.length} entry files, ${assets.size} bundled assets; JavaScript and JSON checks.`);
console.log('WeChat DevTools and real-device compilation remain separate checks.');

// Conservative source budgets leave headroom for DevTools compilation overhead.
assert.equal(app.lazyCodeLoading,'requiredComponents','Enable component lazy loading');
function walk(entry){const p=path.join(root,entry);if(!fs.existsSync(p))return [];return fs.statSync(p).isDirectory()?fs.readdirSync(p).flatMap(n=>walk(path.join(entry,n))):[entry];}
const runtimeFiles=['app.js','app.json','app.wxss','sitemap.json','pages','assets','utils'].flatMap(walk);
const runtimeBytes=runtimeFiles.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0);
assert.ok(runtimeBytes<1400000,`Runtime source budget exceeded: ${runtimeBytes} bytes (budget 1,400,000)`);
const projectFiles=fs.readdirSync(root).filter(n=>n!=='.git').flatMap(walk);
const media=projectFiles.filter(f=>/\.(?:jpe?g|png|gif|webp|mp3|mp4|wav|m4a)$/i.test(f));
for(const file of media)assert.ok(fs.statSync(path.join(root,file)).size<=200000,`Media exceeds 200 KB: ${file}`);
for(const file of runtimeFiles.filter(f=>f.startsWith('utils/')&&f.endsWith('.js')))execFileSync(process.execPath,['--check',file]);
console.log(`PASS: lazy loading; runtime source ${runtimeBytes.toLocaleString('en-US')} bytes; ${media.length} media files across the entire project each <=200,000 bytes.`);
console.log('DevTools must rescan its compiled package to confirm the final 1.5 MB recommendation.');
