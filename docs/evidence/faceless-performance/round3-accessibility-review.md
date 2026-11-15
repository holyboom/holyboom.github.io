# Round 3 — keyboard, short viewports, and reading continuity

Date: 2026-11-14. Final focused checks ran against the rebuilt local production preview on port 4174.

## Confirmed problems and changes

1. **Landscape overlays collided.** At 844×390, the stage action occupied Y=171–191.8px, the meaning label Y=190–205px, and the progress track approximately Y=203.8px. A horizontal-overflow check passed despite this overlap. The boot condition and runtime now use the existing complete, in-flow presentation below 500px viewport height at any width, alongside the existing under-650px rule for narrow phones. The inline boot decision matches the runtime decision, so the compressed stage does not appear while the animation script loads.

2. **Reverse keyboard navigation could hide focus.** At 390×844, Shift+Tab placed the workbench link and the “Explore beneath the surface” summary entirely behind the sticky stage. Native scroll margins now keep story controls below that stage and keep other controls below the header. The focus clearance includes the outline; a 320px Firefox edge informed the final spacing. Keyboard focus also disables smooth scrolling while active, avoiding a delayed scroll chasing rapid Tab navigation. Existing section anchor offsets are unchanged.

3. **Changing presentation modes lost the reading point.** Enabling reduced motion at the craft chapter moved its heading below the fold; rotating into landscape could show the previous chapter. The runtime remembers the visible reading element and its offset and restores it only when crossing between sticky and in-flow layouts. Ordinary resizing and native section navigation keep their existing behavior.

4. **Resuming animation could traverse unrelated scenes.** Scrolling through the static story and returning to Full motion previously animated from stale scene progress. After restoring the reading point, a layout-mode transition now synchronizes current progress to the corrected target, including when no reading anchor exists. The independent runtime review confirmed that the first resumed frame starts at the current section.

The changes are confined to `living.css`, the inline boot condition in `profile_living.py`, and presentation/focus-related regions of `living.js`. The renderer and story copy were not changed in this pass.

## Focused verification

Added [qa-profile-accessibility.cjs](../../../scripts/qa-profile-accessibility.cjs) to cover the gaps rather than repeat the main profile suite. It checks:

- Keyboard skip navigation and visible focus during reverse traversal at 390px and 320px.
- Enter/Space operation of the native disclosure, expanded-content reflow, and exact native bridge destinations/offsets.
- Reading continuity when changing motion preference, rotating, and crossing the short-phone height threshold.
- Returning to live animation after scrolling in the static story without a scene fly-through.
- Clear controls in the 640×480 CSS layout corresponding to a 1280×960 viewport at 200% zoom.
- Keyboard skip/disclosure use with JavaScript disabled at 320px.
- The short-landscape static preview while `living.js` is deliberately held back.

| Final built browser | Result | Evidence |
| --- | --- | --- |
| Chromium | 27/27 passed; no skips or runtime errors | [Results](round-3-final/accessibility-chromium/results.json) |
| Firefox | 27/27 passed; no skips or runtime errors | [Results](round-3-final/accessibility-firefox/results.json) |
| WebKit | 27/27 passed; no skips or runtime errors | [Results](round-3-final/accessibility-webkit/results.json) |

[Landscape after correction](round-3-final/accessibility-chromium/landscape.png) · [200% layout reflow and keyboard focus](round-3-final/accessibility-chromium/zoom-reflow.png)

The existing performance/disclosure regression also passed 68/68 against the source preview after these changes. That includes the established disclosure-position correction and ordinary resize behavior; its separate source-run output is `/tmp/profile-round3-regression/results.json`. The implementation owner runs the full profile suite against the final built artifact separately.

WebKit used the unpacked system libraries at `/tmp/profile-browser-libs/extracted/usr/lib/x86_64-linux-gnu` through `LD_LIBRARY_PATH`. Its actual browser ran successfully with Playwright's host-library discovery check skipped because that check did not recognize the available GLES library. The accessibility assertions themselves were not skipped.

These are automated, emulated browser checks. The zoom scenario verifies layout reflow at the corresponding CSS viewport; it does not claim to drive the browser chrome's zoom UI. Physical devices and a full screen-reader session were not tested.
