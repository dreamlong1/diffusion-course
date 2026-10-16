export const esc = (s) => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const mi = s => `<mi>${s}</mi>`;
const mn = s => `<mn>${s}</mn>`;
const mo = s => `<mo>${s}</mo>`;
const row = (...s) => `<mrow>${s.join('')}</mrow>`;
const sub = (s,t) => `<msub>${mi(s)}${typeof t==='number' ? mn(t) : mi(t)}</msub>`;
const sup = (s,t) => `<msup>${s}${mn(t)}</msup>`;
const frac = (a,b) => `<mfrac>${a}${b}</mfrac>`;
const hat = s => `<mover>${mi(s)}<mo>^</mo></mover>`;
const eq=mo('='), plus=mo('+'), minus=mo('−'), times=mo('×');
const xt=sub('x','t'), x0=sub('x',0), a=sub('α','t'), s=sub('σ','t'), e=mi('ε');
const pred=row(sub('ε','θ'),mo('('),xt,mo(','),mi('t'),mo(')'));
const formulas={
 forward: [row(xt,eq,a,x0,plus,s,e),'x t 等于 alpha t 乘以 x 0，加上 sigma t 乘以 epsilon'],
 example: [row(mn('9.2'),eq,mn('0.8'),times,mn('10'),plus,mn('0.6'),times,mn('2')),'9.2 等于 0.8 乘以 10，加上 0.6 乘以 2'],
 estimate: [row(`<msub>${hat('x')}${mn(0)}</msub>`,eq,frac(row(xt,minus,s,hat('ε')),a)),'原始数据估计等于当前数据减去 sigma t 乘以预测噪声，再除以 alpha t'],
 loss: [row(mi('L'),eq,sup(row(mo('('),hat('ε'),minus,e,mo(')')),2)),'损失 L 等于预测噪声减去真实噪声之差的平方'],
 predict:[row(hat('ε'),eq,pred),'预测噪声等于神经网络 epsilon theta 的输出，输入是 x t 和 t'],
 cosine:[row(a,eq,mi('cos'),mo('('),frac(row(mi('π'),mi('t')),mn('2')),mo(')'),mo(','),mspace(),s,eq,mi('sin'),mo('('),frac(row(mi('π'),mi('t')),mn('2')),mo(')')),'alpha t 等于 cos pi t 除以 2，sigma t 等于 sin pi t 除以 2'],
 reverse:[row(sub('x','T'),mo('→'),`<msub>${mi('x')}<mrow>${mi('T')}${minus}${mn(1)}</mrow></msub>`,mo('→'),mo('⋯'),mo('→'),sub('x',1),mo('→'),x0),'x T 到 x T 减 1，逐步到 x 1 和 x 0'],
 weighted:[row('<msub><mi>L</mi><mtext>weighted</mtext></msub>',mo('('),mi('θ'),mo(')'),eq,`<msub><mi>𝔼</mi><mrow><mi>t</mi><mo>,</mo><msub><mi>x</mi><mn>0</mn></msub><mo>,</mo><mi>ε</mi></mrow></msub>`,mo('['),mi('λ'),mo('('),mi('t'),mo(')'),`<msubsup>${row(mo('‖'),pred,minus,e,mo('‖'))}${mn(2)}${mn(2)}</msubsup>`,mo(']')),'加权噪声预测目标示意，包含对时间、原始数据、随机噪声的平均，以及随时间变化的权重 lambda t'],
};
function mspace(){ return '<mspace width="1em"/>'; }
export function formula(name, label='') {
 const f=formulas[name]; if(!f)throw new Error(`Unknown formula ${name}`);
 return `<div class="equation" tabindex="0"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block" aria-label="${esc(f[1])}">${f[0]}</math>${label?`<span class="equation-label">${esc(label)}</span>`:''}</div>`;
}
export function term(label, key) { return `<button class="term" type="button" data-term="${esc(key)}" aria-haspopup="dialog">${label}</button>`; }
export function source(pages) { return `<p class="source-note">资料依据 <a href="{{sources}}#pdf">PDF 第 ${pages} 页</a><span> · 高中难度教学改写</span></p>`; }
export function supplement(html) { return `<aside class="callout supplement"><span class="callout-label">教学补充</span>${html}</aside>`; }
