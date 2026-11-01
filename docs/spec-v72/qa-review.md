# Integrated browser QA: specification A/B v72

Independent review used Chromium headless with SwiftShader, emulated widths390/1440. No provider calls, credentials, real mobile hardware or teacher signoff were used.

## Result

18/18 scenarios PASS; zero JavaScript page errors.

- All eight coreIDs × two widths: energy, oscillation, wave, electric, ohm, capacitor, boyle, gas. Alternating light/VI and dark/EN contexts; each switched to the other locale.
- Each real integrated workbook opened from native details, saved learner-authored prediction/conclusion, selected an actual parameter, disabled that parameter in the controlled list, recorded a real model state through the existing app callback, opened the table and exported a downloaded JSON containing raw numeric parameters and recorded values.
- Literal HTML-like learner input remained text. Locale switching and reload preserved the prediction and existing measured rows. No horizontal document overflow.
- Ohm at each width: record U=2,4,6V at R=10Ω; fit remains available with homogeneous conditions. Start playback, change R to20Ω: playback pauses, existing rows remain exact and notice explains preservation. Record fourth point: mixed-condition notice reports two groups and measured points remain visible.
- Dark mobile workbook screenshot visually inspected: paired neutral surfaces, readable text, progressive sections and no overflow.

## Reproduction and evidence

`python checks/browser-spec-v72.py` against the local static server4173.

Full JSON report,16 downloaded worksheets and screenshots are in `work/spec-v72/qa/`. The browser script is committed for repeatability. Exported learner fixtures are synthetic test text, not school data.

## Limits

This validates integrated software flows of phasesA/B, not all300individual scientific models, curriculum mapping, physical iPhone/Safari/Android use, full WCAG certification, classroom usability or teacher acceptance. Other per-profile S1–S7 requirements remain pending unless independently evidenced elsewhere.
