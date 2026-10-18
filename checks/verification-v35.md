# Quanh Lab v35

Implements the four supplied references: the exact Q/wave/paper-plane logo image is embedded in self-contained SVGs with a cropped viewBox, replacing the previous orbit mark. Manrope provides lighter body/page typography with full Vietnamese glyphs; experiment names are uppercase and bold. This approximates the supplied MatterMore typography and does not use its commercial FT Sterling font.

Catalog images have white backgrounds in CSS and both renderers, without the old colored grid/multiply overlay. Topic color appears in a tag. Timing/procedure captions are removed from cards; Open and Preview are distinct 44 px controls. Card actions align through flex layout, with compact mobile navigation. Thumbnails use 640×400 pixels.

Evidence: `checks/brand-style-v35.mjs` checks all 300 card/lesson names, tags, routes, preview/favorite actions, removed captions, original logo SHA-256, and packaged font/license. `checks/mobile.mjs` checks CSS at 320–1440 px, including white image surfaces and font weights. `checks/brand-font-v35.json` records local verification of 146 Vietnamese glyphs and font/logo digests. Scientific modules remain protected by the existing hash checks; the full check retains playback, recording, image upload and routing coverage.

The logo asset was rasterized and visually inspected. DOM/CSS/CPU checks are not browser screenshots or real phone testing; no browser or device rendering was verified in this revision. Uploaded source files were not modified.
