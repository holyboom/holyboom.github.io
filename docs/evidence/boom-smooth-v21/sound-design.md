## Boom Smooth v21 — end-of-celebration and reverse-exit stability

The owner reported a stutter after fireworks finish and while scrolling upward beyond Boom. Preserve the approved five fireworks, deterministic particle trajectories, reverse reconstruction and all sounds.

Reproduction: in a touch-enabled WebKit 390×844 viewport parked just after Boom, change only the height to 790, 750, 790 and 844. In v20 the first step changed scrollY from 10998 to 10304 (694 CSS px), rebuilt the earlier Assemble pin and changed its spacer/document height; the entire sequence ended at 10250 without native scroll input. This is a controlled browser-chrome-size simulation, not a physical Safari recording.

- A shared viewport measurement now preserves document-story dimensions for small height-only changes on touch layouts, including browser chrome. Real width/orientation changes, large resizes and desktop height resizes still rebuild normally. Native scroll is never intercepted or compensated with a new scrollTo.
- Assemble uses the stable geometry for its pin size/span and no longer kills/recreates a distant pin for a transient toolbar-height event. Continuity uses the same geometry for station/hold ranges.
- Signature geometry is read before the continuity frame writes styles/SVG. Completed or not-yet-entered fireworks return before measuring DOM. Canvas clearing happens only once when needed; the transparent canvas is not visibility-toggled at both boundaries.
- No identical particle frame is rasterized again. Decoration CSS values are updated only when their value actually changes. Exact geometry equality (not approximate cached positions) preserves deterministic forward/reverse results.
- The particle model and ALL audio engines/assets remain unchanged; no particles removed, no shortened sound tails, no motion switch or new animation frame loop.

Testing: viewport-height perturbations at after-fireworks, above-Boom and mid-reverse; native forward/end/reverse exit; frame/pixel invariants, real orientation and desktop resize; existing burst/audio/reversal, touch and pin regression suites. This does not certify a physical iPhone frame rate or eliminate every possible source of stutter on all devices.
