import {formula,term,source,supplement} from '../../src/math.mjs';
import {lab1} from '../../src/experiments.mjs';
export default {
 id:'lesson-1', number:1, title:'扩散模型是什么？', subtitle:'从一个数字开始，理解加噪与去噪。', minutes:'10', pages:'3–4、6',
 objectives:['说清楚加噪与去噪的方向','看懂信号、噪声和两个系数','亲手算出一个带噪数字'],
 sections:[{id:'l1-intuition',label:'先建立直觉'},{id:'l1-formula',label:'读懂第一个公式'},{id:'l1-lab',label:'加噪实验台'},{id:'l1-generate',label:'恢复与生成的区别'},{id:'l1-quiz',label:'三道自测'}],
 body:`
<section id="l1-intuition" class="lesson-section"><div class="section-index">01 / 先建立直觉</div><h2>把清晰的数据，慢慢变乱</h2><p>想象一张清晰的照片。我们不断给它的像素加上随机的数值，照片就会越来越难辨认，最终接近一团噪声。这个方向叫<strong>前向加噪</strong>。生成时，我们反过来，从随机噪声出发，利用训练好的模型逐步得到数据。</p><div class="direction-pair"><div><span class="pill">加噪</span><strong>清晰数据 <span>→</span> 带噪数据 <span>→</span> 接近纯噪声</strong><small>由我们规定怎么添加噪声</small></div><div><span class="pill warm">生成</span><strong>随机噪声 <span>→</span> 逐步更新 <span>→</span> 生成数据</strong><small>需要模型学到的数据规律</small></div></div><p>PDF 第 3 页用上下两排图片展示了这两个方向。先记住方向，不必急着研究每一步的算法。</p>${source('3')}${supplement('<p>随机数值噪声不等于普通的“模糊”。把照片变模糊与给像素加随机数，是不同的操作。这里的“变乱”只是帮助理解的说法。</p>')}</section>
<section id="l1-formula" class="lesson-section"><div class="section-index">02 / 把图片暂时换成数字</div><h2>第一个公式，只需要乘法与加法</h2><p>一张图片可以用许多数字表示。我们先只看其中一个数字，把复杂问题缩小：</p>${formula('forward','原材料：PDF 第 4 页')}<div class="symbol-grid"><div>${term('x₀','x0')}<span>原始的干净数据</span></div><div>${term('xₜ','xt')}<span>阶段 t 的带噪数据</span></div><div>${term('αₜ','alpha')}<span>信号保留强度</span></div><div>${term('σₜ','sigma')}<span>噪声强度系数</span></div><div>${term('ε','epsilon')}<span>随机噪声</span></div><div>${term('t','time')}<span>当前噪声阶段</span></div></div><p>不要把这些字母当成新运算。公式说的就是：<strong>带噪数据 = 信号部分 + 噪声部分。</strong>α 和 σ 是系数，不是概率，也不要求它们相加等于 1。</p><div class="worked-example"><span class="eyebrow">教学数字例子</span><p>设原始数字为 10，α = 0.8，σ = 0.6，这一次噪声取到 2。</p>${formula('example')}<p>信号部分是 8，噪声部分是 1.2；两者相加得到 9.2。“加噪”不意味着数字一定变大，因为噪声也可以是负数。</p></div>${source('4')}</section>
<section id="l1-lab" class="lesson-section"><div class="section-index">03 / 动手试一次</div><h2>不只看公式，试着改变它</h2>${lab1()}<p>先把 α 调到 0，再把 σ 调到 0，比较两种情况。前者去掉了原始信号项，后者去掉了噪声项。最后按“重置”，回到刚才的例子。</p></section>
<section id="l1-generate" class="lesson-section"><div class="section-index">04 / 一个很重要的区别</div><h2>去噪生成，不是找回预先藏好的原图</h2><p>训练时，我们有干净数据，也知道自己加了什么噪声。这让我们能给模型提供练习题和答案。真正生成新数据时，模型则从随机噪声出发，利用已经学到的规律逐步更新。</p><p>所以，“从噪声生成一张新照片”和“恢复某张已知照片”不是同一项任务。下一课会解释：我们究竟用什么答案来训练模型？</p>${source('3、6')}${supplement('<p>本课的单数字计算只是在说明加噪公式，不是在证明“知道一个带噪数字，就能唯一知道它的来源”。例如，不同的原始数字与噪声组合可能得到相同结果。</p>')}</section>`,
 summary:'加噪由我们规定：信号乘一个系数，噪声乘另一个系数，再相加。模型学习的，是如何利用数据规律逐步走回干净数据的一端。',
 questions:[
 {id:'l1q1',type:'choice',question:'为什么训练时要主动给清晰数据添加已知噪声？',options:['计算机不能处理清晰图片','这样能得到训练输入和对应的噪声答案','加噪会让图片更漂亮'],answer:1,explanation:'我们自己抽取噪声并做加法，因此知道训练题的目标噪声。模型能拿预测与答案作比较。',review:'l1-generate'},
 {id:'l1q2',type:'number',question:'x₀ = 10，α = 0.8，σ = 0.6，ε = 2。带噪数字是多少？',answer:9.2,tolerance:0.001,explanation:'先算 0.8 × 10 = 8，再算 0.6 × 2 = 1.2，相加得到 9.2。',review:'l1-formula'},
 {id:'l1q3',type:'choice',question:'把实验中的 α 调到 0，保持 σ = 0.6、ε = 2，哪句话正确？',options:['结果仍随原始数字改变','结果只剩噪声项，等于 1.2','原始数据会自动恢复'],answer:1,explanation:'α = 0 时，αx₀ 这一项为 0；结果只剩 σε = 1.2。不能据此唯一找回 x₀。',review:'l1-lab'}
 ]
};
