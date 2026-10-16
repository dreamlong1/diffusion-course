/**
 * Run on YOUR computer after `gh auth login --web --scopes workflow`.
 * Creates only dreamlong1/diffusion-course; never forces a push or changes visibility.
 * No token is read by this script or included in the generated website.
 */
import {spawnSync} from 'node:child_process';
import {verifyPages} from './verify-pages.mjs';
import {existsSync,readFileSync,readdirSync,lstatSync} from 'node:fs';
import {dirname,resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline/promises';
const OWNER='dreamlong1',NAME='diffusion-course',REPO=`${OWNER}/${NAME}`;
const REMOTE=`https://github.com/${REPO}.git`;
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const usage=`发布目标：${REPO}（公开仓库）\n用法：node scripts/deploy.mjs [--dry-run | --yes | --help]\n--dry-run  只显示计划，不读取或修改 GitHub，不调用 git/gh\n--yes      跳过本机的 PUBLISH 确认；仍执行全部安全检查\n发布前需要：Node.js 22+、Git、GitHub CLI，并用 dreamlong1 登录。`;
const allowedArgs=new Set(['--dry-run','--yes','--help']);
if(args.some(a=>!allowedArgs.has(a))){console.error('未知参数。\n'+usage);process.exit(2);}
if(args.includes('--help')){console.log(usage);process.exit(0);}
if(args.includes('--dry-run')){
 console.log(usage+'\n\n计划（未执行）：\n1. 检查工具与登录账号；必须为 dreamlong1。\n2. 检查目标仓库，只接受不存在、空仓库，或本目录已经关联的同一仓库。\n3. 构建并测试，列出将公开的源文件。\n4. 提示输入 PUBLISH；创建公开仓库或使用已核实仓库。\n5. 在本项目创建提交，不更改全局 Git 配置；拒绝强制推送。\n6. 推送 main，开启 workflow 类型 Pages，再触发发布工作流。\n7. 等待工作流成功；读取实际 Pages 地址并逐页核对 HTTP 响应。\n\n未创建仓库，未推送内容，未声明网站上线。');
 process.exit(0);
}
process.chdir(root);
function result(command,argv,{inherit=false}={}){
 return spawnSync(command,argv,{cwd:root,encoding:'utf8',stdio:inherit?'inherit':'pipe',windowsHide:true});
}
function run(command,argv,options={}){
 const r=result(command,argv,options);
 if(r.error)throw new Error(`无法运行 ${command}：${r.error.message}`);
 if(r.status!==0)throw new Error(`${command} ${argv.join(' ')} 失败。\n${(r.stderr||r.stdout||'请查看命令输出。').trim()}`);
 return r.stdout?.trim()||'';
}
function api(path,method='GET',fields=[]){return run('gh',['api',path,'--method',method,...fields]);}
function maybeJson(path){
 const r=result('gh',['api',path]);
 if(r.status===0)return JSON.parse(r.stdout);
 if(/(?:HTTP 404|"status"\s*:\s*"?404"?)/.test((r.stderr||'')+(r.stdout||'')))return null;
 throw new Error(`GitHub 读取失败，不能把网络或权限错误当成“仓库不存在”。\n${r.stderr||r.stdout||r.error?.message}`);
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function retry(fn,attempts=8,delay=5000){let last;for(let i=0;i<attempts;i++){try{return await fn();}catch(e){last=e;if(i<attempts-1)await sleep(delay);}}throw last;}
function sourceFiles(){
 const files=['.gitignore','package.json','README.md','DEPLOY.md','CONTENT-NOTES.md','RIGHTS.md','QA.md'];
 function walk(dir){for(const item of readdirSync(resolve(root,dir),{withFileTypes:true})){
  const rel=dir+'/'+item.name,full=resolve(root,rel);
  if(lstatSync(full).isSymbolicLink())throw new Error(`拒绝上传符号链接：${rel}`);
  if(item.isDirectory()){if(item.name==='__pycache__'||item.name==='screenshots')continue;walk(rel);}else{
   if(/(?:^|\/)\.env/.test(rel)||/\.(pdf|woff2?|ttf|otf|pem|key|p12|zip|log|png|jpe?g)$/i.test(rel))throw new Error(`公开源目录中出现不应自动上传的文件：${rel}`);
   if(!['.mjs','.js','.css','.json','.yml','.yaml','.py','.md'].includes(extname(rel)))throw new Error(`未知源文件类型，请人工检查：${rel}`);
   files.push(rel);
  }
 }}
 for(const dir of['content','src','scripts','tests','.github'])walk(dir);
 for(const file of files)if(!existsSync(resolve(root,file)))throw new Error(`交付文件不完整：${file}`);
 return files;
}
async function main(){
 if(Number(process.versions.node.split('.')[0])<22)throw new Error('需要 Node.js 22 或更高版本。');
 for(const command of['git','gh']){
  if(result(command,['--version']).status!==0)throw new Error(`没有找到 ${command}。安装说明见 DEPLOY.md；不要把密码或令牌发到聊天中。`);
 }
 if(result('gh',['auth','status','--hostname','github.com']).status!==0)throw new Error('请先运行：gh auth login --hostname github.com --git-protocol https --web --scopes workflow');
 const user=JSON.parse(api('user'));
 if(user.login!==OWNER)throw new Error(`当前账号是 ${user.login}，目标账号是 ${OWNER}。已停止；请在 gh 中切换账号后重试。`);
 console.log(`已核对登录账号：${user.login}`);
 const repo=maybeJson(`repos/${REPO}`);
 const hasGit=existsSync(resolve(root,'.git'));
 if(repo?.private)throw new Error('目标名称已是私有仓库。本脚本不会改变其可见性，也不会自动发布它。');
 let remoteHeadExists=false;
 if(repo){
  const branches=JSON.parse(api(`repos/${REPO}/branches?per_page=1`));
  remoteHeadExists=Array.isArray(branches) && branches.length>0;
  if(remoteHeadExists && repo.default_branch!=='main')throw new Error('目标仓库默认分支不是 main；请先人工确认现有项目。');
  if(remoteHeadExists&&!hasGit)throw new Error('目标仓库已有内容，但当前目录并未关联其历史。已停止，避免覆盖项目。请先人工检查仓库。');
 }
 if(hasGit){
  const gitRoot=run('git',['rev-parse','--show-toplevel']);
  if(resolve(gitRoot)!==root)throw new Error('当前项目的 Git 根目录不匹配，已停止。');
  const remote=result('git',['remote','get-url','origin']);
  const allowed=[REMOTE,REMOTE.replace('.git',''),`git@github.com:${REPO}.git`];
  if(remote.status===0&&!allowed.includes(remote.stdout.trim()))throw new Error('origin 指向别的项目，已停止。');
  if(run('git',['branch','--show-current'])!=='main')throw new Error('当前不是 main 分支。请人工确认分支后重试；脚本不会自动重命名已有分支。');
  if(run('git',['diff','--cached','--name-only']))throw new Error('存在预先暂存的文件。请先处理它们，避免将无关内容一起提交。');
 }
 const files=sourceFiles();
 console.log('\n即将公开的文件（不包含原 PDF、字体、预览包或构建产物）：\n'+files.join('\n'));
 run(process.execPath,['scripts/build.mjs'],{inherit:true});
 const tests=readdirSync(resolve(root,'tests')).filter(x=>x.endsWith('.test.mjs')).map(x=>'tests/'+x);
 run(process.execPath,['--test','--test-concurrency=1',...tests],{inherit:true});
 if(!args.includes('--yes')){
  if(!process.stdin.isTTY)throw new Error('需要在终端确认。阅读脚本后使用交互终端运行，或明确传入 --yes。');
  const rl=createInterface({input:process.stdin,output:process.stdout});
  const answer=await rl.question(`\n将上述课程公开发布到 ${REPO}。输入 PUBLISH 确认：`);rl.close();
  if(answer.trim()!=='PUBLISH'){console.log('已取消。没有修改远端仓库。');return;}
 }
 if(!hasGit)run('git',['init','--initial-branch=main']);
 if(result('git',['config','user.name']).status!==0)run('git',['config','--local','user.name',OWNER]);
 if(result('git',['config','user.email']).status!==0)run('git',['config','--local','user.email',`${user.id}+${OWNER}@users.noreply.github.com`]);
 if(!repo){
  run('gh',['repo','create',REPO,'--public','--description','高中生也能懂的扩散模型：十二课完整交互入门课程'],{inherit:true});
 }
 if(result('git',['remote','get-url','origin']).status!==0)run('git',['remote','add','origin',REMOTE]);
 const gitAuth=['-c','credential.helper=','-c','credential.helper=!gh auth git-credential'];
 if(remoteHeadExists){
  run('git',[...gitAuth,'fetch','origin','main'],{inherit:true});
  if(result('git',['merge-base','--is-ancestor','origin/main','HEAD']).status!==0)throw new Error('远端存在当前本地历史未包含的提交。没有强制推送；请先人工合并。');
 }
 run('git',['add','--',...files]);
 const staged=run('git',['diff','--cached','--name-only']);
 if(staged)run('git',['commit','-m','Publish complete diffusion course [skip ci]'],{inherit:true});
 const sha=run('git',['rev-parse','HEAD']);
 run('git',[...gitAuth,'push','-u','origin','main'],{inherit:true});
 process.env.GITHUB_SHA=sha;
 run(process.execPath,['scripts/build.mjs'],{inherit:true});
 // Initial push skips CI; set Pages up before explicitly dispatching a workflow.
 const pages=maybeJson(`repos/${REPO}/pages`);
 if(!pages)api(`repos/${REPO}/pages`,'POST',['-f','build_type=workflow']);
 else if(pages.build_type!=='workflow')api(`repos/${REPO}/pages`,'PUT',['-f','build_type=workflow']);
 const launchedAt=new Date(Date.now()-5000).toISOString();
 await retry(()=>run('gh',['workflow','run','pages.yml','--repo',REPO,'--ref','main']));
 const runId=await retry(()=>{
  const runs=JSON.parse(run('gh',['run','list','--repo',REPO,'--workflow','pages.yml','--branch','main','--event','workflow_dispatch','--limit','10','--json','databaseId,headSha,createdAt']));
  const target=runs.find(r=>r.headSha===sha&&r.createdAt>=launchedAt);
  if(!target)throw new Error('等待新工作流出现在运行列表中。');return String(target.databaseId);
 },12,5000);
 console.log(`\n已触发发布工作流 ${runId}，等待结果。`);
 run('gh',['run','watch',runId,'--repo',REPO,'--exit-status','--interval','5'],{inherit:true});
 const published=JSON.parse(api(`repos/${REPO}/pages`));
 const url=published.html_url;
 if(!url||!url.startsWith('https://'))throw new Error('工作流结束，但没有读取到 HTTPS Pages 地址；请检查仓库 Pages 设置。');
 const actualBase=new URL(url.endsWith('/')?url:url+'/');
 const expected=JSON.parse(readFileSync(resolve(root,'dist/build-info.json'),'utf8'));
 await verifyPages(actualBase.href,expected);
 console.log(`\n发布成功，且提交版本、全部课程页面及静态资源均已通过 HTTP 字节核验：\n${actualBase.href}\n源仓库：https://github.com/${REPO}\n后续更新可正常提交并推送 main，工作流会自动发布。`);
}
main().catch(error=>{
 console.error('\n发布未完成：'+error.message);
 console.error(`请检查现有结果：https://github.com/${REPO}/actions\n脚本不会删除仓库、覆盖历史或回收已完成步骤。没有确认全部检查通过前，不应把地址当作已验证上线。`);
 process.exitCode=1;
});
