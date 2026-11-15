# Refinement 1 — faceless geometry and visible contact

Reviewed the integrated runtime and the captures in `integration-review/`, especially the drawing action, reflection action, and resistance hold. No runtime files were changed. The parameters below are proposed starting values in the existing model's units, not general anatomical standards.

## What now reads

The head is blank, the body is recognizable, both arms have distinct jobs, the paper and lesson have clear silhouettes, and the drawing stroke corresponds to the work surface. The remaining strongest distractions are thin hanging fingers, almost invisible furniture, residual floating interfaces, and the lack of a stable visual ground beneath the seated feet. The proposed removal of obsolete UI and addition of a chair back/ground patch address real issues in the captures.

## First priority: make the visible contact equal the rig contact

The rig currently solves a virtual contact at `wrist + frame × gripOffset`. This is valuable and should remain the invariant. However, rendered fingertips often end near local Z=.14–.16 and Y=-.04…-.06, whereas the rig's contact offsets for type/hold/default are around Z=.095/.09/.105 and Y=0. A perfect solver residual therefore does not yet mean the visible finger touches the object.

The world-space target must remain unchanged. If needed, derive a new wrist-local offset from the selected visible contact feature, subtract it from the world target and re-solve the fixed-length arm. Do not move the object or target to hide the gap in one camera view.

| Contact | Visible feature to constrain | Orientation |
| --- | --- | --- |
| Write | Stylus tip at the stroke; thumb/index grip the shaft | Wrist aligned to the tool grip; other fingers relax alongside |
| Type | One selected index/middle fingertip at the key | Palm floats above keyboard; fingers flex toward it |
| Point | Index fingertip, with other fingers gently flexed | Index points toward the target; not all four fingertips together |
| Brace | Palm pad/heel on the fixed support | Palm normal agrees with surface normal; fingers run tangent to the surface |
| Hold/support | Named thumb/finger pads around an edge | Thumb is on one side, supporting fingertips on the other; no uniform penetration into the plane |
| Open/invite | No active contact | Palm turns partly upward and toward the available space, with relaxed asymmetric fingers |

`wristFor()` currently treats point, brace and hold similarly, with finger direction approximately into the work normal. That is suitable for a pointing fingertip but produces an edge-on/claw-like supporting hand. Separating those orientations will help more than only reducing the curl amount.

## Soft hand geometry starting values

- Keep palm width near .095–.105. A palm ellipsoid around radii `[.048, .020, .058]` and centre `[0,0,.035]` is a useful slimmer starting point than the current `.027` thickness and `.072` long radius.
- Centre the four finger roots rather than shifting the whole fan to one side. Try X positions `[-.034,-.011,.012,.033]` with a shallow knuckle arch in Z, around `[.073,.079,.076,.066]`.
- Distinguish finger lengths: approximate index/middle/ring/little lengths `.070/.078/.073/.056`. The current implementation gives middle and ring the same length, and index and little the same length, which reads as repeated prongs.
- If using three anatomical sections, start with length fractions `.46/.32/.22`. Increase flexion progressively through the joints; do not make the last section turn abruptly back toward the wrist.
- Use mild flexion for an open hand (roughly .08–.16 radians at the base), moderate relaxed flexion (.22–.36), and task-specific closure for a grip. A gripping index/thumb pair should close toward its held object; the remaining fingers should not all receive identical curl.
- Keep the thumb shorter and visibly opposed. It should originate beside the palm and sweep across toward the index for a pinch; it should not become a fifth parallel finger.
- Use a softer paired outline that joins at the fingertip, or a small rounded capsule contour. Avoid two separate long lines terminating as spikes. Thin the finger centre/outline from 1.05 toward .65–.8 pixels at the current rendering scale. Keep one slightly stronger outline for the active contact finger.
- Preserve finger geometry and contact offsets as a matched pair. Any change to the active tip must be reflected in the offset used by the arm solve, otherwise apparent contact regresses despite passing virtual-marker tests.

## Seat, floor and furniture

- The rig's ankle Y=-1.18 and current shoe lower extent of -.12 already match floorY=-1.30 when planted. Retain that relationship. Do not lift the floor patch to meet the visible toe while leaving the heel contact wrong.
- The seated pelvis is lower than its visible seat contact suggests: hip Y≈-.61, rendered pelvis centre offset -.05 and radius .145 give a bottom around -.805, while the seat is at -.74. This is approximately .065 of visible penetration. Prefer tuning the lower pelvis envelope instead of moving the fixed rig or the seat. For example, a lower pelvic surface ending near hipY-.13 would match the seat at a neutral seated pose; recheck under lean.
- A low chair back is sufficient. Place it behind the pelvis, near seatZ-.23…-.27, with two side uprights and a few rounded transverse fibers; top height roughly seatY+.60…+.70. It should frame the torso rather than trace through it.
- Keep chair legs terminating at the same floorY. The added ground patch should remain fixed through seated drama and rise, while the larger A membrane can vary outside it.
- Blend the ornamental terrain away from the foot/seat support region so the undulating surface cannot visibly pass through the planted ankles. A stable softly bounded woven patch is enough; a separate floor simulation is unnecessary.

## Faceless attention

The current blank head is appropriate. It still needs a reliable forward direction at small sizes. Keep the subtle lower-face/chin taper and a slightly fuller upper occiput. Replace the abrupt `y < -.35` chin offset with a smooth blend so the silhouette does not gain a small ledge.

A small chin shift around .018–.025 is enough at the current head radius of .19–.25. Avoid adding nose/eye substitutes. The readable signal should come from the entire head frame, neck and chest angle, with the head leading purposeful turns and the arm leading the interrupted reach. Keep both hands and the work visible whenever head direction alone would be ambiguous.

## Constraints to retain during this refinement

1. Fixed arm/leg lengths and stable pole directions.
2. World-space contact targets and the approved contact residual tolerance.
3. Contact entry, hold and release use the same phase progress as the prop.
4. Feet and seat stay fixed while they bear weight; decorative ground does not redefine support.
5. Wrist-local frames remain orthonormal and vary continuously.
6. Forward and reverse scroll at the same progress reconstruct the same pose, grip, target and prop transform.
7. Support or release cannot be concealed by a close camera: show the seat, hips, supporting palm and feet during the rise.

## Recommended next visual sample

Repeat the same integration captures after the finger and support changes, first with fixed camera and monochrome material. Check the drawing stylus grip, left supporting hand, typing fingertips, reflection's two-hand separation, and the rise at contact/release. Compare actual rendered tip/palm points against the rig targets, not only the invisible marker. Then restore the semantic colours and light trail.

## Write-pinch measurement during Round 1

Measured the real three-segment thumb/index curves against the held stylus centreline in wrist-local coordinates. The baseline uses tooltip `[.015,-.025,.15]`, normalized shaft direction `[-.015,.10,-.175]` and length `.202`.

| Shape | Baseline nearest distance | Coordinated candidate distance |
| --- | ---: | ---: |
| Thumb | .051408 | .003489 |
| Index | .041780 | .005583 |

The candidate keeps the FK finger shapes and phalange lengths unchanged. It changes the local tooltip offset to `[-.020,-.025,.150]` and shaft direction to `normalize([-.001,-.007,-.081])`, keeping shaft length `.202`. The thumb's tip radius is `.0045`; the index radius at its closest point is approximately `.00586`. Both then meet the same physical shaft, on opposite X sides, within their envelopes. The visible pencil no longer passes above both fingers.

The world-space drawing tip remains the invariant: changing the local tool offset requires the arm IK to solve a new wrist position. The motion owner must update the held shaft axis and docking wrist/offset coherently. These measurements are a candidate review, not a claim that the coordinated runtime update has already been applied.

### Coordinated implementation status

The root authorized and applied the candidate during the Round 1 source freeze exception. `hand-shapes.js` now uses the shifted write tooltip offset (mirrored for the left hand). The motion owner reports the matching shaft axis, a docking frame that maps that axis exactly onto the paper tangent, unchanged world-space drawing targets, no reach violations, and dock/release boundary jumps below 4.6×10⁻¹⁶. All 8×8 hand-preset blends at 11 positions on both hands were rechecked: phalange-length error stayed below 1.74×10⁻¹⁷ and type/point contacts still equal their visible index fingertips. A rebuilt close visual capture remains the appropriate independent check of the rendered pinch.
