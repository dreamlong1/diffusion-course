"""Full curriculum HTTP/HTTPS and standalone regression using native browser storage."""
from pathlib import Path
from urllib.parse import urljoin
import argparse,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--chromium',required=True);a.add_argument('--base-url',default='http://127.0.0.1:4321/diffusion-course/');args=a.parse_args()
checks=[]
def check(name,ok):
    assert ok,name
    checks.append({'name':name,'passed':True})
answers={1:[1,9.2,1],2:[1,.25,2],3:[1,-2,2],4:[1,1,0],5:[1,.625,2],6:[1,2,0],7:[1,5,2],8:[1,-2,0],9:[1,2,2],10:[1,2.25,2],11:[1,2,2],12:[1,-.15,2]}
KEY='diffusion-course:learning:v1'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=b.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce');page=ctx.new_page();errors=[];failed=[]
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:failed.append(r.url))
    def go(route=''):
        r=page.goto(urljoin(args.base_url,route),wait_until='load');assert r.status==200,(route,r.status)
    def slide(n,k,v):
        page.locator(f'#a{n}-{k}').evaluate('(e,v)=>{e.value=String(v);e.dispatchEvent(new Event("input",{bubbles:true}));}',v)
    def result(key):return page.locator(f'[data-result="{key}"]').inner_text()
    go();check('twelve course cards and navigation entries',page.locator('.course-card').count()==12 and page.locator('.lesson-nav-item').count()==12)
    # A genuine first-edition record remains readable, without using stored schema v2.
    page.evaluate('(v)=>localStorage.setItem(v.key,JSON.stringify(v.record))',{'key':KEY,'record':{'version':1,'read':{'lesson-1':True},'answers':{'l1q2':9.2},'last':'lesson-1','anchors':{}}})
    go('lessons/1/');check('v1 progress survives course expansion',page.locator('[data-read-count]').inner_text()=='1' and page.locator('#l1q2-input').input_value()=='9.2')
    for n,values in answers.items():
        go(f'lessons/{n}/')
        check(f'lesson {n} has an initialized lab',page.locator('[data-lab], [data-advanced-lab]').count()==1 and (n<4 or page.locator('[data-advanced-status]').inner_text()!=''))
        for i,value in enumerate(values,1):
            form=page.locator(f'[data-question=l{n}q{i}]')
            if i==2:form.locator('input').fill(str(value))
            else:form.locator(f'input[value="{value}"]').check()
            form.locator('[type=submit]').click()
            check(f'question l{n}q{i} matches independent answer','回答正确' in form.locator('[data-answer-title]').inner_text())
        button=page.locator('[data-mark-read]')
        if button.get_attribute('aria-pressed')=='false':button.click()
    page.reload(wait_until='load')
    check('all twelve reading records and 36 answers survive reload',page.locator('[data-read-count]').inner_text()=='12' and page.evaluate('(k)=>Object.keys(JSON.parse(localStorage.getItem(k)).answers).length',KEY)==36)
    check('progress bar ends at 12 of 12',page.locator('[role=progressbar]').get_attribute('aria-valuemax')=='12' and page.locator('[role=progressbar]').get_attribute('aria-valuenow')=='12')
    # Explicitly persist and restore a two-digit lesson anchor.
    page.evaluate('(k)=>{const s=JSON.parse(localStorage.getItem(k));s.last="lesson-12";s.anchors["lesson-12"]="l12-lab";localStorage.setItem(k,JSON.stringify(s));}',KEY)
    go();check('continue uses lesson 12 and its restored anchor','第 12 课' in page.locator('[data-continue]').inner_text() and 'lessons/12/index.html#l12-lab' in page.locator('[data-continue]').get_attribute('href'))
    go('lessons/4/');m=result('mean');page.locator('[data-advanced-step]').click();check('new Gaussian seed changes samples',result('mean')!=m);page.locator('[data-advanced-reset]').click();check('Gaussian reset is reproducible',result('mean')==m)
    go('lessons/5/');page.locator('[data-advanced-step]').click();check('one real gradient update yields w .25 and loss .15625',result('weight')=='0.25' and result('loss')=='0.15625');slide(5,'steps',20);check('training reduces loss',float(result('loss'))<.00001)
    go('lessons/6/');slide(6,'stage',1);slide(6,'z',-2);x=result('next');slide(6,'z',2);check('last DDPM step ignores extra noise',result('sd')=='0' and result('next')==x)
    slide(6,'stage',2);slide(6,'z',-2);x=result('next');slide(6,'z',2);check('earlier DDPM step responds to new noise',result('next')!=x)
    go('lessons/7/');slide(7,'scale',2);check('guidance computes 5',result('prediction')=='5')
    go('lessons/8/');check('score -2 moves x to 1.6',result('score')=='-2' and result('next')=='1.6');slide(8,'x',-2);check('score reverses direction across mean',result('score')=='2')
    go('lessons/9/');check('flow midpoint 2, target 8 and loss 4',result('position')=='2' and result('target')=='8' and result('loss')=='4');slide(9,'velocity',8);check('correct flow target yields zero loss',result('loss')=='0')
    go('lessons/10/');slide(10,'steps',2);check('Euler two steps yields 2.25',result('estimate')=='2.25');x=float(result('error'));slide(10,'steps',16);check('Euler error decreases in the known example',float(result('error'))<x)
    shots=ROOT/'.preview/screenshots';shots.mkdir(parents=True,exist_ok=True)
    page.locator('[data-advanced-lab]').screenshot(path=str(shots/'full-euler-desktop.png'))
    go('lessons/11/');slide(11,'goal',6);page.locator('[data-advanced-step]').click();check('execute two of six actions reaches 2',result('position')=='2' and result('executed')=='2');slide(11,'goal',8);page.locator('[data-advanced-step]').click();check('new observation replans from 2 to reach 4',result('position')=='4' and result('executed')=='4')
    page.locator('[data-advanced-reset]').click();check('policy reset restores origin and count',result('position')=='0' and result('executed')=='0')
    go('lessons/12/');check('bias study at t .5 has two MSEs .04',result('loss')=='0.04' and result('error')=='0.04');slide(12,'time',1);check('pure noise endpoint is guarded',result('error')=='不可反算' and '不能除以零' in page.locator('[data-advanced-status]').inner_text())
    for n in range(4,13):
        go(f'lessons/{n}/')
        for control in page.locator('[data-param]').all():
            for bound in ['min','max']:
                control.evaluate('(e,b)=>{e.value=e.getAttribute(b);e.dispatchEvent(new Event("input",{bubbles:true}));}',bound)
                assert 'NaN' not in page.locator('[data-advanced-lab]').inner_text() and 'Infinity' not in page.locator('[data-advanced-lab]').inner_text()
                assert not page.locator('svg').evaluate('(e)=>/NaN|Infinity/.test(e.outerHTML)')
        page.locator('[data-advanced-reset]').click()
        check(f'lesson {n} controls and plot stay finite at bounds',True)
    routes=['']+[f'lessons/{n}/' for n in range(1,13)]+['glossary/','sources/']
    for width in [320,390,768,1366]:
        page.set_viewport_size({'width':width,'height':850})
        for route in routes:
            go(route);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
        check(f'all fifteen pages fit {width}px viewport',True)
    page.set_viewport_size({'width':390,'height':844});go('lessons/11/')
    page.screenshot(path=str(shots/'full-policy-mobile.png'),full_page=True)
    page.locator('[data-menu-toggle]').click();page.locator('#course-sidebar [data-nav=lesson-12]').click()
    check('long mobile directory reaches lesson 12 and closes',page.locator('[data-lesson-page=lesson-12]').is_visible() and page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='false')
    page.locator('#a12-bias').focus();page.keyboard.press('ArrowRight');check('advanced slider works by keyboard',page.locator('#a12-bias').input_value()=='0.3')
    go('glossary/');page.locator('#term-search').fill('Flow Map');check('new glossary entry searchable',page.locator('#term-flow-map').is_visible())
    # Single file also loads the advanced script and supports two-digit routes.
    offline=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');offline.on('pageerror',lambda e:errors.append(str(e)))
    offline.set_content((ROOT/'.preview/course-preview.html').read_text(),wait_until='load')
    for n in range(4,13):
        offline.evaluate('(n)=>location.hash="#lesson-"+n',n);offline.locator(f'[data-view=lesson-{n}]').wait_for(state='visible')
        check(f'standalone lesson {n} initializes advanced lab',offline.locator(f'[data-advanced-lab="{n}"] [data-advanced-status]').inner_text()!='')
    check('standalone has exactly fifteen views',offline.locator('.single-view').count()==15)
    check('no uncaught JavaScript errors or failed resources',not errors and not failed)
    version=b.version;b.close()
report={'passed':len(checks),'failed':0,'browser':version,'base_url':args.base_url,'checks':checks,'not_verified':['Safari/Firefox','Physical phone','Complete screen-reader audit','Trained neural models (not implemented by design)']}
(ROOT/'.preview/browser-full-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks),'failed':0,'browser':version,'base_url':args.base_url}))
