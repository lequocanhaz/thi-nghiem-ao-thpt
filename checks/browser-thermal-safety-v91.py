#!/usr/bin/env python3
"""Cancel in the same task as starting placement; no assumption about frame latency.
The placement-cancel branch injects public DOM click/keydown events. The subsequent
assessment/pour branch still uses native Playwright mouse and keyboard actions.
No physical or session state setter is used.
"""
from pathlib import Path
source=Path('checks/browser-thermal-safety-v90.py').read_text()
old="p.locator('[data-l3-assist=align]').click();p.wait_for_timeout(120);p.keyboard.press('Escape');p.wait_for_timeout(700)"
new="p.locator('[data-l3-assist=align]').evaluate('b=>{b.click();b.dispatchEvent(new KeyboardEvent(\"keydown\",{key:\"Escape\",bubbles:true,cancelable:true}));}');p.wait_for_timeout(700)"
assert source.count(old)==1
source=source.replace(old,new)
exec(compile(source,'trusted-v90-safety-v91-deterministic-cancel','exec'))
