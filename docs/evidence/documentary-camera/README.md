# Documentary camera — v13

Release: `living-documentary-v13`. The camera now moves behind the maker and approaches specific subjects, while preserving the fixed rig, story timeline, environment, reversible dust, memory filament and wrist-light trajectory.

## Direction

| Moment | Camera attention | Emotional purpose |
| --- | --- | --- |
| First imagined place | Dolly toward the drawing hand and stylus | Make the act of designing tangible |
| Human review | Move toward the work and review boundary | Show where a person exercises judgment |
| Resistance | Locked orbit to 163° desktop / 152° compact | Stay behind the solitary maker and share their outlook |
| Returning to the problem | Approach the tilted symbolic head | Let attention and posture carry thought without facial features |
| Rising again | Approach the surviving light at the hand, before the lesson panel arrives | Give persistence a small, specific focal point |
| A capability takes shape | Approach the work as it becomes a connected system | Move from a distilled idea into its depth |
| Human choice | Approach the interface and recipient | Show the person at the centre of an AI experience |
| The person behind the work | Return to a head-and-shoulder composition | Bring attention back to the maker before the closing invitation |

All seven inserts have approach, hold and release intervals tied to native scroll. Reversal retraces the authored path. Distance changes at a fixed focal length, providing perspective and environment parallax. Compact distances preserve the selected subject. Full-body framing remains appropriate between the close-ups. No facial likeness or features have been introduced.

Opening the system-layer disclosure releases the close camera into the established wide composition so its graphs remain visible. Closing restores the insert at the same scroll position. Pointer parallax settles out during held inserts and locked orbits. Native captions remain available when small on-art labels fade. Reduced motion retains the wide static SVG compositions.

## Review artifacts

- [Forward/reverse camera recording](visual/documentary-camera-forward-reverse.webm): six actual browser takes, each traversed in both directions. Jumps between separate takes are capture navigation, not transitions in the page.
- [Wide / close / return, part 1](visual/sheet-1.png): drawing, review, reflection and hand light.
- [Wide / close / return, part 2](visual/sheet-2.png): capability, choice, maker portrait and rear orbit.
- [Capture manifest](visual/manifest.json): 40 stills, 12 directional takes, viewport/camera samples and loaded-script SHA256 hashes. Art-only captures hide DOM overlays for review; the page retains those captions.
- [Camera validation](validation/results.json): 28 checks including complete head/work framing, subject enlargement, boundary continuity, deterministic reversal, pointer suppression, rear angles, disclosure pullback, live visibility on desktop/mobile and reduced motion. The local baseline comparison also verifies unchanged actor, world, dust and light geometry at 81 samples.
- Existing [profile](profile/results.json), [camera](camera/results.json), [performance](performance/results.json) and [orbit](orbits/results.json) suites cover the surrounding behavior. Their framing assertions distinguish intentional close-ups from full-body compositions.
- [Final verification](verification.json): 216 passing checks across the five suites, 40 captured stills, 12 directional takes, no capture browser errors, and all 24 loaded-script hashes matching the production build. The recording is 55 seconds at a 1000×1000 capture size.

The browser checks use headless Chromium and simulated viewports. The recording is a visual review artifact, not physical-device frame-rate evidence. This iteration changes local source and the production build; it does not publish the public GitHub Pages site.

## Reproduce

```sh
npm run build
# Serve dist on port4174, then:
npm run test:profile-documentary
node scripts/capture-profile-documentary.cjs
```

The capture script requires a fresh output directory; use `DOCUMENTARY_CAPTURE_DIR` to keep another review set. `DOCUMENTARY_BASELINE` optionally points at an earlier geometry module for the exact geometry-parity check; without it the suite runs 27 checks. `SKIP_BROWSER=1` runs only numerical contracts. The camera configuration lives in `assets/profile/scenes.js`; shared projection and subject tracking live in `assets/profile/geometry.js`.
