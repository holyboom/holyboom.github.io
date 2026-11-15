# Cinematic Camera — motivated perspective and smooth dolly

The English profile retains the 31-scene human story and approved woven material. Nine reusable camera presets add wide, detail, elevated drafting, opposing angle, isolated, intimate, low-angle and concluding views. This is a local production preview. No push, merge or public deployment has been made.

## Implementation and practical return

- Authored camera target, yaw, pitch and distance are keyed to story beats. A fixed focal length plus changing distance produces actual perspective/parallax. This is not a CSS scale effect.
- Camera movement starts before the shape morph and settles after it. Quintic easing gives zero velocity/acceleration at endpoints; logarithmic distance interpolation smooths perceived push/pull. Scroll position reconstructs the same camera in both directions.
- Wide isolation creates space around doubt; intimate reflection comes closer; a slight low-angle rise supports persistence; a pullback reveals connected outcomes. Captions stay still and readable.
- The prepared projector computes coefficients once per frame and is shared by character, props, hand, trail and SVGs. Unchanged geometry is cached during breathing/pointer frames; gravity invariants are hoisted; unchanged ambient frames skip navigation updates.
- Compact screens use 65% of the authored movement around neutral framing. Reduced motion retains static authored shots. Front-facing orbit bounds preserve the existing planar props; this is not a volumetric character/prop pipeline or a 360-degree camera.
- The existing Canvas/native-scroll renderer supports these camera moves directly, so no additional runtime library was needed. Professional techniques used here are shot blocking, motivated camera movement, perspective dolly/orbit, eased keyframes, parallax and safe framing. Browser validation uses Playwright and render diagnostics.

## Local performance diagnostic

| Viewport | Previous median reported draw cost | Camera + projection | Final optimized draw cost |
| --- | ---: | ---: | ---: |
| 1440 × 1000 | 10.41 ms | 7.54 ms | 5.97 ms |
| 390 × 844 | 9.92 ms | 7.11 ms | 4.16 ms |

The measurements use local headless Chromium and the same scripted scroll sequence. Both runs ended at adaptive detail 2. These are medians of the renderer's exponentially smoothed JavaScript draw-time diagnostic, not raw presentation latency or physical-device FPS guarantees. Intermediate and final measurements are retained as JSON; machine contention and warm-up can affect results. Reproduce with `node scripts/measure-profile-render.cjs /tmp/profile-render.json` against port 4174. No past Lighthouse score is carried forward.

## Verification

- Camera suite: 18/18 checks passed: finite state, genuine perspective, continuous keyframes, reverse scrubbing, compact attenuation, zero-strength locking, hand/trail alignment, meaningful prop framing and reduced-motion rendering stop.
- Existing profile behavior: 59/59 checks passed in Chromium, Firefox and WebKit.
- Professional English/Thai/homepage regression: 42/42 passed.
- Production discovery: 2,182 assertions passed. Syntax and whitespace checks passed.
- Axe WCAG 2 A/AA and 2.1 AA: no reported violations.
- Camera checks are included in the Pages validation workflow. The remote workflow has not been executed in this session.
- Static, mobile, endpoint and transition framing inspected. An outgoing recipient prop near the portrait transition was kept in frame by retaining a small horizontal target offset.
- No physical-device or screen-reader certification is claimed.

## Review

- [Slow camera movement and reverse scroll](camera-movement.webm)
- [Eight camera compositions](camera-frames.png)
- [All 31 current scene captures](storyboard.html)
- [Complete scroll sequence](story-down-and-up.webm)
- [Mobile isolation scene](mobile-conviction.png)
- [Editing and camera guide](../../LIVING-PROFILE.md)

Production preview: http://localhost:4174/profile/
