# Selected C glove — v15

Release: `living-c-glove-v15`. Boom selected **C** from the [three proposed hand designs](approved-options.png): a soft pebble-shaped glove with a broad palm, five separate short fingers and a bean-shaped thumb.

## Result

- [C glove posed studies](c-glove.png) / [vector studies](c-glove.html): production hand surfaces and actual grip states, enlarged in gesture-specific study views. These are geometry studies, not screenshots of the profile camera.
- Actual page: [desktop drawing](desktop-drawing.png), [desktop light](desktop-light.png), [mobile drawing](mobile-drawing.png), [mobile typing](mobile-typing.png), [mobile choice](mobile-choice.png).
- [Six gesture details](hand-studies.png) / [vector details](hand-studies.html) use the actual documentary viewing direction. The [capture manifest](capture.json) records all8 native-scroll page screenshots, their positions/viewports, release and source hash.

The palm is thicker and softly squared, fingers shorter and wider, and both ends of each finger volume are closed and rounded. The surface follows the articulated grip rather than stretching from one finger drawing into another. The wrist narrows into the glove. Sparse purple surface lines retain the woven identity; primary contours survive mobile detail reduction. All777 strand IDs remain, including27 per hand.

Closed surface patches add visible volume under the network. One continuous illustrated gradient per glove keeps overlapping palm/finger parts visually joined. Hand strands sort in short sections so the near-side network stays above the skin while rear-side lines are hidden. Canvas and SVG use the same geometry and material parameters. Closed-polygon clipping keeps a hand on the proper side of the work surface during side/rear camera moves. This is an illustrated material with overlapping closed volumes, not a physically based renderer or a single remeshed manifold.

The changed hand proportions also change contact offsets. The stylus sits beyond the thicker palmar skin with a deeper thumb/index grip; typing still uses its exact articulated index tip. The hand-light emitter sits outside the new palm and shares the full/fast motion sampler. Narrative order, camera event definitions, scenery design, support timing and body bone lengths remain. Wrist and elbow coordinates adapt to the new hand offsets; exact old rig-coordinate parity is not claimed. The first reduced-motion human fallback also has the complete glove surface.

## Verification

- **Structural:** syntax, production build/discovery validation, source/build equality and local HTTP assets.
- **Behavioral:** [glove skin contracts](skin/results.json) cover all24 original, blended and typing shapes across both hands; closed bases, exact contact tips, continuous cap joins, finite skin,777 stable IDs, complete mobile contours, valid materials and reversible surfaces. [Contact/performance checks](performance/results.json) cover grips, actual visible contact points, fixed segment lengths, support, browser resize/lifecycle and reversal. [Camera checks](camera/results.json) cover selected-subject framing, actual desktop/mobile close-ups, disclosure pullback and reduced motion.
- **Painter:** [seven clipping/sorting checks](painter/painter.json) sweep160 front, side and rear cases. Filled glove polygons stay closed and remain on one side of the work plane. Canvas and SVG depth kernels agree. The [profile suite](profile/results.json) covers59 surrounding page behaviors.
- **Perceptual:** inspected the production geometry studies, drawing scene, held-light scene and mobile page captures. The approved generated sheet is direction, not a claim of pixel-identical output.
- **Field:** physical-device frame rate and real visitor preference remain untested. The public site has not been deployed by this revision.

## Reproduce

```sh
npm run build
# Serve dist on port4174, then:
npm run test:profile-glove
PERFORMANCE_QA_DIR=docs/evidence/c-glove/performance npm run test:profile-performance
DOCUMENTARY_QA_DIR=docs/evidence/c-glove/camera npm run test:profile-documentary
PAINTER_QA_DIR=docs/evidence/c-glove/painter npm run test:profile-painter
HAND_CAPTURE_DIR=docs/evidence/c-glove node scripts/capture-profile-hands.cjs
```

Edit hand proportions, grips and shared surfaces in `assets/profile/hand-shapes.js`; network and patches in `geometry.js`; light attachment in `motion.js`. The Canvas painter is `living.js`; the SVG equivalent is `scripts/build-profile-art.cjs`. Keep their clipping and material behavior aligned.
