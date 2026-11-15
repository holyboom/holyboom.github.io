# Locked orbit QA and visual review

Final recommendation: retain the current implementation. The camera travels around the character while keeping distance, pivot, and pitch fixed during each lock. Side and rear views remain legible on desktop and mobile. No remaining visual blocker was found after correcting disclosure nodes that initially crossed the faceless head.

## Independent checks

[Final results](final/results.json): **42 checks passed**, zero browser errors, against `living-orbits-v9`.

Coverage includes fixed lock invariants, genuine azimuth travel, reverse/shuffled sampling, entry/hold/return/exit continuity, native scroll jumps and forward/reverse traversal, cursor-parallax suppression, actor/hand/foreground framing, finite projection and near-plane clearance, light/trail alignment, dust coexistence, disclosure, and reduced motion.

The camera-track inverse uses the public linear `cameraTrack` API rather than the eased acting timeline. The framing/near-plane review samples 442,584 core projected points across four viewport geometries. An independent disclosure regression checks 372 node centers against the actual projected head bounds, padded by 6% of head height, through the full experience-depth lock. It reports zero overlaps.

| Orbit | Desktop peak yaw | Mobile peak yaw | Locked distance |
| --- | ---: | ---: | ---: |
| Drawing side | 61.9° | 57.3° | 6.10 |
| Conviction rear | 134.6° | 120.3° | 6.90 |
| Synthesis side | −61.9° | −57.3° | 6.40 |
| Experience depth | 60.2° | 56.1° | 6.55 |

The rear orbit crosses the side view in both directions. Compact mode retains a true rear hemisphere rather than reducing it to a small front-facing tilt.

## Visual evidence

[Phase/video manifest](visual/manifest.json) records 25 stills and eight native forward/reverse sweeps, with 232 sampled camera states and zero browser errors. All four phase sheets and all eight sequential motion strips were inspected. The acting, held work, and hand-light trails stay coherent through camera travel. Synthesis dust remains peripheral and visible.

The disclosure-open side view initially placed two network nodes across the head. The final adjustment shifts only revealed layers beside and below the interface. Both current open views were inspected: the head stays blank, rear layers remain visible, and the foreground interaction stays in place.

- [Final desktop disclosure](final/desktop-experience-depth-open.png)
- [Final mobile disclosure](final/mobile-experience-depth-open.png)
- [Drawing phases](visual/phases-drawing-side.png)
- [Rear-view phases](visual/phases-conviction-rear.png)
- [Synthesis phases](visual/phases-synthesis-side.png)
- [Experience phases](visual/phases-experience-depth.png)
- [Desktop synthesis dust](visual/desktop-synthesis-dust.png)
- [Mobile synthesis dust](visual/mobile-synthesis-dust.png)
- [All four forward/reverse orbit recordings](visual/orbits-forward-reverse.webm)

The main recording and phase captures precede the final disclosure-only fan adjustment. The current suite and final open screenshots cover that correction; the earlier open screenshots in `visual/` are superseded. The eight current desktop/mobile peak images are also in `final/`.

## Source identity and scope

Current served response hashes match the tested files:

| File | SHA-256 prefix |
| --- | --- |
| geometry.js | `a4a015abc475` |
| living.js | `843cc68131e9` |
| scenes.js | `f4c53ce51a87` |
| motion.js | `3ccaf993eada` |
| hand-shapes.js | `1b86fd8cc05b` |

Full hashes are retained in the results. The browser disclosure check uses the native details `open` property to preserve the camera position; it does not claim a pointer click on an off-screen mobile control. Motion recordings were reviewed through sequential video frames. Pilot-to-pilot jumps are capture navigation; each individual forward/reverse traversal uses native scrolling. This is headless browser evidence, not a physical-device frame-rate measurement.
