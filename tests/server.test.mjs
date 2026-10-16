import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomInt} from 'node:crypto';
import {paths} from '../content/course.mjs';
test('built website serves correctly at the project URL prefix', {timeout:15000}, async t=>{
 const port=randomInt(40000,50000);
 const server=spawn(process.execPath,[fileURLToPath(new URL('../scripts/serve.mjs',import.meta.url)),'--port',String(port)],{stdio:['ignore','pipe','pipe']});
 t.after(()=>server.kill());
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('server startup timeout')),5000);server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('error',e=>{clearTimeout(timer);reject(e);});});
 const base=`http://127.0.0.1:${port}/diffusion-course/`;
 await t.test('all fifteen course pages return actual HTTP 200 with the course title',async()=>{for(const p of Object.values(paths)){const r=await fetch(base+p);assert.equal(r.status,200);assert.match(await r.text(),/扩散模型入门课/);}});
 await t.test('CSS and scripts return appropriate MIME types',async()=>{for(const [p,type]of[['assets/styles.css','text/css'],['assets/core.js','text/javascript'],['assets/app.js','text/javascript'],['assets/advanced-app.js','text/javascript']]){const r=await fetch(base+p);assert.equal(r.status,200);assert.ok(r.headers.get('content-type').startsWith(type));}});
 await t.test('HEAD requests succeed without a response body',async()=>{const r=await fetch(base,{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
 await t.test('unknown routes return a real 404, not a false success',async()=>{const r=await fetch(base+'lesson-not-available/');assert.equal(r.status,404);assert.match(await r.text(),/没有找到这一页/);});
 await t.test('local preview refuses write requests',async()=>{const r=await fetch(base,{method:'POST',body:'not allowed'});assert.equal(r.status,405);});
});
