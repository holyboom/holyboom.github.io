# Locked camera orbits — living-orbits-v9

Four scroll-driven windows keep distance, pitch, focal length and pivot fixed while yaw turns, holds and returns. Each blends into and out of the existing camera without intercepting native scrolling. Fine-pointer parallax is suppressed during the lock; reverse scrolling retraces the same geometry.

| Moment | Emotional purpose | Desktop / mobile peak |
| --- | --- | --- |
| Drawing becomes code | Observe the hands from beside the work | +62° / +57° |
| Conviction and resistance | Move behind the solitary maker and ember | +135° / +120° |
| Research becomes a skill | Watch knowledge gather from the opposite side | −62° / −57° |
| The depth behind AI experiences | See the interface and its disclosed layers separately | +60° / +56° |

Dust, hand-light trails, the woven environment and body performance retain their existing timeline. Revealed rear graphs now fan sideways and downward during the experience-depth orbit, keeping nodes off the faceless head. The interaction plane and actor remain unchanged. The Canvas and SVG painters use bounded camera-space plane distances, preserving contact occlusion through edge-on views without the previous ray-plane singularity. Front-facing labels fade when viewed from behind; native captions remain readable.

## Review and validation

- [Current orbit checks](final/results.json): 42/42 passed, including fixed-pivot locks, true side/rear angles on both viewports, exact reverse/shuffled sampling, pointer suppression, native scroll, reduced motion, dust/disclosure integration and 372 projected rear-node/head clearance checks.
- [Painter checks](painter.json): 5/5 passed across 160 views and 2.57 million points; Canvas/SVG depth keys match exactly, front contact signs are preserved, and sorting stays finite across side/rear views.
- [Profile checks](profile/results.json): 59 passed. [Camera checks](camera/results.json): 18 passed. [Performance checks](performance/results.json): 69 passed. These suites preceded the final rear-graph fan adjustment; the final orbit suite covers that adjustment directly.
- [Geometry parity](geometry-parity.json): 81 positions preserve the actor, primary work, dust and light trajectory. Closed orbit output is identical before/after the final disclosure adjustment.
- [Front-view comparison](front-comparison.json): five untouched frontal compositions have less than 0.001 mean channel difference after the painter fix, with no pixels differing by more than 16/255.
- Build: 2,222 assertions passed. Syntax and whitespace checks passed. Current runtime files match the built preview.

[Visual review](QA-REVIEW.md) · [Four-orbit forward/reverse video](visual/orbits-forward-reverse.webm) · [Rear-angle phase sheet](visual/phases-conviction-rear.png) · [Final disclosed layers](final/desktop-experience-depth-open.png)

The phase/video captures precede only the final disclosure fan adjustment and remain representative of the unchanged closed-orbit output. The `final` captures and tests use the final source. Browser checks use headless Chromium and desktop/mobile viewports, not physical-device performance measurements.

Preview updated locally at http://127.0.0.1:4174/profile/. No public deployment, push or merge was performed for this change.
