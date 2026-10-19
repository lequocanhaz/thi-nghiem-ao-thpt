# Quanh Lab v43 — full-run workspace correction

The reported car could move past a fixed 50 m axis and a fixed seven-unit rail. Increasing the distant studio floor and offering an overview button did not extend that apparatus. Earlier framing checks fitted a new camera independently at each sampled state; they could not prove that playback would stay visible from its starting view.

## Shared behavior for all 300 experiments

- Every normal laboratory model now has an additional work surface, at least 18 × 12 world units, that grows to cover its occupied X/Z extent. It does not change scientific geometry or measurements and is excluded from camera fitting. Hero/thumbnail renders keep their existing composition.
- The live scene checks projected bounds during playback and expands the camera when the apparatus reaches the viewing margin. It retains the union of observed bounds, so returning motion does not repeatedly shrink the view. This also handles seeking to a distant time. Playback safety remains active after manual zoom/rotation; paused detail views remain available. Starting playback restores automatic fitting.
- This logic is shared by WebGL and the software renderer. Geometry bounds cache position-buffer versions; animated geometry and instances still refresh their bounds.
- Normal model viewports are larger: desktop 60svh (400–800 px) and mobile 56svh (340–640 px). Presentation and fullscreen overrides remain intact.

## Physical apparatus and calibrated ranges

Uniform motion, constant acceleration and Newton rails/axes now cover the entire actual physical time interval, including a quadratic turning point and negative travel. Collision tracks include the collision instant, both trajectories and the scaled cart widths. Rail construction depends on parameters, not the current time, so the rail and coordinate range stay fixed during a run. An independent motion envelope reserves room for the carts and vector arrows from the start. The existing metres-to-scene mappings are preserved: 0.12, 0.06, 0.5 and 0.28 respectively. No position is wrapped or clamped to a drawing edge.

Example: uniform v = 20 m/s over the permitted 10 s gives x = 200 m. The rail and calibrated x-axis cover that journey instead of ending at 50 m. Newton's model still ends at |x| = 5 m, as specified by its physics.

Oscillator/damped tracks and spring anchors now allow the configured amplitude without the moving mass crossing its spring mount. Their calibrated axes expand with amplitude. The energy model's mast/guide and height axis extend to the configured release height. Travelling-wave amplitude and electric-position axes also cover their permitted values. The interference water surface and X/Z axes extend to the sources and probe positions.

The six preserved scientific modules and their checksums remain unchanged. The physical parameter domains, numerical results, playback durations, saved measurements, textbook reader and continuous black-hole banner are retained.

## Verification

- The full application check suite passes locally, with targeted spatial/interface/playback checks repeated after the last spatial refinements. GitHub's publication workflow runs the complete suite against the final commit before deployment.
- `checks/motion-space-v43.mjs` uses the actual scene update/model/camera methods. Across 300 experiments, three presets, 2D/3D and phone/desktop viewports, it runs 3,600 complete sampled processes and 61,200 playback states. Each sample must fit the live camera and lie over the expanded surface. It does not independently refit the camera at each sample.
- 50 experiments have sampled states outside their initial fixed camera; the live guard keeps them visible.
- 17,185 additional rail frames measure actual cart and rail mesh bounds at defaults, presets and individual parameter limits. The suite includes the reported kind of run, negative travel, reversal, collision, five viewports, exact coordinate-to-cart correspondence and a fixed starting camera throughout each rail journey.
- 518 configured-position/amplitude checks cover all 13 calibrated coordinate profiles. A probe at (12.5 m, 12.5 m) with 15 m source separation must remain over the expanded water mesh.
- 13,500 existing apparatus framing cases also pass. Actual iPhone hardware, iOS Safari and browser pixel layout were not tested: this managed environment has no required control-browser skill, so browser QA was skipped under the Sites workflow. All recorded visual-space results are CPU geometry, CSS/DOM or synthetic playback checks.
