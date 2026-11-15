# Deterministic performance rig

`assets/profile/motion.js` owns the symbolic maker's articulated performance. It samples scroll directly; it does not integrate velocity or retain playback state. Each integer timeline value is a readable scene endpoint. A destination's action occupies the preceding interval.

## Coordinates and physical model

World X is right, Y is up, and Z points toward the viewer. Arm segments are .39/.43 units, leg segments .47/.48, clavicle span .49, and hip span .31. Three articulated spine segments total .72 units. Analytic two-bone IK preserves limb lengths and uses explicit elbow/knee poles. Contact targets were placed inside the actual reach envelope; target clamping remains a diagnostic fallback.

The floor is Y −1.30; planted ankle joints sit .12 above it. The fixed chair cushion is Y −.74 at X −.48/Z −.12. Seated pelvis height is −.61. A fixed palm support at [−.35, −.10, .46] is separate from the animated body. `support.seatWeight` is a body-mass fraction, while `seatAmount` describes the seated stance. Foot contact weights are zero during explicitly authored swing phases.

## Exports and frames

Browser global: `ProfileMotion`. CommonJS: `require('./assets/profile/motion.js')`.

- `poseAt(timeline)` accepts values from 0 to 30.
- `lightAt(timeline)` evaluates the same right wrist/light path while omitting unused left-arm, leg, tool and stroke output. It uses no playback cache or accumulated state.
- `pose(indexOrName)` supports existing pose names.
- `restPose()` provides a stable standing bind pose.
- `setClips(data)` replaces optional secondary curves.
- `lengths` and `names` expose stable rig constants.

Returned landmarks include the existing head, hip, shoulder, elbows, wrists, knees and ankles, plus distinct clavicle and hip sockets. `frames.head/chest/pelvis/wristL/wristR/footL/footR` are orthonormal local frames. Wrist X crosses the palm, positive Y points out of the back of the hand, and Z points along the fingers. The palmar contact side is negative Y. Offering/cradling frames turn that side upward; support frames turn it toward their surface. Wrist rotations interpolate as quaternions. `ProfileHandShapes` rebuilds fixed-length finger phalanges from blended joint angles. `contacts.shape` is the same geometry consumed by the renderer; index-tip and palm-pad IK offsets come from that geometry.

`work` is the actual prop/contact plane, with unit U/V axes and dimensions. `work.keyboard` is a separate sloped plane. `contacts.left/right` contain world-space `target` and actual `tip`, local `gripOffset`, continuous `fingerCurl`, contact weight, semantic grip and space. `reach.requested` is the requested **wrist** world point, allowing independent reach checks without trusting rig metadata. `light` is attached to the fixed right-wrist local point [.015, −.035, .055] on the palm side.

`tool` exposes held amount, visibility, tip/shaft endpoints, ownership, a fixed drafting-surface dock and release/handoff windows. The right hand places and releases the same visible pen before typing. Its shaft passes between the rendered thumb and index finger; the dock wrist orientation aligns the same local shaft axis with the world-space rest without changing the world tip. The pen rests at the reachable top-right drafting margin, beyond the keyboard rectangle, and remains at its original world-space dock while the hand leaves and stays visible into typing, then fades over local progress .52–.66. It is fully visible when the hands arrive at .50, about 84% visible at the first sampled left press near .562 and 45% at the first sampled right press near .593. The wrist light is a separate emitter.

`drawing.points` and `drawing.strokes` are sampled from the same path as the right hand contact target, including a deliberate pen lift between the two strokes. They are not an unrelated effect.

## Acting and support sequence

The code editor floats above and to the right of the keyboard: its seated origin is [.18, .31, .40], its size is .82×.42, and its Y origin rises by .33 for standing scenes. The keyboard plane and hand targets remain fixed. This keeps the head, forearms, fingers and stationary pen rest visible without drawing hands through an opaque display.

Typing uses independent, staggered index flexion from the shared hand FK model. The contact offset is recomputed from the actual fingertip. A .020-unit key hover path and matching finger flexion keep wrist travel normal to the keyboard at about .00274 units.

The phase percentages follow `docs/plans/faceless-performance.json`, with an explicit tool-ownership bridge in drawing → typing: pen travel .10–.28, settle .28–.30, release .30–.36, hands to keyboard .36–.50, typing .50–.82 and response .82–.92. Early stand/read and stand/sit bridges occupy the plan's reserved domains. The major rise at timeline 16→17 places the left foot, then right foot, shifts the pelvis over them, and only then lifts off the chair. The feet remain anchored after landing. The retry ends with both hands released before preparation for rising.

Reflection is active inspection: the left palm supports a fragment, the right hand compares it as the actual card rotates once around the left grip, then both hold. Late in this hold, the head selects the next support point before the hands move. There is no generic chin-rest pose. In the final passage the maker withdraws from the control without pressing it, opens a palm beside the work, turns the invitation outward, returns inward to inspect, and offers the next possibility forward below the work. Unused arms settle beside the thigh. Welcome/invitation palm planes tilt modestly toward the authored view; their world-space targets remain fixed, so the visibility change does not extend the arms farther. Obstruction uses a real left-palm support; the right hand decelerates before the unsolved boundary.

The Blender source supplies bounded secondary curves for draw, repair and rise. The primary rig owns anatomy, work targets and support. Secondary hand offsets taper to zero before constrained contact. CommonJS and browser runtimes consume the same exported clips.

## Limits of automated evidence

Length, contact, reach, support, frame continuity and reverse-seek tests establish physical consistency. They do not establish emotional readability. That requires review of the rendered monochrome silhouette and the complete scene at desktop and mobile sizes.

The round 3 microbenchmark and exact sampler parity proof are recorded in `round3-metrics.json`. The light-only path is about 6.5× faster during drawing and 1.8–2.35× in the other measured intervals; these development-container measurements are not a mobile frame-rate guarantee.

## Final handoff continuity review

A source review of drawing → typing confirmed the shared choreography:

- Until local .36, the drafting frame stays fixed. The hand transports the stylus during .10–.28, settles it during .28–.30, then opens its fingers during .30–.36 while the stylus remains supported.
- Both the work-frame transformation and primary prop crossfade use .36–.50. During that interval the hands travel to the separate, fixed keyboard plane. They do not follow the editor upward/right.
- At .50, the hand models and FK index offsets exactly match the first typing-action sample. Eased, staggered cycles begin from there; the first left/right presses occur while the released pen is still visible.
- The dock remains in the original drafting frame. Its fade changes visibility only; it does not move the pen. The wrist emitter has separate ownership and continues with the right hand.
- All positions, grip parameters, prop transforms and ownership states are sampled directly from scroll. Reverse scrolling retraces the same placement/release path.

This final review reads the implementation and existing parity/contact evidence; it is not an additional independent test run.
