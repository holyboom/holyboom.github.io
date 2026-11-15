# Human Drama — historical v4 evidence

Superseded by [Cinematic Camera](../cinematic-camera/REPORT.md). These captures and measurements describe the earlier static camera.

The English profile now has 31 authored visual beats across 11 section anchors: the A membrane opening, 28 narrative scenes, professional reflection and invitation. This is a local production preview. No push, merge or public deployment has been made.

## What changed

- Foreground action props make drawing, coding, connecting, reviewing, encountering an obstacle, researching, synthesizing and offering an experience distinguishable. Hands render in front of the props. The drawing board is tilted and the laptop includes a keyboard.
- The personal passage has five beats: conviction, resistance, reflection, returning to the work and persistence. Surrounding light decreases, the character lowers their posture, and the amber light stays present. The scene regains energy through renewed work.
- Five stable colour meanings support the story: violet imagination/identity, cyan engineering, amber human conviction/agency, coral friction and mint approachable outcomes. Actions, objects and text convey the same meanings without requiring colour recognition.
- The 31-beat timeline holds poses briefly, morphs the woven environment and crossfades the readable props. The current action, emotional line and scene counter stay synchronized. Upward scrolling retraces the same geometry and colour; the hand trail reverses with movement.
- All 28 narrative action names exist in native HTML. Reduced motion and no-JavaScript SVGs include the same recognizable props. The reflection and contact sections each receive the same live canvas when visible.
- The professional summary remains recent-first. Thai and main-showcase behavior are retained. The drama is grounded in the owner's account; it invents no employer incident, dated failure, antagonist quotation or client result.

## Verification

- Chromium: 59/59 behavioral checks passed.
- Firefox: 59/59 behavioral checks passed.
- WebKit: 59/59 behavioral checks passed, using headless Linux rather than physical Safari.
- Checks include all authored actions and props, five semantic colour roles, reachability of all 29 sticky scenes, reflection/contact docking, reverse geometry, trail attachment and fade, responsive widths, native HTML, script failure, storage denial and motion preferences.
- Production discovery validation: 2,182 assertions passed.
- Existing English/Thai/homepage regression: 42/42 checks passed.
- Axe WCAG 2 A/AA and 2.1 AA: no reported violations.
- Syntax and whitespace checks passed. Browser screenshots were inspected on desktop and emulated mobile. No physical-device benchmark or screen-reader certification is claimed.
- A Chromium rounding issue at fractional section boundaries was fixed with a one-pixel docking tolerance. The final boundaries were checked again in all three engines.

## Review

- [All 31 scenes](storyboard.html)
- [Five-scene dramatic passage](drama-storyboard.png)
- [Actual scroll sequence, including down/up reversal](story-down-and-up.webm)
- [Mobile dramatic passage](mobile-conviction.png)
- [Detailed scene direction](../../HUMAN-STORYBOARD.md)
- [Editing guide](../../LIVING-PROFILE.md)

Production preview: http://localhost:4174/profile/

To regenerate the capture gallery, install the optional local `axe-core` package, keep the production preview running and run `node scripts/capture-profile-story.cjs`. The shipped site has no dependency on that package or the capture script.
