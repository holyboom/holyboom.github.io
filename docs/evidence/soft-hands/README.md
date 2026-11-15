# Softer, simpler hands — v14

Release: `living-soft-hands-v14`. The request was to make the hands simple and appealing rather than anatomically detailed.

Two rounded contours describe each finger, with faint inner detail. Hemispherical caps replace pointed ends. The palm uses a quiet outer shape and a few interior strands. The forearm skin tapers into the wrist orientation instead of ending in a thick circular cuff. Essential contours remain complete when mobile detail is reduced.

The fixed finger chains, original grips, stylus, typing, support contacts, light emitter, acting and documentary camera are preserved. All777 strand identities remain. The skin curves end at the same FK fingertips. This is a stylized woven hand, not a realistic skin or fingernail model.

## Evidence

- [Enlarged before/after studies](comparison.png), with [self-contained vector studies](comparison.html): drawing, typing, support, review, light and invitation. These isolate shared geometry and enlarge it; they are not full-page screenshots.
- Actual browser frames: [desktop drawing](desktop-drawing.png), [desktop light](desktop-light.png), [mobile drawing](mobile-drawing.png), [mobile typing](mobile-typing.png), [mobile choice](mobile-choice.png). The [capture manifest](capture.json) records all8 screenshots, source hash, viewports, native-scroll positions, loaded release and browser errors.
- [Geometry preservation](geometry-parity.json):41 positions, unchanged777 IDs; geometry changes restricted to hands and forearm skin. Poses, contact data, camera, light trail, work and scenery compare exactly. All13 essential hand strands remain identical in compact detail mode.
- [Performance/contact suite](performance/results.json): fixed body/finger lengths, actual rendered fingertips and palm contacts, stylus grip, support, reversal and browser behavior.
- [Documentary camera suite](camera/results.json): full selected-subject framing, reverse/continuity, live close-ups on desktop/mobile, disclosure pullback and reduced motion.

Structural checks include JavaScript syntax, build/discovery validation and source/build equality. Behavioral checks use deterministic geometry and native scrolling in headless Chromium. Perceptual review inspected enlarged comparisons and actual desktop/mobile frames, including the drawing grip, supported palm and held light. Physical-device rendering and visitor preference are untested. No public deployment was performed.

## Reproduce

Build and serve `dist` on port4174, then run:

```sh
PERFORMANCE_QA_DIR=docs/evidence/soft-hands/performance npm run test:profile-performance
DOCUMENTARY_QA_DIR=docs/evidence/soft-hands/camera npm run test:profile-documentary
node scripts/capture-profile-hands.cjs
```

The capture script produces current hand studies and8 actual page screenshots. `HAND_BASELINE` optionally accepts an earlier geometry module for a before/after board; the recorded comparison used the v13 geometry before this edit. `HAND_CAPTURE_DIR` selects another output folder.
