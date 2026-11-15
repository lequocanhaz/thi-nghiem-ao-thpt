#!/usr/bin/env python3
"""Recheck the v87 lifecycle contract with the v88 course heading.
Only trusted repository harness code is adapted; session data is never executed.
The original failing report remains unchanged.
"""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
old="assert ('ice' if activity=='ice' else 'solid') in p.locator('.l3-pilot h1').inner_text().lower()"
new="assert ('ice' in p.locator('.l3-pilot h1').inner_text().lower() if activity=='ice' else p.locator('.l3-pilot h1').inner_text()=='Specific heat capacity')"
assert source.count(old)==1
source=source.replace(old,new).replace("Path('checks/browser-thermal-v87.py'),Path('dist/index.html')","Path('checks/browser-thermal-v87.py'),Path('checks/browser-thermal-locale-v88.py'),Path('dist/index.html')")
exec(compile(source,'trusted-v87-lifecycle-v88-course-heading','exec'))
