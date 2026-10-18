# v32 — responsive layout and 300 runnable activities

The page loads one stylesheet (`dist/app.css`) rather than six accumulated layers. Desktop parameters occupy a bounded sticky column; at 1100px and below they move after the apparatus in normal document flow. Header/navigation wrap, the model can shrink, charts and tables contain their own horizontal scrolling, and numeric inputs retain readable type sizes. Collapsed controls, presentation, focus mode, optional guidance, data expansion and the mobile assistant retain their existing state contracts.

All 300 activities expose play, pause, step, seek and replay. Existing 79 time/emission activities keep their model time. The 221 static-law activities use a validated controlled procedure: one independent input changes smoothly, dependent readings are evaluated from the existing scientific modules, and the apparatus responds. Their transport displays percent completion and identifies the controlled variable. This is a controlled experimental procedure, not a claim to have implemented 221 new time-dependent dynamics solvers.

The apparatus audit excludes coordinate aids, interaction rigs and text. It records actual visible geometry/material changes in all 300 activities, tests completion, reproducible seeking, loop and imported process validation, and runs 631 selectable-control cases to catch integer quantization restarting a process. Electric fields are rebuilt using the same semantics as the live renderer. Automatic camera fitting is suspended during playback to avoid continuous framing jumps.

Validation commands:

- `npm run check`: syntax/local assets, six unchanged scientific-module hashes, 301 unchanged audio hashes, 1,800 catalog/width CSS cases, responsive modes, chart grids, model labels, 300 apparatus playback activities, spatial views, controls, assistant/media contracts, full 300-route DOM interactions, editing interruption and process restore, and relay tests.
- `npm run check:models`: 9,776 numerical and geometry states across all 300 activities, including presets and parameter samples.
- `npm run check:framing`: 13,500 CPU projection cases across three aspect ratios and three camera views.
- `npm run check:audio`: packaged Vietnamese clip mappings and playback state/race/error handling.

Limits: CSS cascade and DOM tests do not measure rendered browser bounding boxes; CPU geometry/projection tests do not test WebGL/GPU pixels, real touch, iOS/Safari, or device audio. No browser/device screenshot test was available in this environment. Model and physical-domain warnings remain applicable at singular or excluded conditions.
