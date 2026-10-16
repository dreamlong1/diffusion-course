/** Dependency-free, deterministic static build. No network requests. */
import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import lesson1 from '../content/lessons/01.mjs';
import lesson2 from '../content/lessons/02.mjs';
import lesson3 from '../content/lessons/03.mjs';
import glossary from '../content/glossary.mjs';
import { paths, shell, home, lessonPage, glossaryPage, sourcesPage, tokens, hrefFor } from '../src/templates.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url))), dist=join(root,'dist');
const lessons=[lesson1,lesson2,lesson3];
const pages={home:home(lessons),...Object.fromEntries(lessons.map(l=>[l.id,lessonPage(l,lessons)])),glossary:glossaryPage(glossary),sources:sourcesPage()};
await rm(dist,{recursive:true,force:true});
await mkdir(join(dist,'assets'),{recursive:true});
for(const name of ['styles.css','core.js','app.js'])await copyFile(join(root,'src',name),join(dist,'assets',name));
for(const [id,body] of Object.entries(pages)){
 const file=join(dist,paths[id]);await mkdir(dirname(file),{recursive:true});
 await writeFile(file,shell(id,body,{lessons,glossary}));
}
await writeFile(join(dist,'.nojekyll'),'');
await writeFile(join(dist,'404.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>没有找到这一页 · 扩散模型入门课</title><style>body{font:16px/1.9 system-ui,sans-serif;margin:10vh auto;max-width:550px;padding:24px;background:#f6f7f4;color:#1e3137}a{color:#20636b}h1{font-size:30px}</style><h1>没有找到这一页</h1><p>首版开放前三课。请从课程目录重新进入，而不是使用还未开放章节的地址。</p><a href="/diffusion-course/index.html">返回课程目录 →</a></html>`);
// Portable, all-in-one edition: no network, no external resources, no build needed.
const css=await readFile(join(root,'src/styles.css'),'utf8');
const js=(await readFile(join(root,'src/core.js'),'utf8'))+'\n'+(await readFile(join(root,'src/app.js'),'utf8'));
const views=Object.entries(pages).map(([id,body])=>`<div class="single-view" data-view="${id}">${tokens(body,hrefFor('home',true))}</div>`).join('\n');
await mkdir(join(root,'.preview'),{recursive:true});
await writeFile(join(root,'.preview/course-preview.html'),shell('home',views,{lessons,glossary,inline:true,styles:css,scripts:js,allViews:true}));
const publicFiles=[...Object.values(paths),'assets/styles.css','assets/core.js','assets/app.js'];
const hashes=Object.fromEntries(await Promise.all(publicFiles.map(async file=>[file,createHash('sha256').update(await readFile(join(dist,file))).digest('hex')])));
const manifest={name:'diffusion-course',version:'1.0.1',revision:process.env.GITHUB_SHA||null,lessons:3,experiments:3,questions:9,pages:Object.values(paths),hashes,deployment:'Not verified by local build'};
await writeFile(join(dist,'build-info.json'),JSON.stringify(manifest,null,2));
console.log('Built: 6 course pages + 404, 3 interactive experiments, 9 questions.');
console.log('Static website: dist/  |  Standalone preview: .preview/course-preview.html');
