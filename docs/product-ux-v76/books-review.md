# Books UX v76 — implementation and independent reader review

Only runtime file owned by this task: `dist/books-ux-v76.css`. Parent owns entry inclusion. No reader JavaScript, book copy/catalog/scans, storage or page-turning behavior was changed.

## Concrete improvements

- Mobile book selection uses compact cover/metadata rows: all three grade choices are visible together. Actual shelf height is489px at320 and550px at390, compared with the preceding full-cover mobile list around1800px. Original cover images remain unfiltered.
- Desktop covers and headings use a calmer scale; card hover uses border feedback and keyboard focus is explicit. Existing entire-card links remain intact.
- Reader page controls and zoom controls are clearly grouped with44px controls. Selected grade remains visible at320px after widening its column to112px. The change-book link has44px height. Disabled navigation follows the selected theme instead of the legacy white disabled surface.
- Reader toolbar remains in its own surface with a sticky positioning rule for outer-scroll contexts; no overlays or extra floating controls were added. This is a presentation-only change.

## Verification

Final stable stylesheet SHA is in `report.json`.

-8/8 contexts PASS:320/390/768/1440 × light/dark. Each context opened all three grades, moved to page39 and zoom125%, changed VI/EN and theme, verified page/zoom/chapter/URL/image-source preservation, then tested fullscreen.24 grade-reading flows total. All visible toolbar controls have≥44px height; no horizontal overflow or JavaScript errors.
-2/2 actual error→retry/fullscreen cases PASS:390/1440 dark. Aborted grade11 image requests trigger existing inline error; retry loads the original image after network restoration. Loading contrast11.17:1, error9.06:1; original page image `filter:none`.
-`npm run check:books` PASS, including388 original pages and85 lesson navigation records through the existing checks.

Source stability is true in both reports. Earlier images captured during refinement are superseded by the final files named `shelf-*`, `reader-*` and `fullscreen-*`; final8-context matrix was rerun after the320px grade and disabled-state corrections.

This is Chromium viewport emulation. It does not certify physical iPhone/Safari/Android, OS virtual keyboards, full WCAG conformance or translated source pages. Original textbook pages remain Vietnamese.
