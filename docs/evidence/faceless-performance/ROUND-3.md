# Refinement 3 — natural hands, usable small screens and efficient rendering

Started2026-11-14 21:48:38 UTC; finished22:19:01 UTC. Elapsed30m23s.

## Performance evidence

The cache-only change skips static cached anatomy/support points after the opening scene. It preserves strand IDs/metadata, all environment points and all opening source points. Live rig geometry is still generated at the same detail.

Fresh Node processes with explicit garbage collection measured retained heap after visiting all frame caches at102.58MB before and44.51MB after (56.6% less). Incremental frame-cache growth fell from93.85MB to35.78MB (61.9% less). The31-scene first-visit median improved from25.52ms to19.27ms at detail1 and19.56ms to13.38ms at detail2. Warm frame medians stayed essentially unchanged at8.56/8.55ms and4.68/4.70ms. This change benefits memory and first visits; it is not evidence of higher sustained FPS.

Reproduce with `node --expose-gc scripts/benchmark-profile-geometry.cjs --out /tmp/profile-geometry.json`. The before/after JSON records source hashes and measurement details. Browser diagnostics are separate and do not establish physical-device performance.

## Checks completed during this round

- Exact pre-change geometry parity before intentional acting refinements.
- Bounded wrist roll for visible open palms; finger-led typing with exact key contact.
- Exact optimized light-path sampling versus the full rig.
- Fade unused standing support while retaining physical support during the rises/sit.
- Keyboard focus clearance around sticky art; short landscape layout and zoom reflow.
- Complete Chromium/Firefox/WebKit regression, camera/performance suites, production build, public-profile regression and final actual-render review.

## Implemented refinements and final verification

- Typing now bends the index finger independently. The shared FK tip drives contact, with a0.020-unit hover path; measured wrist movement normal to the keys is0.00274 rather than the previous0.045-unit whole-hand motion. Left/right presses stay staggered.
- Welcome/invitation palms rotate modestly into view while retaining their world targets. The editor floats above/right of the keyboard, exposing both hands. The pen remains stationary and released at keyboard arrival, then fades with its rest over0.52–0.66 of the handoff.
- The visible palm rest stays through actual support release, then disappears from standing scenes. A dedicated first-rise envelope prevents early opacity loss.
- The emitter now uses a constant-point path. A mutation check proves the old bowed segment would leave a0.121997-unit phantom stroke; the final emitter has exactly0 extent. Directional afterimages remain separate.
- Reduced/short-screen layouts preserve the reading point. Returning to Full starts on the current scene. Keyboard outlines stay clear of sticky art; short landscape uses complete static artwork.
- The shared fast light evaluator exactly matches all6,001 full-pose emitters. The isolated pre-acting cache change preserved380 complete frame/illustration/camera/light records. Final fast trail median is0.504ms versus0.952ms before in the same Node benchmark method; retained all-frame-cache heap is44.56MB in the final build.
- Final production performance suite:69/69; camera suite:18/18; general profile:59/59 each in Chromium, Firefox and WebKit. Focused accessibility:27/27 each in those browsers. English/Thai/main-showcase regression:42/42. Production discovery:2,222 assertions; discovery-gate fixtures:26/26.
- Actual Canvas review covers all31 scenes at desktop/mobile/isolated-art sizes, semantic action phases, and forward/reverse native scroll recordings. The final point-only build receives its own capture manifest and source hashes.

The browser/Node measurements are local diagnostics, not a physical-device FPS claim. The200% accessibility case emulates its CSS layout viewport. Facial likeness, full screen-reader certification and universal emotion recognition are not claimed. No public deployment has been performed.

## Browser timing diagnostic

A single unthrottled headless Chromium traversal is retained in `round3-render-before.json` and `round3-render-after.json`. Mobile draw-cost median/P95 changed10.50/14.95ms→9.11/10.82ms. Desktop median/P95 changed11.04/20.04ms→12.92/16.40ms. These mixed, single-run results do not establish an overall FPS improvement; the strong optimization claims are the isolated cache-heap reduction and exact fast-light evaluation. Both builds adapt to detail2 in this diagnostic.
