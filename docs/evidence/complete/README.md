# AI experiences — completed implementation

Release: `living-complete-v11`.

The profile now carries the five accepted enhancements through the journey: emotional holds, one remembered light filament, responsive woven surroundings, inspectable public-work paths, and an ending that recalls the first architectural drawing. Four camera orbits, scroll-bound dust, the hand afterimage, layered architecture and reduced-motion fallbacks work together.

The final steering request is implemented in the actor: 30 human poses have separate torso direction, inclination, head attention, hand recovery, knee level and foot stance. The opening remains the abstract A. Near-duplicate gestures were reviewed without props or colour, then in the real Canvas. Important changes include a listening hand, an assessing hand near the chin, open assembly/release gestures, a sheltered ember, a recoil at resistance, lower reflection, forward repair, a deeper two-hand capability crouch, a protecting palm, broad welcome and diagonal final invitation. See [the acting direction](../../DISTINCT-ACTING.th.md).

Standing stance changes step one foot at a time. The rig preserves fixed limb lengths, contact surfaces and the existing support order for sitting and rising. Reflected work follows its lower lap frame; the capability follows the crouch. Action-time typing still articulates both index fingers; the three typing scenes have distinct recovery poses.

The Work chapter provides three native disclosure paths: reviewable work, source traceability, and carrying a chosen capability into a brief. Each connects problem, design choice and workflow to the existing public demonstrations. It adds no private project details or claimed client outcomes. The ending repeats “I still build places for people. The medium has changed.” beside a faint curved pavilion and provides a native return link.

## Review artifacts

- [Complete 31-scene motion tour](final-tour/complete-acting-journey.webm), about 33 seconds, recorded through native scroll from the actual page.
- [One-camera neutral pose sheet](neutral/contact-sheet.png), showing all 30 human poses without props, scene colour or camera differences.
- [All scene artwork](all-scenes/contact-sheet.html), plus [final changed poses and mobile views](final-poses/contact-sheet.html). The all-scenes set precedes the final chin/final-invitation hand refinements; final-poses and the tour contain the final actor.
- [Work paths](interaction/work-1440.png) and [closing composition](interaction/closing-1440.png). The closing screenshot precedes only the final invitation-hand adjustment; the final art and tour show that gesture.
- [Delivery hashes](delivery-manifest.json): the served tour scripts, source files and built production artifact match. All 31 recorded stops reach their intended settled scene; zero browser errors.

## Validation

| Check | Result |
| --- | --- |
| Production build and static discovery | 2,254 assertions passed |
| Physical performance, including contacts and support | 69 checks passed on final actor |
| Final camera / orbit contracts | 18 / 42 checks passed |
| Native work paths, keyboard, no-JS, reduced motion and return route | 48 checks passed |
| Emotional holds and story-thread contracts | 18 checks passed |
| Neutral pose separation and planted-foot support | 5 checks passed |
| Public English/Thai profiles and showcase | 42 checks passed in Chromium (production-artifact mode) |
| Main profile | 59 checks passed in Chromium; 59 in Firefox |
| Focus, short viewports and reading context | 27 checks passed in Chromium |
| Dust | 12 behavioral checks passed across 421 samples; five optional historical-baseline comparisons explicitly skipped |
| Syntax and whitespace | Passed |

The pose-separation checks reject near-duplicate joint arrangements; they are not a measured score for emotional readability. Visual review covers all 31 scene images, the neutral sheet, the changed mobile scenes and sampled final video frames. Browser testing uses headless desktop/mobile viewports, not physical-device performance measurements. A supplementary default WebKit regression could not launch because this environment lacks liblzo2 and libGLESv2; no current WebKit result is claimed. The public-profile regression uses the available Chromium engine.

Implementation and local production preview are complete: http://127.0.0.1:4174/profile/. No public deployment, push or merge was performed.
