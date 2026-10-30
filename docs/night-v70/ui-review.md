# Independent UI/QA — neutral night theme v70

Final runtime browser verification: **8/8 contexts PASS**, widths 320, 390, 1440 and 1920 px × Vietnamese/English. Each context tests dark → light → dark with the same retained chat reply.

- Production-before evidence reproduces the unreadable light message surface in night mode. Minimum sampled contrast: 1.03:1.
- Final local sampled message, user bubble, context, attachment hint and KaTeX contrast: **6.10:1 minimum** across both themes. Inline error contrast also passes4.5:1.
- Long scientific reply with numbered steps and stacked KaTeX fraction remains readable and has no chat/page horizontal overflow.
- Failure keeps question draft; retry succeeds; close restores focus; no JavaScript errors in8contexts.
- Final exact night palette: body/chat #212121, user bubble #303030, page header #171717 (computed `rgb(23, 23, 23)`).
- Linked oscillation remains visible at all four widths after chat/theme interactions. No scientific model source was changed by this task; this UI check does not re-certify all300models.
- Found a header cascade specificity conflict during review; root fixed it. Full8context harness rerun after the fix passed.

Reusable script: `checks/browser-night-v70.py`. Full report and screenshots in this folder. Production-before report/screenshot in `work/night-v70/before/`.

AI transport is intercepted with fixtures: **no provider request or key used**. Chromium headless/SwiftShader with emulated widths; not physical iPhone/Safari/Android or OS virtual keyboard certification. Attachment upload and real backend inference are outside this harness.
