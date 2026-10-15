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
