"""Browser interaction checks for the self-contained edition.
Runs with Playwright Python and a local Chromium executable. No network navigation.
Storage restoration is tested with an explicit in-memory Storage test double,
because about:blank does not provide a persistent site origin. This is NOT a
verification of native localStorage persistence or of the live GitHub Pages URL.
"""
from pathlib import Path
import argparse
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--chromium', default='/usr/bin/chromium')
parser.add_argument('--report', default=str(ROOT / '.preview/browser-report.json'))
args = parser.parse_args()
HTML = (ROOT / '.preview/course-preview.html').read_text()
SHOTS = ROOT / '.preview/screenshots'
SHOTS.mkdir(parents=True, exist_ok=True)
results = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    results.append({'name': name, 'passed': True})

def mock_storage(page, saved=None):
    page.evaluate('''(saved) => {
      const store = new Map(Object.entries(saved || {}));
      Object.defineProperty(window, 'localStorage', { configurable:true, value: {
        getItem(k){ return store.has(String(k)) ? store.get(String(k)) : null; },
        setItem(k,v){store.set(String(k),String(v));},
        removeItem(k){store.delete(String(k));},
        clear(){store.clear();}, key(i){return [...store.keys()][i] || null;},
        get length(){return store.size;}
      }});
    }''', saved or {})

def go(page, route):
    page.evaluate('(route) => {location.hash = route}', '#' + route)
    page.wait_for_timeout(70)
    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")

def slider(page, selector, value):
    page.locator(selector).evaluate('(e, v) => {e.value = String(v); e.dispatchEvent(new Event("input",{bubbles:true}));}', value)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.chromium, headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    mock_storage(page)
    page.set_content(HTML, wait_until='load')
    check('six logical views, only homepage initially visible', page.locator('.single-view:visible').count()==1 and page.locator('[data-view="home"]').is_visible())
    check('normal storage interface does not show warning', page.locator('[data-storage-warning]').is_hidden())
    page.screenshot(path=str(SHOTS/'home-desktop.png'), full_page=True)
    # Lesson 1
    go(page,'%E0%A4%A')
    check('malformed hash falls back without crashing',page.locator('[data-view=home]').is_visible())
    go(page,'lesson-1')
    page.locator('.skip-link').focus();page.keyboard.press('Enter');page.wait_for_timeout(100)
    check('skip link stays in current lesson and focuses main',page.locator('[data-view=lesson-1]').is_visible() and page.locator('#main').evaluate('(e)=>document.activeElement===e'))
    check('lesson 1 initial calculation equals 9.2', page.locator('[data-lab="mix"] [data-out="xt"]').inner_text()=='9.2')
    slider(page,'#mix-alpha',0)
    check('alpha zero removes the original signal', page.locator('[data-lab="mix"] [data-out="xt"]').inner_text()=='1.2')
    page.locator('[data-lab="mix"] [data-reset]').click()
    check('mix reset restores all default values', page.locator('#mix-alpha').input_value()=='0.8')
    page.locator('#tab-numeric').focus()
    page.keyboard.press('ArrowRight')
    check('mode tabs support arrow-key navigation', page.locator('#lab1-image').is_visible() and page.locator('#tab-image').get_attribute('aria-selected')=='true')
    before=page.locator('[data-lab="mix"] [data-canvas="mixed"]').evaluate('(e)=>e.toDataURL()')
    page.locator('[data-randomize]').click()
    after=page.locator('[data-lab="mix"] [data-canvas="mixed"]').evaluate('(e)=>e.toDataURL()')
    check('new noise changes the image without changing numeric epsilon', before!=after and page.locator('#mix-epsilon').input_value()=='2')
    page.locator('[data-term="alpha"]').first.click()
    check('term definition dialog opens and explains alpha', page.locator('.definition-dialog').is_visible() and '信号系数' in page.locator('#definition-title').inner_text())
    page.keyboard.press('Escape')
    check('Escape closes term dialog', page.locator('.definition-dialog').is_hidden())
    # Lesson 2
    go(page,'lesson-2')
    check('prediction default results match hand calculation',page.locator('[data-lab="predict"] [data-out="loss"]').inner_text()=='0.25' and page.locator('[data-lab="predict"] [data-out="estimate"]').inner_text()=='10.375')
    slider(page,'#prediction',2)
    check('perfect noise prediction produces zero loss and estimate 10',page.locator('[data-lab="predict"] [data-out="loss"]').inner_text()=='0' and page.locator('[data-lab="predict"] [data-out="estimate"]').inner_text()=='10')
    page.locator('[data-lab="predict"] [data-reset]').click()
    check('prediction reset returns to 1.5',page.locator('#prediction').input_value()=='1.5')
    # Lesson 3
    go(page,'lesson-3')
    page.screenshot(path=str(SHOTS/'lesson3-desktop.png'),full_page=False)
    page.locator('[data-lab="time"]').screenshot(path=str(SHOTS/'lesson3-experiment.png'))
    slider(page,'#noise-time',0)
    check('time t=0 gives signal 1, noise 0, output 10',page.locator('[data-lab="time"] [data-out="alpha"]').inner_text()=='1' and page.locator('[data-lab="time"] [data-out="sigma"]').inner_text()=='0' and page.locator('[data-lab="time"] [data-out="xt"]').inner_text()=='10')
    slider(page,'#noise-time',1)
    check('time t=1 gives signal 0 and output -2',page.locator('[data-lab="time"] [data-out="alpha"]').inner_text()=='0' and page.locator('[data-lab="time"] [data-out="xt"]').inner_text()=='-2')
    page.locator('.lab-details summary').click()
    check('singular reconstruction warns rather than dividing by zero','不能除以 0' in page.locator('[data-out="estimate-status"]').inner_text())
    slider(page,'#noise-time',.99)
    check('near-zero alpha shows error-amplification warning','误差会被放大' in page.locator('[data-out="estimate-status"]').inner_text())
    page.locator('[data-lab="time"] [data-reset]').click()
    page.locator('[data-step]').click()
    check('step button advances t from .4 to .5',page.locator('#noise-time').input_value()=='0.5')
    page.locator('[data-play]').click()
    page.wait_for_timeout(260)
    page.locator('[data-play]').click()
    val=page.locator('#noise-time').input_value()
    page.wait_for_timeout(200)
    check('play advances and pause stops the time controller',float(val)>.5 and val==page.locator('#noise-time').input_value())
    page.locator('[data-lab="time"] [data-reset]').click()
    check('time reset returns to .4',page.locator('#noise-time').input_value()=='0.4')
    page.locator('[data-flow-next]').click()
    check('flow player highlights next stage',page.locator('[data-flow-step="1"]').get_attribute('aria-current')=='step')
    page.locator('[data-flow-reset]').click()
    check('flow reset returns to stage 1',page.locator('[data-flow-step="0"]').get_attribute('aria-current')=='step')
    # All nine questions: empty, wrong and correct submissions.
    form=page.locator('[data-question="l3q1"]')
    form.locator('button[type="submit"]').click()
    check('empty answer is rejected without completion','先选择' in form.locator('[data-answer-title]').inner_text())
    form.locator('input[value="0"]').check()
    form.locator('button[type="submit"]').click()
    check('wrong answer returns explanation and permits retry','再核对' in form.locator('[data-answer-title]').inner_text() and form.locator('[data-answer-explanation]').inner_text()!='')
    answers={1:[1,9.2,1],2:[1,.25,2],3:[1,-2,2]}
    for lesson,values in answers.items():
        go(page,f'lesson-{lesson}')
        for index,value in enumerate(values,1):
            form=page.locator(f'[data-question="l{lesson}q{index}"]')
            if index==2:form.locator('input').fill(str(value))
            else:form.locator(f'input[value="{value}"]').check()
            form.locator('button[type="submit"]').click()
            assert '回答正确' in form.locator('[data-answer-title]').inner_text()
        page.locator(f'[data-mark-read="lesson-{lesson}"]').click()
    check('all nine answers are evaluated correctly',len(json.loads(page.evaluate("localStorage.getItem('diffusion-course:learning:v1')"))['answers'])==9)
    check('read status and quiz progress tracked independently',page.locator('[data-read-count]').inner_text()=='3' and '答对 3' in page.locator('[data-score="lesson-3"]').inner_text())
    saved=page.evaluate("localStorage.getItem('diffusion-course:learning:v1')")
    restored=browser.new_page(viewport={'width':1200,'height':900},reduced_motion='reduce')
    mock_storage(restored,{'diffusion-course:learning:v1':saved})
    restored.set_content(HTML,wait_until='load')
    go(restored,'lesson-2')
    check('saved JSON restores read status, answers and feedback',restored.locator('[data-read-count]').inner_text()=='3' and restored.locator('#l2q2-input').input_value()=='0.25' and '上次提交' in restored.locator('[data-question="l2q2"] [data-answer-state]').inner_text())
    go(page,'glossary')
    page.locator('#term-search').fill('sigma')
    check('glossary search filters by English symbol name',page.locator('[data-glossary-item]:visible').count()==1 and page.locator('#term-sigma').is_visible())
    page.locator('#term-search').fill('xyz-not-a-term')
    check('glossary no-result state is explicit',page.locator('[data-search-empty]').is_visible())
    page.locator('#term-search').fill('')
    # Mobile checks on every route at 360, 390 and 768 pixels.
    for width in [360,390,768]:
        page.set_viewport_size({'width':width,'height':800})
        for route in ['home','lesson-1','lesson-2','lesson-3','glossary','sources']:
            go(page,route)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(width,route)
    check('six routes have no page-wide overflow at 360, 390 and 768px',True)
    page.set_viewport_size({'width':360,'height':800})
    go(page,'lesson-3')
    page.screenshot(path=str(SHOTS/'lesson3-mobile.png'),full_page=False)
    page.locator('[data-menu-toggle]').click()
    check('mobile menu opens and sidebar becomes keyboard-accessible',page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='true' and not page.locator('#course-sidebar').evaluate('(e)=>e.inert'))
    page.keyboard.press('Escape')
    check('Escape closes mobile menu and hides it from keyboard navigation',page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='false' and page.locator('#course-sidebar').evaluate('(e)=>e.inert'))
    page.locator('[data-menu-toggle]').click()
    page.locator('#course-sidebar [data-nav="lesson-1"]').click()
    page.wait_for_timeout(120)
    check('mobile navigation changes course and closes the drawer',page.locator('[data-view="lesson-1"]').is_visible() and page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='false')
    page.locator('[data-menu-toggle]').click()
    page.locator('.mobile-links [data-nav=glossary]').click();page.wait_for_timeout(100)
    check('mobile menu exposes glossary',page.locator('[data-view=glossary]').is_visible())
    # Denied storage behavior is tested with real about:blank restriction, no double.
    denied=browser.new_page(viewport={'width':800,'height':800},reduced_motion='reduce')
    denied.set_content(HTML,wait_until='load')
    go(denied,'lesson-3');slider(denied,'#noise-time',1)
    check('storage denial shows warning without breaking the experiment',denied.locator('[data-storage-warning]').is_visible() and denied.locator('[data-lab="time"] [data-out="xt"]').inner_text()=='-2')
    corrupted=browser.new_page(reduced_motion='reduce');mock_storage(corrupted,{'diffusion-course:learning:v1':'{bad json'})
    corrupted.set_content(HTML,wait_until='load')
    check('corrupted saved JSON does not prevent course rendering',corrupted.locator('[data-storage-warning]').is_visible() and corrupted.locator('[data-view="home"]').is_visible())
    page.set_viewport_size({'width':1440,'height':1000});go(page,'home')
    page.once('dialog',lambda d:d.accept())
    page.locator('[data-reset-progress]').first.click()
    check('confirmed reset clears all quiz and reading records',page.locator('[data-read-count]').inner_text()=='0' and page.evaluate("localStorage.getItem('diffusion-course:learning:v1')") is None)
    check('no uncaught JavaScript errors in the exercised course',len(errors)==0)
    browser.close()
report={'passed':len(results),'failed':0,'mode':'Chromium set_content, self-contained edition','storage':'in-memory Storage double for restoration; real denied-storage fallback tested','not_verified':['Live GitHub deployment','Browser HTTP/file navigation under this restricted runtime','Native origin-based localStorage persistence across reload','Safari/Firefox engine-specific behavior'],'checks':results}
Path(args.report).write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(results),'failed':0,'report':args.report},ensure_ascii=False))
