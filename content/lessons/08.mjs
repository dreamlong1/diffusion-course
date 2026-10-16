import {lesson,equation,note,extra,reference} from '../../src/lesson-kit.mjs';
import {advancedLab} from '../../src/advanced-experiments.mjs';
import {term} from '../../src/math.mjs';
export default lesson(8,'Score：哪边更像数据？','把概率分布想成地形，认识局部方向信息。',
 ['知道 Score 不是图片质量打分','判断一维高斯分布的 Score 方向','理解噪声预测与 Score 的联系和限制'],[
 ['landscape','在概率地形上找方向',`<p>把一维数据画在数轴上：常见区域的概率密度较高，罕见区域较低。${term('Score','score')}描述当前位置附近，<strong>对数概率密度上升最快的方向和变化程度</strong>。在一维里它只是一个正数、负数或零；在图片的高维空间里，它是一组方向数字。</p><p>“Score”在这里不是给一张图片打 90 分，也不是概率本身。假设数据集中在 0 附近：站在正数 2，向左更接近中心，Score 为负；站在 −2，方向向右，Score 为正。站在中心可能为 0，但单凭 Score = 0 不能判断一般分布中那是山峰、山谷还是平坦处。</p>${reference('score-sources','Song 与 Ermon 的 Score 模型论文及作者教程')}`],
 ['gaussian','一个能手算的 Score',`<p>对于均值 μ、标准差 s 的一维高斯分布，有：</p>${equation('<mi>Score</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mo>−</mo><mfrac><mrow><mi>x</mi><mo>−</mo><mi>μ</mi></mrow><msup><mi>s</mi><mn>2</mn></msup></mfrac>','高斯分布的 Score 等于负的 x 减均值，再除以标准差的平方')}<p>μ = 0、s = 1、x = 2 时，Score = −2。只为了观察方向，走 0.2 倍 Score，得到 2 + 0.2 × (−2) = 1.6。若 s = 2，同一位置的 Score 变成 −0.5：分布更宽，对数密度的坡度更缓。</p>${extra('没学过对数和导数，可以先跳过',`<p>严格定义为 Score(x) = d log p(x)/dx，多维写作 ∇ₓ log p(x)。高斯的 log p(x) 中，与 x 有关的部分为 −(x−μ)²/(2s²)，对 x 求导就得到上式。常数项不影响方向。</p><p>这里 p 是密度，单点的密度数值不等于“恰好抽到这个实数”的概率。概率对应一个区间下的面积。</p>`)}`],
 ['lab','实验：方向与宽度',advancedLab(8)],
 ['noise','预测噪声为什么能告诉我们方向',`<p>已知干净数据 x₀ 时，xₜ = αₜx₀ + σₜε 的条件分布是一个高斯。σₜ &gt; 0 时，它的条件 Score 是 −(xₜ−αₜx₀)/σₜ²，也就是 −ε/σₜ。这给出噪声与局部方向的联系。</p><p>真实生成看不到 x₀。模型在平方损失下学习的是当前 xₜ、t 对应的<strong>平均意义上的噪声预测</strong>。在相应高斯加噪设定下，理想噪声预测除以 −σₜ，对应带噪数据分布的 Score；不是每一份随机 ε 都能直接代表整个分布的方向。</p>${extra('为什么不能直接除以零？','<p>上面的关系要求 σₜ &gt; 0。在完全干净端 σₜ = 0 时，不能直接套除法。实际模型和采样器如何处理端点，必须看具体定义。</p>')}${note('只沿 Score 往上走，会趋向高密度区域，并不自动按正确概率产生多样样本。完整 Score 采样还需要合适的随机项或概率流动力学，以及时间相关的规则。实验的单步箭头不是完整采样器。')}`]
 ],'Score 是对数密度的局部方向信息。它与噪声预测有数学联系，但“往山顶走”不等于完成分布采样。',[
 {type:'choice',question:'本课的 Score 指什么？',options:['图片的审美评分','对数概率密度的局部变化方向','这张图片出现的概率百分比'],answer:1,explanation:'Score 是对位置求导得到的局部信息，不是质量分数或概率百分比。',review:'landscape'},
 {type:'number',question:'μ = 0、s = 1、x = 2，高斯 Score 是多少？',answer:-2,explanation:'−(2−0)/1² = −2，表示向数轴左侧的方向。',review:'gaussian'},
 {type:'choice',question:'只沿 Score 不断往上走，就完成了正确采样吗？',options:['不一定，完整采样还需要对应的动力学与随机性处理','一定，所有样本都应落到同一山顶','只要 Score 为正就完成'],answer:0,explanation:'趋向高密度区域不等于按分布产生样本；集中在山顶会丢失应有的多样性。',review:'noise'}
 ],18);
