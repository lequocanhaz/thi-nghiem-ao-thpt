#!/usr/bin/env python3
"""V88/V89 manual controls remain reachable after explicitly expanding disclosures.
This harness opens UI disclosures only; it never changes physical/session state.
"""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
old="assert ('ice' if activity=='ice' else 'solid') in p.locator('.l3-pilot h1').inner_text().lower()"
new="assert ('ice' in p.locator('.l3-pilot h1').inner_text().lower() if activity=='ice' else p.locator('.l3-pilot h1').inner_text()=='Specific heat capacity')"
source=source.replace(old,new)
# Open the UI sections exactly as a user choosing manual/advanced controls can.
source=source.replace("self.page = self.context.new_page()", """self.page = self.context.new_page()
        self.page.add_init_script('''new MutationObserver(()=>{for(const selector of ['#l3Adjustments','.l3-display-options','.l3-trial-settings']){const n=document.querySelector(selector);if(n&&!n.open)n.open=true;}}).observe(document,{subtree:true,childList:true});''')""")
exec(compile(source,'trusted-v87-v90-expanded-controls','exec'))
