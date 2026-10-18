# Quanh Lab v33

User story: visitors recognize Quanh Lab, find an experiment in a clearer catalog, run/record it with fewer visible tools, and ask Trợ lý AI about text or uploaded images.

## Changes

- Original Q/orbit SVG mark, outlined Inter wordmark, favicon and shared header/footer/assistant identity.
- Indigo/lime accents, rounded navigation, split desktop banner/class-entry layout, new experiment cards, filters, control surfaces and assistant. Responsive layout retains inline mobile parameters and contained chart/table scrolling.
- Export report, A/B comparison, variable sweep and camera-view menus removed from rendered controls for all 300 activities. Old saved A/B overlays no longer appear automatically.
- Images: two per turn, local raster decoding/JPEG preparation to at most 2000px and bounded payloads, thumbnail/remove/enlarged view, image-only messages, bounded image follow-up history, paste/drop/photo-picker change events. Drafts and photos stay with the correct experiment on route changes, cancellation and request failure.

## Evidence

- `checks/chat-images-v33.mjs`: bounds, aspect ratio, JPEG preparation, object-URL cleanup, image payloads and follow-ups, preview/removal, enlarged view, send failures, cancellation, route changes and asynchronous image preparation; real DOM paste/drop/change listeners; removed tools checked across all 300 experiment markups.
- `checks/vision-live-v33.json`: real public endpoint returned HTTP 200 and correctly read “Q33” on blue from a synthetic PNG. One successful live image request verifies that boundary; it does not validate arbitrary physics/image reasoning.
- `npm run check`: complete existing catalog/playback, CSS/DOM, audio hashes, formula hashes, assistant and server contracts, including new image tests.

## Limits

The logo was rasterized and visually inspected. Website checks use DOM, CSS cascade and CPU geometry; they do not substitute for browser screenshots, a real iOS photo picker, real canvas decoding, touch hardware, GPU rendering or device audio. The server remains the existing configured endpoint; no credentials or backend configuration were changed.
