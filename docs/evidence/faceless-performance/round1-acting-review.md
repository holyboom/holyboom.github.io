# Round 1 — independent faceless acting review

Reviewed 2026-11-14. Read-only review of the actual browser renders in `round1-baseline`, the unlabelled phase captures in `round1-unlabelled`, and the later continuous-motion filmstrips in `round1-motion-sweeps`. Checked the current `motion.js` and `geometry.js` to distinguish an observed pose from an already implemented correction.

The strongest existing quality is restraint. The maker stays with the task, the light remains close, and rising is a return to work rather than a victory gesture. The five-beat passage reads as seated work → a problem → looking at an object → another attempt → standing. The emotional cause is less clear than that sequence of actions. Without the object labels, resistance and reflection can still read as ordinary interface handling.

This is an individual animation review, not a user study or a claim that a gesture has a universal emotional meaning. Indices below are the zero-based runtime indices, so 13–17 correspond to displayed scenes 14–18.

## 1. Let the successful retry remain under inspection before releasing it

**Evidence:** [resistance phases](round1-unlabelled/performance-14.png), [reflection phases](round1-unlabelled/performance-15.png), [retry endpoint](round1-baseline/art-16.png), and [motion strip through retry](round1-motion-sweeps/filmstrip-03.png). The failed attempt withdraws to the body; the repair also proceeds into an immediate generic retreat. The colored connection does much of the work of telling us that the outcome changed.

**Current implementation:** the retry already has a valuable difference: the left hand approaches first and braces while the right hand makes its arc. Preserve that. In `poseAt()`, the generic response branch begins interpolation toward the final open-hand pose as soon as the action ends. For beat 16, that means release begins around `u=.66`, with both hands moving toward their resting outcome together.

**Highest-return change:** keep the left hand on its existing brace target through the first part of response. Keep the right hand at the completed join briefly while the head stays directed there. Then withdraw the right hand, and release the left support afterwards. Use a short authored progress interval, not a wall-clock delay or a longer scroll section. An initial blocking range of roughly `.66–.74` for verifying the join and `.74–.86` for the staggered release fits within the existing response window; inspect the final timing rather than treating those values as a requirement.

**Emotional effect to test:** the character checks whether the changed approach worked. The second attempt gains an observable consequence beyond a color change. This should read when the caption and prop text are hidden, without adding a nod or celebratory gesture.

## 2. Make the existing head orientation visible in the blank silhouette

**Evidence:** the same three-quarter egg-like head appears in [conviction](round1-baseline/art-13.png), [resistance](round1-baseline/art-14.png), and [inspection](round1-baseline/art-15.png). At the smaller phase-strip and mobile sizes, its forward direction is difficult to distinguish. This makes the existing attention leads harder to see, particularly when a hand is moving underneath the head.

**Current implementation:** head rotation is present and changes before the torso. The cranial surface also has a chin/occiput distinction, but the front shift is only `.018` model units. In the inspected 720-square framing this is only a few pixels; it is smaller still on mobile. Increasing the amount of head rotation alone would not necessarily make its direction clearer.

**Highest-return change:** strengthen the smooth blank-front / rounded-back distinction at the lower head and neck. Preserve the rounded woven appearance and add no eyes, mouth, or likeness. A slightly clearer forward chin and a more distinct neck-to-back-of-head junction can expose yaw and pitch that already exist. Compare the same fixed-camera action frames before adjusting the head timing.

**Emotional effect to test:** the viewer can identify whether attention is on the light, the failed connection, or the inspected result. The character then appears attentive to a specific thing, rather than generally tilted into a thoughtful pose.

## 3. Give the standing hold one relaxed arm instead of two posed elbows

**Evidence:** [standing after the retry](round1-baseline/art-17.png) and the settled frames in [the stand motion strip](round1-motion-sweeps/filmstrip-04.png) show both elbows held out and both hands near the waist. A similar silhouette recurs in [the final invitation](round1-baseline/art-30.png). In these views it resembles a presentational, hands-near-hips stance more than a person who has just finished a careful effort.

**Current implementation:** beat 17 sends both hands to `rest(true)`. The shared body-space rest targets retain a forward hand position and bend at both elbows. The new hand shapes can improve the palms, but they do not change this overall arm silhouette.

**Highest-return change:** after the rise support releases, let the left arm settle lower and nearer the side, with a relaxed palm toward the thigh. Keep the right hand's light close to the working body. Avoid adding a large chest lift or making both arms symmetrical. Begin by changing the beat-17 finish target and grip; retain fixed limb lengths and check reach/contact when tuning the lower target. The final invitation may reuse the relaxed non-offering arm if the comparison succeeds.

**Emotional effect to test:** the standing hold feels quietly available to continue. One arm keeps the purpose of the scene; the other visibly releases effort. This gives the body a more human asymmetry while retaining the intended restraint.

## Already underway; not duplicate requests

The capture timestamps precede some of the latest work. The shared detailed hands, stable chair/ground presentation, removal of ghost interface geometry, and synchronized inspection-card tilt were reported or visible in current source during this review. The suggestions above do not ask for those changes again. The reflection-card action should be judged again from the rebuilt browser before drawing a final conclusion about its readability.

For the next review, the most informative comparison is the same unlabelled, fixed-camera resistance → inspection → retry → standing passage, then its ordinary mobile stage. The goal is to see an interrupted intention, a changed method, a checked result, and released effort in the body itself.
