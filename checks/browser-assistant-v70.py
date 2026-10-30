"""Optional Chromium chat/theme regression checks. All AI transport is synthetic.

Run against the local dist server; this never calls an AI provider. Covers long
answers, math, error recovery, attachments and theme switching on desktop/mobile.
"""
import argparse
import base64
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:4173/')
parser.add_argument('--out', default='work/ai-v70')
args = parser.parse_args()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
report = {'transport': 'synthetic; no AI inference', 'browser': 'Chromium emulation; not real Safari/iPhone', 'cases': [], 'errors': []}
answer = ('**Khảo sát định luật Ohm**\n\nGiữ điện trở không đổi, thay đổi hiệu điện thế và đo dòng điện.\n'
          r'\[ I=\dfrac{U}{R}=\dfrac{5}{10}=0.5\,\mathrm{A} \]' + '\n\n' +
          '\n'.join(f'{n}. Ghi giá trị đo, đơn vị SI và đối chiếu quan hệ giữa dòng điện và hiệu điện thế.' for n in range(1, 11)))
pixel = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1cAAAAASUVORK5CYII=')

def paint(locator, pseudo=None):
    return locator.evaluate('''(el,pseudo)=>{
      const style=getComputedStyle(el,pseudo),rgb=s=>s.match(/[\\d.]+/g).map(Number),
      luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      let node=el,bg;
      while(node){bg=rgb(getComputedStyle(node).backgroundColor);if(bg.length<4||bg[3]===1)break;node=node.parentElement;}
      bg=bg&&bg[3]!==0?bg:[255,255,255];
      const fg=rgb(style.color),a=luminance(bg),b=luminance(fg);
      return {background:bg.slice(0,3),color:fg.slice(0,3),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    }''', pseudo)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    for width in [390, 1440]:
        for theme in ['light', 'dark']:
            for locale in ['vi-VN', 'en-US']:
                context = browser.new_context(viewport={'width': width, 'height': 900},
                                              is_mobile=width < 600, has_touch=width < 600)
                context.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1',{json.dumps(locale)})")
                page = context.new_page()
                page.on('pageerror', lambda error: report['errors'].append(str(error)))
                state = {'fail': False, 'requests': []}

                def transport(route):
                    if route.request.method == 'OPTIONS':
                        route.fulfill(status=204, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type'})
                        return
                    state['requests'].append(route.request.post_data_json)
                    route.fulfill(status=503 if state['fail'] else 200,
                                  headers={'Access-Control-Allow-Origin': '*'}, content_type='application/json',
                                  body=json.dumps({'error': 'Dịch vụ AI đang bận. Hãy thử lại.'} if state['fail'] else {'answer': answer}))

                page.route('**/api/chat', transport)
                page.goto(args.base, wait_until='networkidle')
                page.locator('#openAssistant').click()
                chat = page.locator('#aiAssistant')
                chat.wait_for(state='visible')
                assert page.locator('#aiTitle').inner_text() == ('AI assistant' if locale == 'en-US' else 'Trợ lý AI')
                colors = {}
                for selector in ['.ai-head h2', '.ai-context', '.ai-prompt', '.ai-prompt-hint', 'textarea']:
                    colors[selector] = paint(chat.locator(selector).first)
                    assert colors[selector]['contrast'] >= 4.5, (width, theme, locale, selector, colors[selector])
                colors['placeholder'] = paint(chat.locator('textarea'), '::placeholder')
                assert colors['placeholder']['contrast'] >= 4.5
                chat.locator('textarea').fill('Test long answer and scientific formula')
                chat.locator('button[type=submit]').click()
                chat.locator('.ai-message[data-role=assistant]:not(.ai-pending)').wait_for()
                chat.locator('.katex').first.wait_for()
                for selector in ['.ai-message[data-role=assistant]', '.ai-message[data-role=user]', '.katex']:
                    colors[selector] = paint(chat.locator(selector).first)
                    assert colors[selector]['contrast'] >= 4.5, (selector, colors[selector])
                assert state['requests'][-1]['locale'] == locale
                assert chat.locator('textarea').input_value() == ''
                assert chat.locator('.ai-messages').evaluate('el=>el.scrollHeight>el.clientHeight')
                assert not chat.evaluate('el=>el.scrollWidth>el.clientWidth+1')
                if theme == 'dark':
                    assert colors['.ai-message[data-role=assistant]']['background'] == [33, 33, 33]
                    assert colors['.ai-message[data-role=user]']['background'] == [48, 48, 48]
                if locale == 'vi-VN':
                    chat.screenshot(path=str(out / f'answer-{width}-{theme}.png'))
                # Switching appearance must preserve conversation and the unsent draft.
                chat.locator('textarea').fill('Keep this draft')
                chat.locator('[data-ai=close]').click()
                page.locator('#appearanceToggle').click()
                page.locator('#openAssistant').click()
                assert chat.locator('.ai-message[data-role=assistant]').count() == 1
                assert chat.locator('textarea').input_value() == 'Keep this draft'
                assert paint(chat.locator('.ai-message[data-role=assistant]'))['contrast'] >= 4.5
                chat.locator('[data-ai=close]').click()
                page.locator('#appearanceToggle').click()
                page.locator('#openAssistant').click()
                # Network error is inline, legible and retains a retryable draft.
                state['fail'] = True
                chat.locator('button[type=submit]').click()
                chat.locator('.ai-status[data-state=error]').wait_for(state='visible')
                colors['error'] = paint(chat.locator('.ai-status'))
                assert colors['error']['contrast'] >= 4.5
                assert chat.locator('textarea').input_value() == 'Keep this draft'
                assert not chat.locator('button[type=submit]').is_disabled()
                # An attachment can be prepared/removed without submitting data.
                chat.locator('input[type=file]').set_input_files({'name': 'graph.png', 'mimeType': 'image/png', 'buffer': pixel})
                chat.locator('.ai-attachment').wait_for()
                assert paint(chat.locator('.ai-attachment span'))['contrast'] >= 4.5
                chat.locator('.ai-attachment button').click()
                assert chat.locator('.ai-attachment').count() == 0
                assert chat.locator('textarea').input_value() == 'Keep this draft'
                # Retry succeeds; keyboard close restores focus.
                state['fail'] = False
                chat.locator('button[type=submit]').click()
                page.wait_for_function("document.querySelectorAll('.ai-message[data-role=assistant]:not(.ai-pending)').length===2 && !document.querySelector('.ai-pending')")
                chat.locator('textarea').focus()
                chat.locator('textarea').press('Escape')
                assert chat.is_hidden()
                assert page.locator('#openAssistant').evaluate('el=>document.activeElement===el')
                report['cases'].append({'width': width, 'theme': theme, 'locale': locale, 'status': 'PASS', 'colors': colors})
                context.close()
    browser.close()
assert not report['errors'], report['errors']
(out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps({'cases': len(report['cases']), 'status': 'PASS', 'jsErrors': report['errors']}))
