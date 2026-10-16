export default [
 {key:'x0',symbol:'x₀',name:'干净数据',english:'Clean data',definition:'加噪前的原始数据。它可以是一个数字，也可以是一张图片所对应的一组数字。',source:'PDF 第 3–4 页'},
 {key:'xt',symbol:'xₜ',name:'带噪数据',english:'Noisy data',definition:'当前噪声阶段 t 的数据。在本课程的混合公式中，它由信号部分和噪声部分相加得到。',source:'PDF 第 4 页'},
 {key:'alpha',symbol:'αₜ',name:'信号系数',english:'Signal coefficient',definition:'原始信号前的系数，控制信号保留强度；对应 DDPM 原论文中的 √ᾱₜ，不是单步 αₜ。不是概率；不要把 α + σ = 1 当成通用要求。',source:'PDF 第 4 页；后一句为教学提醒'},
 {key:'sigma',symbol:'σₜ',name:'噪声系数',english:'Noise coefficient',definition:'随机噪声前的系数，控制它在混合结果中的强度。它与 αₜ 一起由噪声调度规定。',source:'PDF 第 4 页'},
 {key:'epsilon',symbol:'ε',name:'随机噪声',english:'Random noise',definition:'加噪时抽取的随机量。在本课的数字例子里是一项数字；图片实验中是一组随机数字。PDF 的公式通常使用高斯噪声。',source:'PDF 第 4 页；数字例子为教学简化'},
 {key:'time',symbol:'t',name:'扩散时间',english:'Diffusion time',definition:'噪声过程中的阶段标签，可以是离散步数，也可以是连续参数。本课约定 0 是干净端，较大的 t 通常对应更强噪声；它不是现实秒数。',source:'PDF 第 3–4、6 页；“不是秒数”为教学说明'},
 {key:'schedule',symbol:'αₜ, σₜ',name:'噪声调度',english:'Noise schedule',definition:'为不同的 t 规定信号与噪声系数的规则。本课实验采用无偏移的连续余弦混合；真实 Improved DDPM 还涉及偏移、归一化和离散化，不能直接照搬实验端点。',source:'PDF 第 4–5 页'},
 {key:'prediction',symbol:'ε̂',name:'预测噪声',english:'Predicted noise',definition:'模型对噪声的估计。帽子表示“估计”，不代表它一定与真实噪声相等。PDF 主要用 εθ(xₜ,t) 表示网络的噪声输出。',source:'PDF 第 7–8 页；帽子为课程简记'},
 {key:'network',symbol:'εθ',name:'神经网络',english:'Neural network',definition:'本课把它看成一个有许多可调参数的数学函数。噪声预测网络接收 xₜ、t，输出噪声估计。参数如何调整，暂不展开。',source:'PDF 第 7–8 页；函数比喻为教学补充'},
 {key:'theta',symbol:'θ',name:'模型参数',english:'Model parameters',definition:'用来表示网络内部可学习参数的记号。训练会调整参数，生成时则使用训练好的模型进行预测。',source:'PDF 第 6–8 页的参数记号；解释为教学展开'},
 {key:'loss',symbol:'L',name:'损失',english:'Loss',definition:'评价预测与目标差距的量。本课使用单数字平方误差；原文的目标还包含向量平方范数、对训练样本的平均以及时间权重。',source:'PDF 第 8 页'},
 {key:'ddpm',symbol:'DDPM',name:'去噪扩散概率模型',english:'Denoising Diffusion Probabilistic Models',definition:'本课学习的经典扩散模型方法：先构造前向加噪，再学习和使用逐步的反向生成过程。',source:'PDF 第 6–8 页'},
 {key:'policy',symbol:'Policy',name:'扩散策略（预告）',english:'Diffusion Policy',definition:'本课程后续拟讨论的机器人应用方向。首版仅提醒区分动作时间与扩散时间，没有讲解该方法的完整算法或代码。',source:'教学扩展预告，不作为本 PDF 已覆盖的主题'}
];
