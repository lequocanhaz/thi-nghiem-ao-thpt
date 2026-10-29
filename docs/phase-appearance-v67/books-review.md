# Independent book release review — PR43

Verdict: PASS for the post-review appearance and locale fixes. No release blocker found in the reviewed book flows.

- Linux headless Chromium 154.0.8037.57: 12/12 scenarios (390×844 and 1440×900, light/dark, grades10/11/12).
- Shelf→reader, grade dropdown, lesson contents, zoom125%, VI↔EN and light↔dark passed. Page, grade, zoom, TOC options/value, URL, stored position, image sources and image nodes remain unchanged across locale/theme changes.
- Day/Night button text and aria-label update immediately in VI and EN, without a theme click or reload.
- Corrected dark contrast: active Textbooks navigation10.659:1; wordmark13.9507:1; File page label13.9507:1; Day mode button12.6146:1. Minimum across measured selectors in both themes6.392:1.
- No document horizontal overflow or JavaScript page errors. Runtime file hashes unchanged during run.
- Visually inspected mobile grade10 EN dark and desktop grade12 EN dark screenshots; original scan palette preserved.
- Node checks books.mjs, book-english-v58.mjs and book-capture-v59.mjs PASS:388 scans,85 English lesson titles,15 chapters, single/double-page destinations and pointer capture contract retained.

Minor inherited locale observation (non-blocking for appearance release): the header experiments link still displays “Thí nghiệm ▤” in EN. Current change does not modify book-language mappings. Original book scans are intentionally Vietnamese, explicitly disclosed in EN.

Limitations: simulated viewport Chromium only; no real iPhone/Safari/Android, hardware touch, screen reader or full WCAG certification. This focused pass did not load every scan or navigate every lesson. No runtime edit, commit or deployment by this reviewer.

Evidence: Local review artifacts are in work/release43-books-final/; the follow-up after body tokens is recorded in books-final-review.md.
