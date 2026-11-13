# Thermal 3D UI review — 13 November 2026

Owned source: `dist/l3/thermal-three.js` and `thermal-three.css` only. Controller, scientific state, registry, storage, mode buttons and fallback integration belong to the root agent. Relevant AGENTS/HANDOFF and frontend-design/runtime/webapp-testing skills were read.

Implemented a real Three.js scene using existing self-hosted vendor modules: bench and racks, open calorimeter, actual liquid meshes, clipped horizontal cup free surface under gravity, cup spout/rotation gizmo, ice, solid, tongs, probe with LCD, balance and bath. Lighting, shadows, perspective camera, OrbitControls, mesh raycasting, pointer capture and drag on the vertical canonical apparatus plane are active. State updates alter geometry and instrument displays, rather than returning equilibrium answers.

Canonical mapping: worldX=(x−400)/1000, worldY=(348−y)/1000, z=0. The apparatus has real depth; scientific manipulation remains on the declared vertical plane. Probe origin is its actual tip; stirrer tip is canonical+10; cup local spout(.055,.05) rotated by−angle exactly matches the shared controller spout. Water level uses model volume/capacity fraction. Mesh dimensions are amplified for interaction and are not calibrated SI measurement geometry, CFD or full collision/6DOF simulation. Root documents this distinction.

Browser evidence is actual local routes in Chromium with ANGLE/SwiftShader software WebGL, not a physical phone/Safari or GPU-performance claim. `preview.py` and `preview.jsonl` cover1440A lightVI,1440B darkEN,320A lightEN,390B darkVI. All four have no page JS error or document overflow; A48visible meshes/9644triangles/97draw calls; B58meshes/12080triangles/118draw calls. Labels were visually checked against screenshots, including mobile after fixing initial FOV/aspect fit that had clipped the right balance.

`water.py`, `water.json`, `water-probe-1440.png`: native3D raycast cup drag120,130→410,130, external angle60°, model transferred0.2kg; cup returned to its rack; native3D probe drag to410,315; model reports water placement and27.869°C lagged probe reading after stepping. The HTML instrument readouts remain available independently of small mesh LCDs on mobile.

Initial gizmo center-hole picking could select the calorimeter behind the torus. The final picker keeps actual chosen mesh hits primary, then gives the selected visible gizmo and selected thin tool a22.5CSS-pixel center allowance before background mesh hits. QA is independently rerunning native center-gizmo A/B, orbit/touch, cancellation and no-WebGL/context-loss fallback. Final source frozen after these fixes; no claim that the first raw QA run passed.

Renderer is demand-driven (no idle animation loop), resize-aware, adapts auto-fit before manual camera movement, and updates readonly projected DOM anchors on scroll without GPU redraw. Cleanup disconnects observers/listeners, disposes geometries/materials/textures/OrbitControls/renderer, explicitly loses the private WebGL context, and marks a detached canvas as disposed. No physics/controller globals are exposed; DOM `data-projections` and `data-stats` are readonly front-end evidence for native-pointer browser testing.

Source syntax check passed. Root performs required full npm/independent QA/release checks; this UI task did not publish or run the full catalog test suite.
