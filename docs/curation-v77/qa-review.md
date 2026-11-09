# Independent browser QA — curated library v77

Scope: reversible selection of 40 main investigations with 260 supplementary entries. The smaller default library follows the owner's latest direction; this is not a certification that every selected model is complete or that every supplementary model is defective.

## Verified on the stable UI source

- Chromium 154.0.8037.57, headless, SwiftShader; 12/12 cases passed in `report.json`.
- Eight combinations: widths 320, 390, 768 and 1440 px, each in light and dark themes. Main/default 40, supplementary 260, first original v74 preview loaded, collection controls at least 44 px, no document horizontal overflow, VI→EN→VI collection copy intact. Empty fluid-topic chip hidden in main and available in the supplementary collection.
- Visible pagination buttons reached all 300 IDs: 40 main plus 260 supplementary, no overlap. Search for `de broglie` stayed empty in main and offered the explicit supplementary search. Search text and collection survived browser Back/Forward. The de Broglie limitation notice translated in both directions.
- A previously opened supplementary `spring_period` session retained its recorded row, physical parameters and literal-text notes across favorite/recent filtering, opening its old route, locale changes and reload, on 390 and 1440 px. Personal collection count displayed 1, and the related main investigation remained reachable.
- The supplementary analytical-relation disclosure started closed, retained an explicitly opened state during locale changes, and did not change the scientific state. The ray legend for `ray_slab` remained open. Parameter rails started off in a fresh session; explicitly enabling them preserved physical state/rows/notes and survived reload.
- No JavaScript page errors or HTTP responses >=400 were observed. Hashes of the specified runtime UI files stayed identical from start to finish (`sourceStable: true`).

## Visual review

The library now shows an explicit collection choice and the smaller count; the original experiment images remain. The supplementary notice on a 390 px saved session is shorter than the first implementation (about 135 px versus 188 px) and retains related-investigation/back links. Specific `needs-work` entries retain an expanded limitation paragraph. These are informative labels, not a declaration that all 260 supplementary entries are broken.

Screenshots: `main-390-dark.png`, `archive-390-dark.png`, `main-1440-light.png`, `archive-1440-light.png`, `lab-390-dark.png`, `lab-1440-light.png` (additional theme combinations also saved).

## Boundaries

This report does not certify real iPhone/Safari, Android hardware, the virtual keyboard, classroom acceptance, frame rate or every scientific interaction in all 300 models. The saved-data check covers the explicit supplementary-session fixture above. Asset and equation preservation, the known negative-resistance domain in `voltmeter_design`, and the independent scientific rationale are covered by the root's separate checks/reviews, not inferred from these browser results. The known weak representations have been excluded from the main collection and labelled; the underlying scientific/visual defects are not declared repaired.

Test: `python3 checks/browser-curation-v77.py --out work/curation77/qa-final`. The second deep run passed 4/4 cases with explicit related-prefix and native `optgroup` localization assertions in `../qa-locale-final/report.json`; it also had stable runtime hashes and zero JavaScript/HTTP errors.

## Additional required widths

`qa-extra-widths/report.json` passed 10/10 smoke cases for 375, 414, 430, 1024 and 1920 px, each in light and dark themes, with stable runtime hashes and zero JavaScript/HTTP errors. Combined with the first run, the collection UI passed all nine required widths (320, 375, 390, 414, 430, 768, 1024, 1440, 1920 px): 18 smoke cases plus the four distinct deep cases. The four deep cases were also repeated with stricter native-label localization assertions. All three reports used the same runtime UI source hashes. The CLI now accepts `--widths` as comma-separated values and defaults to all nine widths.
