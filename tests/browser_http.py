"""Real-origin browser checks; start `npm start` first. Requires Python Playwright.
Unlike browser_checks.py, these tests never replace localStorage or set_content.
"""
from pathlib import Path
from urllib.parse import urljoin
import argparse, json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser()
a.add_argument('--chromium',required=True)
a.add_argument('--base-url',default='http://127.0.0.1:4321/diffusion-course/')
args=a.parse_args()
checks=[]
def check(name,ok):
    assert ok,name
    checks.append({'name':name,'passed':True})
def slide(page,selector,value):
    page.locator(selector).evaluate('(e,v)=>{e.value=String(v);e.dispatchEvent(new Event("input",{bubbles:true}));}',value)

with sync_playwright() as p:
    b=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=b.new_context(viewport={'width':1366,'height':900},reduced_motion='reduce')
    page=ctx.new_page(); errors=[]; failed=[]
    ctx.on('page',lambda tab:tab.on('pageerror',lambda e:errors.append(str(e))))
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:failed.append(r.url))
    def go(route=''):
        r=page.goto(urljoin(args.base_url,route),wait_until='load')
        assert r.status==200,(route,r.status)
    go()
    check('native localStorage is available',page.locator('[data-storage-warning]').is_hidden())
    go('lessons/2/');go()
    check('unstarted continue label and href both refer to lesson 1',page.locator('[data-continue]').inner_text()=='开始第一课 →' and 'lessons/1/' in page.locator('[data-continue]').get_attribute('href'))
    go('lessons/1/')
    check('HTTP lesson 1 evaluates 9.2',page.locator('[data-out=xt]').inner_text()=='9.2')
    page.locator('#mix-alpha').focus();page.keyboard.press('ArrowLeft')
    check('keyboard changes range and output',page.locator('#mix-alpha').input_value()=='0.75' and page.locator('[data-out=xt]').inner_text()=='8.7')
    page.locator('[data-reset]').click()
    go('lessons/2/')
    check('HTTP noise prediction calculation',page.locator('[data-out=loss]').inner_text()=='0.25' and page.locator('[data-out=estimate]').inner_text()=='10.375')
    slide(page,'#prediction',2)
    check('correct prediction gives zero loss',page.locator('[data-out=loss]').inner_text()=='0')
    for lesson,values in {1:[1,9.2,1],2:[1,.25,2],3:[1,-2,2]}.items():
        go(f'lessons/{lesson}/')
        for i,value in enumerate(values,1):
            form=page.locator(f'[data-question=l{lesson}q{i}]')
            if i==2:form.locator('input').fill(str(value))
            else:form.locator(f'input[value="{value}"]').check()
            form.locator('[type=submit]').click()
            check(f'HTTP question l{lesson}q{i} correct','回答正确' in form.locator('[data-answer-title]').inner_text())
        page.locator('[data-mark-read]').click()
    page.reload(wait_until='load')
    check('native storage survives reload and restores all reading records',page.locator('[data-read-count]').inner_text()=='3')
    go('lessons/2/')
    check('native storage restores answers on a different page',page.locator('#l2q2-input').input_value()=='0.25' and '上次提交' in page.locator('[data-question=l2q2] [data-answer-state]').inner_text())
    form=page.locator('[data-question=l2q2]');form.locator('input').fill('');form.locator('[type=submit]').click()
    check('empty resubmission explains retained previous answer','仍保留上次' in form.locator('[data-answer-explanation]').inner_text())
    go('lessons/3/');slide(page,'#noise-time',1)
    check('time endpoint is finite and guarded',page.locator('[data-out=xt]').inner_text()=='-2' and '不能除以 0' in page.locator('[data-out=estimate-status]').text_content())
    slide(page,'#noise-time',.5)
    check('cosine midpoint uses full precision',page.locator('[data-out=xt]').inner_text()=='5.657')
    go('glossary/');page.locator('#term-search').fill('sigma')
    check('HTTP glossary filters terms',page.locator('[data-glossary-item]:visible').count()==1)
    for width in [320,360,390,768,1366]:
        page.set_viewport_size({'width':width,'height':850})
        for route in ['', 'lessons/1/', 'lessons/2/', 'lessons/3/', 'glossary/', 'sources/']:
            go(route)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
        check(f'six HTTP pages fit viewport {width}px',True)
    page.set_viewport_size({'width':390,'height':844});go('lessons/3/')
    page.locator('[data-menu-toggle]').click();page.locator('.mobile-links [data-nav=glossary]').click()
    check('mobile glossary is reachable and menu closes',page.locator('#term-search').is_visible() and page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='false')
    go('lessons/3/');page.locator('[data-menu-toggle]').click();page.keyboard.press('Escape')
    check('mobile menu restores focus on Escape',page.locator('[data-menu-toggle]').evaluate('(e)=>document.activeElement===e'))
    shots=ROOT/'.preview/screenshots';shots.mkdir(parents=True,exist_ok=True)
    page.screenshot(path=str(shots/'http-lesson3-mobile.png'),full_page=True)
    page.set_viewport_size({'width':1366,'height':900});go()
    page.screenshot(path=str(shots/'http-home-desktop.png'),full_page=True)
    go('sources/');check('public mathematical sources are available',page.locator('#papers').is_visible())
    page.evaluate("localStorage.setItem('diffusion-course:learning:v1',JSON.stringify({version:1,answers:{l1q2:true,l2q2:' ',l3q2:[]}}))")
    go('lessons/1/')
    check('malformed stored answers are ignored',page.locator('#l1q2-input').input_value()=='')
    page.evaluate("localStorage.setItem('diffusion-course:learning:v1','{bad json')");page.reload(wait_until='load')
    check('corrupt native storage falls back without breaking lab',page.locator('[data-storage-warning]').is_visible() and page.locator('[data-out=xt]').inner_text()=='9.2')
    page.once('dialog',lambda d:d.accept());page.locator('[data-reset-progress]').first.click()
    check('reset recovers corrupt storage',page.locator('[data-storage-warning]').is_hidden() and page.evaluate("localStorage.getItem('diffusion-course:learning:v1')") is None)
    check('no page errors or failed resources',not errors and not failed)
    version=b.version;b.close()
report={'passed':len(checks),'failed':0,'browser':version,'mode':'Real HTTP navigation with native localStorage','base_url':args.base_url,'checks':checks,'not_verified':['Live GitHub Pages HTTPS','Safari/Firefox','Physical phone','Complete screen-reader audit']}
(ROOT/'.preview/browser-http-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks),'failed':0,'browser':version},ensure_ascii=False))
