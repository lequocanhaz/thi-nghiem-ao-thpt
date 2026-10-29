from playwright.sync_api import sync_playwright
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1440,'height':1000});page.goto('http://127.0.0.1:4173/#lab/oscillation',wait_until='networkidle');page.wait_for_selector('#shmPhaseSlider')
 slider=page.locator('#shmPhaseSlider');slider.fill('0');slider.dispatch_event('input');svg=page.locator('.shm-circle-svg');svg.scroll_into_view_if_needed()
 pts=svg.evaluate('(s)=>{const m=s.getScreenCTM();return [[290,156],[70,156]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return{x:p.x,y:p.y}})}')
 page.mouse.move(pts[0]['x'],pts[0]['y']);page.mouse.down();page.mouse.move(pts[1]['x'],pts[1]['y'],steps=8);page.mouse.up();assert abs(float(slider.input_value())-180)<1
 slider.focus();slider.press('Home');slider.press('ArrowRight');assert float(slider.input_value())>0
 page.goto('http://127.0.0.1:4173/books.html',wait_until='networkidle');page.locator('#appearanceToggle').click();page.reload(wait_until='networkidle');assert page.locator('html').get_attribute('data-appearance')=='dark'
 print('PASS circle pointer drag, keyboard slider, books theme persistence');b.close()
