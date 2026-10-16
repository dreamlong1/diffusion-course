import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {verifyPages} from '../scripts/verify-pages.mjs';

test('publication checks detect stale builds, broken assets and soft 404s',async t=>{
 const root=new URL('../dist/',import.meta.url);
 const expected=JSON.parse(await readFile(new URL('build-info.json',root),'utf8'));
 let mode='ok';
 const server=http.createServer(async(req,res)=>{
  const path=req.url.replace('/diffusion-course/','')||'index.html';
  if(mode==='404'&&path==='lessons/3/index.html'){res.writeHead(404);res.end('Not found');return;}
  if(mode==='stale'&&path==='build-info.json'){
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({...expected,revision:'old-commit'}));return;
  }
  const type=path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':path.endsWith('.js')?'text/javascript':'application/json';
  res.setHeader('Content-Type',mode==='mime'&&path==='assets/app.js'?'text/html':type);
  try{res.end(mode==='soft404'&&path==='lessons/2/index.html'?'<html>Course missing</html>':await readFile(new URL(path,root)));}
  catch(_){res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>server.close());
 const url=`http://127.0.0.1:${server.address().port}/diffusion-course/`;
 await t.test('serves exactly the expected fifteen pages and four resources',async()=>{assert.equal((await verifyPages(url,expected,{attempts:1})).files,19);});
 for(const [variant,message] of [['stale',/revision/],['404',/HTTP 404/],['soft404',/bytes differ/],['mime',/Wrong JS MIME/]]){
  await t.test(`rejects ${variant}`,async()=>{mode=variant;await assert.rejects(()=>verifyPages(url,expected,{attempts:1}),message);});
 }
});
