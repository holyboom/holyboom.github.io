# Delivery build physical and rendered performance review

The production preview at `http://127.0.0.1:4174/profile/` passed **69/69 checks** on 2026-11-14. The four served runtime modules matched the source hashes; see `served-source-parity.json`. The complete tested-source hashes are also recorded in `results.json`.

This report supersedes the earlier `round-3-final` report after the stationary-emitter correction.

## What was verified

- 6,001 timeline poses retain fixed arm, leg and finger lengths, reachable hand goals, exact reverse/random-seek behavior and correct planted-foot targets.
- The fast emitter evaluator equals the complete pose emitter at every one of those 6,001 samples. This is an exact comparison, not a visual tolerance.
- Every vertex in the stationary emitter path equals that same light point after formation, across 124 rendered samples. An isolated in-memory substitution of the previous bowed-segment expression produces a 0.121997-unit phantom stroke and correctly fails the new assertion; the corrected expression has exactly zero error. See `emitter-regression-proof.json`. No runtime files were changed for that countercheck.
- 1,775 beat, phase and contact boundaries were probed on both sides. Maximum epsilon landmark displacement was 0.00003034 scene units; no discontinuity failures were found.
- 63 discovered contact intervals produced 171 acquisition, hold and release probes against actual painted work or visible support surfaces. The support table stays visible until the palm releases it.
- 401 pen ownership samples and 41 rendered handoff samples confirm docking before release, independent hand movement toward the keyboard, a rigid pen, actual finger pinch, and no collision with the painted keys. The pen remains visible when typing begins, then fades.
- In all three typing actions, index flexion contributes about 0.01725 units of local motion while wrist movement normal to the keyboard is about 0.00274 units. Left and right presses are staggered. Actual rendered index terminals meet the painted keyboard during each discovered press interval.
- The cache-only optimization was independently verified before intentional artwork changes: **380/380 canonical frame records exactly matched**. That immutable proof remains in `../round-3-initial-cache/frame-parity.json`; it is not a claim that subsequently revised artwork equals the older artwork.

## Production-browser observations

The desktop and phone captures show a distinct editor display above the keyboard. The hands remain on the keyboard plane; the stationary released pen is briefly visible beside the handoff. The final standing shots no longer retain an unused table while the active support moments still show their support.

Reviewed actual production captures include `live-1440-t2.58.png`, `live-390-t2.58.png`, `live-1440-t17.00.png` and `live-390-t16.48.png`. The full unretouched capture strips are `live-1440.html` and `live-390.html`.

Both viewport sizes retrace the pose and settled canvas pixels exactly after reversing through the pen release. Opening the depth disclosure changes the rendered image while front-work/pose drift is zero. Duplicate observers, content height changes, compact-width reflow, forward/reverse native scrolling, the Work anchor and closing the disclosure preserve the intended mapping. The two disclosed graphs expose nodes and connecting edges within the tested bounds.

## Interpretation limits

These results establish physical continuity, prop ownership, painted-contact alignment and browser reversibility. They do not establish that independent viewers can identify five emotions without text or color. The rise/sit checks validate support choreography rather than a force-based biomechanical simulation. Browser captures use emulated viewports, not physical devices. The actor remains deliberately stylized; a single intermediate rise still can read as a crouch without the surrounding motion.
