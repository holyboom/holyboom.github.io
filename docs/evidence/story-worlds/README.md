# Four families, 31 grounds — v16

Release: `living-story-worlds-v16`. Boom selected all four [terrain concepts](approved-floors.png), requested a distinct ground for every scene, and explicitly selected fixed Full motion with the motion selector removed.

## The worlds

The [scene map](scene-map.json) gives every beat a different recipe and narrative job. Contour terraces carry architectural origins and recovered foundations; flowing paths carry code, connection and choice; gravity wells carry conviction, resistance and reflection; linked islands carry assembled capabilities, shared work and an open invitation. Within each family the layout, number of levels/branches/islands, depth, width, turn and curvature change. These are31 different point sets rather than a shared wave with different colour.

All100 ground strands keep their IDs and48 samples. Compact rendering retains the entire ground so islands and bridge networks do not disappear when body detail decreases. Relief plates add quiet volume behind the actor. A shared deformation applies bounded squeeze, turn and sink around the support centre; the actual foot positions retain their local ground support. No gravity force solver, mutable velocity or independent particle clock is introduced. Reverse scroll reconstructs the same geometry.

## Look at the result

- [Atlas1](visual/atlas-1.png), [atlas2](visual/atlas-2.png), [atlas3](visual/atlas-3.png), [atlas4](visual/atlas-4.png) show all31 grounds with the existing performer and surroundings. These use the real Canvas/native-scroll renderer with a fixed elevated study camera to make terrain comparable.
- [Forward/reverse recording](visual/floors-forward-reverse.webm): six actual native-scroll takes through terrace→path, islands→well and path→islands transitions, using the same elevated study camera. Jumps between separate takes are review navigation. The recording is about25 seconds.
- Actual page camera: [desktop conviction](visual/desktop-13.png), [desktop capability](visual/desktop-20.png), [desktop closing](visual/desktop-30.png), [mobile connection](visual/mobile-08.png), [mobile resistance](visual/mobile-14.png), [mobile closing](visual/mobile-30.png).
- [Capture manifest](visual/manifest.json) records55 stills, six directional takes, source hashes and browser errors. The native desktop/mobile captures retain the authored documentary camera.

## Full-motion policy

The header has no motion selector or hidden replacement control. Runtime mode is constant `full`; legacy saved Reduced values and the OS motion preference do not select a static version. Short phones and landscape keep the live renderer. A paused scene holds its geometry, and the scheduler suspends after settling and while hidden/offscreen. Native scrolling, keyboard controls, no-JS/error fallback illustrations and print content remain.

Structural reflow preserves the reading heading. During active work inspection it preserves the displayed rig instead. Navigating to another Canvas host clears an old inspection correction so an open work disclosure cannot hold the closing scene at an earlier pose. This is an explicit owner policy, not a claim of reduced-motion accessibility conformance.

## Verification

- [Ground and Full-policy contracts](validation/results.json): all four families,31 unique geometries,100 stable strands, finite bounds, grounded supports, reversal, complete compact detail, old-storage/OS override, short/landscape rendering and no idle loop.
- [Preservation](preservation.json):41 positions compare exactly with the published v15 for non-terrain strands, C glove skin, props, scenic objects, dust, memory filament, camera and hand-light trail.
- [Profile behavior](profile/results.json), [keyboard/reflow](reflow/results.json), [contact/performance](performance/results.json), [documentary camera](camera/results.json), [base camera](base-camera/results.json), [orbits](orbits/results.json), [gloves](glove/results.json), [painter](painter/painter.json), [closing/disclosures](completion/results.json) and [English/Thai/showcase regression](professional/result.json) cover the shared boundaries. Background terrain is allowed to extend beyond the frame; primary work remains subject to its existing framing checks.

Visual review inspected the atlas, native desktop/mobile pages and extracted video frames. Browser tests emulate viewport sizes; physical-device frame rate, universal emotional readability and full accessibility certification are untested. The original A membrane, symbolic character, C gloves, light carrier and documentary camera remain.

## Reproduce

```sh
npm run build
# Serve dist on port4174, then:
npm run test:profile-floors
QA_DIR=docs/evidence/story-worlds/reflow npm run test:profile-accessibility
PERFORMANCE_QA_DIR=docs/evidence/story-worlds/performance npm run test:profile-performance
FLOOR_VIDEO=1 node scripts/capture-profile-floors.cjs
```

Author recipes in `assets/profile/scenes.js`; shared geometry and support deformation in `floors.js`. `geometry.js` owns their integration with the persistent strands and illustration layers. Policy and reflow behavior live in `living.js`, with the matching boot/header in `scripts/profile_living.py`.
