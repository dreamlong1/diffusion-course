import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {Script} from 'node:vm';
import {lessons,paths,questionCount} from '../content/course.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
const pages=Object.values(paths);
test('all fifteen pages render without template placeholders',()=>{for(const path of pages){const html=readFileSync(resolve(root,'dist',path),'utf8');assert.ok(html.startsWith('<!doctype html>'));assert.ok(html.includes('lang="zh-CN"'));assert.ok(!/\{\{[^}]+\}\}/.test(html));assert.ok(!html.includes('当前值不可用'));}});
test('relative links and script assets resolve locally under project prefix',()=>{for(const path of pages){const html=readFileSync(resolve(root,'dist',path),'utf8');for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){const link=match[1];if(/^(https?:|data:|#)/.test(link))continue;assert.ok(!link.startsWith('/'),`root absolute link ${link}`);assert.ok(existsSync(resolve(root,'dist',dirname(path),link.split('#')[0])),`${path}: missing ${link}`);}}});
test('all internal fragment links point to real headings',()=>{
 for(const path of pages){
  const html=readFileSync(resolve(root,'dist',path),'utf8');
  for(const [,link] of html.matchAll(/href="([^"]+)"/g)){
   if(/^(https?:|data:)/.test(link)||!link.includes('#'))continue;
   const [file,fragment]=link.split('#');
   const target=file?readFileSync(resolve(root,'dist',dirname(path),file),'utf8'):html;
   assert.ok(target.includes(`id="${fragment}"`),`${path}: broken fragment ${link}`);
  }
 }
});
test('browser scripts have valid JavaScript syntax',()=>{
 for(const file of ['core.js','app.js','advanced-app.js'])new Script(readFileSync(resolve(root,'dist/assets',file),'utf8'),{filename:file});
});
test('HTML IDs are unique within each page and the standalone edition',()=>{for(const file of [...pages.map(p=>resolve(root,'dist',p)),resolve(root,'.preview/course-preview.html')]){const html=readFileSync(file,'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,`duplicate ID in ${file}`);}});
test('exactly thirty-six valid questions with explicit explanations',()=>{assert.equal(lessons.flatMap(l=>l.questions).length,36);for(const l of lessons){assert.equal(l.questions.length,3);for(const q of l.questions){assert.ok(q.explanation.length>10);assert.ok(l.body.includes(`id="${q.review}"`));assert.ok(q.type==='number'?Number.isFinite(q.answer):q.answer>=0&&q.answer<q.options.length);}}});
test('standalone preview embeds every lesson and all scripts, has no external runtime requests',()=>{const html=readFileSync(resolve(root,'.preview/course-preview.html'),'utf8');for(const id of Object.keys(paths))assert.ok(html.includes(`data-view="${id}"`));assert.ok(html.includes('data-single="true"'));assert.ok(!/<script[^>]*src=/.test(html));assert.ok(!/<link[^>]*rel="stylesheet"/.test(html));assert.ok(html.includes('globalThis.DiffusionMath'));});
test('readable formulas are native MathML, not images or unrendered TeX',()=>{const html=readFileSync(resolve(root,'dist/lessons/3/index.html'),'utf8');assert.ok(html.includes('<math xmlns="http://www.w3.org/1998/Math/MathML"'));assert.ok(!html.includes('\\frac'));});
test('public build contains no PDF, font files, source map or credential files',()=>{const all=[];const walk=dir=>{for(const file of readdirSync(dir,{withFileTypes:true})){const p=resolve(dir,file.name);file.isDirectory()?walk(p):all.push(p);}};walk(resolve(root,'dist'));assert.ok(all.every(p=>!/(\.pdf|\.woff2?|\.ttf|\.otf|\.env|\.map)$/i.test(p)));});

test('complete curriculum has twelve substantial lessons, one lab each and no unavailable placeholders',()=>{
 assert.equal(lessons.length,12);assert.equal(questionCount,36);
 for(const l of lessons){
  assert.equal(l.id,`lesson-${l.number}`);assert.ok(l.objectives.length>=3);
  assert.ok(l.body.replace(/<[^>]+>/g,'').length>800,`too little content for ${l.id}`);
  assert.equal((l.body.match(/data-(?:advanced-)?lab=/g)||[]).length,1,l.id);
  const html=readFileSync(resolve(root,'dist',paths[l.id]),'utf8');
  assert.ok(!html.includes('undefined'));assert.ok(!html.includes('尚未开放'));
 }
 const manifest=JSON.parse(readFileSync(resolve(root,'dist/build-info.json'),'utf8'));
 assert.equal(manifest.lessons,12);assert.equal(manifest.experiments,12);assert.equal(manifest.questions,36);assert.equal(manifest.pages.length,15);assert.equal(Object.keys(manifest.hashes).length,19);
});
