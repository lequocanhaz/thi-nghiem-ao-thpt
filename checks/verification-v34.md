# Quanh Lab v34

The graph now uses its measured container dimensions instead of a 520 px minimum width. Tick density responds to the available space; long axis titles wrap and the y title moves above narrow plots. Layout resizing and reopening a collapsed chart rebuild the SVG. Domains and physical models are unchanged.

An open assistant follows lab → library/source routes immediately. The header names the active context; drafts and images remain separate per context. Late errors identify the previous activity. Touch users can read the conversation without opening the keyboard automatically; desktop retains input focus. Short viewports use a compact composer/header, and affected icon targets are at least 44 px.

Evidence: `checks/ui-v34.mjs` covers 3,600 graph configurations across all 300 activities (220–900 px wide, 260/380 px high), preserving domains, titles, finite geometry and in-bounds tick anchors. It also covers touch/desktop focus, draft/context isolation and late errors. `checks/dom.mjs` exercises actual routing and measured-width SVG updates; `checks/mobile.mjs` adds the 320 px breakpoint. Existing playback, photo upload, scientific hashes and server tests remain in the full check.

Verification limit: DOM, CSS cascade and numerical geometry are not browser pixels, operating-system photo selection or touch-device tests. No browser or real phone was used in this revision. The previously verified image endpoint and backend configuration are unchanged.
