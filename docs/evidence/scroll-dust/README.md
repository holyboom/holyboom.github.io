# Scroll-bound disintegration — living-dust-v8

Selected background pieces dissolve into rounded grains and reassemble into the next woven form at nine narrative transitions. Stronger changes accompany drawing becoming code, entering solitude, and research becoming a distinctive skill. Smaller changes erode only the interior strands. The quiet chapter keeps the lower existing opacity.

Each filament splits into six fragments. Fragments shorten, curl through depth, then land back on the next form. Gathering transitions bend inward; other transitions disperse outward. The close drawing-to-code camera uses the visible right-hand background piece. The actor, active work, hand light and camera retain their previous geometry.

Everything derives from scroll position and stable seeds. Reverse scrolling retraces the breakup; stopping midway holds the suspended dust. There is no timer-based emitter, random spawning, bloom or new dependency. The largest transition uses 120 grains (60 on mobile). Particle strokes retain their desktop optical width on phones; ordinary prop strokes keep their existing mobile reduction. All 31 settled beats and the static SVGs remain intact.

## Evidence

- Build: 2,222 assertions passed, with no public deployment.
- Syntax checks passed.
- Final profile browser suite: 59 checks passed (`final-profile/results.json`).
- Camera suite: 18 checks passed (`camera/results.json`).
- [Final numerical QA](../ambient-dust/qa-final/results.json): all 17 checks passed across 421 timeline samples, including exact pre-change actor/work/camera/light parity, reverse and shuffled sampling, finite geometry, particle budgets, clear endpoints and sampled continuity.
- [Final browser capture manifest](../ambient-dust/final/manifest.json): 28 stills and eight native forward/reverse sweeps, zero browser errors, hashes captured from the served script responses.
- [Final mobile optical-size review](../ambient-dust/mobile-final/manifest.json): focused 390px breakup/cloud/reassembly captures and forward/reverse traversal after retaining particle stroke width, zero browser errors. The geometry is unchanged from the 17-check numerical run.
- [Motion preview](../ambient-dust/final/dust-forward-reverse.webm).
- [Drawing-to-code sequence](../ambient-dust/final/transition-03.png) and [research-to-skill sequence](../ambient-dust/final/transition-20.png).

`npm run test:profile-dust` runs the repeatable dust regression contracts. Optional `DUST_BASELINE=/path/to/previous-geometry.cjs` adds exact historical parity checks; without it those five checks are explicitly reported as skipped. The final evidence above used the pre-change snapshot.

Preview is local; the public GitHub Pages site was not changed by this work. Browser checks use headless Chromium and viewport simulation, not physical-device performance measurements.
