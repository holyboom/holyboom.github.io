# Geometry and contact review for faceless performance

Read-only review of the cinematic-camera baseline against `docs/FACELESS-PERFORMANCE-PLAN.th.md` and `docs/plans/faceless-performance.json`. This document records implementation guidance; it does not claim that the revised gestures have been implemented or perceptually validated.

## Shared action frames

The visible prop and the IK contact must use the same local-to-world transform and current performance progress. Keep static shape vertices cached in prop-local space; apply the current action frame when projecting them. Use the same frame to transform grip/support targets. Do not derive contacts from camera-adjusted screen positions.

| Activity | Concrete baseline mismatch | Minimum useful correction |
| --- | --- | --- |
| Drawing | Paper maps `(x,y)` to `[x, .62y-.04, 1.15-.45y]`. The old sketch stylus tip is approximately `[.53,-.09,.96]`; the paper at that world Y is at Z ≈1.186. The tip is about .226 model units away. | Define the stroke in paper-local coordinates. During writing, place the stylus tip exactly on that stroke, derive wrist/grip behind it, and keep the left supporting fingertips on the paper edge. Lift along the paper normal before and after writing. |
| Typing | Keys occupy the same vertical Z=.95 plane as the screen, at Y≈-.29 to -.37. Old palms are at Y=-.15, so they hover above them. | Give the keyboard a shallow physical support plane distinct from the screen. Transform both keys and fingertip targets through it. Show stylus release before the hands move to the keyboard. |
| Inspecting | Paper and pointer positions are independently authored. A wrist near the document is not a contact point. | Name a lower support grip and a separate inspection point. Keep the support hand fixed while the other hand slows near the relevant region, pauses, then withdraws. |
| Repair | A completed connector appears between fixed nodes while hands are independently posed elsewhere. | Left hand establishes a base grip first. Right hand approaches the shared join target on a shorter path than the failed attempt. Reveal the connector only after contact; retain it when the hands release. |
| Opening | The review illustration is a flat, cached document and lens rather than a movable layer. | Keep a base plane held by the left hand. Move one clearly bounded layer around a hinge/pivot driven by the right-hand contact frame. Keep the other layers still. |
| Offering | The interface can remain attached visually to the hand even after the intended release. | Separate placement from release: settle the interface onto a persistent support frame, relax the grip, and move the hand away. The interface then remains still while the character opens space. |

These corrections are compatible with the existing Canvas projection and the A woven material. They do not require a renderer migration.

## Painter order and light

- The baseline repaints every human strand above every filled prop. It improves visibility but can draw the torso or far arm through the work surface. Give relevant strands painter roles: background/body behind, work surface, contacting forearm/hand, emitter. Only the limbs that need to be in front should be repainted above the surface.
- Keep a small positive normal offset for the front contact surface, so a fingertip does not vanish exactly into a filled plane. The permitted offset should still satisfy the plan's contact-residual tolerance.
- The baseline has a small permanent `intent` scribble built from world-axis offsets beside the pen. It appears in unrelated activities. Hide/remove it outside drawing; derive the drawing mark from the actual paper-local stroke progress.
- The emitter should use the right-hand local frame, independently of the held object. A stylus, fragment and luminous symbol should not compete for the same grip.
- Project previous light-trail positions through the current camera, preserving the existing approach. Camera movement should not manufacture an unrelated light trail.

## Faceless readability and support

- Preserve a subtle chin/back-of-head asymmetry and orient the neck/head as one rigged unit. Remove expressive brows, mouth and nose strokes. If persistent strand topology is still required, disable dedicated facial strands instead of deleting arbitrary shared line IDs.
- Put fingers and thumb into a wrist-local frame. The baseline positions every finger in world axes, making a rotated palm retain the same apparent grip.
- Existing chair and table support opacity is multiplied by .10. These supports become almost invisible. Restore enough contour/seat visibility to read seated contact and the later rise, while preserving the purple woven material.
- Keep a fixed support region beneath planted feet. The large decorative woven field currently undulates independently beneath fixed feet; it should not make planted feet appear to sink or float. A few stable support curves near the contacts can preserve the broad A landscape without simulating cloth physics.

## Camera essentials from the approved plan

- Drawing: three-quarter elevated view containing the stylus tip, left support hand and emerging stroke. A head silhouette must not cover the contact.
- Typing: show the stylus rest and both hands moving onto the keyboard before tightening the shot.
- Resistance → reflection → repair: keep the same side of the action axis and stable work location; settle the camera while the hands communicate the changed method.
- Reflection: keep head, chest and both hands in one frame. A faceless-head close-up carries too little information.
- Sit/stand bridges and the rise: show seat, hips, feet and supporting hand until the weight transfer and release have completed. Only then move closer.
- Choice: the hand points beside the control, then withdraws; it must not look like it selects for the user.
- Opening/offer: the character moves out of the sight line and leaves room for the visible work and the visitor's implied space.

## Practical checks

1. Fixed camera, one-colour silhouette, captions and glow off: distinguish draw, type, inspect, interrupted reach, repair and open.
2. Sample contact entry, middle, release and the reverse direction. Compare world-space contact residuals, not only projected overlap.
3. Confirm fixed bone lengths and planted contacts across the sit/stand bridge breakdowns.
4. Inspect the same samples at mobile size, where overlapping hands and faint supports are more damaging than missing decorative strands.
5. Re-enable camera, semantic colour and hand light only after the contact and silhouette checks pass.
