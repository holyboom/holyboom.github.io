# Piano continuation after Boom

User report: after fireworks finish, piano disappears while scrolling farther down.

## Reproduced failure
The earlier visual-stability fix distinguished mobile toolbar-height changes from true viewport geometry changes. The audio scroll controller did not: every window resize called suppress(450), zeroing speed and clearing the input lease. With repeated small height changes, the visitor keeps scrolling but the score receives no accepted movement. Fireworks finishing was where the effect was noticed, not an instruction to stop the piano.

The same WebKit scroll sequence with changing viewport height stopped adding notes (52 stayed 52) and measured output decayed to near zero. The fixed sequence advanced 52 to 75 scheduled notes, accepted all eight sampled movements, and produced nonzero score output. Chromium showed intermittent loss of accepted input before the patch and uninterrupted accepted samples afterward. This is a browser reproduction, not a measurement on the user's iPhone.

## Focused repair
Only the scroll sound controller changes its resize decision. It now uses the same HolyMindViewport revision as the visual story. Transient browser chrome cannot erase an existing gesture/inertial lease; it also cannot invent or extend one. Real resize/orientation still suppresses layout-generated scroll and remeasures. Navigation, modal, layout, master mute and hidden-page protections remain.

No score scheduling, note order, natural piano release, mix gains, firework audio, 259-particle geometry, sound asset or Always-on motion changes. The +8 dB electrical current still requires actual visible line movement, independent from piano. All sixteen listed core modules and 160 audio assets are byte-identical to v25.

## Evidence
Native wheel traverses the fireworks, waits for their tails, then scrolls through repeated height changes and reverses. Assertions measure piano scheduling and RMS rather than just an enabled flag. Separate native touch tests cover the same continuation and next-beat behavior. Regression checks retain natural tail, mute/lifecycle and the exact-zero line-current gate.

No subjective listening, physical iPhone frame-rate, hearing safety or full accessibility certification is claimed.
