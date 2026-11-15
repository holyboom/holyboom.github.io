# A dramatic woven world — living-dramatic-world-v12

Each of the eleven sections now has an authored environment with eight surrounding object groups, connecting spans and curved room-light filaments. The additional set contains 114 paths on desktop and 69 on phones. Shapes include rounded architectural ribs, folios, stacked structures, bridges, empty chairs, networks, woven orbs, petals and scattered fragments. They use real world-space depth and the existing orbit camera.

The drama follows the work: an unbuilt place becomes a system under construction; separate workspaces become connected; the solitary room retains empty chairs and broken spans; resistance scatters the set; reflection gathers its lessons; repair reconnects the span; knowledge forms a capability; a layered entrance opens into the public work and final invitation. All five conviction beats have different set variants. The [Thai art direction](ART-DIRECTION.th.md) maps every section to its environment.

All new scenic paths share stable identities and interpolate from scroll. Existing dust, hand light, memory filament, body acting, emotional holds, camera locks and disclosures continue alongside them. A 161-position exact comparison confirms the original body, camera and other illustration layers are unchanged.

Scenic ink fades near the head, hands and primary work. Shared Canvas/SVG focus protection tests the projected line segments, with a small safety margin for the curved strokes; it does not move world objects to follow the camera. Phones omit secondary geometry, and the live renderer culls offscreen strokes. The reduced-motion SVGs include the same authored sets. There are no new dependencies, timers, random emitters or idle animation loops.

## View the result

- [All eleven sections](final-sections/contact-sheet.html), with links to desktop and mobile context for each.
- [Sections 1–6](final-sections/sheet-01.png) and [sections 7–11](final-sections/sheet-02.png).
- [Complete 31-scene motion tour](final-tour/complete-acting-journey.webm), captured from the native-scroll page.
- [Delivery checks](delivery.json): current source and production files match the served tour; all recorded scene stops are correct and there are zero browser errors.

## Validation

- Build: 2,254 assertions passed; syntax and whitespace checks passed.
- [Final environment QA](final-validation/results.json): 21 checks passed, including unique chapter sets, reverse sampling, bounded geometry and desktop/mobile budgets, exact original-feature parity, and actual head pixels with/without the scenic layer at six scenes on two viewports. The pixel comparison warms the steady renderer and preserves its detail setting before comparing.
- [Profile](profile/results.json): 59 checks passed.
- [Physical performance](performance/results.json): 69 checks passed.
- [Camera orbits and composed disclosures](orbits/results.json): 42 checks passed.
- [Keyboard, short screens and reading context](accessibility/results.json): 27 checks passed.
- Canvas/SVG plane-painter regression: 5 checks passed across 160 views and 2.57 million points before the final focus refinement; the plane algorithm itself is unchanged.

The general profile, performance, orbit and accessibility suites precede only the final scenic focus refinement. The final environment test and final captures use the final source. Headless render diagnostics are recorded in `render-diagnostic.json` and `final-render-diagnostic.json`; they ran under concurrent review workloads and do not establish physical-device FPS or an isolated before/after speed claim.

Visual inspection covers all eleven final section images, selected native mobile scenes, rear conviction and disclosed side views, and sampled final tour frames. The scenery deliberately remains a faint, nonopaque stage behind the maker. Peripheral set pieces can extend past the frame as the camera turns. Earlier `candidate`, `final`, `tour`, and focus-diagnostic folders document intermediate review; the delivery links above point to `final-sections`, `final-tour` and `final-validation`.

Local production preview: http://127.0.0.1:4174/profile/. No public deployment was performed.
