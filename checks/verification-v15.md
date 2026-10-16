# Orbital visual revision · 16/10/2026

## Changes

- Added `visual.css`: warm, light workspace, clearer editorial hierarchy, topic colors retained, larger model previews, consistent instrument panels.
- Replaced the blue introductory composition with a dark, gold-lit space scene. The three actual instruments remain selectable in the same banner.
- Three.js geometry and a custom accretion-disk shader; deterministic stars, orbit and silhouette. This is explicitly labeled artistic illustration, without physical measurements.
- Native inclination/separation slider, scene selection, pause, mouse/keyboard camera changes, reduced-motion preference, offscreen rendering suspension and resource cleanup.
- Canvas projects the same inclined geometry when WebGL is unavailable. Physics models, 300 catalog entries, audio files, saved lab state and existing tools are preserved.

## Local validation

- Existing `npm run check` passed all 300 routes and numerical parameter paths, 79 dynamic time-control cases and the data/session/analysis flows.
- `node checks/banner.mjs`: the retained three-instrument composition and its controller pass existing finite-geometry and framing checks.
- `node checks/cosmos.mjs`: 45 camera/pose cases across five viewport sizes; actual model vertices fit the camera; 714,054 finite Canvas drawing calls; pause, scene changes, keyboard alternatives and disposal pass.
- `visual.css` parses with CSSOM; responsive and reduced-motion rules are present. These are code contracts, not measured browser layouts.
- A standalone Canvas raster of the new scene was rendered and visually inspected. This validates that drawing path only, not the WebGL shader or the whole page.
- Eight scientific module hashes and all 301 existing audio hashes are checked by `checks/assets.mjs`.

## Limits

No live-browser pixel, touch-device, screen-reader, WebGL/GPU or speaker listening QA was performed for this revision. No local preview server or browser was installed. GitHub Actions reruns the revised checks before publishing.
