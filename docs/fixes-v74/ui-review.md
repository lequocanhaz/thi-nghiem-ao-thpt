# Optics labels v74 — author verification

Changed only exact translation pairs in `dist/language-ui.js`. Added missing `Khoảng cách ảnh`, `Chiều cao ảnh`, `Phát tia`, `Minh họa chậm`, and full arrow action `Nhập số ↗`. Existing plain `Nhập số` was insufficient because the translator uses exact trimmed strings. Added the associated direct-control accessible names and experiment-time label. No substring/unit replacement or observer broadening.

`checks/language-optics-v74.mjs` passes exact pairs, preserved whitespace, no translation of user prose, locale roundtrip, dynamic label insertion, original input precision, canvas/row identity and blocked user notes/AI/math content. Existing locale-mutations, english-ui-voice and language-pill checks pass.

Actual Chromium matrix: four contexts (390/1440 px × light/dark), VI→EN→VI→EN, real parameter edits/recording, retained row and student prediction, numeric-input focus, step refresh and reload. All pass with zero page errors. Root's targeted app clock synchronization was necessary: the visible label initially translated while `aria-valuetext` retained Vietnamese until the next model refresh. Final two dark contexts additionally assert the accessible slider NAME and VALUE immediately and after step/parameter changes. Both pass. Those targeted app changes were made by the lead, not this agent.

Evidence: `matrix4-report.json`, `final-name-refresh/report.json`, and stage screenshots in `final-name-refresh/`. The screenshots were visually inspected.

Remaining observations outside the five-label scope: the coordinate orientation legend can still be Vietnamese in EN; the observation plot card has a white outer frame in dark mode and a low-contrast analytic-prediction legend. These are not represented as fixed or as full EN/theme acceptance.

Chromium viewport emulation is not physical Safari/iPhone/Android testing. No AI inference, account sign-in or secret access was used.
