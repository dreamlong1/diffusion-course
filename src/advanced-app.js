/* Local numerical teaching labs. No network, model weights or telemetry. */
(function(){
 'use strict';
 const D=globalThis.DiffusionMath;
 if(!D)return;
 const ns='http://www.w3.org/2000/svg';
 function element(name,attrs={},text=''){
  const node=document.createElementNS(ns,name);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));node.textContent=text;return node;
 }
 document.querySelectorAll('[data-advanced-lab]').forEach(lab=>{
  const number=Number(lab.dataset.advancedLab),svg=lab.querySelector('svg'),status=lab.querySelector('[data-advanced-status]'),plotNote=lab.querySelector('[data-plot-note]');
  const params=Object.fromEntries([...lab.querySelectorAll('[data-param]')].map(input=>[input.dataset.param,input]));
  let seed=731,position=0,executed=0;
  function out(key,value){lab.querySelectorAll(`[data-result="${key}"]`).forEach(node=>node.textContent=typeof value==='number'?D.format(value,6):String(value));}
  function plot(xmin,xmax,ymin,ymax,xlabel,ylabel){
   svg.replaceChildren();
   const x=v=>44+448*(v-xmin)/(xmax-xmin),y=v=>198-166*(v-ymin)/(ymax-ymin);
   svg.append(element('path',{d:'M44 32V198H492',fill:'none',stroke:'#91a69f'}));
   for(let i=0;i<3;i++){
    const xx=xmin+(xmax-xmin)*i/2,yy=ymin+(ymax-ymin)*i/2;
    svg.append(element('text',{x:x(xx),y:216,'text-anchor':'middle',class:'axis-labels'},D.format(xx,2)));
    svg.append(element('text',{x:38,y:y(yy)+4,'text-anchor':'end',class:'axis-labels'},D.format(yy,2)));
   }
   svg.append(element('text',{x:268,y:237,'text-anchor':'middle',class:'axis-labels'},xlabel));
   svg.append(element('text',{x:44,y:19,class:'axis-labels'},ylabel));
   return {x,y,line(points,color='#20636b'){svg.append(element('path',{d:points.map((p,i)=>`${i?'L':'M'}${x(p[0])} ${y(p[1])}`).join(' '),fill:'none',stroke:color,'stroke-width':2.5}));},dot(xx,yy,color='#b3622e'){svg.append(element('circle',{cx:x(xx),cy:y(yy),r:5,fill:color}));}};
  }
  function update(){
   const v=Object.fromEntries(Object.entries(params).map(([k,input])=>{
    const value=Number(input.value);lab.querySelector(`[data-value-for="${input.id}"]`).textContent=D.format(value);input.setAttribute('aria-valuetext',D.format(value));return[k,value];
   }));
   plotNote.textContent='';
   if(number===4){
    const values=Array.from(D.gaussianArray(2000,seed),z=>v.mean+v.sd*z),s=D.stats(values),bins=Array(40).fill(0);let outside=0;
    values.forEach(x=>{const i=Math.floor((x+10)*2);if(i>=0&&i<40)bins[i]++;else outside++;});
    const p=plot(-10,10,0,Math.max(1,...bins),'样本值','每个等宽区间的样本数');
    bins.forEach((count,i)=>svg.append(element('rect',{x:p.x(-10+i*.5)+1,y:p.y(count),width:9.2,height:p.y(0)-p.y(count),fill:'#427c78'})));
    out('mean',s.mean);out('sd',s.sd);out('outside',outside);
    status.textContent=`2000 个样本；随机种子 ${seed}。理论均值 ${v.mean}，理论标准差 ${v.sd}。样本结果会有波动。`;
   }else if(number===5){
    const r=D.trainLinear(v.steps,v.rate);out('weight',r.weight);out('loss',r.loss);out('steps',v.steps);
    const p=plot(0,20,0,.65,'参数更新次数','平均平方损失');p.line(r.history.map((loss,i)=>[i,loss]));p.dot(v.steps,r.loss);
    status.textContent=`已从 w = 0 执行 ${v.steps} 次梯度更新；最优 w = 0.5。这里的更新次数不是扩散时间。`;
   }else if(number===6){
    const r=D.ddpmStep(1.2,v.prediction,v.stage,v.z);Object.entries(r).forEach(([k,x])=>out(k,x));
    const p=plot(-3,5,0,1,'数值位置','点的位置表示：当前 / 均值 / 下一步');p.dot(1.2,.8,'#678b79');p.dot(r.mean,.5,'#20636b');p.dot(r.next,.2);
    status.textContent=v.stage===1?'最后一步：反向标准差为 0，改变 z 不改变输出。':`下一步 = ${D.format(r.mean)} + ${D.format(r.sd)} × (${v.z}) = ${D.format(r.next)}。`;
    plotNote.textContent='上排是当前 xₜ，中排是反向均值，下排是下一步。纵向分排只为区分，不是数值大小。';
   }else if(number===7){
    const prediction=D.guidance(1,3,v.scale);out('prediction',prediction);out('estimate',D.estimate(9.2,.8,.6,prediction));
    const p=plot(0,4,0,9,'引导强度 g','组合后的噪声预测');p.line([[0,1],[4,9]]);p.dot(v.scale,prediction);
    status.textContent=`1 + ${v.scale} × (3 − 1) = ${D.format(prediction)}。本实验没有图像质量评分；g = 1 恰好采用有条件预测。`;
   }else if(number===8){
    const score=D.normalScore(v.x,0,v.sd),next=v.x+.2*score;out('score',score);out('next',next);
    const p=plot(-4,4,0,.85,'位置 x','高斯概率密度');p.line(Array.from({length:161},(_,i)=>{const x=-4+i*.05;return[x,D.normalDensity(x,0,v.sd)];}));p.dot(v.x,D.normalDensity(v.x,0,v.sd));
    svg.append(element('path',{d:`M${p.x(v.x)} 185H${p.x(next)}`,stroke:'#b3622e','stroke-width':4}));p.dot(next,.065);
    status.textContent=score===0?'在高斯中心，Score = 0。这里只展示单步方向，不是完整分布采样。':`Score ${score<0?'为负，方向向左':'为正，方向向右'}。短线终点对应 x + 0.2 × Score = ${D.format(next)}。`;
   }else if(number===9){
    const r=D.linearFlow(-2,6,v.time);out('position',r.position);out('target',r.velocity);out('loss',D.loss(v.velocity,r.velocity));
    const p=plot(0,1,-2,6,'τ：噪声端 0 → 数据端 1','训练路径的位置');p.line([[0,-2],[1,6]]);p.dot(v.time,r.position);
    status.textContent=`当前位置 ${D.format(r.position)}，目标速度始终为 8；预测 ${v.velocity} 的平方损失为 ${D.format(D.loss(v.velocity,8))}。这是已知配对路径，不是生成轨迹。`;
   }else if(number===10){
    const r=D.eulerGrowth(v.steps);['estimate','exact','error'].forEach(k=>out(k,r[k]));
    const p=plot(0,1,1,3,'阶段 τ','位置 x');p.line(Array.from({length:61},(_,i)=>[i/60,Math.exp(i/60)]));p.line(r.points.map(q=>[q.t,q.x]),'#b3622e');p.dot(1,r.estimate);
    status.textContent=`Euler 使用 ${v.steps} 次速度计算；蓝绿曲线是精确解，橙线是近似结果。单步映射 e × x 是已知公式，没有经过训练。`;
   }else if(number===11){
    const r=D.replan(position,v.goal,v.execute);out('position',position);out('action',r.action);out('executed',executed);
    const p=plot(0,6,-10,10,'未来第几个动作','计划位置');p.line(r.plan.map((x,i)=>[i,x]));r.plan.forEach((x,i)=>p.dot(i,x,i<=v.execute?'#b3622e':'#20636b'));
    status.textContent=`重新规划 6 个位移，下一次只执行前 ${v.execute} 个。累计已执行 ${executed} 个；图中橙点标出下一段将执行到的位置。`;
   }else if(number===12){
    const r=D.biasStudy(v.time,v.bias);out('loss',r.loss);out('error',r.error===null?'不可反算':r.error);out('alpha',r.alpha);
    if(r.error===null){plot(-2,2,-2,2,'干净数据','重建数据（不可计算）');status.textContent='t = 1 时 α = 0，不能除以零。即使 b = 0，也无法从纯噪声唯一反算原始数据。';}
    else{
     const lo=Math.min(-3,...r.reconstructed),hi=Math.max(3,...r.reconstructed),p=plot(-2,2,lo,hi,'干净数据 x₀','估计数据 x̂₀');p.line([[-2,-2],[2,2]]);r.reconstructed.forEach((x,i)=>p.dot(r.clean[i],x));
     status.textContent=`固定种子 731、5 个样本。误差放大系数 σ/α = ${D.format(r.sigma/r.alpha)}；橙点与蓝绿线的偏离反映重建误差，不代表真实生成质量。`;
    }
   }
   svg.setAttribute('aria-label',`${lab.querySelector('h3').textContent}。${status.textContent}`);
  }
  Object.values(params).forEach(input=>input.addEventListener('input',update));
  lab.querySelector('[data-advanced-step]')?.addEventListener('click',()=>{
   if(number===4)seed+=31;
   if(number===5)params.steps.value=String(Math.min(20,Number(params.steps.value)+1));
   if(number===11){const k=Number(params.execute.value);position=D.replan(position,Number(params.goal.value),k).next;executed+=k;}
   update();
  });
  lab.querySelector('[data-advanced-reset]').addEventListener('click',()=>{Object.values(params).forEach(input=>input.value=input.defaultValue);seed=731;position=0;executed=0;update();});
  update();
 });
})();
