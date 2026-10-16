/* Pure math shared by the browser and Node tests. No training or sampling model. */
(function (root) {
  'use strict';
  function finite(...values) {
    if (values.some(v => !Number.isFinite(v))) throw new TypeError('请输入有限数字。');
  }
  function cosine(t) {
    finite(t);
    if (t < 0 || t > 1) throw new RangeError('t 必须介于 0 和 1 之间。');
    if (t === 0) return { alpha: 1, sigma: 0 };
    if (t === 1) return { alpha: 0, sigma: 1 };
    return { alpha: Math.cos(Math.PI * t / 2), sigma: Math.sin(Math.PI * t / 2) };
  }
  function mix(x0, alpha, sigma, epsilon) {
    finite(x0, alpha, sigma, epsilon);
    return alpha * x0 + sigma * epsilon;
  }
  function loss(prediction, target) {
    finite(prediction, target);
    return (prediction - target) ** 2;
  }
  function estimate(xt, alpha, sigma, prediction) {
    finite(xt, alpha, sigma, prediction);
    if (Math.abs(alpha) < 1e-8) return null;
    return (xt - sigma * prediction) / alpha;
  }
  function format(value, digits = 3) {
    if (value === null || !Number.isFinite(value)) return '不可反算';
    const rounded = Number(value.toFixed(digits));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }
  function gaussianArray(length, seed = 12345) {
    if (!Number.isInteger(length) || length < 0 || length > 1e6) throw new RangeError('无效的数组长度。');
    let state = seed >>> 0;
    function random() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state + 1) / 4294967297;
    }
    const out = new Float32Array(length);
    for (let i = 0; i < length; i += 2) {
      const r = Math.sqrt(-2 * Math.log(random()));
      const angle = 2 * Math.PI * random();
      out[i] = r * Math.cos(angle);
      if (i + 1 < length) out[i + 1] = r * Math.sin(angle);
    }
    return out;
  }
  function stats(values) {
    if (!values.length) throw new RangeError('样本不能为空');
    finite(...values);
    const mean=values.reduce((a,b)=>a+b,0)/values.length;
    return {mean,sd:Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length)};
  }
  function normalDensity(x,mean,sd) {
    finite(x,mean,sd);if(sd<=0)throw new RangeError('标准差必须大于零');
    return Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
  }
  function normalScore(x,mean,sd) {
    finite(x,mean,sd);if(sd<=0)throw new RangeError('标准差必须大于零');
    return -(x-mean)/(sd*sd);
  }
  function trainLinear(steps,rate) {
    finite(steps,rate);if(!Number.isInteger(steps)||steps<0||steps>100||rate<=0||rate>=.4)throw new RangeError('无效的训练设置');
    let weight=0;const history=[.625];
    for(let i=0;i<steps;i++){weight-=rate*5*(weight-.5);history.push(2.5*(weight-.5)**2);}
    return {weight,loss:history.at(-1),history};
  }
  function ddpmStep(xt,prediction,stage,z) {
    finite(xt,prediction,stage,z);if(stage!==1&&stage!==2)throw new RangeError('教学步骤只能是 1 或 2');
    const beta=stage===2?.25:.2,bar=stage===2?.6:.8,previous=stage===2?.8:1;
    const mean=(xt-beta/Math.sqrt(1-bar)*prediction)/Math.sqrt(1-beta);
    const sd=stage===1?0:Math.sqrt(beta*(1-previous)/(1-bar));
    return {mean,sd,next:mean+sd*z};
  }
  function guidance(unconditional,conditional,scale){finite(unconditional,conditional,scale);return unconditional+scale*(conditional-unconditional);}
  function linearFlow(z,y,time){finite(z,y,time);if(time<0||time>1)throw new RangeError('阶段越界');return {position:(1-time)*z+time*y,velocity:y-z};}
  function eulerGrowth(steps){
    if(!Number.isInteger(steps)||steps<1||steps>1000)throw new RangeError('无效的步数');
    let x=1;const points=[{t:0,x}];for(let i=0;i<steps;i++){x+=x/steps;points.push({t:(i+1)/steps,x});}
    return {estimate:x,exact:Math.E,error:Math.abs(Math.E-x),points};
  }
  function replan(position,goal,execute,horizon=6){
    finite(position,goal,execute,horizon);if(!Number.isInteger(execute)||!Number.isInteger(horizon)||execute<1||execute>horizon||horizon>100)throw new RangeError('无效的执行长度');
    const action=(goal-position)/horizon;
    return {action,next:position+action*execute,plan:Array.from({length:horizon+1},(_,i)=>position+action*i)};
  }
  function biasStudy(time,bias){
    finite(time,bias);const {alpha,sigma}=cosine(time),noise=gaussianArray(5,731),clean=[-2,-1,0,1,2];
    const reconstructed=clean.map((x,i)=>estimate(mix(x,alpha,sigma,noise[i]),alpha,sigma,noise[i]+bias));
    const error=reconstructed.some(x=>x===null)?null:reconstructed.reduce((sum,x,i)=>sum+(x-clean[i])**2,0)/clean.length;
    return {alpha,sigma,loss:bias*bias,error,clean,reconstructed};
  }
  root.DiffusionMath = Object.freeze({ cosine, mix, loss, estimate, format, gaussianArray, stats, normalDensity, normalScore, trainLinear, ddpmStep, guidance, linearFlow, eulerGrowth, replan, biasStudy });
})(globalThis);
