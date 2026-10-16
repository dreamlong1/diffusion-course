import test from 'node:test';
import assert from 'node:assert/strict';
import '../src/core.js';
const D=globalThis.DiffusionMath;
const near=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<tol,`${actual} != ${expected}`);
test('sample statistics use population variance and affine Gaussian scaling',()=>{
 const s=D.stats([-1,0,1]);near(s.mean,0);near(s.sd,Math.sqrt(2/3));
 const values=Array.from(D.gaussianArray(2000,731)),a=D.stats(values),b=D.stats(values.map(x=>3+2*x));near(b.mean,3+2*a.mean);near(b.sd,2*a.sd);
 assert.throws(()=>D.stats([]));
});
test('linear training uses mean loss and exact gradient; stable learning rates converge',()=>{
 near(D.trainLinear(0,.1).loss,.625);const r=D.trainLinear(1,.1);near(r.weight,.25);near(r.loss,.15625);
 for(const rate of [.02,.1,.3,.35])assert.ok(D.trainLinear(20,rate).loss<.625);
 assert.throws(()=>D.trainLinear(1,.4));
});
test('DDPM two-stage schedule uses posterior variance and suppresses final noise',()=>{
 const r=D.ddpmStep(1.2,.5,2,1);near(r.mean,(1.2-.25/Math.sqrt(.4)*.5)/Math.sqrt(.75));near(r.sd,Math.sqrt(.125));near(r.next,r.mean+r.sd);
 const a=D.ddpmStep(1.2,.5,1,-2),b=D.ddpmStep(1.2,.5,1,2);near(a.sd,0);near(a.next,b.next);assert.throws(()=>D.ddpmStep(0,0,3,0));
});
test('CFG boundaries and extrapolation match the stated g convention',()=>{near(D.guidance(1,3,0),1);near(D.guidance(1,3,1),3);near(D.guidance(1,3,2),5);});
test('Gaussian score matches numerical derivative of log density',()=>{
 for(const [x,m,s] of [[2,0,1],[-2,0,1],[1,2,.5],[2,0,2]]){
  const h=1e-5,fd=(Math.log(D.normalDensity(x+h,m,s))-Math.log(D.normalDensity(x-h,m,s)))/(2*h);near(D.normalScore(x,m,s),fd,1e-8);
 }
 near(D.normalScore(2,0,1),-2);assert.throws(()=>D.normalScore(1,0,0));
});
test('linear flow positions and velocities obey noise-to-data direction',()=>{near(D.linearFlow(-2,6,0).position,-2);near(D.linearFlow(-2,6,1).position,6);near(D.linearFlow(-2,6,.5).position,2);near(D.linearFlow(-2,6,.5).velocity,8);assert.throws(()=>D.linearFlow(0,1,2));});
test('Euler convergence checked against an independent exact exponential solution',()=>{
 near(D.eulerGrowth(1).estimate,2);near(D.eulerGrowth(2).estimate,2.25);
 let error=1;for(const n of[1,2,4,8,16,32]){const r=D.eulerGrowth(n);assert.ok(r.error<error);error=r.error;near(r.exact,Math.exp(1));}
 assert.throws(()=>D.eulerGrowth(0));
});
test('receding horizon executes a prefix then replans from the observed position',()=>{
 const a=D.replan(0,6,2);near(a.action,1);near(a.next,2);assert.equal(a.plan.length,7);
 const b=D.replan(a.next,8,2);near(b.action,1);near(b.next,4);near(D.replan(3,3,6).next,3);
 assert.throws(()=>D.replan(0,6,7));
});
test('capstone uses independently expected bias amplification and singular guard',()=>{
 for(const t of [.2,.5,.9]){const r=D.biasStudy(t,.2);near(r.loss,.04);near(r.error,(r.sigma/r.alpha)**2*.04);near(D.biasStudy(t,0).error,0);}
 near(D.estimate(9.2,.8,.6,2.2)-10,-.15);assert.equal(D.biasStudy(1,0).error,null);
});
