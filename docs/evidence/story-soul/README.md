# Emotional continuity — living-story-soul-v10

Implemented the three accepted suggestions together:

1. **Emotional holds.** The maker keeps the small ember pose while the camera travels to a rear view, lets the distilled capability register, and holds the clear entrance to AI experiences. These are deterministic scroll intervals. Native scrolling remains uninterrupted, and reverse scrolling retraces both pose and camera.
2. **One remembered light line.** A warm filament remains attached to the wrist-local light across the story. Its stable sections evolve from a rounded plan into connected forms, break into small grains through resistance, then gather into a distilled coil and open into an invitation. It is a symbolic continuity device rather than a recording of past input. It shares the scene camera, background composition and static fallback builder.
3. **A responsive woven environment.** Nearby background strands lean toward the hand during construction, withdraw during resistance, and send faint ripples over the ground after selected completed actions. Existing dust, directional hand trails and orbit cameras compose with these changes. The revealed orchestration graph fans slightly farther out so its links remain visible in the side view.

The body rig, contact calculations, scene text and story facts retain their existing definitions. The shared resolver retimes the three selected holds. There is no additional animation loop, timer-based emitter, random spawning or dependency.

## Evidence

- Build: 2,222 assertions passed. Syntax and whitespace checks passed.
- [Final orbit suite](final-orbits/results.json): 42 checks passed, including reverse scroll, mobile/rear framing, pointer suppression, reduced motion, dust and disclosure integration, and head clearance.
- [Final profile suite](final-profile/results.json): 59 checks passed.
- [Final physical-performance suite](final-performance/results.json): 69 checks passed, including visible contacts, fixed anatomy, support and disclosed graph visibility.
- [Dust regression](final-dust/results.json): 12 behavioral checks passed across 421 samples; five optional historical-baseline checks were explicitly skipped because the retimed story intentionally changes the prior output.
- [Story continuity suite](final-numerical/results.json): 18 checks passed, covering held poses with moving cameras, attachment, head clearance, monotonic release, bounded paths and history-independent reverse sampling.
- [Browser-held poses](browser-holds.json): native-scroll video contains 23 exact held-performance samples during the rear camera move and 21 during the skill hold. Loaded script hashes and built assets match the final source.
- [Visual capture manifest](final-visual/manifest.json): 18 desktop/mobile/Canvas stills and four continuous native forward/reverse sweeps, zero browser errors.

[Six-scene contact sheet](final-visual/contact-sheet.png) · [Forward/reverse motion preview](final-visual/story-soul-forward-reverse.webm)

Visual inspection covers the drawing, rear hold, broken thread, gathering, capability hold and experience entrance on desktop/mobile. The thread remains below the head and subordinate to the active work. Its fracture grains are intentionally subtle, especially on mobile. The largest new illustration has 44 short paths; alternate grain detail and the second ripple are omitted on phones. Existing reduced-motion mode supplies static SVGs.

The `visual` folder records an earlier shape candidate; `final-visual` records the final authored forms. The browser checks use headless Chromium viewport simulation, not physical-device performance measurements. Preview updated locally at http://127.0.0.1:4174/profile/; no public deployment was performed.
