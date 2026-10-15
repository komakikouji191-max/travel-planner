const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
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
 for (const match of text.matchAll(/\/assets\/[\w.-]+/g)) assets.add(match[0]);
 assert.ok(!text.includes('/workspace/'),`Cloud-only path in ${file}`);
}
for (const asset of assets) assert.ok(fs.existsSync(path.join(root,asset.slice(1))),`Missing ${asset}`);
assert.ok(!app.renderer,'Use standard WebView rendering for this implementation');
console.log(`PASS: ${app.pages.length} page routes, ${files.length} entry files, ${assets.size} bundled assets; JavaScript and JSON checks.`);
console.log('WeChat DevTools and real-device compilation remain separate checks.');
