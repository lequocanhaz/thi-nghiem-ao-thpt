# Quanh Lab v41 — expanded workspace and direct page turning

The simulation studio is 180 world units wide, up from 18; its floor is 350 instead of 35. Grid spacing stays unchanged. Camera travel and minimum orthographic zoom permit a tenfold wider view. Every lab has “Không gian ×10”, “Vừa mô hình” and accessible zoom buttons. The overview changes only the view; physical inputs and equations remain intact. The grid centers on the current apparatus and grows further when its bounds exceed the studio.

Horizontal and angled projectile axes now cover the entire flight range and peak height, including the reported 31.55 m / 29.26 m/s state and maximum permitted inputs. Unit-to-world mappings are unchanged. Axis extents are independent of playback time, so they do not jump during a flight.

All three textbook readers accept dragging with touch, pen or mouse. The page follows horizontal movement before release; a sufficient pull or flick commits the turn and a short pull snaps back. Vertical intent yields to scrolling. A second pointer, cancellation, rotation or route change abandons the turn. Zoomed pages pan without turning, including native browser pinch zoom detected through VisualViewport. Pointer Events have a Touch Events fallback. Covers and final pages stop at their boundaries. Failed target images retain the last readable page and offer retry. Reduced motion preserves navigation without 3D animation. Mobile reader buttons have 44 px width, with safe-area padding for focus mode.

## Verification

- `npm run check`: complete application suite, including all 300 routes/playback activities and 631 selectable controls.
- `checks/framing.mjs`: 13,500 default/preset/time/view camera cases across 300 activities.
- `checks/space-v41.mjs`: 9,000 camera projections across all 300 activities at 15 portrait/landscape phone viewports; another 390 flight camera/overview cases and 1,313 trajectory samples, including the attached screenshot’s parameters and domain limits.
- `checks/mobile.mjs`: 6,600 CSS cascade/DOM cases across all 300 activities at 22 widths from 320 to 1440 px, including common iPhone portrait and landscape widths.
- `checks/touch-books-v41.mjs`: shipped Pointer/Touch event handlers and actual reader DOM/image lifecycle; finger-following progress, forward/back, snap-back, vertical scrolling, multitouch, cancellation, zoom gating, all three grades, boundary pages, landscape spreads, orientation cancellation, reduced motion and failed-image retry.
- `checks/books.mjs`: all 388 page files and 1,552 navigation cases, reaching every page in single/two-page modes.

These are CPU, file, CSS cascade and synthetic DOM/event checks. They do not constitute browser pixel layout, real iPhone touch, WebKit or iOS Safari tests. The managed environment sets `SITES_MANAGED_LINUX_CONTAINER=1`; the Sites workflow requires `$control-browser` for browser QA, and that skill/capability is unavailable. No preview server, substitute browser automation or new browser screenshot was used. Historical v40/v37 browser evidence remains explicitly historical.

Runtime cache versions are v41 for changed entrypoints and modules, with the reader entrypoint v42 for the native pinch-zoom follow-up. Stable textbook data/images and physics modules retain their existing versions. Deployment is through the existing GitHub Pages workflow.
