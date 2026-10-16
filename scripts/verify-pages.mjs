/** Verify deployed bytes, not just a workflow's status or an old HTTP 200. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export async function verifyPages(base, expected, {attempts=12, delay=5000}={}) {
 const url=new URL(base.endsWith('/')?base:base+'/');
 if(!['https:','http:'].includes(url.protocol))throw new Error('Expected an HTTP(S) site URL');
 const get=async path=>{
  const endpoint=new URL(path,url);
  const r=await fetch(endpoint,{signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(r.status!==200)throw new Error(`${path}: HTTP ${r.status}`);
  return r;
 };
 let last;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const manifest=await (await get('build-info.json')).json();
   if(manifest.name!=='diffusion-course'||manifest.revision!==expected.revision)throw new Error('Deployed revision differs from expected build');
   const files=Object.entries(expected.hashes||{});
   if(files.length!==9)throw new Error('Expected six pages and three assets in build manifest');
   for(const [path,hash] of files){
    if(manifest.hashes?.[path]!==hash)throw new Error(`Stale manifest: ${path}`);
    const r=await get(path),type=r.headers.get('content-type')||'';
    if(path.endsWith('.html')&&!type.includes('text/html'))throw new Error(`Wrong HTML MIME: ${path}`);
    if(path.endsWith('.js')&&!/(javascript|ecmascript)/.test(type))throw new Error(`Wrong JS MIME: ${path}`);
    if(path.endsWith('.css')&&!type.includes('text/css'))throw new Error(`Wrong CSS MIME: ${path}`);
    const bytes=Buffer.from(await r.arrayBuffer());
    if(createHash('sha256').update(bytes).digest('hex')!==hash)throw new Error(`Deployed bytes differ: ${path}`);
   }
   const home=await get('');
   if(createHash('sha256').update(Buffer.from(await home.arrayBuffer())).digest('hex')!==expected.hashes['index.html'])throw new Error('Homepage differs from expected build');
   return {url:url.href,files:files.length,revision:manifest.revision};
  }catch(error){last=error;if(attempt+1<attempts)await new Promise(r=>setTimeout(r,delay));}
 }
 throw last;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const base=process.argv[2];
  if(!base)throw new Error('Usage: npm run verify:pages -- https://owner.github.io/diffusion-course/');
  const expected=JSON.parse(await readFile(new URL('../dist/build-info.json',import.meta.url),'utf8'));
  console.log(JSON.stringify(await verifyPages(base,expected),null,2));
 }catch(e){console.error(`Pages verification failed: ${e.message}`);process.exitCode=1;}
}
