/** Read-only local preview server. Binds to loopback, never exposes source files. */
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../dist');
const i=process.argv.indexOf('--port'),port=i>=0?Number(process.argv[i+1]):4321;
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 try{
  let route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(route==='/diffusion-course') {res.writeHead(302,{'Location':'/diffusion-course/'});res.end();return;}
  if(route.startsWith('/diffusion-course/'))route=route.slice('/diffusion-course'.length);
  let file=resolve(root,'.'+route);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  let info=await stat(file);if(info.isDirectory()){file=resolve(file,'index.html');info=await stat(file);}
  if(!info.isFile())throw new Error('Not a file');
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
 }catch(_){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html'),'utf8').catch(()=>'<h1>404</h1>'));}
});
server.listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}/diffusion-course/`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
