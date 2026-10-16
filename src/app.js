/* Local-only course interaction. This script never transmits learning records. */
(function () {
  'use strict';
  const D = globalThis.DiffusionMath;
  const dataElement = document.getElementById('course-data');
  if (!D || !dataElement) return;
  const data = JSON.parse(dataElement.textContent);
  const single = document.body.dataset.single === 'true';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const KEY = 'diffusion-course:learning:v1';
  const questions = new Map(data.lessons.flatMap(l => l.questions.map(q => [q.id, { ...q, lesson: l.id }])));
  const ids = new Set(data.lessons.map(l => l.id));
  const initial = () => ({ version: 1, read: {}, answers: {}, last: 'lesson-1', anchors: {} });
  let state = initial(), storageUsable = true;
  const warning = $('[data-storage-warning]');
  function storageWarning(message) {
    storageUsable = false;
    if (warning) { warning.textContent = message; warning.hidden = false; }
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.version === 1) {
        for (const id of ids) {
          state.read[id] = saved.read?.[id] === true;
          if (/^l[1-3]-[a-z-]+$/.test(saved.anchors?.[id] || '')) state.anchors[id] = saved.anchors[id];
        }
        for (const [key, q] of questions) {
          const value = saved.answers?.[key];
          if (typeof value !== 'number' && typeof value !== 'string') continue;
          if (typeof value === 'string' && value.trim() === '') continue;
          const n = Number(value);
          if (Number.isFinite(n) && (q.type === 'number' || (Number.isInteger(n) && n >= 0 && n < q.options.length))) state.answers[key] = n;
        }
        if (ids.has(saved.last)) state.last = saved.last;
      }
    }
  } catch (error) {
    storageWarning('本机记录无法读取，或浏览器禁止了存储。课程仍可使用；当前进度只临时保留。');
  }
  function persist() {
    if (!storageUsable) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { storageWarning('浏览器存储不可用，当前进度只能临时保留；课程和实验仍可使用。'); }
  }
  let toastTimer;
  function toast(message) {
    const node = $('[data-toast]'); if (!node) return;
    node.textContent = message; node.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 3200);
  }
  function pageHref(id, anchor = '') {
    if (single) return `#${id}${anchor ? '/' + anchor : ''}`;
    const here = data.paths[document.body.dataset.page] || 'index.html';
    return '../'.repeat(here.split('/').length - 1) + data.paths[id] + (anchor ? '#' + anchor : '');
  }
  function correct(q, value) {
    return q.type === 'number' ? Math.abs(value - q.answer) <= q.tolerance : value === q.answer;
  }
  function updateProgress() {
    const count = [...ids].filter(id => state.read[id]).length;
    $$('[data-read-count]').forEach(n => n.textContent = String(count));
    $$('[data-progress-fill]').forEach(n => { n.style.width = `${count / 3 * 100}%`; n.parentElement.setAttribute('aria-valuenow', String(count)); });
    for (const lesson of data.lessons) {
      const answered = lesson.questions.filter(q => Object.hasOwn(state.answers, q.id)).length;
      const score = lesson.questions.filter(q => Object.hasOwn(state.answers, q.id) && correct(q, state.answers[q.id])).length;
      $$(`[data-nav-state="${lesson.id}"]`).forEach(n => { n.classList.toggle('read', Boolean(state.read[lesson.id])); n.setAttribute('aria-label', state.read[lesson.id] ? '已阅读' : '未阅读'); });
      $$(`[data-card-status="${lesson.id}"]`).forEach(n => { n.textContent = `${state.read[lesson.id] ? '已阅读' : '未阅读'}${answered ? ` · 练习 ${answered}/3，答对 ${score}/3` : ''}`; });
      $$(`[data-score="${lesson.id}"]`).forEach(n => n.textContent = `已作答 ${answered} / 3${answered ? ` · 答对 ${score}` : ''}`);
      $$(`[data-mark-read="${lesson.id}"]`).forEach(n => { n.setAttribute('aria-pressed', String(Boolean(state.read[lesson.id]))); n.textContent = state.read[lesson.id] ? '已阅读 ✓ · 点击撤销' : '标记本课已阅读 ✓'; });
    }
    $$('[data-continue]').forEach(n => {
      const id = state.last || 'lesson-1';
      const started = Object.keys(state.answers).length > 0 || [...ids].some(x => state.read[x]) || Boolean(state.anchors[id]);
      n.href = pageHref(started ? id : 'lesson-1', started ? state.anchors[id] || '' : '');
      n.textContent = started ? `继续第 ${id.slice(-1)} 课 →` : '开始第一课 →';
    });
  }
  $$('[data-mark-read]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.markRead;
    state.read[id] = !state.read[id]; persist(); updateProgress();
    toast(state.read[id] ? '本课已标记为阅读完成。练习结果单独记录。' : '已撤销本课阅读标记。');
  }));
  $$('[data-reset-progress]').forEach(button => button.addEventListener('click', () => {
    if (!window.confirm('清除这个浏览器中的全部阅读和答题记录？此操作不能撤销。')) return;
    state = initial();
    try { localStorage.removeItem(KEY); storageUsable = true; warning.hidden = true; } catch (_) { /* Continue in memory. */ }
    $$('[data-question]').forEach(form => { form.reset(); $('[data-answer-state]', form).textContent = ''; $('.answer-feedback', form).hidden = true; });
    updateProgress(); toast('本机学习记录已清除。');
  }));
  function showFeedback(form, q, value, restored = false) {
    const ok = correct(q, value);
    const panel = $('.answer-feedback', form); panel.hidden = false; panel.classList.toggle('correct', ok);
    $('[data-answer-title]', panel).textContent = ok ? '回答正确。' : '再核对一下关键概念。';
    $('[data-answer-explanation]', panel).textContent = q.explanation;
    $('[data-answer-state]', form).textContent = (restored ? '上次提交' : '已提交') + (ok ? ' · 正确' : ' · 可修改重做');
  }
  $$('[data-question]').forEach(form => {
    const q = questions.get(form.dataset.question);
    if (!q) return;
    if (Object.hasOwn(state.answers, q.id)) {
      const value = state.answers[q.id];
      if (q.type === 'choice') {
        const chosen = $(`input[value="${value}"]`, form); if (chosen) chosen.checked = true;
      } else $('input', form).value = String(value);
      showFeedback(form, q, value, true);
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = q.type === 'choice' ? $('input:checked', form) : $('input', form);
      if (!input || input.value.trim() === '' || !Number.isFinite(Number(input.value))) {
        const panel = $('.answer-feedback', form); panel.hidden = false; panel.classList.remove('correct');
        $('[data-answer-title]', panel).textContent = q.type === 'choice' ? '先选择一个选项。' : '先输入一个有效数字。';
        $('[data-answer-explanation]', panel).textContent = Object.hasOwn(state.answers, q.id)
          ? '本次输入未保存，仍保留上次提交的答案。' : '尚未记录这道题的作答。';
        return;
      }
      const value = Number(input.value); state.answers[q.id] = value;
      state.last = q.lesson; persist(); showFeedback(form, q, value); updateProgress();
    });
    form.addEventListener('input', () => {
      if (Object.hasOwn(state.answers, q.id)) $('[data-answer-state]', form).textContent = '答案已修改，请重新提交。';
      $('.answer-feedback', form).hidden = true;
    });
  });
  // Terminology dialog uses only trusted local definitions and textContent.
  const dialog = $('.definition-dialog');
  $$('[data-term]').forEach(button => button.addEventListener('click', () => {
    const word = data.glossary.find(g => g.key === button.dataset.term); if (!word) return;
    $('#definition-title', dialog).textContent = `${word.symbol} · ${word.name}`;
    $('[data-definition-body]', dialog).textContent = word.definition;
    $('[data-definition-source]', dialog).textContent = word.source;
    $('[data-definition-link]', dialog).href = pageHref('glossary', `term-${word.key}`);
    dialog.showModal();
  }));
  $('[data-definition-link]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  const search = $('#term-search');
  if (search) search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase(); let count = 0;
    $$('[data-glossary-item]').forEach(item => { item.hidden = !item.dataset.search.includes(query); if (!item.hidden) count++; });
    $('[data-search-count]').textContent = `找到 ${count} 个词条`;
    $('[data-search-empty]').hidden = count !== 0;
  });
  // Mobile menu: close on escape/navigation; contain keyboard focus while open.
  let menuOpen = false;
  const menuToggle = $('[data-menu-toggle]');
  function closeMenu() { menuOpen = false; document.body.classList.remove('menu-open'); menuToggle.setAttribute('aria-expanded', 'false'); const side=$('#course-sidebar'); side.inert=window.innerWidth<=760; side.setAttribute('aria-hidden',String(window.innerWidth<=760)); }
  menuToggle.addEventListener('click', () => {
    menuOpen = !menuOpen; document.body.classList.toggle('menu-open', menuOpen); menuToggle.setAttribute('aria-expanded', String(menuOpen)); $('#course-sidebar').inert=!menuOpen && window.innerWidth<=760; $('#course-sidebar').setAttribute('aria-hidden',String(!menuOpen && window.innerWidth<=760));
    if (menuOpen) setTimeout(() => $('[data-menu-close]', $('#course-sidebar')).focus(), 40);
  });
  $$('[data-menu-close]').forEach(button => button.addEventListener('click', () => { closeMenu(); menuToggle.focus(); }));
  $$('#course-sidebar a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) { closeMenu(); menuToggle.focus(); }
    if (event.key === 'Tab' && menuOpen) {
      const focusable = $$('button,a[href]', $('#course-sidebar')).filter(n => n.offsetParent !== null);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 760 || !menuOpen) closeMenu(); });
  closeMenu();
  // Draw a completely original shape. Noise is a fixed, seeded Gaussian field.
  function signalArray(size) {
    const signal = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const nx = (x + .5) / size * 2 - 1, ny = (y + .5) / size * 2 - 1;
      const radius = Math.hypot(nx, ny);
      const ring = radius > .44 && radius < .68;
      const center = Math.hypot(nx - .04, ny + .01) < .14;
      signal[y * size + x] = ring || center ? .87 : -.78;
    }
    return signal;
  }
  function paint(canvas, signal, noise, alpha, sigma, tint = false) {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < signal.length; i++) {
      const v = Math.max(0, Math.min(1, (D.mix(signal[i], alpha, sigma, noise[i]) + 1) / 2));
      if (tint) { pixels.data[i * 4] = 40 + (232 - 40) * (1-v); pixels.data[i * 4+1] = 85 + (240-85)*(1-v); pixels.data[i * 4+2] = 78 + (228-78)*(1-v); }
      else { const gray = Math.round((1-v)*255); pixels.data[i*4] = gray; pixels.data[i*4+1] = gray; pixels.data[i*4+2] = gray; }
      pixels.data[i*4+3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
  }
  $$('[data-hero]').forEach(canvas => {
    const size=canvas.width, {alpha,sigma}=D.cosine(Number(canvas.dataset.hero));
    paint(canvas,signalArray(size),D.gaussianArray(size*size,731),alpha,sigma,true);
  });
  function setOut(root, key, value) { $$(`[data-out="${key}"]`,root).forEach(n => n.textContent = String(value)); }
  function showRange(input) {
    const out = $(`[data-value-for="${input.id}"]`); if (out) out.textContent = D.format(Number(input.value));
    input.setAttribute('aria-valuetext', D.format(Number(input.value)));
  }
  function chart(root, kind) {
    const plot = $('.plot', root); if (!plot) return;
    const values = (fn,max) => Array.from({length:101},(_,i)=> { const x=46 + 448*i/100; const y=180-160*fn(i/100)/max; return `${i?'L':'M'}${x.toFixed(3)} ${y.toFixed(3)}`; }).join(' ');
    $('[data-curve="a"]',plot).setAttribute('d', kind==='time' ? values(t=>D.cosine(t).alpha,1) : values(t=>D.loss(t*3,2),4));
    if(kind==='time') $('[data-curve="s"]',plot).setAttribute('d',values(t=>D.cosine(t).sigma,1));
    else { $('[data-curve="s"]',plot).style.display='none'; $('[data-dot="s"]',plot).style.display='none'; }
  }
  function cursor(root, fraction, a, s, max=1) {
    const plot=$('.plot',root); if(!plot)return;
    const x=46+448*fraction;
    $('[data-cursor]',plot).setAttribute('d',`M${x} 20V180`);
    for(const [key,value] of [['a',a],['s',s]]) { const dot=$(`[data-dot="${key}"]`,plot); dot.setAttribute('cx',String(x)); dot.setAttribute('cy',String(180-160*value/max)); }
  }
  const pauseAll = [];
  $$('[data-lab]').forEach(lab => {
    const kind=lab.dataset.lab;
    const inputs=Object.fromEntries($$('[data-input]',lab).map(n=>[n.dataset.input,n]));
    let seed=731;
    const clean=$('[data-canvas="clean"]',lab), mixed=$('[data-canvas="mixed"]',lab);
    const size=clean?.width || 0, field=size?signalArray(size):null;
    let noise=size?D.gaussianArray(size*size,seed):null;
    if(clean)paint(clean,field,noise,1,0);
    chart(lab,kind);
    let timer=null;
    function pause(){ if(timer!==null)clearInterval(timer);timer=null;const b=$('[data-play]',lab);if(b){b.textContent='播放加噪';b.setAttribute('aria-pressed','false');} $$('[data-original-live]',lab).forEach(n=>{n.setAttribute('aria-live',n.dataset.originalLive);}); }
    pauseAll.push(pause);
    function update(){
      Object.values(inputs).forEach(showRange);
      if(kind==='mix'){
        const a=Number(inputs.alpha.value),s=Number(inputs.sigma.value),e=Number(inputs.epsilon.value),x=D.mix(10,a,s,e);
        for(const [key,value] of [['xt',x],['signal',a*10],['noise',s*e]])setOut(lab,key,D.format(value));
        setOut(lab,'calculation',`${D.format(a)} × 10 + ${D.format(s)} × (${D.format(e)}) = ${D.format(x)}`);
        if(mixed){paint(mixed,field,noise,a,s);mixed.setAttribute('aria-label',`带噪图形，信号系数 ${a}，噪声系数 ${s}`);}
      } else if(kind==='predict'){
        const p=Number(inputs.prediction.value),l=D.loss(p,2),estimate=D.estimate(9.2,.8,.6,p);
        setOut(lab,'loss',D.format(l));setOut(lab,'estimate',D.format(estimate));
        setOut(lab,'loss-calc',`(${D.format(p)} − 2)² = ${D.format(l)}`);
        setOut(lab,'estimate-calc',`(9.2 − 0.6 × ${D.format(p)}) ÷ 0.8 = ${D.format(estimate)}`);
        setOut(lab,'feedback',l<1e-10?'此例预测恰好等于真实噪声，损失为 0，原始数字估计为 10。':`噪声预测${p<2?'偏小':'偏大'}，原始数字估计${estimate>10?'偏大':'偏小'}。试着把预测移向 2。`);
        cursor(lab,p/3,l,0,4);
      } else if(kind==='time'){
        const t=Number(inputs.time.value),{alpha:a,sigma:s}=D.cosine(t),x=D.mix(10,a,s,-2);
        setOut(lab,'alpha',D.format(a));setOut(lab,'sigma',D.format(s));setOut(lab,'xt',D.format(x));
        setOut(lab,'calculation',`${D.format(a)} × 10 + ${D.format(s)} × (−2) ≈ ${D.format(x)}`);
        setOut(lab,'stage-note',t===0?'t = 0：保留全部原始信号，不加入噪声。':t===1?'t = 1：α = 0，只剩噪声，结果与原始数字无关。':'系数与结果显示为四舍五入后的值；底层计算使用完整精度。t 是噪声阶段，不是秒数。');
        const result=D.estimate(x,a,s,-2),status=$('[data-out="estimate-status"]',lab);
        status.classList.toggle('warning',a<.1);
        setOut(lab,'estimate-status',result===null?'α = 0：不能除以 0，无法唯一反算原始数字。':a<.1?`α 已接近 0。用这里的已知噪声仍算得 ${D.format(result)}，但预测噪声的微小误差会被放大。`:`在这个已知噪声的教学例子中，移项得到 x₀ = ${D.format(result)}。`);
        cursor(lab,t,a,s);
        if(mixed){paint(mixed,field,noise,a,s);mixed.setAttribute('aria-label',`余弦加噪示意，t=${t}，alpha=${D.format(a)}，sigma=${D.format(s)}`);}
      }
    }
    Object.values(inputs).forEach(input=>input.addEventListener('input',()=>{pause();update();}));
    $('[data-reset]',lab)?.addEventListener('click',()=>{pause();for(const input of Object.values(inputs))input.value=input.defaultValue;seed=731;if(size)noise=D.gaussianArray(size*size,seed);update();});
    $('[data-randomize]',lab)?.addEventListener('click',()=>{seed+=31;noise=D.gaussianArray(size*size,seed);update();toast('已换一份图像噪声。数字模式中的 ε 没有改变。');});
    $('[data-play]',lab)?.addEventListener('click',()=>{
      if(timer!==null){pause();return;}
      if(Number(inputs.time.value)>=1)inputs.time.value='0';
      const b=$('[data-play]',lab);b.textContent='暂停';b.setAttribute('aria-pressed','true');
      $$('[aria-live]',lab).forEach(n=>{n.dataset.originalLive=n.getAttribute('aria-live');n.setAttribute('aria-live','off');});
      update();timer=setInterval(()=>{const value=Math.min(1,Math.round((Number(inputs.time.value)+.01)*100)/100);inputs.time.value=String(value);update();if(value>=1)pause();},100);
    });
    $('[data-step]',lab)?.addEventListener('click',()=>{pause();inputs.time.value=String(Math.min(1,Math.round((Number(inputs.time.value)+.1)*100)/100));update();});
    const tabs=$$('[data-tab]',lab);
    function selectTab(tab){tabs.forEach(n=>{const selected=n===tab;n.setAttribute('aria-selected',String(selected));n.tabIndex=selected?0:-1;});$$('[data-panel]',lab).forEach(n=>n.hidden=n.dataset.panel!==tab.dataset.tab);}
    tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
    update();
  });
  $$('[data-flow]').forEach(root=>{
    let step=0,round=1;
    const explanations=['把当前数据和对应的 t 一起交给模型。','模型根据当前输入，输出一份噪声估计。','利用预测估计干净数据，进而计算反向步骤的分布。','从计算的分布中得到 xₜ₋₁；随后进入下一轮，t 减小。'];
    function update(){ $$('[data-flow-step]',root).forEach(n=>{n.classList.toggle('active',Number(n.dataset.flowStep)===step);n.setAttribute('aria-current',Number(n.dataset.flowStep)===step?'step':'false');});$('[data-flow-text]',root).textContent=`第 ${round} 轮 · 第 ${step+1} 环节：${explanations[step]}`;$('[data-flow-next]',root).textContent=step===3?'开始下一轮 →':'下一环节 →'; }
    $('[data-flow-next]',root).addEventListener('click',()=>{step=(step+1)%4;if(step===0)round++;update();});
    $('[data-flow-reset]',root).addEventListener('click',()=>{step=0;round=1;update();});update();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll.forEach(p=>p());});
  function activePage(id){
    document.body.dataset.page=id;
    $('.skip-link').href=single ? `#${id}/main` : '#main';
    $$('[data-nav]').forEach(n=>{const active=n.dataset.nav===id;n.classList.toggle('current',active);if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
    if(ids.has(id)){state.last=id;persist();}
    updateProgress();
  }
  // The downloadable single-file edition shares all interactions with the hosted site.
  if(single){
    function route(){
      pauseAll.forEach(p=>p());
      let raw;
      try { raw=decodeURIComponent(location.hash.slice(1)); }
      catch (_) { raw='home'; }
      const [candidate,anchor='']=raw.split('/');
      const id=Object.hasOwn(data.paths,candidate)?candidate:'home';
      $$('.single-view').forEach(view=>view.hidden=view.dataset.view!==id);
      activePage(id);closeMenu();
      document.title=(data.lessons.find(l=>l.id===id)?.title || ({home:'高中生也能懂的扩散模型',glossary:'术语与符号速查',sources:'资料与使用说明'})[id])+' · 扩散模型入门课';
      requestAnimationFrame(()=>{
        if(anchor){
          const target=document.getElementById(anchor);
          if(target && (target.id==='main' || target.closest('[data-view]')?.dataset.view===id)){
            target.scrollIntoView({behavior:'instant'});
            if(anchor==='main')target.focus({preventScroll:true});
          }
        }else window.scrollTo({top:0,behavior:'instant'});
      });
    }
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href^="#"]');if(!link)return;
      const fragment=link.getAttribute('href').slice(1);
      if(Object.hasOwn(data.paths,fragment.split('/')[0]))return;
      const view=link.closest('[data-view]');const id=view?.dataset.view || document.body.dataset.page;
      event.preventDefault();const target=`#${id}/${fragment}`;
      if(location.hash===target)document.getElementById(fragment)?.scrollIntoView();else location.hash=target;
    });
    window.addEventListener('hashchange',route);route();
  } else { activePage(document.body.dataset.page); }
  let scrollTimer;
  window.addEventListener('scroll',()=>{
    if(scrollTimer)return;
    scrollTimer=setTimeout(()=>{
      scrollTimer=null;const id=document.body.dataset.page;if(!ids.has(id))return;
      const article=$(`[data-lesson-page="${id}"]`);if(!article)return;
      const sections=$$('section[id]',article);let anchor='';
      for(const section of sections){if(section.getBoundingClientRect().top<160)anchor=section.id;}
      if(anchor&&state.anchors[id]!==anchor){state.anchors[id]=anchor;persist();}
    },400);
  },{passive:true});
  updateProgress();
})();
