# HolyMind Line Current v19


## Line Current v19 — audible only during actual visible line travel

The owner clarified: the non-piano scrolling current must sound only while the shared visual carrier is moving along its line. Mere scrolling, a parked carrier, a pinned layer reveal or a stationary visible line must be silent on the current bus. This supersedes the general scroll-velocity audio rule, not the music behavior.

- The continuity renderer reports visible-path existence, route endpoints, actual progress movement, viewport visibility and a monotonic timestamp from the same frame that draws the line. Decorative spinning or changing layer transforms is not route travel.
- A normally closed post-envelope gain gates only the existing +8 dB current bus. Genuine scroll intent and fresh moving/visible route evidence are both required. Missing evidence, docking, zero progress motion, offscreen carrier, navigation/reflow suppression and hidden pages close it.
- Eight-millisecond opening and twelve-millisecond closing edges prevent abrupt signal discontinuities. A fifty-millisecond movement-cadence window bridges input/render timing; no audible long decay is added. A 100 ms audio-clock lease fails closed if rendering stalls.
- The pianist reads the unchanged generic scroll stream. Pinned Assemble can continue the ordered Mozart score while the docked electrical-current bus stays exactly zero. Natural piano tails, score cursor, cues and ambient field remain independent.
- No new render loop, AudioContext, oscillator, runtime library, UI toggle or image. Layout, always-on motion, fourteen original brain effects, musical source/score and all existing controls are preserved.
- Tests include ten line transfers in both directions, stationary midline, real docked holds, pinned layer scrolling, native mobile input emulation, source retention, exact-zero gate output and stale-renderer closure. Physical iPhone loudspeaker testing is not claimed.

## Exact signal ownership

The new gate sits after the original scroll envelope, ducking and fixed +8 dB presence stage, before the current analyser/master. Only this branch is gated; the ambient and resolution branches remain separate. Audio.updateLineTravel does not call the score updater or replace its activity input. The renderer does not change carrier geometry.

The output is mathematically zero after its finite 12 ms close edge, unlike an asymptotic low gain. While leased open, the original waveform and presence gain are unchanged. Gesture and lifecycle gates still prevent automatic sound unlocking.

## Limits

Native touch tests run through the browser in mobile emulation, not a physical phone. Automated output measurement establishes routing/silence, not subjective mix quality or speaker performance. The short edge/cadence windows are synchronization tolerances, not a reverb tail.
