import {esc} from './math.mjs';
export const section=(n,key,title,body)=>`<section id="l${n}-${key}" class="lesson-section"><h2>${title}</h2>${body}</section>`;
export const equation=(body,label)=>`<div class="equation" tabindex="0"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${esc(label)}"><mrow>${body}</mrow></math></div>`;
export const note=(text)=>`<aside class="callout"><span class="callout-label">记住边界</span><p>${text}</p></aside>`;
export const extra=(title,body)=>`<details class="deep-dive"><summary>${title}</summary>${body}</details>`;
export const reference=(key,label)=>`<p class="source-note">公开来源：<a href="{{sources}}#${key}">${label}</a>。本课例子与交互是新增教学设计。</p>`;
export function lesson(n,title,subtitle,objectives,parts,summary,questions,minutes=15){
 return {id:`lesson-${n}`,number:n,title,subtitle,minutes,objectives,sections:[...parts.map(([key,label])=>({id:`l${n}-${key}`,label})),{id:`l${n}-quiz`,label:'三道自测'}],body:parts.map(([key,label,body])=>section(n,key,label,body)).join(''),summary,questions:questions.map((q,i)=>({...q,id:`l${n}q${i+1}`,review:`l${n}-${q.review}`,tolerance:q.type==='number'?.0001:undefined}))};
}
