# Phase C — independent browser QA

PASS 12/12 contexts: damped, collision, refraction, lens, phasechange and lorentz at 390 and 1440 px. Three independently referenced numerical states each (36 states total). Chromium154.0.8037.57 headless, SwiftShader, Linux; emulated mobile viewport, not physical Safari/Android.

Actual parameter-number inputs and native time-slider events feed the application; recording uses the real Record action. Python reference arithmetic compares recorded raw table data and parses rendered Vietnamese table cells, including superscript scientific notation, within displayed precision. No application numerical helper supplies expected values.

Cases include underdamped extremes and undamped limit; approaching/post-impact/non-approaching collisions; normal incidence and TIR; real/virtual/infinite lens image; ice warming/melting plateau; positive/zero/negative Lorentz charge and µC/mg/µN conversion. Each context retains three rows through language change and model reset, executes a visible step action, confirms a rendered canvas and no document overflow. Final run: zero JavaScript errors and no failed contexts.

The time slider intentionally uses max/500 increments. An early harness requested t=0.5 s for a20 s range and received0.52 s; the final test references actual recorded input snapshots and logs requested versus actual values. This is not a solver defect. A12 s startup visibility wait was also replaced by attached-state waiting with30 s timeout; final12 contexts pass.

No runtime edits or reproducible application defect found in this sample. This is numerical/UI sampling of six scenes, not acceptance of all52 scenes, all 300 experiments, camera geometry at every parameter, physical touch gestures, or teacher/curriculum approval. Original thumbnails, equations and learner data were not modified.

Reusable optional harness: checks/browser-core-v73.py. Machine-readable evidence: report.json, requestedInputs/actualInputs/reference/recorded/displayedCells and twelve final model screenshots alongside it.

## Open P2 localization finding

Visual inspection of390-lens.png after switching to EN shows several remaining Vietnamese labels: “Khoảng cách ảnh”, “Chiều cao ảnh”, “Phát tia”, “Minh họa chậm” and “Nhập số”. Numerical values and recorded rows remain correct. This pre-existing bilingual-copy gap remains pending; the functional PASS above does not certify complete English translation.
